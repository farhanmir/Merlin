"""Direct integration of OptiLLM inference optimization techniques."""

import asyncio
from typing import Any

from merlin.optillm.bon import best_of_n_sampling
from merlin.optillm.cot_reflection import cot_reflection
from merlin.optillm.leap import leap
from merlin.optillm.mcts import chat_with_mcts

# Import OptiLLM approach modules
from merlin.optillm.moa import mixture_of_agents
from merlin.optillm.plansearch import plansearch
from merlin.optillm.pvg import inference_time_pv_game
from merlin.optillm.reread import re2_approach
from merlin.optillm.rstar import RStar
from merlin.optillm.rto import round_trip_optimization
from merlin.optillm.self_consistency import advanced_self_consistency_approach
from openai import OpenAI


class OptiLLMService:
    """
    Direct integration service for OptiLLM inference optimization.

    Instead of proxying to a separate OptiLLM server, this service
    directly calls OptiLLM technique functions with the appropriate LLM client.
    """

    # Map technique names to their functions
    TECHNIQUES = {
        "moa": mixture_of_agents,
        "cot_reflection": cot_reflection,
        "plansearch": plansearch,
        "bon": best_of_n_sampling,
        "self_consistency": advanced_self_consistency_approach,
        "pvg": inference_time_pv_game,
        "mcts": chat_with_mcts,
        "leap": leap,
        "re2": re2_approach,
        "rto": round_trip_optimization,
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

    async def apply_techniques(
        self,
        provider: str,
        model: str,
        messages: list[dict[str, Any]],
        api_key: str,
        techniques: list[str],
    ) -> str:
        """
        Apply OptiLLM techniques to the chat completion.

        Args:
            provider: LLM provider (openai, anthropic, google)
            model: Base model name (e.g., "gpt-4o")
            messages: List of message dicts with role and content
            api_key: Decrypted API key for the LLM provider
            techniques: List of OptiLLM techniques to apply in order

        Returns:
            Final response text after applying all techniques
        """
        # Create LLM client
        client = self._create_client(provider, api_key)

        # Parse messages into OptiLLM format
        system_prompt, initial_query = self._parse_messages(messages)

        # If no techniques, use direct client call
        if not techniques:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=False,
            )
            return response.choices[0].message.content

        # Apply techniques sequentially (chained)
        final_response = initial_query
        for technique in techniques:
            if technique not in self.TECHNIQUES:
                raise ValueError(f"Unknown technique: {technique}")

            # Get the technique function
            technique_func = self.TECHNIQUES[technique]

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

            final_response = response

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
        elif technique == "re2":
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
