import logging
import re

from merlin import optillm
from merlin.optillm import conversation_logger

logger = logging.getLogger(__name__)


def _sanitize_input(text: str) -> str:
    """
    Sanitize input text to remove code blocks that may cause provider errors.

    Extracts conceptual content from code blocks for providers like Google Gemini
    that reject messages containing code structures.

    Args:
        text: Input text that may contain code blocks

    Returns:
        Sanitized text without code blocks
    """
    if "```" not in text:
        return text

    logger.info("Sanitizing input: removing code blocks")

    # Extract text before code blocks
    parts = text.split("```")
    if len(parts) > 1:
        before_code = parts[0].strip()
        if before_code and len(before_code) > 50:
            return before_code

    # Strip all code blocks
    import re

    cleaned = re.sub(r"```[^`]*```", "[code omitted]", text, flags=re.DOTALL)
    return cleaned.strip()


def cot_reflection(
    system_prompt,
    initial_query,
    client,
    model: str,
    return_full_response: bool = False,
    request_config: dict = None,
    request_id: str = None,
):
    cot_completion_tokens = 0

    # Sanitize initial_query to prevent code blocks from causing errors
    sanitized_query = _sanitize_input(initial_query)

    # Extract temperature and max_tokens from request_config with defaults
    temperature = 0.6  # Default to 0.6 as requested
    max_tokens = 4096  # Default to 4096 as requested

    if request_config:
        temperature = request_config.get("temperature", temperature)
        max_tokens = request_config.get("max_tokens", max_tokens)
    cot_prompt = f"""
        {system_prompt}

        You are an AI assistant that uses a Chain of Thought (CoT) approach with reflection to answer queries. Follow these steps:

        1. Think through the problem step by step within the <thinking> tags.
        2. Reflect on your thinking to check for any errors or improvements within the <reflection> tags.
        3. Make any necessary adjustments based on your reflection.
        4. Provide your final, concise answer within the <output> tags.

        Important: The <thinking> and <reflection> sections are for your internal reasoning process only. 
        Do not include any part of the final answer in these sections. 
        The actual response to the query must be entirely contained within the <output> tags.

        Use the following format for your response:
        <thinking>
        [Your step-by-step reasoning goes here. This is your internal thought process, not the final answer.]
        <reflection>
        [Your reflection on your reasoning, checking for errors or improvements]
        </reflection>
        [Any adjustments to your thinking based on your reflection]
        </thinking>
        <output>
        [Your final, concise answer to the query. This is the only part that will be shown to the user.]
        </output>
        """

    # Make the API call using user-provided or default parameters
    provider_request = {
        "model": model,
        "messages": [
            {"role": "system", "content": cot_prompt},
            {"role": "user", "content": sanitized_query},  # Use sanitized query
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        response = client.chat.completions.create(**provider_request)
    except Exception as e:
        # Log error with context about input sanitization
        has_code_blocks = "```" in initial_query
        logger.error(
            f"CoT Reflection API error. Input contained code blocks: {has_code_blocks}. Error: {str(e)}"
        )
        raise

    # Log provider call
    if (
        hasattr(optillm, "conversation_logger")
        and optillm.conversation_logger
        and request_id
    ):
        response_dict = (
            response.model_dump() if hasattr(response, "model_dump") else response
        )
        optillm.conversation_logger.log_provider_call(
            request_id, provider_request, response_dict
        )

    # Extract the full response
    full_response = response.choices[0].message.content
    cot_completion_tokens += response.usage.completion_tokens
    logger.info(f"CoT with Reflection :\n{full_response}")

    # Use regex to extract the content within <thinking> and <output> tags
    thinking_match = re.search(r"<thinking>(.*?)</thinking>", full_response, re.DOTALL)
    output_match = re.search(r"<output>(.*?)(?:</output>|$)", full_response, re.DOTALL)

    thinking = (
        thinking_match.group(1).strip()
        if thinking_match
        else "No thinking process provided."
    )
    output = output_match.group(1).strip() if output_match else full_response

    logger.info(f"Final output :\n{output}")

    if return_full_response:
        return full_response, cot_completion_tokens
    else:
        return output, cot_completion_tokens
