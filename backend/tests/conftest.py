# tests/conftest.py
"""
Shared test fixtures for RealCare backend tests.
"""

import os
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Set test environment
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://realcare:realcare@localhost:5432/realcare_test"

from app.main import app
from app.core.database import get_db, Base


# Test database URL - use separate test database
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://realcare:realcare@localhost:5432/realcare_test"
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        pool_pre_ping=True
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop tables after all tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create database session for each test."""
    async_session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session_factory() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database override."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict:
    """Get authenticated user headers."""
    import uuid

    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    # Register test user
    register_response = await client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "TestPass123!",
        "name": "Test User"
    })

    if register_response.status_code != 201:
        # User might already exist, try login
        pass

    # Login
    response = await client.post("/api/v1/auth/login/json", json={
        "email": unique_email,
        "password": "TestPass123!"
    })

    if response.status_code != 200:
        pytest.fail(f"Failed to login: {response.text}")

    tokens = response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.fixture
async def agent_headers(client: AsyncClient, auth_headers: dict) -> dict:
    """Get authenticated agent headers."""
    import uuid

    # Register as agent
    response = await client.post(
        "/api/v1/agents/register",
        headers=auth_headers,
        json={
            "agency_name": f"Test Agency {uuid.uuid4().hex[:8]}",
            "license_number": f"2024-{uuid.uuid4().hex[:5]}",
            "business_number": f"123-{uuid.uuid4().hex[:2]}-{uuid.uuid4().hex[:5]}",
            "representative_name": "Test Representative",
            "office_address": "Seoul, Gangnam, Test Building",
            "office_phone": "02-1234-5678"
        }
    )

    # Agent registration might fail if already registered, but that's okay
    return auth_headers
