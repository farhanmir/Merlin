from typing import Annotated

from fastapi import Depends
from merlin.core.config import Settings, get_settings
from merlin.db.session import get_session
from merlin.repositories.key_repo import ApiKeyRepository
from merlin.services.external_api_service import ExternalAPIService
from merlin.services.optillm_service import OptiLLMService
from sqlalchemy.ext.asyncio import AsyncSession

# Re-export for convenience
SessionDep = Annotated[AsyncSession, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_key_repository(session: SessionDep) -> ApiKeyRepository:
    """Dependency for API key repository."""
    return ApiKeyRepository(session)


def get_optillm_service(settings: SettingsDep) -> OptiLLMService:
    """Dependency for OptiLLM service."""
    return OptiLLMService(settings.optillm_url)


def get_external_api_service(settings: SettingsDep) -> ExternalAPIService:
    """Dependency for external API service."""
    return ExternalAPIService(settings)


KeyRepoDep = Annotated[ApiKeyRepository, Depends(get_key_repository)]
OptiLLMDep = Annotated[OptiLLMService, Depends(get_optillm_service)]
ExternalAPIDep = Annotated[ExternalAPIService, Depends(get_external_api_service)]
