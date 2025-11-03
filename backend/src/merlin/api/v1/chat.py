from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Request
from merlin.api.deps import (
    ChatRepoDep,
    CurrentUserDep,
    KeyRepoDep,
    OptiLLMDep,
    SessionDep,
    SettingsDep,
)
from merlin.core.rate_limit import limiter
from merlin.core.security import decrypt_api_key
from merlin.schemas.chat import (
    ChatMessageResponse,
    ChatRequest,
    ModelInfo,
    ModelList,
    SaveMessageRequest,
    SessionHistoryResponse,
    SessionListResponse,
)

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
async def list_models(user_id: CurrentUserDep, key_repo: KeyRepoDep) -> ModelList:
    """
    List available models based on configured API keys for the authenticated user.

    Returns only models for providers that have valid API keys configured.
    """
    keys = await key_repo.get_all(user_id)
    available_models: list[ModelInfo] = []

    for key in keys:
        if key.is_valid and key.provider in PROVIDER_MODELS:
            available_models.extend(PROVIDER_MODELS[key.provider])

    return ModelList(models=available_models)


@router.post("/completions")
@limiter.limit("30/hour")  # Aligned with Neon Free Tier (5 hours/day active time)
async def chat_completions(
    request_obj: Request,
    request: ChatRequest,
    user_id: CurrentUserDep,
    key_repo: KeyRepoDep,
    optillm_service: OptiLLMDep,
    settings: SettingsDep,
) -> Any:
    """
    Send a chat completion request with optional streaming for the authenticated user.

    Supports OptiLLM techniques by prefixing the model name.
    Rate limited to 30 requests per hour per user to preserve Neon Free Tier limits.
    """
    # Set user_id in request state for rate limiting
    request_obj.state.user_id = user_id

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

    # Get and decrypt the API key for the authenticated user
    api_key_record = await key_repo.get_by_provider(user_id, provider)
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
            # Disable streaming for Google/Anthropic (different SSE format than OpenAI)
            # They require response transformation which is easier with non-streaming
            use_streaming = request.stream and provider == "openai"

            # Call provider API directly based on provider type
            if provider == "openai":
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": base_model,
                    "messages": [msg.model_dump() for msg in request.messages],
                    "stream": use_streaming,
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
                    "stream": False,  # Anthropic streaming format is different
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
                    # Google doesn't support streaming in the same way - disable it
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

                # Only OpenAI supports streaming with transformation
                if use_streaming:
                    from fastapi.responses import StreamingResponse

                    async def stream_generator() -> Any:
                        async for chunk in response.aiter_bytes():
                            yield chunk

                    return StreamingResponse(
                        stream_generator(),
                        media_type="text/event-stream",
                    )
                else:
                    # Transform provider-specific response to OpenAI format
                    response_data = response.json()

                    if provider == "google":
                        # Google format: {"candidates": [{"content": {"parts": [{"text": "..."}]}}]}
                        # Transform to OpenAI format
                        text = ""
                        if (
                            "candidates" in response_data
                            and len(response_data["candidates"]) > 0
                        ):
                            candidate = response_data["candidates"][0]
                            if (
                                "content" in candidate
                                and "parts" in candidate["content"]
                            ):
                                text = "".join(
                                    part.get("text", "")
                                    for part in candidate["content"]["parts"]
                                )

                        return {
                            "id": "chatcmpl-google",
                            "object": "chat.completion",
                            "created": 0,
                            "model": base_model,
                            "choices": [
                                {
                                    "index": 0,
                                    "message": {"role": "assistant", "content": text},
                                    "finish_reason": "stop",
                                }
                            ],
                        }

                    elif provider == "anthropic":
                        # Anthropic format: {"content": [{"text": "..."}]}
                        # Transform to OpenAI format
                        text = ""
                        if "content" in response_data:
                            text = "".join(
                                block.get("text", "")
                                for block in response_data["content"]
                                if block.get("type") == "text"
                            )

                        return {
                            "id": "chatcmpl-anthropic",
                            "object": "chat.completion",
                            "created": 0,
                            "model": base_model,
                            "choices": [
                                {
                                    "index": 0,
                                    "message": {"role": "assistant", "content": text},
                                    "finish_reason": response_data.get(
                                        "stop_reason", "stop"
                                    ),
                                }
                            ],
                        }

                    else:
                        # OpenAI format - return as-is
                        return response_data
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


# Chat history endpoints
@router.post("/messages", status_code=201)
async def save_message(
    request: SaveMessageRequest,
    user_id: CurrentUserDep,
    chat_repo: ChatRepoDep,
) -> ChatMessageResponse:
    """Save a chat message for the authenticated user."""
    import json

    message = await chat_repo.create_message(
        user_id=user_id,
        session_id=request.session_id,
        role=request.role,
        content=request.content,
        model=request.model,
        techniques=request.techniques,
    )

    return ChatMessageResponse(
        id=message.id,
        session_id=message.session_id,
        role=message.role,
        content=message.content,
        model=message.model,
        techniques=json.loads(message.techniques) if message.techniques else None,
        created_at=message.created_at,
    )


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(
    user_id: CurrentUserDep,
    chat_repo: ChatRepoDep,
) -> SessionListResponse:
    """Get all chat sessions for the authenticated user."""
    sessions = await chat_repo.get_all_sessions(user_id)
    return SessionListResponse(sessions=sessions)


@router.get("/sessions/{session_id}", response_model=SessionHistoryResponse)
async def get_session_history(
    session_id: str,
    user_id: CurrentUserDep,
    chat_repo: ChatRepoDep,
) -> SessionHistoryResponse:
    """Get all messages for a specific session."""
    import json

    messages = await chat_repo.get_messages_by_session(user_id, session_id)

    return SessionHistoryResponse(
        session_id=session_id,
        messages=[
            ChatMessageResponse(
                id=msg.id,
                session_id=msg.session_id,
                role=msg.role,
                content=msg.content,
                model=msg.model,
                techniques=json.loads(msg.techniques) if msg.techniques else None,
                created_at=msg.created_at,
            )
            for msg in messages
        ],
    )


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    user_id: CurrentUserDep,
    chat_repo: ChatRepoDep,
) -> None:
    """Delete all messages in a session."""
    await chat_repo.delete_session(user_id, session_id)


@router.delete("/messages", status_code=204)
async def delete_all_messages(
    user_id: CurrentUserDep,
    chat_repo: ChatRepoDep,
) -> None:
    """Delete all chat messages for the authenticated user."""
    await chat_repo.delete_all_messages(user_id)
