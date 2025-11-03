"""Direct integration of OptiLLM inference optimization techniques."""

import asyncio
import logging
import time
from collections import deque
from typing import Any, Callable

from fastapi import HTTPException
from merlin.optillm.bon import best_of_n_sampling

# NOTE: CePO disabled - requires math_verify and conversation_logger dependencies
# from merlin.optillm.cepo.cepo import cepo, init_cepo_config
from merlin.optillm.cot_reflection import cot_reflection
from merlin.optillm.leap import leap

# NOTE: MARS disabled - requires optillm module import (circular dependency)
# from merlin.optillm.mars import multi_agent_reasoning_system
from merlin.optillm.mcts import chat_with_mcts

# Import OptiLLM approach modules
from merlin.optillm.moa import mixture_of_agents
from merlin.optillm.plansearch import plansearch
from merlin.optillm.rstar import RStar
from merlin.optillm.rto import round_trip_optimization
from merlin.optillm.self_consistency import advanced_self_consistency_approach
from openai import APIError, OpenAI, RateLimitError

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Intelligent rate limiter that tracks API calls and enforces delays.

    Google Gemini Free Tier: 15 RPM (requests per minute)
    OpenAI Free Tier: 3 RPM
    """

    def __init__(self, provider: str):
        self.provider = provider
        self.request_times = deque(maxlen=50)  # Track last 50 requests

        # Rate limits per provider (requests per minute)
        self.limits = {
            "google": 15,
            "openai": 3,
            "anthropic": 50,  # Higher limit
        }

        # Minimum delay between requests (seconds)
        self.min_delays = {
            "google": 4.5,  # 15 RPM = 1 request per 4 seconds, add buffer
            "openai": 20,  # 3 RPM = 1 request per 20 seconds
            "anthropic": 1.5,
        }

    def get_delay(self) -> float:
        """Calculate how long to wait before next request."""
        if not self.request_times:
            return 0

        # Time since last request
        time_since_last = time.time() - self.request_times[-1]
        min_delay = self.min_delays.get(self.provider, 1.0)

        # If we haven't waited long enough, return remaining wait time
        if time_since_last < min_delay:
            return min_delay - time_since_last

        return 0

    def get_requests_in_last_minute(self) -> int:
        """Count requests made in the last 60 seconds."""
        cutoff = time.time() - 60
        return sum(1 for t in self.request_times if t > cutoff)

    def should_throttle(self) -> tuple[bool, float]:
        """
        Check if we should throttle.

        Returns:
            (should_throttle, wait_time_seconds)
        """
        limit = self.limits.get(self.provider, 60)
        current_rpm = self.get_requests_in_last_minute()

        if current_rpm >= limit:
            # Need to wait until oldest request expires
            oldest = self.request_times[0]
            wait_time = 60 - (time.time() - oldest) + 1  # Add 1 sec buffer
            return True, max(wait_time, 0)

        return False, 0

    async def wait_if_needed(self, progress_callback: Callable[[str], None] = None):
        """Wait if rate limit requires it, with optional progress updates."""
        # Check if we're at limit
        should_throttle, throttle_wait = self.should_throttle()
        if should_throttle:
            if progress_callback:
                progress_callback(
                    f"⏳ Rate limit reached. Waiting {int(throttle_wait)}s..."
                )
            logger.warning(
                f"Rate limit reached for {self.provider}. Waiting {throttle_wait:.1f}s"
            )
            await asyncio.sleep(throttle_wait)

        # Check minimum delay since last request
        delay = self.get_delay()
        if delay > 0:
            if progress_callback and delay > 2:
                progress_callback(f"⏱️ Pacing requests... ({delay:.0f}s)")
            await asyncio.sleep(delay)

        # Record this request
        self.request_times.append(time.time())


class OptiLLMService:
    """
    Direct integration service for OptiLLM inference optimization.

    Instead of proxying to a separate OptiLLM server, this service
    directly calls OptiLLM technique functions with the appropriate LLM client.
    """

    # Map technique names to their functions
    # NOTE: Some techniques disabled due to missing dependencies or rate limit constraints
    TECHNIQUES = {
        # === DISABLED - Missing Dependencies ===
        # "mars": multi_agent_reasoning_system,  # Requires optillm module import
        # "cepo": cepo,  # Requires math_verify and conversation_logger
        # === ENABLED - Light API Usage (1-5 calls) ===
        "moa": mixture_of_agents,  # ~3-5 API calls
        "cot_reflection": cot_reflection,  # ~2 API calls
        "plansearch": plansearch,  # ~8 API calls (returns code blocks)
        "bon": best_of_n_sampling,  # ~3 API calls
        "self_consistency": advanced_self_consistency_approach,  # ~5 API calls
        "leap": leap,  # ~2 API calls
        "rto": round_trip_optimization,  # ~4 API calls
        # === ENABLED - Heavy API Usage (10-20+ calls) ===
        "mcts": chat_with_mcts,  # ~10-15 API calls (Monte Carlo tree search)
        # === DISABLED - Exceeds Free Tier Rate Limits (15 RPM) ===
        # "pvg": inference_time_pv_game,  # ~20+ API calls (2 rounds × 6 solutions + verification)
        # "re2": re2_approach,  # ~15+ API calls (multiple reasoning steps)
    }

    def __init__(self) -> None:
        # Configuration for OptiLLM techniques (aligned with Free Tier constraints)
        self.config = {
            # MCTS (Monte Carlo Tree Search)
            "mcts_simulations": 2,
            "mcts_exploration": 0.2,
            "mcts_depth": 1,
            # Best-of-N sampling
            "best_of_n": 3,
            # R* (Reinforcement Learning Star)
            "rstar_max_depth": 2,
            "rstar_num_rollouts": 3,
            "rstar_c": 1.4,
            # General config
            "n": 2,
            "return_full_response": False,
        }

    def _create_client(self, provider: str, api_key: str) -> OpenAI:
        """
        Create an appropriate LLM client based on provider.

        OptiLLM expects an OpenAI-compatible client.
        """
        if provider == "openai":
            return OpenAI(api_key=api_key)
        elif provider == "anthropic":
            # Anthropic via LiteLLM compatibility
            return OpenAI(api_key=api_key, base_url="https://api.anthropic.com/v1")
        elif provider == "google":
            # Google via LiteLLM compatibility
            return OpenAI(
                api_key=api_key,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    def _parse_messages(self, messages: list[dict[str, Any]]) -> tuple[str, str]:
        """
        Parse messages into system_prompt and initial_query.

        OptiLLM techniques expect:
        - system_prompt: System message content or empty string
        - initial_query: Last user message content
        """
        system_prompt = ""
        initial_query = ""

        for msg in messages:
            if msg["role"] == "system":
                system_prompt = msg["content"]
            elif msg["role"] == "user":
                initial_query = msg["content"]

        return system_prompt, initial_query

    def _extract_answer_from_code(self, code_block: str) -> str | None:
        """
        Extract the final answer from a Python code block.

        Handles various patterns:
        - return "HEROINE"
        - print(f"The word is: {riddle_solution}")
        - full_word = "HEROINE"
        - Function docstrings explaining the answer

        Args:
            code_block: Python code as string

        Returns:
            Extracted answer or None if not found
        """
        import re

        # Remove language identifier if present (python, py, etc.)
        code_block = re.sub(r"^(python|py)\s*\n", "", code_block, flags=re.IGNORECASE)

        # Pattern 1: Look for return statements with string literals
        return_match = re.search(
            r'return\s+["\']([^"\']+)["\']', code_block, re.IGNORECASE
        )
        if return_match:
            answer = return_match.group(1)
            logger.info(f"Extracted answer from return statement: {answer}")
            return f"The answer is: {answer}"

        # Pattern 2: Look for print statements with the answer
        print_patterns = [
            r'print\(["\']([^"\']+)["\']',  # print("HEROINE")
            r'print\(f["\'][^"\']*\{([^}]+)\}[^"\']*["\']',  # print(f"Answer: {var}")
            r'print\([^)]*["\']([A-Z]+)["\']',  # print("The answer is:", "HEROINE")
        ]
        for pattern in print_patterns:
            match = re.search(pattern, code_block, re.IGNORECASE)
            if match:
                answer = match.group(1)
                logger.info(f"Extracted answer from print statement: {answer}")
                return f"The answer is: {answer}"

        # Pattern 3: Look for variable assignments at module level
        var_match = re.search(
            r'^(?:word|answer|result|solution|riddle_solution|final_answer|full_word)\s*=\s*["\']([^"\']+)["\']',
            code_block,
            re.IGNORECASE | re.MULTILINE,
        )
        if var_match:
            answer = var_match.group(1)
            logger.info(f"Extracted answer from variable assignment: {answer}")
            return f"The answer is: {answer}"

        # Pattern 4: Look for function docstrings that might explain the answer
        docstring_match = re.search(r'"""(.*?)"""', code_block, re.DOTALL)
        if docstring_match:
            docstring = docstring_match.group(1).strip()
            # Check if docstring contains an answer pattern
            if any(
                keyword in docstring.lower()
                for keyword in ["answer", "word", "solution"]
            ):
                logger.info("Found answer explanation in docstring")
                return docstring

        # Pattern 5: Look for comments that explain the answer
        comment_match = re.search(
            r"#\s*(Answer|Solution|Word|Result):\s*(.+)", code_block, re.IGNORECASE
        )
        if comment_match:
            answer = comment_match.group(2).strip()
            logger.info(f"Extracted answer from comment: {answer}")
            return f"The answer is: {answer}"

        return None

    def _format_message_for_provider(self, message: str, provider: str) -> str:
        """
        Format message according to provider-specific requirements.

        Google Gemini requires plain text without embedded code blocks when used
        via OpenAI-compatible endpoint.

        Args:
            message: Original message content
            provider: LLM provider name

        Returns:
            Formatted message suitable for the provider
        """
        import re

        if provider == "google" and "```" in message:
            # For Google, convert code blocks to plain text descriptions
            logger.info("Converting code blocks to plain text for Google Gemini")

            # Extract text before code blocks
            parts = message.split("```")
            if len(parts) > 1:
                text_parts = [parts[0]]  # Text before first block

                for i in range(2, len(parts), 2):  # Text between and after blocks
                    if parts[i].strip():
                        text_parts.append(parts[i])

                combined = " ".join(text_parts).strip()
                if combined and len(combined) > 30:
                    return combined

            # If extraction failed, remove code blocks entirely
            cleaned = re.sub(
                r"```[^`]*```",
                "[code implementation omitted]",
                message,
                flags=re.DOTALL,
            )
            return cleaned.strip()

        # For other providers, pass through unchanged
        return message

    def _clean_response_for_chaining(
        self, response: str, provider: str, technique: str = ""
    ) -> str:
        """
        Clean technique response before passing to next technique.

        Some techniques (like plansearch, cot_reflection) return code blocks or structured outputs
        that cause issues when passed to subsequent techniques, especially with
        Google's Gemini API which rejects non-struct values.

        Args:
            response: Raw response from previous technique
            provider: LLM provider (some are more strict about formats)

        Returns:
            Cleaned response suitable for next technique
        """
        import re

        # If response contains code blocks, extract just the conceptual answer
        # Code blocks cause "Value is not a struct" errors with Google Gemini
        if "```" in response:
            logger.info(
                f"Response from {technique} contains code blocks, cleaning for next technique"
            )

            # Try to find explanatory text before code blocks
            parts = response.split("```")
            if len(parts) > 1:
                # Get text before first code block
                before_code = parts[0].strip()
                if before_code and len(before_code) > 50:
                    # If there's substantial text before code, use that
                    logger.info("Using text before code blocks")
                    return before_code

                # For plansearch specifically, try to extract the answer from code
                if technique == "plansearch":
                    for i in range(1, len(parts), 2):
                        code_block = parts[i] if i < len(parts) else ""

                        # Use the new helper to extract answer from code
                        extracted = self._extract_answer_from_code(code_block)
                        if extracted:
                            return extracted

                # Otherwise, try to extract the answer from within code blocks
                # Look for variable assignments like: word = "heroine"
                for i in range(1, len(parts), 2):
                    code_block = parts[i] if i < len(parts) else ""

                    # Look for the actual answer in the code (e.g., word = "heroine")
                    answer_match = re.search(
                        r'(?:word|answer|result|solution)\s*=\s*["\']([^"\']+)["\']',
                        code_block,
                        re.IGNORECASE,
                    )
                    if answer_match:
                        answer = answer_match.group(1)
                        logger.info(f"Extracted answer from code: {answer}")
                        return f"The answer is: {answer}"

                    # Look for docstrings or comments explaining the answer
                    docstring_match = re.search(r'"""(.*?)"""', code_block, re.DOTALL)
                    if docstring_match:
                        docstring = docstring_match.group(1).strip()
                        if len(docstring) > 30:
                            logger.info("Using docstring as answer")
                            return docstring

                # Check text between code blocks
                for i in range(1, len(parts), 2):
                    if i + 1 < len(parts):
                        between_blocks = parts[i + 1].strip()
                        if between_blocks and len(between_blocks) > 30:
                            logger.info("Using text between code blocks")
                            return between_blocks

            # Last resort: completely strip all code blocks and return remaining text
            cleaned = re.sub(r"```[^`]*```", "", response, flags=re.DOTALL)
            cleaned = cleaned.strip()
            if cleaned and len(cleaned) > 20:
                logger.info("Stripped all code blocks, using remaining text")
                return cleaned

            # If all else fails, extract a simple answer
            logger.warning(
                "Could not clean code blocks properly, using generic response"
            )
            return "Based on the analysis above, the answer has been determined."

        # If no code blocks or couldn't extract, return as-is
        # but limit length to avoid token issues
        if len(response) > 2000:
            return response[:2000] + "..."

        return response

    async def apply_techniques(
        self,
        provider: str,
        model: str,
        messages: list[dict[str, Any]],
        api_key: str,
        techniques: list[str],
    ) -> str:
        """
        Apply OptiLLM techniques to the chat completion with intelligent rate limiting.

        Args:
            provider: LLM provider (openai, anthropic, google)
            model: Base model name (e.g., "gpt-4o")
            messages: List of message dicts with role and content
            api_key: Decrypted API key for the LLM provider
            techniques: List of OptiLLM techniques to apply in order

        Returns:
            Final response text after applying all techniques

        Raises:
            RateLimitError: If rate limit is exceeded after retries
        """
        # Create LLM client
        client = self._create_client(provider, api_key)

        # Create rate limiter for this provider
        rate_limiter = RateLimiter(provider)

        # Parse messages into OptiLLM format
        system_prompt, initial_query = self._parse_messages(messages)

        # If no techniques, use direct client call
        if not techniques:
            await rate_limiter.wait_if_needed()
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=False,
            )
            return response.choices[0].message.content

        # Log technique execution plan
        logger.info(
            f"Applying {len(techniques)} OptiLLM technique(s): {', '.join(techniques)}"
        )

        # Apply techniques sequentially (chained)
        final_response = initial_query
        for idx, technique in enumerate(techniques, 1):
            if technique not in self.TECHNIQUES:
                raise ValueError(f"Unknown technique: {technique}")

            # Get the technique function
            technique_func = self.TECHNIQUES[technique]

            # Log progress
            logger.info(f"[{idx}/{len(techniques)}] Executing technique: {technique}")

            # Wait if needed to avoid rate limit (proactive throttling)
            await rate_limiter.wait_if_needed(
                progress_callback=lambda msg: logger.info(msg)
            )

            # Execute technique with retry logic
            max_retries = 3
            retry_count = 0

            while retry_count < max_retries:
                try:
                    # Execute technique (run in thread pool since they're synchronous)
                    response, _ = await asyncio.to_thread(
                        self._execute_technique,
                        technique,
                        technique_func,
                        system_prompt,
                        final_response,
                        client,
                        model,
                    )

                    # Clean response before passing to next technique
                    # This prevents code blocks from causing API errors in subsequent techniques
                    final_response = self._clean_response_for_chaining(
                        response, provider, technique
                    )

                    logger.info(f"✓ {technique} completed successfully")
                    break  # Success, exit retry loop

                except RateLimitError as e:
                    retry_count += 1
                    if retry_count >= max_retries:
                        logger.error(
                            f"Rate limit exceeded for {technique} after {max_retries} retries"
                        )
                        raise HTTPException(
                            status_code=429,
                            detail=f"⏱️ Rate limit exceeded. Please try again in a few minutes. "
                            f"Tip: Use fewer techniques ({len(techniques)} selected) to avoid limits.",
                        ) from e

                    # Exponential backoff: 5s, 10s, 20s
                    wait_time = 5 * (2 ** (retry_count - 1))
                    logger.warning(
                        f"Rate limit hit on {technique}. "
                        f"Retry {retry_count}/{max_retries} in {wait_time}s..."
                    )
                    await asyncio.sleep(wait_time)

                except APIError as e:
                    # Distinguish between user errors and system errors
                    status_code = getattr(e, "status_code", None)

                    if status_code == 400:
                        # User/validation error - fail fast
                        error_msg = str(e)
                        if (
                            "Value is not a struct" in error_msg
                            or "struct" in error_msg.lower()
                        ):
                            logger.error(
                                f"Google Gemini rejected message with code blocks in {technique}"
                            )
                            raise HTTPException(
                                status_code=400,
                                detail=f"Provider rejected request in {technique}. This may be due to code blocks in the response. "
                                f"Try using {technique} as the last technique, or use a different provider.",
                            ) from e
                        else:
                            logger.error(
                                f"Provider validation error in {technique}: {error_msg}"
                            )
                            raise HTTPException(
                                status_code=400,
                                detail=f"Provider rejected request in {technique}: {error_msg}",
                            ) from e

                    elif status_code == 429:
                        # Rate limit - should have been caught above, but handle as fallback
                        logger.error(f"Rate limit error in {technique}")
                        raise HTTPException(
                            status_code=429,
                            detail=f"Rate limit exceeded in {technique}. Please wait and try again.",
                        ) from e

                    elif status_code and status_code >= 500:
                        # Provider server error
                        logger.error(f"Provider server error in {technique}: {str(e)}")
                        raise HTTPException(
                            status_code=502,
                            detail=f"Provider service error in {technique}. The API may be experiencing issues.",
                        ) from e

                    else:
                        # Generic API error
                        logger.error(f"API error in {technique}: {str(e)}")
                        raise HTTPException(
                            status_code=502,
                            detail=f"LLM API error in {technique}: {str(e)}",
                        ) from e

        logger.info(f"All {len(techniques)} techniques completed successfully")
        return final_response

    def _execute_technique(
        self,
        technique: str,
        technique_func: Any,
        system_prompt: str,
        query: str,
        client: OpenAI,
        model: str,
    ) -> tuple[str, int]:
        """
        Execute a single OptiLLM technique.

        Returns tuple of (response, token_count).
        """
        # Build kwargs based on technique
        if technique == "mcts":
            return technique_func(
                system_prompt,
                query,
                client,
                model,
                self.config["mcts_simulations"],
                self.config["mcts_exploration"],
                self.config["mcts_depth"],
            )
        elif technique == "bon":
            return technique_func(
                system_prompt, query, client, model, self.config["best_of_n"]
            )
        elif technique == "plansearch":
            return technique_func(
                system_prompt, query, client, model, n=self.config["n"]
            )
        elif technique == "rstar":
            rstar = RStar(
                system_prompt,
                client,
                model,
                max_depth=self.config["rstar_max_depth"],
                num_rollouts=self.config["rstar_num_rollouts"],
                c=self.config["rstar_c"],
            )
            return rstar.solve(query)
        elif technique == "cot_reflection":
            return technique_func(
                system_prompt,
                query,
                client,
                model,
                return_full_response=self.config["return_full_response"],
            )
        else:
            # Default: pass system_prompt, query, client, model
            return technique_func(system_prompt, query, client, model)
