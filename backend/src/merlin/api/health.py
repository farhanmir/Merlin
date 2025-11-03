from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from merlin.api.deps import ExternalAPIDep, KeyRepoDep, OptiLLMDep, get_session
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for container orchestration."""
    return {"status": "ok", "version": "0.1.0"}


@router.get("/ready")
async def readiness_check() -> dict[str, str]:
    """
    Readiness check endpoint.

    In a production system, this would verify:
    - Database connectivity
    - OptiLLM connectivity
    - Other critical dependencies
    """
    return {"status": "ready", "version": "0.1.0"}


@router.get("/health/detailed")
async def detailed_health_check(
    session: AsyncSession = Depends(get_session),
    optillm: OptiLLMDep = None,
    key_repo: KeyRepoDep = None,
    external_api_service: ExternalAPIDep = None,
) -> dict:
    """
    Detailed health check for all services and dependencies.
    Returns status of database, OptiLLM, configured API keys, and external APIs.
    """
    health_status = {
        "timestamp": datetime.now().isoformat(),
        "overall_status": "healthy",
        "services": {},
        "api_keys": {},
        "external_apis": {},
    }

    # Check database connectivity
    try:
        await session.execute(text("SELECT 1"))
        health_status["services"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful",
        }
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "unhealthy",
            "message": f"Database error: {str(e)}",
        }
        health_status["overall_status"] = "degraded"

    # Check OptiLLM service (direct integration)
    try:
        # OptiLLM is directly integrated, verify it's available
        if optillm is not None:
            technique_count = len(optillm.TECHNIQUES)
            health_status["services"]["optillm"] = {
                "status": "healthy",
                "message": "OptiLLM direct integration active",
                "integration": "direct",
                "techniques_available": technique_count,
            }
        else:
            health_status["services"]["optillm"] = {
                "status": "unavailable",
                "message": "OptiLLM service not initialized",
                "integration": "direct",
            }
            health_status["overall_status"] = "degraded"
    except Exception as e:
        health_status["services"]["optillm"] = {
            "status": "unhealthy",
            "message": f"OptiLLM error: {str(e)}",
            "integration": "direct",
        }
        health_status["overall_status"] = "degraded"

    # Check API key configuration
    if key_repo:
        try:
            providers = ["openai", "anthropic", "google"]
            for provider in providers:
                key = await key_repo.get_by_provider(provider)
                health_status["api_keys"][provider] = {
                    "configured": key is not None,
                    "valid": key.is_valid if key else False,
                }
        except Exception as e:
            health_status["api_keys"]["error"] = str(e)

    # Check external API configuration
    if external_api_service:
        try:
            api_health = (
                external_api_service.check_api_health()
            )  # No await - sync method
            health_status["external_apis"] = api_health
        except Exception as e:
            health_status["external_apis"]["error"] = str(e)

    return health_status
