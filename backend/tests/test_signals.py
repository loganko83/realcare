# tests/test_signals.py
"""
Owner Signal tests for RealCare backend.
"""

import pytest
import uuid
from httpx import AsyncClient


class TestSignalPublicEndpoints:
    """Test public signal endpoints."""

    async def test_list_signals_empty(self, client: AsyncClient):
        """Test listing signals when empty."""
        response = await client.get("/api/v1/signals")

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert data["page"] == 1

    async def test_list_signals_with_filters(self, client: AsyncClient):
        """Test listing signals with filters."""
        response = await client.get(
            "/api/v1/signals",
            params={
                "region": "gangnam",
                "property_type": "apartment",
                "min_price": 100000000,
                "max_price": 500000000,
                "page": 1,
                "page_size": 10
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data


class TestSignalCreate:
    """Test signal creation."""

    async def test_create_signal_success(self, client: AsyncClient, auth_headers: dict):
        """Test successful signal creation."""
        response = await client.post(
            "/api/v1/signals",
            headers=auth_headers,
            json={
                "property_type": "apartment",
                "property_address": "Seoul, Gangnam-gu, Test Apartment 101-1234",
                "property_size": 84.5,
                "floor": 15,
                "total_floors": 25,
                "built_year": 2020,
                "region": "gangnam",
                "district": "gangnam-gu",
                "asking_price": 850000000,
                "is_negotiable": True,
                "min_acceptable_price": 800000000,
                "is_anonymous": True,
                "description": "Well-maintained apartment with great view",
                "features": ["parking", "security", "gym"]
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["property_type"] == "apartment"
        assert data["asking_price"] == 850000000
        assert data["status"] == "active"
        assert data["is_anonymous"] == True
        assert "id" in data

    async def test_create_signal_minimal(self, client: AsyncClient, auth_headers: dict):
        """Test signal creation with minimal required fields."""
        response = await client.post(
            "/api/v1/signals",
            headers=auth_headers,
            json={
                "property_type": "apartment",
                "property_address": "Seoul, Seocho-gu, Minimal Test 202",
                "region": "seocho",
                "asking_price": 500000000
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["region"] == "seocho"

    async def test_create_signal_unauthenticated(self, client: AsyncClient):
        """Test signal creation without authentication."""
        response = await client.post(
            "/api/v1/signals",
            json={
                "property_type": "apartment",
                "property_address": "Seoul Test Address",
                "region": "gangnam",
                "asking_price": 500000000
            }
        )

        assert response.status_code == 401

    async def test_create_signal_invalid_price(self, client: AsyncClient, auth_headers: dict):
        """Test signal creation with invalid price."""
        response = await client.post(
            "/api/v1/signals",
            headers=auth_headers,
            json={
                "property_type": "apartment",
                "property_address": "Seoul Test Address",
                "region": "gangnam",
                "asking_price": -1000
            }
        )

        assert response.status_code == 422


class TestSignalOperations:
    """Test signal CRUD operations."""

    async def test_get_signal(self, client: AsyncClient, auth_headers: dict):
        """Test getting a specific signal."""
        # Create a signal first
        create_resp = await client.post(
            "/api/v1/signals",
            headers=auth_headers,
            json={
                "property_type": "villa",
                "property_address": "Seoul, Mapo-gu, Villa Test 303",
                "region": "mapo",
                "asking_price": 350000000
            }
        )
        assert create_resp.status_code == 201
        signal_id = create_resp.json()["id"]

        # Get the signal (public endpoint)
        response = await client.get(f"/api/v1/signals/{signal_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == signal_id
        assert data["property_type"] == "villa"

    async def test_get_my_signals(self, client: AsyncClient, auth_headers: dict):
        """Test getting user's own signals."""
        # Create a signal
        await client.post(
            "/api/v1/signals",
            headers=auth_headers,
            json={
                "property_type": "officetel",
                "property_address": "Seoul, Yeongdeungpo-gu, Officetel 404",
                "region": "yeongdeungpo",
                "asking_price": 250000000
            }
        )

        # Get my signals
        response = await client.get(
            "/api/v1/signals/my",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_update_signal(self, client: AsyncClient, auth_headers: dict):
        """Test updating a signal."""
        # Create a signal
        create_resp = await client.post(
            "/api/v1/signals",
            headers=auth_headers,
            json={
                "property_type": "apartment",
                "property_address": "Seoul, Songpa-gu, Update Test 505",
                "region": "songpa",
                "asking_price": 600000000
            }
        )
        signal_id = create_resp.json()["id"]

        # Update the signal
        response = await client.put(
            f"/api/v1/signals/{signal_id}",
            headers=auth_headers,
            json={
                "asking_price": 580000000,
                "is_negotiable": False,
                "description": "Price reduced for quick sale"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["asking_price"] == 580000000
        assert data["is_negotiable"] == False

    async def test_delete_signal(self, client: AsyncClient, auth_headers: dict):
        """Test deleting a signal."""
        # Create a signal
        create_resp = await client.post(
            "/api/v1/signals",
            headers=auth_headers,
            json={
                "property_type": "house",
                "property_address": "Seoul, Gangbuk-gu, Delete Test 606",
                "region": "gangbuk",
                "asking_price": 400000000
            }
        )
        signal_id = create_resp.json()["id"]

        # Delete the signal
        response = await client.delete(
            f"/api/v1/signals/{signal_id}",
            headers=auth_headers
        )

        assert response.status_code == 204

        # Verify deletion
        get_resp = await client.get(f"/api/v1/signals/{signal_id}")
        assert get_resp.status_code == 404


class TestSignalInterests:
    """Test signal interest operations."""

    async def test_create_interest(self, client: AsyncClient, auth_headers: dict):
        """Test expressing interest in a signal."""
        # Create another user and signal
        other_email = f"owner_{uuid.uuid4().hex[:8]}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": other_email,
            "password": "OwnerPass123!",
            "name": "Property Owner"
        })
        owner_login = await client.post("/api/v1/auth/login/json", json={
            "email": other_email,
            "password": "OwnerPass123!"
        })
        owner_headers = {"Authorization": f"Bearer {owner_login.json()['access_token']}"}

        # Create signal as owner
        create_resp = await client.post(
            "/api/v1/signals",
            headers=owner_headers,
            json={
                "property_type": "apartment",
                "property_address": "Seoul, Gangnam-gu, Interest Test 707",
                "region": "gangnam",
                "asking_price": 700000000
            }
        )
        signal_id = create_resp.json()["id"]

        # Express interest as different user
        response = await client.post(
            f"/api/v1/signals/{signal_id}/interest",
            headers=auth_headers,
            json={
                "message": "I am interested in viewing this property",
                "offered_price": 680000000
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["signal_id"] == signal_id
        assert data["offered_price"] == 680000000
        assert data["status"] == "pending"

    async def test_get_signal_interests_owner(self, client: AsyncClient, auth_headers: dict):
        """Test getting interests as signal owner."""
        # Create signal
        create_resp = await client.post(
            "/api/v1/signals",
            headers=auth_headers,
            json={
                "property_type": "apartment",
                "property_address": "Seoul, Gangnam-gu, Interest View Test 808",
                "region": "gangnam",
                "asking_price": 750000000
            }
        )
        signal_id = create_resp.json()["id"]

        # Get interests
        response = await client.get(
            f"/api/v1/signals/{signal_id}/interests",
            headers=auth_headers
        )

        assert response.status_code == 200
        assert isinstance(response.json(), list)
