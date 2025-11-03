import logging
import time
from difflib import SequenceMatcher
from typing import Dict, List

from merlin import optillm
from merlin.optillm import conversation_logger

logger = logging.getLogger(__name__)


def _sanitize_input(text: str) -> str:
    """Remove code blocks from input to prevent provider errors."""
    if "```" not in text:
        return text

    logger.info("Self-consistency: Sanitizing input to remove code blocks")

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


class AdvancedSelfConsistency:
    def __init__(
        self,
        client,
        model: str,
        num_samples: int = 3,  # Reduced from 5 for free tier
        similarity_threshold: float = 0.8,
        request_id: str = None,
    ):
        self.client = client
        self.model = model
        self.num_samples = num_samples
        self.similarity_threshold = similarity_threshold
        self.self_consistency_completion_tokens = 0
        self.request_id = request_id

    def generate_responses(self, system_prompt: str, user_prompt: str) -> List[str]:
        # Sanitize input first
        sanitized_prompt = _sanitize_input(user_prompt)

        responses = []
        successful_samples = 0

        for i in range(self.num_samples):
            try:
                provider_request = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": sanitized_prompt},
                    ],
                    "temperature": 1,
                    "max_tokens": 4096,
                }

                response = self.client.chat.completions.create(**provider_request)

                # Log provider call
                if (
                    hasattr(optillm, "conversation_logger")
                    and optillm.conversation_logger
                    and self.request_id
                ):
                    response_dict = (
                        response.model_dump()
                        if hasattr(response, "model_dump")
                        else response
                    )
                    optillm.conversation_logger.log_provider_call(
                        self.request_id, provider_request, response_dict
                    )

                self.self_consistency_completion_tokens += (
                    response.usage.completion_tokens
                )
                responses.append(response.choices[0].message.content)
                successful_samples += 1

                # Add delay between samples to avoid rate limits (4.5s for Google's 15 RPM)
                if i < self.num_samples - 1:
                    time.sleep(4.5)

            except Exception as e:
                # Check for validation errors - fail fast
                if hasattr(e, "status_code") and e.status_code == 400:
                    logger.error(
                        f"Validation error in self-consistency sample {i+1}: {str(e)}"
                    )
                    raise  # Don't continue if validation fails
                # For rate limits or server errors, log and continue with what we have
                elif hasattr(e, "status_code") and e.status_code == 429:
                    logger.warning(f"Rate limit hit on sample {i+1}, waiting...")
                    time.sleep(10)  # Wait longer for rate limit
                    continue
                else:
                    logger.error(f"Error generating sample {i+1}: {str(e)}")
                    # Continue with other samples if at least 2 succeeded
                    if successful_samples >= 2:
                        logger.info(
                            f"Continuing with {successful_samples} successful samples"
                        )
                        break
                    else:
                        raise  # Fail if we don't have enough samples

        if len(responses) < 2:
            raise Exception(
                f"Self-consistency requires at least 2 samples, got {len(responses)}"
            )

        return responses

    def calculate_similarity(self, a: str, b: str) -> float:
        return SequenceMatcher(None, a, b).ratio()

    def cluster_similar_responses(self, responses: List[str]) -> List[List[str]]:
        clusters = []
        for response in responses:
            added_to_cluster = False
            for cluster in clusters:
                if (
                    self.calculate_similarity(response, cluster[0])
                    >= self.similarity_threshold
                ):
                    cluster.append(response)
                    added_to_cluster = True
                    break
            if not added_to_cluster:
                clusters.append([response])
        return clusters

    def aggregate_results(self, responses: List[str]) -> Dict[str, any]:
        final_answers = responses
        clusters = self.cluster_similar_responses(final_answers)

        cluster_info = []
        for cluster in clusters:
            cluster_info.append(
                {"answer": cluster[0], "frequency": len(cluster), "variants": cluster}
            )

        cluster_info.sort(key=lambda x: x["frequency"], reverse=True)

        return {
            "clusters": cluster_info,
            "total_responses": len(responses),
            "num_unique_clusters": len(clusters),
        }

    def evaluate(self, system_prompt: str, user_prompt: str) -> Dict[str, any]:
        responses = self.generate_responses(system_prompt, user_prompt)
        aggregated_result = self.aggregate_results(responses)

        return {
            "individual_responses": responses,
            "aggregated_result": aggregated_result,
        }


def advanced_self_consistency_approach(
    system_prompt: str, initial_query: str, client, model: str, request_id: str = None
) -> str:
    self_consistency = AdvancedSelfConsistency(client, model, request_id=request_id)
    result = self_consistency.evaluate(system_prompt, initial_query)

    logger.info("Advanced Self-Consistency Results:")
    logger.info(f"Total responses: {result['aggregated_result']['total_responses']}")
    logger.info(
        f"Number of unique clusters: {result['aggregated_result']['num_unique_clusters']}"
    )
    for i, cluster in enumerate(result["aggregated_result"]["clusters"], 1):
        logger.debug(f"\nCluster {i}:")
        logger.debug(f"  Representative answer: {cluster['answer']}")
        logger.debug(f"  Frequency: {cluster['frequency']}")
        logger.debug(f"  Variants: {cluster['variants']}")

    if result["aggregated_result"]["clusters"]:
        return (
            result["aggregated_result"]["clusters"][0]["answer"],
            self_consistency.self_consistency_completion_tokens,
        )
    else:
        return (
            "No consistent answer found.",
            self_consistency.self_consistency_completion_tokens,
        )
