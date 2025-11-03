"""Reset database with new schema including user_id column"""

import asyncio
import os

# Add src to path
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from merlin.db.models import Base
from merlin.db.session import get_engine


async def reset_database():
    """Drop all tables and recreate with new schema"""
    # Delete the old database file
    db_path = Path(__file__).parent / "merlin.db"
    if db_path.exists():
        print(f"Deleting old database: {db_path}")
        db_path.unlink()

    # Set environment variable
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./merlin.db"

    # Create engine and tables
    engine = get_engine()

    print("Creating new database with updated schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Database reset complete!")
    print("New tables created:")
    print("  - users (with id, email, hashed_password)")
    print("  - api_keys (with user_id column)")
    print("  - chat_messages (with user_id column)")
    print("  - workflows")
    print("  - workflow_steps")


if __name__ == "__main__":
    asyncio.run(reset_database())
