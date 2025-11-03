from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from merlin.core.config import Settings, get_settings
from merlin.core.security import decode_access_token
from merlin.db.session import get_session
from merlin.repositories.chat_repo import ChatMessageRepository
from merlin.repositories.key_repo import ApiKeyRepository
from merlin.services.external_api_service import ExternalAPIService
from merlin.services.optillm_service import OptiLLMService
from sqlalchemy.ext.asyncio import AsyncSession

# Re-export for convenience
SessionDep = Annotated[AsyncSession, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]

# Security
security = HTTPBearer(auto_error=False)


def get_key_repository(session: SessionDep) -> ApiKeyRepository:
    """Dependency for API key repository."""
    return ApiKeyRepository(session)


def get_chat_repository(session: SessionDep) -> ChatMessageRepository:
    """Dependency for chat message repository."""
    return ChatMessageRepository(session)


def get_optillm_service() -> OptiLLMService:
    """Dependency for OptiLLM service."""
    return OptiLLMService()


def get_external_api_service(settings: SettingsDep) -> ExternalAPIService:
    """Dependency for external API service."""
    return ExternalAPIService(settings)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str:
    """Extract and verify user ID from JWT token.

    Args:
        credentials: HTTP Bearer token credentials

    Returns:
        User ID from token

    Raises:
        HTTPException: If token is missing or invalid
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


KeyRepoDep = Annotated[ApiKeyRepository, Depends(get_key_repository)]
ChatRepoDep = Annotated[ChatMessageRepository, Depends(get_chat_repository)]
OptiLLMDep = Annotated[OptiLLMService, Depends(get_optillm_service)]
CurrentUserDep = Annotated[str, Depends(get_current_user_id)]
ExternalAPIDep = Annotated[ExternalAPIService, Depends(get_external_api_service)]
CurrentUserDep = Annotated[str, Depends(get_current_user_id)]
