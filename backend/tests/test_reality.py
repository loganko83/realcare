# tests/test_reality.py
"""
Reality Check calculation tests for RealCare backend.
"""

import pytest
from httpx import AsyncClient


class TestRealityCalculation:
    """Test reality check calculations."""

    async def test_calculate_success(self, client: AsyncClient, auth_headers: dict):
        """Test successful reality check calculation."""
        response = await client.post(
            "/api/v1/reality/calculate",
            headers=auth_headers,
            json={
                "target_price": 500000000,
                "region": "seoul-gangnam",
                "annual_income": 80000000,
                "cash_available": 200000000,
                "existing_debt": 50000000,
                "is_first_home": True,
                "house_count": 0
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "grade" in data
        assert 0 <= data["score"] <= 100
        assert data["grade"] in ["A", "B", "C", "D", "F"]

    async def test_speculative_zone_ltv(self, client: AsyncClient, auth_headers: dict):
        """Test LTV limits in speculative zones (Gangnam, Seocho, Songpa)."""
        response = await client.post(
            "/api/v1/reality/calculate",
            headers=auth_headers,
            json={
                "target_price": 1000000000,
                "region": "seoul-gangnam",
                "annual_income": 100000000,
                "cash_available": 500000000,
                "is_first_home": True,
                "house_count": 0
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Gangnam is speculative zone: 50% LTV for first-time homebuyer
        if "analysis" in data:
            assert data["analysis"]["applicable_ltv"] <= 50

    async def test_adjusted_zone_ltv(self, client: AsyncClient, auth_headers: dict):
        """Test LTV limits in adjusted zones (Mapo, Seongdong)."""
        response = await client.post(
            "/api/v1/reality/calculate",
            headers=auth_headers,
            json={
                "target_price": 800000000,
                "region": "seoul-mapo",
                "annual_income": 90000000,
                "cash_available": 300000000,
                "is_first_home": True,
                "house_count": 0
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Mapo is adjusted zone: 70% LTV for first-time homebuyer
        if "analysis" in data:
            assert data["analysis"]["applicable_ltv"] <= 70

    async def test_non_regulated_zone_ltv(self, client: AsyncClient, auth_headers: dict):
        """Test LTV limits in non-regulated zones."""
        response = await client.post(
            "/api/v1/reality/calculate",
            headers=auth_headers,
            json={
                "target_price": 500000000,
                "region": "gyeonggi-other",
                "annual_income": 80000000,
                "cash_available": 150000000,
                "is_first_home": False,
                "house_count": 1
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Non-regulated zones: 70% LTV
        if "analysis" in data:
            assert data["analysis"]["applicable_ltv"] == 70

    async def test_multi_home_owner_ltv(self, client: AsyncClient, auth_headers: dict):
        """Test LTV limits for multi-home owners."""
        response = await client.post(
            "/api/v1/reality/calculate",
            headers=auth_headers,
            json={
                "target_price": 1000000000,
                "region": "seoul-gangnam",
                "annual_income": 150000000,
                "cash_available": 700000000,
                "is_first_home": False,
                "house_count": 2
            }
        )

        assert response.status_code == 200
        data = response.json()

        # 2+ homes in speculative zone: 0% LTV (no mortgage)
        if "analysis" in data:
            assert data["analysis"]["applicable_ltv"] == 0

    async def test_dsr_calculation(self, client: AsyncClient, auth_headers: dict):
        """Test DSR calculation."""
        response = await client.post(
            "/api/v1/reality/calculate",
            headers=auth_headers,
            json={
                "target_price": 500000000,
                "region": "seoul-gangnam",
                "annual_income": 60000000,
                "cash_available": 100000000,
                "existing_debt": 100000000,
                "is_first_home": True,
                "house_count": 0
            }
        )

        assert response.status_code == 200
        data = response.json()

        # DSR should be calculated
        if "analysis" in data:
            assert "dsr_percentage" in data["analysis"]
            assert 0 <= data["analysis"]["dsr_percentage"] <= 100

    async def test_high_dsr_warning(self, client: AsyncClient, auth_headers: dict):
        """Test warning when DSR exceeds limit."""
        response = await client.post(
            "/api/v1/reality/calculate",
            headers=auth_headers,
            json={
                "target_price": 1500000000,
                "region": "seoul-gangnam",
                "annual_income": 50000000,
                "cash_available": 100000000,
                "existing_debt": 200000000,
                "is_first_home": True,
                "house_count": 0
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Should have low score due to high DSR
        assert data["score"] < 60

    async def test_grade_calculation(self, client: AsyncClient, auth_headers: dict):
        """Test grade calculation based on score."""
        # High score scenario
        response = await client.post(
            "/api/v1/reality/calculate",
            headers=auth_headers,
            json={
                "target_price": 300000000,
                "region": "gyeonggi-other",
                "annual_income": 100000000,
                "cash_available": 200000000,
                "existing_debt": 0,
                "is_first_home": True,
                "house_count": 0
            }
        )

        assert response.status_code == 200
        data = response.json()

        # With good conditions, should have good grade
        assert data["grade"] in ["A", "B", "C"]

    async def test_missing_required_fields(self, client: AsyncClient, auth_headers: dict):
        """Test calculation with missing required fields."""
        response = await client.post(
            "/api/v1/reality/calculate",
            headers=auth_headers,
            json={
                "target_price": 500000000
            }
        )

        assert response.status_code == 422

    async def test_invalid_values(self, client: AsyncClient, auth_headers: dict):
        """Test calculation with invalid values."""
        response = await client.post(
            "/api/v1/reality/calculate",
            headers=auth_headers,
            json={
                "target_price": -500000000,  # Negative price
                "region": "seoul-gangnam",
                "annual_income": 80000000,
                "cash_available": 200000000,
                "is_first_home": True
            }
        )

        # Should reject negative values
        assert response.status_code in [400, 422]

    async def test_unauthenticated_request(self, client: AsyncClient):
        """Test calculation without authentication."""
        response = await client.post(
            "/api/v1/reality/calculate",
            json={
                "target_price": 500000000,
                "region": "seoul-gangnam",
                "annual_income": 80000000,
                "cash_available": 200000000,
                "is_first_home": True
            }
        )

        assert response.status_code == 401
