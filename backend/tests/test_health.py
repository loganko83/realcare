# tests/test_health.py
"""
Health check endpoint tests for RealCare backend.
"""

import pytest
from httpx import AsyncClient


class TestHealthCheck:
    """Test health check endpoints."""

    async def test_basic_health_check(self, client: AsyncClient):
        """Test basic health check endpoint."""
        response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "realcare-api"
        assert "timestamp" in data

    async def test_detailed_health_check(self, client: AsyncClient):
        """Test detailed health check with component status."""
        response = await client.get("/api/v1/health/detailed")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "checks" in data
        assert "api" in data["checks"]
        assert "database" in data["checks"]
        assert data["checks"]["api"] == "healthy"
        # In test environment with test DB, database should be healthy
        assert data["checks"]["database"] == "healthy"

    async def test_readiness_check(self, client: AsyncClient):
        """Test Kubernetes-style readiness check."""
        response = await client.get("/api/v1/health/ready")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"

    async def test_liveness_check(self, client: AsyncClient):
        """Test Kubernetes-style liveness check."""
        response = await client.get("/api/v1/health/live")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"


class TestHealthCheckFields:
    """Test health check response fields."""

    async def test_health_check_timestamp_format(self, client: AsyncClient):
        """Test that timestamp is in ISO format."""
        response = await client.get("/api/v1/health")
        data = response.json()

        # Should be ISO 8601 format with timezone
        timestamp = data["timestamp"]
        assert "T" in timestamp  # ISO format separator
        # Should contain timezone info or Z for UTC
        assert "+" in timestamp or "Z" in timestamp

    async def test_detailed_health_has_version(self, client: AsyncClient):
        """Test that detailed health includes version info."""
        response = await client.get("/api/v1/health/detailed")
        data = response.json()

        # Version should be included
        assert "version" in data


class TestHealthDegradation:
    """Test health status with component failures."""

    async def test_overall_status_calculation(self, client: AsyncClient):
        """Test overall status is calculated from component health."""
        response = await client.get("/api/v1/health/detailed")
        data = response.json()

        # If all critical services healthy, overall should be healthy
        if all(
            data["checks"].get(s) == "healthy"
            for s in ["api", "database"]
        ):
            assert data["status"] in ["healthy", "degraded"]
