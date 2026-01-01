# tests/test_contracts.py
"""
Contract tests for RealCare backend.
"""

import pytest
from datetime import date, timedelta
from httpx import AsyncClient


class TestContractCreate:
    """Test contract creation."""

    async def test_create_sale_contract(self, client: AsyncClient, auth_headers: dict):
        """Test creating a sale contract."""
        move_in = (date.today() + timedelta(days=60)).isoformat()

        response = await client.post(
            "/api/v1/contracts",
            headers=auth_headers,
            json={
                "contract_type": "sale",
                "property_address": "Seoul, Gangnam-gu, Apartment 101-1234",
                "property_description": "3BR apartment with good view",
                "contract_date": date.today().isoformat(),
                "move_in_date": move_in,
                "total_price": 850000000,
                "deposit": 85000000,
                "has_loan": True,
                "loan_amount": 400000000,
                "has_interior_work": False
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["contract_type"] == "sale"
        assert data["total_price"] == 850000000
        assert data["status"] == "draft"
        assert data["has_loan"] == True
        assert "id" in data

    async def test_create_jeonse_contract(self, client: AsyncClient, auth_headers: dict):
        """Test creating a jeonse contract."""
        move_in = (date.today() + timedelta(days=30)).isoformat()
        move_out = (date.today() + timedelta(days=365*2)).isoformat()

        response = await client.post(
            "/api/v1/contracts",
            headers=auth_headers,
            json={
                "contract_type": "jeonse",
                "property_address": "Seoul, Mapo-gu, Officetel 202",
                "move_in_date": move_in,
                "move_out_date": move_out,
                "total_price": 300000000,
                "deposit": 30000000,
                "has_loan": True,
                "loan_amount": 200000000
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["contract_type"] == "jeonse"

    async def test_create_monthly_rent_contract(self, client: AsyncClient, auth_headers: dict):
        """Test creating a monthly rent contract."""
        move_in = (date.today() + timedelta(days=14)).isoformat()
        move_out = (date.today() + timedelta(days=365)).isoformat()

        response = await client.post(
            "/api/v1/contracts",
            headers=auth_headers,
            json={
                "contract_type": "monthly_rent",
                "property_address": "Seoul, Seongdong-gu, Studio 303",
                "move_in_date": move_in,
                "move_out_date": move_out,
                "total_price": 50000000,
                "deposit": 10000000,
                "monthly_rent": 800000
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["contract_type"] == "monthly_rent"
        assert data["monthly_rent"] == 800000

    async def test_create_contract_unauthenticated(self, client: AsyncClient):
        """Test contract creation without authentication."""
        response = await client.post(
            "/api/v1/contracts",
            json={
                "contract_type": "sale",
                "property_address": "Seoul Test Address",
                "total_price": 500000000
            }
        )

        assert response.status_code == 401


class TestContractList:
    """Test contract listing."""

    async def test_list_contracts(self, client: AsyncClient, auth_headers: dict):
        """Test listing user's contracts."""
        # Create a contract first
        await client.post(
            "/api/v1/contracts",
            headers=auth_headers,
            json={
                "contract_type": "sale",
                "property_address": "Seoul, Gangnam-gu, List Test 101",
                "total_price": 600000000
            }
        )

        # List contracts
        response = await client.get(
            "/api/v1/contracts",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) >= 1

    async def test_list_contracts_with_status_filter(self, client: AsyncClient, auth_headers: dict):
        """Test listing contracts with status filter."""
        response = await client.get(
            "/api/v1/contracts",
            headers=auth_headers,
            params={"status": "draft"}
        )

        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            assert item["status"] == "draft"


class TestContractOperations:
    """Test contract CRUD operations."""

    async def test_get_contract_detail(self, client: AsyncClient, auth_headers: dict):
        """Test getting contract with timeline tasks."""
        # Create contract
        create_resp = await client.post(
            "/api/v1/contracts",
            headers=auth_headers,
            json={
                "contract_type": "sale",
                "property_address": "Seoul, Gangnam-gu, Detail Test 404",
                "move_in_date": (date.today() + timedelta(days=45)).isoformat(),
                "total_price": 700000000
            }
        )
        contract_id = create_resp.json()["id"]

        # Get detail
        response = await client.get(
            f"/api/v1/contracts/{contract_id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == contract_id
        assert "timeline_tasks" in data
        # Sale contracts should have timeline tasks
        assert len(data["timeline_tasks"]) > 0

    async def test_update_contract(self, client: AsyncClient, auth_headers: dict):
        """Test updating a contract."""
        # Create contract
        create_resp = await client.post(
            "/api/v1/contracts",
            headers=auth_headers,
            json={
                "contract_type": "jeonse",
                "property_address": "Seoul, Songpa-gu, Update Test 505",
                "total_price": 400000000
            }
        )
        contract_id = create_resp.json()["id"]

        # Update
        response = await client.put(
            f"/api/v1/contracts/{contract_id}",
            headers=auth_headers,
            json={
                "total_price": 380000000,
                "has_loan": True,
                "loan_amount": 250000000,
                "status": "in_progress"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_price"] == 380000000
        assert data["has_loan"] == True

    async def test_delete_contract(self, client: AsyncClient, auth_headers: dict):
        """Test deleting a contract."""
        # Create contract
        create_resp = await client.post(
            "/api/v1/contracts",
            headers=auth_headers,
            json={
                "contract_type": "monthly_rent",
                "property_address": "Seoul, Nowon-gu, Delete Test 606",
                "total_price": 30000000,
                "monthly_rent": 500000
            }
        )
        contract_id = create_resp.json()["id"]

        # Delete
        response = await client.delete(
            f"/api/v1/contracts/{contract_id}",
            headers=auth_headers
        )

        assert response.status_code == 204

        # Verify deletion
        get_resp = await client.get(
            f"/api/v1/contracts/{contract_id}",
            headers=auth_headers
        )
        assert get_resp.status_code == 404

    async def test_cannot_access_other_user_contract(self, client: AsyncClient, auth_headers: dict):
        """Test that users cannot access other users' contracts."""
        # Create contract as first user
        create_resp = await client.post(
            "/api/v1/contracts",
            headers=auth_headers,
            json={
                "contract_type": "sale",
                "property_address": "Seoul Private Contract 707",
                "total_price": 500000000
            }
        )
        contract_id = create_resp.json()["id"]

        # Create second user
        import uuid
        other_email = f"other_{uuid.uuid4().hex[:8]}@example.com"
        await client.post("/api/v1/auth/register", json={
            "email": other_email,
            "password": "OtherPass123!",
            "name": "Other User"
        })
        login_resp = await client.post("/api/v1/auth/login/json", json={
            "email": other_email,
            "password": "OtherPass123!"
        })
        other_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # Try to access first user's contract
        response = await client.get(
            f"/api/v1/contracts/{contract_id}",
            headers=other_headers
        )

        assert response.status_code in [403, 404]


class TestContractTimeline:
    """Test contract timeline operations."""

    async def test_get_timeline_tasks(self, client: AsyncClient, auth_headers: dict):
        """Test getting timeline tasks for a contract."""
        # Create contract with move-in date for timeline generation
        create_resp = await client.post(
            "/api/v1/contracts",
            headers=auth_headers,
            json={
                "contract_type": "sale",
                "property_address": "Seoul, Gangnam-gu, Timeline Test 808",
                "move_in_date": (date.today() + timedelta(days=60)).isoformat(),
                "total_price": 800000000,
                "has_loan": True
            }
        )
        contract_id = create_resp.json()["id"]

        # Get timeline
        response = await client.get(
            f"/api/v1/contracts/{contract_id}/timeline",
            headers=auth_headers
        )

        assert response.status_code == 200
        tasks = response.json()
        assert isinstance(tasks, list)
        assert len(tasks) > 0

        # Verify task structure
        for task in tasks:
            assert "id" in task
            assert "title" in task
            assert "category" in task
            assert "priority" in task
            assert "is_completed" in task

    async def test_update_timeline_task(self, client: AsyncClient, auth_headers: dict):
        """Test updating a timeline task."""
        # Create contract
        create_resp = await client.post(
            "/api/v1/contracts",
            headers=auth_headers,
            json={
                "contract_type": "jeonse",
                "property_address": "Seoul, Seocho-gu, Task Update Test 909",
                "move_in_date": (date.today() + timedelta(days=30)).isoformat(),
                "total_price": 350000000
            }
        )
        contract_id = create_resp.json()["id"]

        # Get timeline to find a task
        timeline_resp = await client.get(
            f"/api/v1/contracts/{contract_id}/timeline",
            headers=auth_headers
        )
        tasks = timeline_resp.json()
        assert len(tasks) > 0
        task_id = tasks[0]["id"]

        # Update task
        response = await client.patch(
            f"/api/v1/contracts/{contract_id}/timeline/{task_id}",
            headers=auth_headers,
            json={"is_completed": True}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_completed"] == True
        assert "completed_at" in data
