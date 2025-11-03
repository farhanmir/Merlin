import httpx
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response

from merlin.api.deps import KeyRepoDep, SettingsDep
from merlin.core.security import decrypt_api_key, encrypt_api_key
from merlin.schemas.keys import ApiKeyCreate, ApiKeyList, ApiKeyResponse

router = APIRouter()

# Provider validation endpoints
VALIDATION_ENDPOINTS = {
    "openai": ("https://api.openai.com/v1/models", "Authorization", "Bearer"),
    "anthropic": ("https://api.anthropic.com/v1/models", "x-api-key", ""),
    "google": ("https://generativelanguage.googleapis.com/v1/models", "key", ""),
}


async def validate_api_key(provider: str, api_key: str) -> bool:
    """
    Validate an API key by making a test request to the provider's API.
    
    Returns True if valid, False otherwise.
    """
    if provider not in VALIDATION_ENDPOINTS:
        return False
    
    url, header_key, prefix = VALIDATION_ENDPOINTS[provider]
    
    if provider == "google":
        # Google uses query parameter
        url = f"{url}?key={api_key}"
        headers = {}
    else:
        # OpenAI and Anthropic use headers
        auth_value = f"{prefix} {api_key}".strip()
        headers = {header_key: auth_value}
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, headers=headers)
            return response.status_code == 200
        except httpx.HTTPError:
            return False


@router.get("", response_model=ApiKeyList)
async def list_api_keys(key_repo: KeyRepoDep, settings: SettingsDep) -> ApiKeyList:
    """
    List all configured API keys (with masked values).
    """
    keys = await key_repo.get_all()
    
    api_keys = []
    for key in keys:
        # Decrypt the key to create a meaningful mask from plaintext
        try:
            plaintext_key = decrypt_api_key(key.encrypted_key, settings.fernet_key)
            # Mask the plaintext: show first 3 and last 4 characters
            if len(plaintext_key) > 7:
                masked = f"{plaintext_key[:3]}...{plaintext_key[-4:]}"
            else:
                masked = "***"
        except Exception:
            # If decryption fails, use a generic mask
            masked = "***...***"
        
        api_keys.append(
            ApiKeyResponse(
                provider=key.provider,
                masked_key=masked,
                is_valid=key.is_valid,
                created_at=key.created_at,
                updated_at=key.updated_at,
            )
        )
    
    return ApiKeyList(keys=api_keys)


@router.post("", response_model=ApiKeyResponse)
async def add_api_key(
    request: ApiKeyCreate,
    key_repo: KeyRepoDep,
    settings: SettingsDep,
) -> ApiKeyResponse:
    """
    Add or update an API key.
    
    The key will be validated before storage.
    """
    # Validate the API key
    is_valid = await validate_api_key(request.provider, request.api_key)
    
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid API key for provider: {request.provider}",
        )
    
    # Encrypt the API key
    encrypted_key = encrypt_api_key(request.api_key, settings.fernet_key)
    
    # Store in database
    api_key_record = await key_repo.upsert(
        provider=request.provider,
        encrypted_key=encrypted_key,
        is_valid=is_valid,
    )
    
    # Create meaningful mask from plaintext
    if len(request.api_key) > 7:
        masked = f"{request.api_key[:3]}...{request.api_key[-4:]}"
    else:
        masked = "***"

    return ApiKeyResponse(
        provider=api_key_record.provider,
        masked_key=masked,
        is_valid=api_key_record.is_valid,
        created_at=api_key_record.created_at,
        updated_at=api_key_record.updated_at,
    )


@router.delete("/{provider}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(provider: str, key_repo: KeyRepoDep) -> Response:
    """
    Delete an API key for a specific provider.
    """
    deleted = await key_repo.delete(provider)
    
    if not deleted:
        raise HTTPException(status_code=404, detail=f"No API key found for provider: {provider}")
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)
