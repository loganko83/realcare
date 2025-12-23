# tests/test_auth.py
"""
Authentication tests for RealCare backend.
"""

import pytest
import uuid
from httpx import AsyncClient


class TestAuthRegistration:
    """Test user registration."""

    async def test_register_success(self, client: AsyncClient):
        """Test successful user registration."""
        unique_email = f"new_{uuid.uuid4().hex[:8]}@example.com"

        response = await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "Password123!",
            "name": "New User"
        })

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["email"] == unique_email
        assert data["name"] == "New User"
        assert "password" not in data

    async def test_register_duplicate_email(self, client: AsyncClient):
        """Test registration with duplicate email."""
        unique_email = f"dup_{uuid.uuid4().hex[:8]}@example.com"

        # First registration
        await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "Password123!",
            "name": "First User"
        })

        # Duplicate registration
        response = await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "Password123!",
            "name": "Second User"
        })

        assert response.status_code == 400

    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email format."""
        response = await client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "Password123!",
            "name": "Invalid Email"
        })

        assert response.status_code == 422

    async def test_register_weak_password(self, client: AsyncClient):
        """Test registration with weak password."""
        response = await client.post("/api/v1/auth/register", json={
            "email": f"weak_{uuid.uuid4().hex[:8]}@example.com",
            "password": "123",
            "name": "Weak Pass"
        })

        assert response.status_code == 422

    async def test_register_missing_fields(self, client: AsyncClient):
        """Test registration with missing required fields."""
        response = await client.post("/api/v1/auth/register", json={
            "email": "missing@example.com"
        })

        assert response.status_code == 422


class TestAuthLogin:
    """Test user login."""

    async def test_login_success(self, client: AsyncClient):
        """Test successful login."""
        unique_email = f"login_{uuid.uuid4().hex[:8]}@example.com"

        # Register first
        await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "Password123!",
            "name": "Login User"
        })

        # Login
        response = await client.post("/api/v1/auth/login/json", json={
            "email": unique_email,
            "password": "Password123!"
        })

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient):
        """Test login with wrong password."""
        unique_email = f"wrongpass_{uuid.uuid4().hex[:8]}@example.com"

        # Register
        await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "Password123!",
            "name": "Wrong Pass User"
        })

        # Login with wrong password
        response = await client.post("/api/v1/auth/login/json", json={
            "email": unique_email,
            "password": "WrongPassword!"
        })

        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with nonexistent email."""
        response = await client.post("/api/v1/auth/login/json", json={
            "email": "noexist@example.com",
            "password": "Password123!"
        })

        assert response.status_code == 401


class TestAuthToken:
    """Test token operations."""

    async def test_get_me(self, client: AsyncClient, auth_headers: dict):
        """Test getting current user info."""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "id" in data
        assert "name" in data

    async def test_get_me_no_token(self, client: AsyncClient):
        """Test getting user info without token."""
        response = await client.get("/api/v1/auth/me")

        assert response.status_code == 401

    async def test_get_me_invalid_token(self, client: AsyncClient):
        """Test getting user info with invalid token."""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )

        assert response.status_code == 401

    async def test_refresh_token(self, client: AsyncClient):
        """Test refreshing access token."""
        unique_email = f"refresh_{uuid.uuid4().hex[:8]}@example.com"

        # Register and login
        await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "Password123!",
            "name": "Refresh User"
        })

        login_response = await client.post("/api/v1/auth/login/json", json={
            "email": unique_email,
            "password": "Password123!"
        })
        tokens = login_response.json()

        # Refresh token
        response = await client.post(
            f"/api/v1/auth/refresh?refresh_token={tokens['refresh_token']}"
        )

        assert response.status_code == 200
        new_tokens = response.json()
        assert "access_token" in new_tokens

    async def test_logout(self, client: AsyncClient, auth_headers: dict):
        """Test user logout."""
        response = await client.post("/api/v1/auth/logout", headers=auth_headers)

        # Logout should succeed
        assert response.status_code in [200, 204]
