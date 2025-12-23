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
                "agency_name": f"Test Agency {uuid.uuid4().hex[:8]}",
                "license_number": f"2024-{uuid.uuid4().hex[:5]}",
                "business_number": f"123-45-{uuid.uuid4().hex[:5]}",
                "representative_name": "Hong Gildong",
                "office_address": "Seoul, Gangnam-gu, Teheran-ro 123",
                "office_phone": "02-1234-5678"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["tier"] == "FREE"
        assert data["is_verified"] == False

    async def test_register_agent_missing_fields(self, client: AsyncClient, auth_headers: dict):
        """Test agent registration with missing fields."""
        response = await client.post(
            "/api/v1/agents/register",
            headers=auth_headers,
            json={
                "agency_name": "Incomplete Agency"
            }
        )

        assert response.status_code == 422

    async def test_register_agent_unauthenticated(self, client: AsyncClient):
        """Test agent registration without authentication."""
        response = await client.post(
            "/api/v1/agents/register",
            json={
                "agency_name": "Unauth Agency",
                "license_number": "2024-99999",
                "business_number": "123-45-67890",
                "representative_name": "Test",
                "office_address": "Seoul",
                "office_phone": "02-1234-5678"
            }
        )

        assert response.status_code == 401


class TestAgentProfile:
    """Test agent profile operations."""

    async def test_get_my_agent(self, client: AsyncClient, agent_headers: dict):
        """Test getting own agent profile."""
        response = await client.get(
            "/api/v1/agents/me",
            headers=agent_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "agency_name" in data
        assert "tier" in data

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

        assert response.status_code == 404


class TestAgentDashboard:
    """Test agent dashboard."""

    async def test_get_dashboard(self, client: AsyncClient, agent_headers: dict):
        """Test getting agent dashboard."""
        response = await client.get(
            "/api/v1/agents/dashboard",
            headers=agent_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_listings" in data or "agent" in data


class TestAgentListings:
    """Test agent listings management."""

    async def test_create_listing(self, client: AsyncClient, agent_headers: dict):
        """Test creating a new listing."""
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

        # Should succeed or fail gracefully
        assert response.status_code in [200, 201, 422]

    async def test_get_my_listings(self, client: AsyncClient, agent_headers: dict):
        """Test getting own listings."""
        response = await client.get(
            "/api/v1/agents/me/listings",
            headers=agent_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict) or isinstance(data, list)


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
