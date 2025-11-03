from datetime import datetime

from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    """Request model for creating/updating an API key."""

    provider: str = Field(..., description="Provider name (openai, anthropic, google)")
    api_key: str = Field(..., min_length=10, description="The API key to validate and store")


class ApiKeyResponse(BaseModel):
    """Response model for API key information."""

    provider: str
    masked_key: str
    is_valid: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApiKeyList(BaseModel):
    """Response model for listing API keys."""

    keys: list[ApiKeyResponse]
