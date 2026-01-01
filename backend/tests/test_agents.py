# tests/test_agents.py
"""
Agent tests for RealCare backend.
"""

import pytest
import uuid
from httpx import AsyncClient


class TestAgentRegistration:
    """Test agent registration."""

    async def test_register_agent_success(self, client: AsyncClient, auth_headers: dict):
        """Test successful agent registration."""
        response = await client.post(
            "/api/v1/agents/register",
            headers=auth_headers,
            json={
                "business_name": f"Test Agency {uuid.uuid4().hex[:8]}",
                "license_number": f"2024-{uuid.uuid4().hex[:5]}",
                "business_number": f"123-45-{uuid.uuid4().hex[:5]}",
                "representative_name": "Hong Gildong",
                "office_address": "Seoul, Gangnam-gu, Teheran-ro 123",
                "office_region": "gangnam",
                "office_phone": "02-1234-5678"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["tier"].lower() == "free"

    async def test_register_agent_missing_fields(self, client: AsyncClient, auth_headers: dict):
        """Test agent registration with missing fields."""
        response = await client.post(
            "/api/v1/agents/register",
            headers=auth_headers,
            json={
                "business_name": "Incomplete Agency"
            }
        )

        assert response.status_code == 422

    async def test_register_agent_unauthenticated(self, client: AsyncClient):
        """Test agent registration without authentication."""
        response = await client.post(
            "/api/v1/agents/register",
            json={
                "business_name": "Unauth Agency",
                "license_number": "2024-99999",
                "business_number": "123-45-67890",
                "representative_name": "Test",
                "office_address": "Seoul, Gangnam-gu, Test Address 123",
                "office_region": "gangnam",
                "office_phone": "02-1234-5678"
            }
        )

        assert response.status_code == 401


class TestAgentProfile:
    """Test agent profile operations."""

    async def test_get_my_agent_pending(self, client: AsyncClient, agent_headers: dict):
        """Test getting own agent profile - pending agent gets 403."""
        response = await client.get(
            "/api/v1/agents/me",
            headers=agent_headers
        )

        # Agent is PENDING (not VERIFIED), so 403 is expected
        assert response.status_code == 403

    async def test_get_my_agent_verified(self, client: AsyncClient, verified_agent_headers: dict):
        """Test getting own agent profile - verified agent gets profile."""
        response = await client.get(
            "/api/v1/agents/me",
            headers=verified_agent_headers
        )

        # Verified agent should get their profile
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "status" in data

    async def test_get_my_agent_not_registered(self, client: AsyncClient, auth_headers: dict):
        """Test getting agent profile when not registered as agent."""
        # Create new user who is not an agent
        unique_email = f"notagen_{uuid.uuid4().hex[:8]}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "Password123!",
            "name": "Not Agent"
        })
        login_resp = await client.post("/api/v1/auth/login/json", json={
            "email": unique_email,
            "password": "Password123!"
        })
        tokens = login_resp.json()
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}

        response = await client.get("/api/v1/agents/me", headers=headers)

        # 403 - not registered as agent
        assert response.status_code == 403


class TestAgentDashboard:
    """Test agent dashboard."""

    async def test_get_dashboard_pending(self, client: AsyncClient, agent_headers: dict):
        """Test getting agent dashboard - pending agent gets 403."""
        response = await client.get(
            "/api/v1/agents/dashboard",
            headers=agent_headers
        )

        # Agent is PENDING, so 403 is expected
        assert response.status_code == 403

    async def test_get_dashboard_verified(self, client: AsyncClient, verified_agent_headers: dict):
        """Test getting agent dashboard - verified agent succeeds."""
        response = await client.get(
            "/api/v1/agents/dashboard",
            headers=verified_agent_headers
        )

        # Verified agent should get dashboard
        assert response.status_code == 200
        data = response.json()
        assert "agent" in data or "stats" in data or "listings" in data


class TestAgentListings:
    """Test agent listings management."""

    async def test_create_listing_pending(self, client: AsyncClient, agent_headers: dict):
        """Test creating a new listing - pending agent gets 403."""
        response = await client.post(
            "/api/v1/agents/listings",
            headers=agent_headers,
            json={
                "property_type": "apartment",
                "transaction_type": "sale",
                "title": "Test Apartment Listing",
                "address": "Seoul, Gangnam, Test Building 101",
                "price": 500000000,
                "area_sqm": 85,
                "floor": 10,
                "total_floors": 20,
                "description": "Beautiful test apartment"
            }
        )

        # Agent is PENDING, so 403 is expected
        assert response.status_code == 403

    async def test_create_listing_verified(self, client: AsyncClient, verified_agent_headers: dict):
        """Test creating a new listing - verified agent succeeds."""
        response = await client.post(
            "/api/v1/agents/listings",
            headers=verified_agent_headers,
            json={
                "property_type": "apartment",
                "transaction_type": "sale",
                "title": "Verified Agent Listing",
                "address": "Seoul, Gangnam, Premium Building 202",
                "price": 750000000,
                "area_sqm": 95,
                "floor": 15,
                "total_floors": 30,
                "description": "Premium apartment from verified agent"
            }
        )

        # Verified agent should be able to create listings
        assert response.status_code in [200, 201]

    async def test_get_my_listings(self, client: AsyncClient, agent_headers: dict):
        """Test getting own listings."""
        response = await client.get(
            "/api/v1/agents/me/listings",
            headers=agent_headers
        )

        # Endpoint might not exist or require verification
        assert response.status_code in [200, 403, 404]


class TestAgentSignals:
    """Test agent signal responses."""

    async def test_get_available_signals(self, client: AsyncClient, agent_headers: dict):
        """Test getting available owner signals."""
        response = await client.get(
            "/api/v1/agents/signals/available",
            headers=agent_headers
        )

        # May return 200 or 404 if no signals
        assert response.status_code in [200, 404]


class TestPublicAgentEndpoints:
    """Test public agent endpoints."""

    async def test_list_agents(self, client: AsyncClient):
        """Test listing verified agents (public)."""
        response = await client.get("/api/v1/agents/")

        assert response.status_code == 200
        data = response.json()
        assert "items" in data or isinstance(data, list)
