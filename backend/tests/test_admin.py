# tests/test_admin.py
"""
Admin endpoint tests for RealCare backend.
"""

import pytest
import uuid
from httpx import AsyncClient


class TestAdminAuth:
    """Test admin authentication requirements."""

    async def test_admin_stats_requires_auth(self, client: AsyncClient):
        """Test that admin stats endpoint requires authentication."""
        response = await client.get("/api/v1/admin/stats")
        assert response.status_code == 401

    async def test_admin_stats_requires_admin_role(self, client: AsyncClient, auth_headers: dict):
        """Test that admin stats endpoint requires admin role."""
        response = await client.get(
            "/api/v1/admin/stats",
            headers=auth_headers
        )
        assert response.status_code == 403

    async def test_admin_stats_success(self, client: AsyncClient, admin_headers: dict):
        """Test admin stats endpoint with admin user."""
        response = await client.get(
            "/api/v1/admin/stats",
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "agents" in data
        assert "payments" in data
        assert "signals" in data
        assert "total" in data["users"]
        assert "pending_verification" in data["agents"]


class TestAdminUserManagement:
    """Test admin user management endpoints."""

    async def test_list_users(self, client: AsyncClient, admin_headers: dict):
        """Test listing users as admin."""
        response = await client.get(
            "/api/v1/admin/users",
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "pagination" in data
        assert isinstance(data["users"], list)

    async def test_list_users_with_search(self, client: AsyncClient, admin_headers: dict):
        """Test searching users."""
        response = await client.get(
            "/api/v1/admin/users",
            headers=admin_headers,
            params={"search": "test"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "users" in data

    async def test_list_users_with_role_filter(self, client: AsyncClient, admin_headers: dict):
        """Test filtering users by role."""
        response = await client.get(
            "/api/v1/admin/users",
            headers=admin_headers,
            params={"role": "USER"}
        )

        assert response.status_code == 200
        data = response.json()
        for user in data["users"]:
            assert user["role"].upper() == "USER"

    async def test_get_user_detail(self, client: AsyncClient, admin_headers: dict, auth_headers: dict):
        """Test getting user detail."""
        # First get list to find a user ID
        list_resp = await client.get(
            "/api/v1/admin/users",
            headers=admin_headers
        )
        users = list_resp.json()["users"]
        if users:
            user_id = users[0]["id"]

            response = await client.get(
                f"/api/v1/admin/users/{user_id}",
                headers=admin_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert "user" in data
            assert data["user"]["id"] == user_id

    async def test_update_user(self, client: AsyncClient, admin_headers: dict):
        """Test updating a user."""
        # Create a test user
        unique_email = f"update_test_{uuid.uuid4().hex[:8]}@example.com"
        reg_resp = await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "UpdateTest123!",
            "name": "Update Test"
        })
        user_id = reg_resp.json()["id"]

        # Update user
        response = await client.put(
            f"/api/v1/admin/users/{user_id}",
            headers=admin_headers,
            json={
                "name": "Updated Name",
                "is_active": True
            }
        )

        assert response.status_code == 200
        assert response.json()["message"] == "User updated successfully"

    async def test_ban_user(self, client: AsyncClient, admin_headers: dict):
        """Test banning a user."""
        # Create a test user
        unique_email = f"ban_test_{uuid.uuid4().hex[:8]}@example.com"
        reg_resp = await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "BanTest123!",
            "name": "Ban Test"
        })
        user_id = reg_resp.json()["id"]

        # Ban user
        response = await client.post(
            f"/api/v1/admin/users/{user_id}/ban",
            headers=admin_headers
        )

        assert response.status_code == 200
        assert response.json()["message"] == "User banned successfully"

    async def test_cannot_ban_self(self, client: AsyncClient, admin_headers: dict):
        """Test that admin cannot ban themselves."""
        # Get admin's own user ID from the headers
        me_resp = await client.get("/api/v1/auth/me", headers=admin_headers)
        admin_id = me_resp.json()["id"]

        # Try to ban self
        response = await client.post(
            f"/api/v1/admin/users/{admin_id}/ban",
            headers=admin_headers
        )

        assert response.status_code == 400
        assert "Cannot ban yourself" in response.json()["detail"]

    async def test_delete_user(self, client: AsyncClient, admin_headers: dict):
        """Test deleting a user (soft delete)."""
        # Create a test user
        unique_email = f"delete_test_{uuid.uuid4().hex[:8]}@example.com"
        reg_resp = await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "DeleteTest123!",
            "name": "Delete Test"
        })
        user_id = reg_resp.json()["id"]

        # Delete user
        response = await client.delete(
            f"/api/v1/admin/users/{user_id}",
            headers=admin_headers
        )

        assert response.status_code == 200
        assert response.json()["message"] == "User deleted successfully"


