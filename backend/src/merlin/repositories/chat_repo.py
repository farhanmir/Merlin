"""Repository for chat message operations."""

import json
from typing import List, Optional

from merlin.db.models import ChatMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class ChatMessageRepository:
    """Repository for managing chat messages."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_message(
        self,
        user_id: str,
        session_id: str,
        role: str,
        content: str,
        model: Optional[str] = None,
        techniques: Optional[List[str]] = None,
    ) -> ChatMessage:
        """Create a new chat message."""
        message = ChatMessage(
            user_id=user_id,
            session_id=session_id,
            role=role,
            content=content,
            model=model,
            techniques=json.dumps(techniques) if techniques else None,
        )
        self.session.add(message)
        await self.session.commit()
        await self.session.refresh(message)
        return message

    async def get_messages_by_session(
        self, user_id: str, session_id: str
    ) -> List[ChatMessage]:
        """Get all messages for a specific session (user-specific)."""
        result = await self.session.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id, ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_all_sessions(self, user_id: str) -> List[str]:
        """Get all unique session IDs for a user, ordered by most recent first."""
        from sqlalchemy import func

        # Get session IDs with their max created_at, then order by that
        result = await self.session.execute(
            select(
                ChatMessage.session_id, func.max(ChatMessage.created_at).label("latest")
            )
            .where(ChatMessage.user_id == user_id)
            .group_by(ChatMessage.session_id)
            .order_by(func.max(ChatMessage.created_at).desc())
        )
        return [row[0] for row in result.all()]

    async def delete_session(self, user_id: str, session_id: str) -> None:
        """Delete all messages in a session (user-specific)."""
        result = await self.session.execute(
            select(ChatMessage).where(
                ChatMessage.user_id == user_id, ChatMessage.session_id == session_id
            )
        )
        messages = result.scalars().all()
        for message in messages:
            await self.session.delete(message)
        await self.session.commit()

    async def delete_all_messages(self, user_id: str) -> None:
        """Delete all messages for a user."""
        result = await self.session.execute(
            select(ChatMessage).where(ChatMessage.user_id == user_id)
        )
        messages = result.scalars().all()
        for message in messages:
            await self.session.delete(message)
        await self.session.commit()
