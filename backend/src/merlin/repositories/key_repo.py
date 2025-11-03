from datetime import datetime
from typing import Optional

from merlin.db.models import ApiKey
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class ApiKeyRepository:
    """Repository for API key database operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_all(self, user_id: str) -> list[ApiKey]:
        """Get all API keys for a specific user."""
        result = await self.session.execute(
            select(ApiKey).where(ApiKey.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_by_provider(self, user_id: str, provider: str) -> Optional[ApiKey]:
        """Get an API key by user ID and provider name."""
        result = await self.session.execute(
            select(ApiKey).where(ApiKey.user_id == user_id, ApiKey.provider == provider)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self, user_id: str, provider: str, encrypted_key: str, is_valid: bool
    ) -> ApiKey:
        """
        Insert or update an API key for a specific user.

        If a key exists for the user and provider, update it.
        Otherwise, create a new record.
        """
        existing = await self.get_by_provider(user_id, provider)

        if existing:
            existing.encrypted_key = encrypted_key
            existing.is_valid = is_valid
            existing.updated_at = datetime.utcnow()
            await self.session.commit()
            await self.session.refresh(existing)
            return existing
        else:
            new_key = ApiKey(
                user_id=user_id,
                provider=provider,
                encrypted_key=encrypted_key,
                is_valid=is_valid,
            )
            self.session.add(new_key)
            await self.session.commit()
            await self.session.refresh(new_key)
            return new_key

    async def delete(self, user_id: str, provider: str) -> bool:
        """
        Delete an API key by user ID and provider.

        Returns True if deleted, False if not found.
        """
        existing = await self.get_by_provider(user_id, provider)

        if existing:
            await self.session.delete(existing)
            await self.session.commit()
            return True

        return False
