import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from merlin.core.config import Settings, get_settings
from merlin.db.models import Base
from merlin.db.session import get_session
from merlin.main import app


# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
def test_settings() -> Settings:
    """Provide test settings with mock values."""
    return Settings(
        fernet_key="dGVzdC1rZXktdGVzdC1rZXktdGVzdC1rZXktdGVzdC1r",  # base64-encoded test key
        database_url=TEST_DATABASE_URL,
        optillm_url="http://mock-optillm:8000",
        cors_origins=["http://localhost:3000"],
        log_level="DEBUG",
    )


@pytest.fixture
async def test_db():
    """Create a test database and provide a session."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    sessionmaker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with sessionmaker() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
def test_client(test_settings: Settings, test_db: AsyncSession) -> TestClient:
    """Create a test client with overridden dependencies."""
    
    async def override_get_session():
        yield test_db
    
    def override_get_settings():
        return test_settings
    
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_settings] = override_get_settings
    
    with TestClient(app) as client:
        yield client
    
    app.dependency_overrides.clear()
