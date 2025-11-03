from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from merlin.api.deps import KeyRepoDep, OptiLLMDep, SessionDep, SettingsDep
from merlin.core.security import decrypt_api_key
from merlin.schemas.chat import ChatRequest, ModelInfo, ModelList

router = APIRouter()

# Model definitions for each provider
PROVIDER_MODELS = {
    "openai": [
        ModelInfo(id="gpt-4o", name="GPT-4o", provider="OpenAI"),
        ModelInfo(id="gpt-4o-mini", name="GPT-4o Mini", provider="OpenAI"),
        ModelInfo(id="gpt-4-turbo", name="GPT-4 Turbo", provider="OpenAI"),
        ModelInfo(id="o1", name="o1", provider="OpenAI"),
        ModelInfo(id="o1-mini", name="o1 Mini", provider="OpenAI"),
    ],
    "anthropic": [
        ModelInfo(
            id="claude-3-5-sonnet-20241022",
            name="Claude 3.5 Sonnet",
            provider="Anthropic",
        ),
        ModelInfo(
            id="claude-3-5-haiku-20241022",
            name="Claude 3.5 Haiku",
            provider="Anthropic",
        ),
        ModelInfo(
            id="claude-3-opus-20240229", name="Claude 3 Opus", provider="Anthropic"
        ),
    ],
    "google": [
        ModelInfo(
            id="gemini-2.5-pro",
            name="Gemini 2.5 Pro",
            provider="Google",
        ),
        ModelInfo(
            id="gemini-2.5-flash",
            name="Gemini 2.5 Flash",
            provider="Google",
        ),
        ModelInfo(
            id="gemini-2.5-flash-lite",
            name="Gemini 2.5 Flash-Lite",
            provider="Google",
        ),
    ],
}


@router.get("/models", response_model=ModelList)
async def list_models(key_repo: KeyRepoDep) -> ModelList:
    """
    List available models based on configured API keys.

    Returns only models for providers that have valid API keys configured.
    """
    keys = await key_repo.get_all()
    available_models: list[ModelInfo] = []

    for key in keys:
        if key.is_valid and key.provider in PROVIDER_MODELS:
            available_models.extend(PROVIDER_MODELS[key.provider])

    return ModelList(models=available_models)


@router.post("/completions")
async def chat_completions(
    request: ChatRequest,
    key_repo: KeyRepoDep,
    optillm_service: OptiLLMDep,
    settings: SettingsDep,
) -> Any:
    """
    Send a chat completion request with optional streaming.

    Supports OptiLLM techniques by prefixing the model name.
    """
    # Strip OptiLLM technique prefixes to get the base model name
    # Techniques like "moa-", "plansearch-", etc. are prefixed to model names
    base_model = request.model
    for prefix in [
        # Advanced Multi-Agent & Planning
        "mars-",
        "cepo-",
        "plansearch-",
        # Core Reasoning
        "cot_reflection-",
        "moa-",
        # Sampling & Verification
        "bon-",
        "self_consistency-",
        "pvg-",
        # Search & Optimization
        "mcts-",
        "rstar-",
        "rto-",
        # Specialized Techniques
        "leap-",
        "re2-",
        "z3-",
    ]:
        if base_model.startswith(prefix):
            base_model = base_model[len(prefix) :]
            break

    # Find the provider for the requested model
    provider = None
    for prov, models in PROVIDER_MODELS.items():
        if any(m.id == base_model for m in models):
            provider = prov
            break

    if not provider:
        raise HTTPException(status_code=400, detail=f"Unknown model: {request.model}")

    # Get and decrypt the API key
    api_key_record = await key_repo.get_by_provider(provider)
    if not api_key_record:
        raise HTTPException(
            status_code=400,
            detail=f"No API key configured for provider: {provider}",
        )

    if not api_key_record.is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"API key for {provider} is invalid. Please update it.",
        )

    try:
        api_key = decrypt_api_key(api_key_record.encrypted_key, settings.fernet_key)
    except ValueError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to decrypt API key: {str(e)}"
        )

    # If no OptiLLM techniques are selected, bypass OptiLLM and call provider directly
    if not request.techniques or len(request.techniques) == 0:
        try:
            # Call provider API directly based on provider type
            if provider == "openai":
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": base_model,
                    "messages": [msg.model_dump() for msg in request.messages],
                    "stream": request.stream,
                }
                url = "https://api.openai.com/v1/chat/completions"

            elif provider == "anthropic":
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": base_model,
                    "messages": [msg.model_dump() for msg in request.messages],
                    "max_tokens": 4096,
                    "stream": request.stream,
                }
                url = "https://api.anthropic.com/v1/messages"

            elif provider == "google":
                # Google uses API key as query parameter
                headers = {
                    "Content-Type": "application/json",
                }
                # Convert messages to Google's format
                contents = []
                for msg in request.messages:
                    contents.append(
                        {
                            "role": "user" if msg.role == "user" else "model",
                            "parts": [{"text": msg.content}],
                        }
                    )
                payload = {
                    "contents": contents,
                }
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{base_model}:generateContent?key={api_key}"

            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Direct API calls not supported for provider: {provider}",
                )

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()

                if request.stream:
                    from fastapi.responses import StreamingResponse

                    async def stream_generator() -> Any:
                        async for chunk in response.aiter_bytes():
                            yield chunk

                    return StreamingResponse(
                        stream_generator(),
                        media_type="text/event-stream",
                    )
                else:
                    return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Provider API error: {str(e)}",
            )

    # Call OptiLLM service when techniques are selected
    try:
        response = await optillm_service.chat_completion(
            model=request.model,
            messages=[msg.model_dump() for msg in request.messages],
            api_key=api_key,
            techniques=request.techniques,
            stream=request.stream,
        )

        if request.stream:
            # Return streaming response
            from fastapi.responses import StreamingResponse

            async def stream_generator() -> Any:
                async for chunk in response:
                    yield chunk

            return StreamingResponse(
                stream_generator(),
                media_type="text/event-stream",
            )
        else:
            # Return complete response
            return response
    except httpx.HTTPStatusError as e:
        # API returned an error status code
        error_source = "OptiLLM" if request.techniques else "Provider API"
        error_detail = f"{error_source} error: {e.response.status_code}"
        try:
            error_body = e.response.json()
            if "error" in error_body:
                error_detail = f"{error_source} error: {error_body['error']}"
        except Exception:
            error_detail = f"{error_source} error: {e.response.text[:200]}"

        raise HTTPException(status_code=500, detail=error_detail)
    except httpx.HTTPError as e:
        error_source = "OptiLLM" if request.techniques else "Provider API"
        raise HTTPException(
            status_code=500, detail=f"{error_source} request failed: {str(e)}"
        )
    except Exception as e:
        error_hint = (
            "Try using fewer OptiLLM techniques or a different model."
            if request.techniques
            else "Check your API key and model selection."
        )
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}. {error_hint}",
        )
