from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Security
    fernet_key: str

    # Database
    database_url: str = "sqlite+aiosqlite:///./merlin.db"

    # OptiLLM
    optillm_url: str = "http://localhost:8000"

    # External APIs (Optional - for workflow steps)
    gptzero_api_key: str = ""  # For AI detection step
    # Note: undetectableai.pro is free and uses browser automation (no API key needed)

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Logging
    log_level: str = "INFO"

    @field_validator("fernet_key")
    @classmethod
    def validate_fernet_key(cls, v: str) -> str:
        """Validate that the Fernet key is properly formatted."""
        if not v:
            raise ValueError("FERNET_KEY is required")
        if len(v) != 44:
            raise ValueError(
                "FERNET_KEY must be exactly 44 characters (base64-encoded 32 bytes)"
            )
        return v

    @field_validator("cors_origins", mode="before")
    @classmethod
    def validate_cors_origins(cls, v: str | list[str]) -> list[str]:
        """
        Convert CORS_ORIGINS from string to list if needed.
        Handles both comma-separated strings and list inputs.
        """
        if isinstance(v, str):
            # Split on commas and trim whitespace
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()  # type: ignore
