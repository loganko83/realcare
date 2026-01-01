# tests/conftest.py
"""
Shared test fixtures for RealCare backend tests.
"""

import os
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Set test environment before importing app
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://realcare:realcare@localhost:5432/realcare_test"

from app.main import app as fastapi_app
from app.core.database import get_db, Base
import app.models  # Ensure models are registered with Base.metadata


# Test database URL - use separate test database
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://realcare:realcare@localhost:5432/realcare_test"
)


@pytest.fixture
async def test_engine():
    """Create test database engine for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Cleanup after test
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create database session for each test."""
    async_session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False
    )

    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database override."""

    async def override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app),
        base_url="http://test"
    ) as ac:
        yield ac

    fastapi_app.dependency_overrides.clear()


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
    """Get authenticated agent headers (PENDING status)."""
    import uuid

    # Register as agent
    response = await client.post(
        "/api/v1/agents/register",
        headers=auth_headers,
        json={
            "business_name": f"Test Agency {uuid.uuid4().hex[:8]}",
            "license_number": f"2024-{uuid.uuid4().hex[:5]}",
            "business_number": f"123-{uuid.uuid4().hex[:2]}-{uuid.uuid4().hex[:5]}",
            "representative_name": "Test Representative",
            "office_address": "Seoul, Gangnam-gu, Test Building 123",
            "office_region": "gangnam",
            "office_phone": "02-1234-5678"
        }
    )

    if response.status_code not in [200, 201]:
        pytest.fail(f"Failed to register agent: {response.status_code} - {response.text}")

    return auth_headers


@pytest.fixture
async def verified_agent_headers(
    client: AsyncClient,
    auth_headers: dict,
    db_session: AsyncSession
) -> dict:
    """Get authenticated agent headers with VERIFIED status."""
    import uuid
    from datetime import datetime, timezone
    from sqlalchemy import select, update
    from app.models.agent import Agent, AgentStatus

    # Register as agent
    response = await client.post(
        "/api/v1/agents/register",
        headers=auth_headers,
        json={
            "business_name": f"Verified Agency {uuid.uuid4().hex[:8]}",
            "license_number": f"VER-{uuid.uuid4().hex[:5]}",
            "business_number": f"999-{uuid.uuid4().hex[:2]}-{uuid.uuid4().hex[:5]}",
            "representative_name": "Verified Representative",
            "office_address": "Seoul, Gangnam-gu, Premium Building 456",
            "office_region": "gangnam",
            "office_phone": "02-9999-8888"
        }
    )

    if response.status_code not in [200, 201]:
        pytest.fail(f"Failed to register agent: {response.status_code} - {response.text}")

    agent_data = response.json()
    agent_id = agent_data.get("id")

    # Update agent status to VERIFIED in database
    await db_session.execute(
        update(Agent)
        .where(Agent.id == agent_id)
        .values(
            status=AgentStatus.VERIFIED,
            verified_at=datetime.now(timezone.utc)
        )
    )
    await db_session.commit()

    return auth_headers


@pytest.fixture
async def admin_headers(client: AsyncClient, db_session: AsyncSession) -> dict:
    """Get authenticated admin user headers."""
    import uuid
    from sqlalchemy import update
    from app.models.user import User, UserRole

    unique_email = f"admin_{uuid.uuid4().hex[:8]}@example.com"

    # Register admin user
    register_response = await client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "AdminPass123!",
        "name": "Admin User"
    })

    if register_response.status_code != 201:
        pytest.fail(f"Failed to register admin: {register_response.text}")

    user_data = register_response.json()
    user_id = user_data.get("id")

    # Update user role to ADMIN in database
    await db_session.execute(
        update(User)
        .where(User.id == user_id)
        .values(role=UserRole.ADMIN)
    )
    await db_session.commit()

    # Login
    response = await client.post("/api/v1/auth/login/json", json={
        "email": unique_email,
        "password": "AdminPass123!"
    })

    if response.status_code != 200:
        pytest.fail(f"Failed to login as admin: {response.text}")

    tokens = response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}