class TestAdminAgentVerification:
    """Test admin agent verification endpoints."""

    async def test_list_pending_agents(self, client: AsyncClient, admin_headers: dict):
        """Test listing pending agents."""
        response = await client.get(
            "/api/v1/admin/agents/pending",
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "agents" in data
        assert "pagination" in data

    async def test_get_agent_detail(self, client: AsyncClient, admin_headers: dict, agent_headers: dict):
        """Test getting agent detail for verification."""
        # Get pending agents list
        list_resp = await client.get(
            "/api/v1/admin/agents/pending",
            headers=admin_headers
        )
        agents = list_resp.json()["agents"]

        if agents:
            agent_id = agents[0]["id"]

            response = await client.get(
                f"/api/v1/admin/agents/{agent_id}",
                headers=admin_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert "agent" in data
            assert data["agent"]["id"] == agent_id

    async def test_verify_agent_approve(self, client: AsyncClient, admin_headers: dict, auth_headers: dict):
        """Test approving agent verification."""
        # Create a new agent (using fresh user)
        unique_email = f"verify_agent_{uuid.uuid4().hex[:8]}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "VerifyTest123!",
            "name": "Verify Test"
        })
        login_resp = await client.post("/api/v1/auth/login/json", json={
            "email": unique_email,
            "password": "VerifyTest123!"
        })
        new_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # Register as agent
        agent_resp = await client.post(
            "/api/v1/agents/register",
            headers=new_headers,
            json={
                "business_name": f"Verify Agency {uuid.uuid4().hex[:8]}",
                "license_number": f"VER-{uuid.uuid4().hex[:5]}",
                "business_number": f"555-{uuid.uuid4().hex[:2]}-{uuid.uuid4().hex[:5]}",
                "representative_name": "Verify Representative",
                "office_address": "Seoul, Test District, Verify Building 123",
                "office_region": "gangnam",
                "office_phone": "02-5555-5555"
            }
        )
        agent_id = agent_resp.json()["id"]

        # Approve agent
        response = await client.post(
            f"/api/v1/admin/agents/{agent_id}/verify",
            headers=admin_headers,
            json={"approved": True}
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Agent verified successfully"

    async def test_verify_agent_reject(self, client: AsyncClient, admin_headers: dict):
        """Test rejecting agent verification."""
        # Create a new agent
        unique_email = f"reject_agent_{uuid.uuid4().hex[:8]}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": unique_email,
            "password": "RejectTest123!",
            "name": "Reject Test"
        })
        login_resp = await client.post("/api/v1/auth/login/json", json={
            "email": unique_email,
            "password": "RejectTest123!"
        })
        new_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # Register as agent
        agent_resp = await client.post(
            "/api/v1/agents/register",
            headers=new_headers,
            json={
                "business_name": f"Reject Agency {uuid.uuid4().hex[:8]}",
                "license_number": f"REJ-{uuid.uuid4().hex[:5]}",
                "business_number": f"666-{uuid.uuid4().hex[:2]}-{uuid.uuid4().hex[:5]}",
                "representative_name": "Reject Representative",
                "office_address": "Seoul, Test District, Reject Building 456",
                "office_region": "mapo",
                "office_phone": "02-6666-6666"
            }
        )
        agent_id = agent_resp.json()["id"]

        # Reject agent
        response = await client.post(
            f"/api/v1/admin/agents/{agent_id}/verify",
            headers=admin_headers,
            json={
                "approved": False,
                "rejection_reason": "Invalid license number format"
            }
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Agent rejected"


class TestAdminActivity:
    """Test admin activity log endpoint."""

    async def test_get_recent_activity(self, client: AsyncClient, admin_headers: dict):
        """Test getting recent platform activity."""
        response = await client.get(
            "/api/v1/admin/activity",
            headers=admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        assert isinstance(data["activities"], list)

        if data["activities"]:
            activity = data["activities"][0]
            assert "type" in activity
            assert "description" in activity
            assert "timestamp" in activity

    async def test_get_activity_with_limit(self, client: AsyncClient, admin_headers: dict):
        """Test getting activity with custom limit."""
        response = await client.get(
            "/api/v1/admin/activity",
            headers=admin_headers,
            params={"limit": 10}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["activities"]) <= 10
