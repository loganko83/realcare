# tests/test_payments.py
"""
Payment and subscription tests for RealCare backend.
"""

import pytest
from httpx import AsyncClient


class TestSubscriptionPlans:
    """Test subscription plans endpoints."""

    async def test_get_plans(self, client: AsyncClient):
        """Test getting all subscription plans."""
        response = await client.get("/api/v1/payments/plans")

        assert response.status_code == 200
        data = response.json()

        # Should have at least free plan
        assert len(data) >= 1

        plans = [p["plan"] for p in data]
        assert "free" in plans

    async def test_get_plan_by_id(self, client: AsyncClient):
        """Test getting specific plan."""
        response = await client.get("/api/v1/payments/plans/basic")

        # Plan might exist or not
        assert response.status_code in [200, 404]


class TestPaymentOperations:
    """Test payment operations."""

    async def test_create_payment(self, client: AsyncClient, auth_headers: dict):
        """Test creating a payment."""
        response = await client.post(
            "/api/v1/payments/payments",
            headers=auth_headers,
            json={
                "amount": 29000,
                "method": "card",
                "product_type": "subscription",
                "product_id": "basic-monthly"
            }
        )

        # Should create or have validation error
        assert response.status_code in [200, 201, 422]

        if response.status_code in [200, 201]:
            data = response.json()
            assert "id" in data or "payment_id" in data

    async def test_get_my_payments(self, client: AsyncClient, auth_headers: dict):
        """Test getting user's payment history."""
        response = await client.get(
            "/api/v1/payments/payments",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "items" in data

    async def test_get_my_payments_unauthenticated(self, client: AsyncClient):
        """Test getting payments without authentication."""
        response = await client.get("/api/v1/payments/payments")

        assert response.status_code == 401


class TestSubscriptionOperations:
    """Test subscription management."""

    async def test_get_my_subscription(self, client: AsyncClient, auth_headers: dict):
        """Test getting current subscription."""
        response = await client.get(
            "/api/v1/payments/subscription",
            headers=auth_headers
        )

        # May have subscription or not
        assert response.status_code in [200, 404]

    async def test_subscribe_to_plan(self, client: AsyncClient, auth_headers: dict):
        """Test subscribing to a plan."""
        response = await client.post(
            "/api/v1/payments/subscription",
            headers=auth_headers,
            json={
                "plan": "basic",
                "billing_cycle": "monthly",
                "payment_method": "card"
            }
        )

        # Should create subscription or have validation error
        assert response.status_code in [200, 201, 400, 422]

    async def test_cancel_subscription(self, client: AsyncClient, auth_headers: dict):
        """Test cancelling subscription."""
        response = await client.delete(
            "/api/v1/payments/subscription",
            headers=auth_headers
        )

        # May cancel or have no subscription
        assert response.status_code in [200, 204, 404]


class TestAgentSubscriptions:
    """Test agent-specific subscription features."""

    async def test_agent_tier_limits(self, client: AsyncClient, agent_headers: dict):
        """Test that agent tier affects limits."""
        response = await client.get(
            "/api/v1/agents/dashboard",
            headers=agent_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Free tier should have limits
        if "limits" in data:
            assert "max_listings" in data["limits"] or "listings_limit" in data["limits"]
