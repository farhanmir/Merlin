from typing import Any, AsyncGenerator

import httpx


class OptiLLMService:
    """Service for interacting with OptiLLM proxy."""

    def __init__(self, optillm_url: str) -> None:
        self.optillm_url = optillm_url

    def _build_model_name(self, model: str, techniques: list[str]) -> str:
        """
        Build the OptiLLM model name with technique prefixes.

        OptiLLM uses the format: technique1-technique2-model
        """
        if not techniques:
            return model

        # Join techniques with hyphens and prepend to model name
        technique_prefix = "-".join(techniques)
        return f"{technique_prefix}-{model}"

    async def chat_completion(
        self,
        model: str,
        messages: list[dict[str, Any]],
        api_key: str,
        techniques: list[str],
        stream: bool = True,
    ) -> Any:
        """
        Send a chat completion request to OptiLLM.

        Args:
            model: Base model name (e.g., "gpt-4o")
            messages: List of message dicts with role and content
            api_key: Decrypted API key for the LLM provider
            techniques: List of OptiLLM techniques to apply
            stream: Whether to stream the response

        Returns:
            If stream=True, returns an async generator of SSE chunks
            If stream=False, returns the JSON response
        """
        modified_model = self._build_model_name(model, techniques)

        payload = {
            "model": modified_model,
            "messages": messages,
            "stream": stream,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        # Configure timeout: generous read timeout for streaming, standard for non-streaming
        if stream:
            timeout = httpx.Timeout(connect=10.0, read=None, write=10.0, pool=None)
        else:
            timeout = httpx.Timeout(60.0)

        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                response = await client.post(
                    f"{self.optillm_url}/v1/chat/completions",
                    json=payload,
                    headers=headers,
                )

                response.raise_for_status()

                if stream:
                    return self._stream_response(response)
                else:
                    return response.json()
            except httpx.ConnectError:
                # OptiLLM not available - fall back to direct Google API call
                if "gemini" in model.lower():
                    return await self._fallback_google_api(
                        model, messages, api_key, stream
                    )
                raise

    async def _stream_response(
        self, response: httpx.Response
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream SSE chunks from OptiLLM response.
        """
        async for chunk in response.aiter_bytes():
            yield chunk

    async def _fallback_google_api(
        self,
        model: str,
        messages: list[dict[str, Any]],
        api_key: str,
        stream: bool = True,
    ) -> Any:
        """
        Fallback to direct Google Gemini API when OptiLLM is unavailable.
        """
        # Convert OpenAI-style messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        payload = {
            "contents": contents,
        }

        # Google uses API key in URL, not header
        if stream:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?key={api_key}&alt=sse"
        else:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        timeout = (
            httpx.Timeout(connect=10.0, read=None, write=10.0, pool=None)
            if stream
            else httpx.Timeout(60.0)
        )

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()

            if stream:
                return self._stream_response(response)
            else:
                # Convert Google response to OpenAI format
                data = response.json()
                text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )
                return {
                    "choices": [{"message": {"role": "assistant", "content": text}}]
                }

    async def chat_completion_sync(
        self,
        model: str,
        messages: list[dict[str, Any]],
        techniques: list[str],
        api_key: str | None = None,
    ) -> str:
        """
        Synchronous (non-streaming) chat completion for workflow steps.

        Args:
            model: Base model name
            messages: List of message dicts
            techniques: List of OptiLLM techniques
            api_key: Optional API key (uses dummy key if not provided)

        Returns:
            Complete response text
        """
        modified_model = self._build_model_name(model, techniques)

        payload = {
            "model": modified_model,
            "messages": messages,
            "stream": False,
        }

        headers = {
            "Authorization": f"Bearer {api_key or 'dummy-key'}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.optillm_url}/v1/chat/completions",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def list_models(self, api_key: str) -> list[dict[str, Any]]:
        """
        List available models from OptiLLM.

        This can be used for discovery and validation.
        """
        headers = {
            "Authorization": f"Bearer {api_key}",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.optillm_url}/v1/models",
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
