from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from merlin.api.health import router as health_router
from merlin.api.v1.auth import router as auth_router
from merlin.api.v1.chat import router as chat_router
from merlin.api.v1.keys import router as keys_router
from merlin.api.v1.workflows import router as workflows_router
from merlin.core.config import get_settings
from merlin.core.rate_limit import limiter
from merlin.db.session import init_db
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    settings = get_settings()
    print(f"Starting Merlin API v{app.version}")
    print(f"Database: {settings.database_url}")

    await init_db()
    print("Database initialized")

    yield

    # Shutdown
    print("Shutting down Merlin API")


app = FastAPI(
    title="Merlin API",
    version="0.1.0",
    description="Agentic AI Workbench with BYOK and OptiLLM integration",
    lifespan=lifespan,
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, tags=["health"])
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(chat_router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(keys_router, prefix="/api/v1/keys", tags=["keys"])
app.include_router(workflows_router, prefix="/api/v1/workflows", tags=["workflows"])


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Merlin API", "version": "0.1.0"}
