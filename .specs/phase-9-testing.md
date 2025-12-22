# Phase 9: Testing & Quality Assurance

> Spec-Kit Methodology v2.0
> Priority: HIGH
> Dependencies: Phase 8 (Frontend Complete)
> Estimated Tasks: 24

---

## Overview

This phase establishes comprehensive testing infrastructure for both backend (pytest) and frontend (Playwright), ensuring code quality and preventing regressions. Focus on critical user flows and API reliability.

## Prerequisites

- [x] Backend API fully implemented
- [x] Frontend UI components complete
- [x] Playwright already installed in package.json
- [ ] pytest to be added to backend requirements

---

## P9-01: Backend Unit Tests

### P9-01-A: Test Infrastructure Setup

**Directory Structure**:
```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py           # Shared fixtures
│   ├── test_auth.py          # Auth tests
│   ├── test_reality.py       # Reality Check tests
│   ├── test_agents.py        # Agent tests
│   ├── test_payments.py      # Payment tests
│   ├── test_blockchain.py    # Blockchain tests
│   └── utils/
│       ├── __init__.py
│       └── factories.py      # Test data factories
├── pytest.ini
└── requirements-test.txt
```

**Test Dependencies**:
```txt
# requirements-test.txt
pytest==7.4.4
pytest-asyncio==0.23.2
pytest-cov==4.1.0
httpx==0.28.1
factory-boy==3.3.0
faker==22.0.0
```

**Pytest Configuration**:
```ini
# pytest.ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --cov=app --cov-report=term-missing
filterwarnings =
    ignore::DeprecationWarning
```

**Tasks**:
- [ ] P9-01-A-1: Create tests directory structure
- [ ] P9-01-A-2: Add test dependencies to requirements
- [ ] P9-01-A-3: Create pytest.ini configuration
- [ ] P9-01-A-4: Create conftest.py with shared fixtures

---

### P9-01-B: Test Fixtures (conftest.py)

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import get_db
from app.core.config import get_settings

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://realcare:realcare@localhost:5432/realcare_test"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    yield engine
    await engine.dispose()


@pytest.fixture
async def db_session(test_engine):
    """Create database session for each test."""
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session):
    """Create test client with database override."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def auth_headers(client):
    """Get authenticated user headers."""
    # Register test user
    await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "TestPass123!",
        "name": "Test User"
    })

    # Login
    response = await client.post("/api/v1/auth/login/json", json={
        "email": "test@example.com",
        "password": "TestPass123!"
    })
    tokens = response.json()

    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.fixture
async def agent_headers(client, auth_headers):
    """Get authenticated agent headers."""
    # Register as agent
    await client.post(
        "/api/v1/agents/register",
        headers=auth_headers,
        json={
            "company_name": "Test Agency",
            "license_number": "2024-12345",
            "regions": ["seoul-gangnam", "seoul-seocho"],
            "business_number": "123-45-67890"
        }
    )
    return auth_headers
```

**Tasks**:
- [ ] P9-01-B-1: Create test database fixtures
- [ ] P9-01-B-2: Create authenticated client fixtures
- [ ] P9-01-B-3: Create agent client fixtures
- [ ] P9-01-B-4: Add cleanup hooks

---

### P9-01-C: Authentication Tests

```python
# tests/test_auth.py
import pytest


class TestAuthRegistration:
    """Test user registration."""

    async def test_register_success(self, client):
        response = await client.post("/api/v1/auth/register", json={
            "email": "new@example.com",
            "password": "Password123!",
            "name": "New User"
        })
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["email"] == "new@example.com"

    async def test_register_duplicate_email(self, client):
        # First registration
        await client.post("/api/v1/auth/register", json={
            "email": "dup@example.com",
            "password": "Password123!",
            "name": "First User"
        })
        # Duplicate
        response = await client.post("/api/v1/auth/register", json={
            "email": "dup@example.com",
            "password": "Password123!",
            "name": "Second User"
        })
        assert response.status_code == 400

    async def test_register_invalid_email(self, client):
        response = await client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "Password123!",
            "name": "Invalid"
        })
        assert response.status_code == 422

    async def test_register_weak_password(self, client):
        response = await client.post("/api/v1/auth/register", json={
            "email": "weak@example.com",
            "password": "123",
            "name": "Weak Pass"
        })
        assert response.status_code == 422


class TestAuthLogin:
    """Test user login."""

    async def test_login_success(self, client):
        # Register first
        await client.post("/api/v1/auth/register", json={
            "email": "login@example.com",
            "password": "Password123!",
            "name": "Login User"
        })
        # Login
        response = await client.post("/api/v1/auth/login/json", json={
            "email": "login@example.com",
            "password": "Password123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password(self, client):
        response = await client.post("/api/v1/auth/login/json", json={
            "email": "login@example.com",
            "password": "WrongPassword!"
        })
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client):
        response = await client.post("/api/v1/auth/login/json", json={
            "email": "noexist@example.com",
            "password": "Password123!"
        })
        assert response.status_code == 401


class TestAuthToken:
    """Test token operations."""

    async def test_get_me(self, client, auth_headers):
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data

    async def test_get_me_no_token(self, client):
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    async def test_refresh_token(self, client):
        # Register and login
        await client.post("/api/v1/auth/register", json={
            "email": "refresh@example.com",
            "password": "Password123!",
            "name": "Refresh User"
        })
        login_response = await client.post("/api/v1/auth/login/json", json={
            "email": "refresh@example.com",
            "password": "Password123!"
        })
        tokens = login_response.json()

        # Refresh
        response = await client.post(
            f"/api/v1/auth/refresh?refresh_token={tokens['refresh_token']}"
        )
        assert response.status_code == 200
        new_tokens = response.json()
        assert "access_token" in new_tokens
```

**Tasks**:
- [ ] P9-01-C-1: Test registration flows
- [ ] P9-01-C-2: Test login flows
- [ ] P9-01-C-3: Test token operations
- [ ] P9-01-C-4: Test edge cases and errors

---

### P9-01-D: Reality Check Tests

```python
# tests/test_reality.py
import pytest


class TestRealityCalculation:
    """Test reality check calculations."""

    async def test_calculate_success(self, client, auth_headers):
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

    async def test_speculative_zone_ltv(self, client, auth_headers):
        """Test LTV limits in speculative zones."""
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
        data = response.json()
        # Gangnam is speculative zone: 50% LTV for first-home
        assert data["analysis"]["applicable_ltv"] == 50

    async def test_non_regulated_zone_ltv(self, client, auth_headers):
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
        data = response.json()
        # Non-regulated: 70% LTV
        assert data["analysis"]["applicable_ltv"] == 70

    async def test_dsr_limit_exceeded(self, client, auth_headers):
        """Test DSR warning when limit exceeded."""
        response = await client.post(
            "/api/v1/reality/calculate",
            headers=auth_headers,
            json={
                "target_price": 1500000000,
                "region": "seoul-gangnam",
                "annual_income": 50000000,
                "cash_available": 100000000,
                "existing_debt": 200000000,
                "is_first_home": True
            }
        )
        data = response.json()
        risks = [r["type"] for r in data["risks"]]
        assert "dsr_exceeded" in risks or data["analysis"]["dsr_percentage"] > 40
```

**Tasks**:
- [ ] P9-01-D-1: Test basic calculation
- [ ] P9-01-D-2: Test LTV by region type
- [ ] P9-01-D-3: Test DSR calculations
- [ ] P9-01-D-4: Test risk factor generation

---

### P9-01-E: Agent Tests

```python
# tests/test_agents.py
import pytest


class TestAgentRegistration:
    """Test agent registration."""

    async def test_register_agent(self, client, auth_headers):
        response = await client.post(
            "/api/v1/agents/register",
            headers=auth_headers,
            json={
                "company_name": "Test Real Estate",
                "license_number": "2024-99999",
                "regions": ["seoul-gangnam"],
                "business_number": "999-99-99999"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["tier"] == "FREE"
        assert data["is_verified"] == False


class TestAgentDashboard:
    """Test agent dashboard."""

    async def test_get_dashboard(self, client, agent_headers):
        response = await client.get(
            "/api/v1/agents/dashboard",
            headers=agent_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "agent" in data
        assert "stats" in data
        assert "limits" in data


class TestAgentListings:
    """Test agent listings."""

    async def test_create_listing(self, client, agent_headers):
        response = await client.post(
            "/api/v1/agents/listings",
            headers=agent_headers,
            json={
                "property_type": "apartment",
                "transaction_type": "sale",
                "address": "Seoul, Gangnam, Test Building 101",
                "price": 500000000,
                "size_pyeong": 32,
                "floor": 10,
                "total_floors": 20,
                "description": "Test listing"
            }
        )
        assert response.status_code == 201
```

**Tasks**:
- [ ] P9-01-E-1: Test agent registration
- [ ] P9-01-E-2: Test dashboard endpoint
- [ ] P9-01-E-3: Test listings CRUD
- [ ] P9-01-E-4: Test signal responses

---

### P9-01-F: Payment Tests

```python
# tests/test_payments.py
import pytest


class TestSubscriptionPlans:
    """Test subscription plans."""

    async def test_get_plans(self, client):
        response = await client.get("/api/v1/payments/plans")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4
        plans = [p["plan"] for p in data]
        assert "free" in plans
        assert "enterprise" in plans


class TestPayments:
    """Test payment operations."""

    async def test_create_payment(self, client, auth_headers):
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
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "pending"

    async def test_get_my_payments(self, client, auth_headers):
        response = await client.get(
            "/api/v1/payments/payments",
            headers=auth_headers
        )
        assert response.status_code == 200
```

**Tasks**:
- [ ] P9-01-F-1: Test subscription plans endpoint
- [ ] P9-01-F-2: Test payment creation
- [ ] P9-01-F-3: Test payment history
- [ ] P9-01-F-4: Test subscription operations

---

## P9-02: Frontend E2E Tests (Playwright)

### P9-02-A: Playwright Configuration

**File**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000/real',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/real',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Test Directory Structure**:
```
e2e/
├── auth.spec.ts            # Authentication tests
├── reality-check.spec.ts   # Reality check tests
├── agent.spec.ts           # Agent dashboard tests
├── payment.spec.ts         # Payment flow tests
├── fixtures/
│   ├── test-data.ts        # Test data
│   └── auth.ts             # Auth helpers
└── global-setup.ts         # Global setup
```

**Tasks**:
- [ ] P9-02-A-1: Update playwright.config.ts
- [ ] P9-02-A-2: Create e2e directory structure
- [ ] P9-02-A-3: Create test data fixtures
- [ ] P9-02-A-4: Create auth helper functions

---

### P9-02-B: Authentication E2E Tests

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('TestPass123!');
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page).toHaveURL('/');
      await expect(page.getByText(/welcome/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/password/i).fill('WrongPassword');
      await page.getByRole('button', { name: /login/i }).click();

      await expect(page.getByText(/invalid/i)).toBeVisible();
    });

    test('should redirect to login for protected routes', async ({ page }) => {
      await page.goto('/agent/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Registration', () => {
    test('should register new user', async ({ page }) => {
      await page.goto('/register');
      await page.getByLabel(/email/i).fill(`test${Date.now()}@example.com`);
      await page.getByLabel('Password', { exact: true }).fill('TestPass123!');
      await page.getByLabel(/confirm password/i).fill('TestPass123!');
      await page.getByLabel(/name/i).fill('Test User');
      await page.getByLabel(/terms/i).check();
      await page.getByLabel(/privacy/i).check();
      await page.getByRole('button', { name: /register/i }).click();

      await expect(page).toHaveURL(/\/login/);
    });

    test('should show validation errors', async ({ page }) => {
      await page.goto('/register');
      await page.getByRole('button', { name: /register/i }).click();

      await expect(page.getByText(/email.*required/i)).toBeVisible();
    });
  });
});
```

**Tasks**:
- [ ] P9-02-B-1: Test login page display
- [ ] P9-02-B-2: Test successful login flow
- [ ] P9-02-B-3: Test login error handling
- [ ] P9-02-B-4: Test registration flow
- [ ] P9-02-B-5: Test protected route redirect

---

### P9-02-C: Reality Check E2E Tests

```typescript
// e2e/reality-check.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reality Check', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPass123!');
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('/');
  });

  test('should calculate reality score', async ({ page }) => {
    await page.goto('/');

    // Fill form
    await page.getByLabel(/target price/i).fill('500000000');
    await page.getByLabel(/region/i).selectOption('seoul-gangnam');
    await page.getByLabel(/annual income/i).fill('80000000');
    await page.getByLabel(/cash available/i).fill('200000000');

    await page.getByRole('button', { name: /calculate/i }).click();

    // Check results
    await expect(page.getByTestId('reality-score')).toBeVisible();
    await expect(page.getByText(/grade/i)).toBeVisible();
  });

  test('should display risk factors', async ({ page }) => {
    await page.goto('/');

    // Fill with risky values
    await page.getByLabel(/target price/i).fill('1500000000');
    await page.getByLabel(/region/i).selectOption('seoul-gangnam');
    await page.getByLabel(/annual income/i).fill('50000000');
    await page.getByLabel(/cash available/i).fill('100000000');

    await page.getByRole('button', { name: /calculate/i }).click();

    await expect(page.getByTestId('risk-factors')).toBeVisible();
  });

  test('should export PDF report', async ({ page }) => {
    await page.goto('/');

    // Calculate first
    await page.getByLabel(/target price/i).fill('500000000');
    await page.getByRole('button', { name: /calculate/i }).click();

    // Wait for results
    await expect(page.getByTestId('reality-score')).toBeVisible();

    // Export PDF
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export pdf/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
```

**Tasks**:
- [ ] P9-02-C-1: Test reality check form
- [ ] P9-02-C-2: Test score calculation display
- [ ] P9-02-C-3: Test risk factor display
- [ ] P9-02-C-4: Test PDF export

---

### P9-02-D: Agent Dashboard E2E Tests

```typescript
// e2e/agent.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsAgent } from './fixtures/auth';

test.describe('Agent Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAgent(page);
  });

  test('should display agent dashboard', async ({ page }) => {
    await page.goto('/agent/dashboard');

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByTestId('stats-overview')).toBeVisible();
    await expect(page.getByTestId('subscription-status')).toBeVisible();
  });

  test('should show available signals', async ({ page }) => {
    await page.goto('/agent/dashboard');

    await expect(page.getByTestId('recent-signals')).toBeVisible();
  });

  test('should create new listing', async ({ page }) => {
    await page.goto('/agent/listings');
    await page.getByRole('button', { name: /new listing/i }).click();

    // Fill listing form
    await page.getByLabel(/property type/i).selectOption('apartment');
    await page.getByLabel(/address/i).fill('Seoul, Gangnam, Test 101');
    await page.getByLabel(/price/i).fill('500000000');
    await page.getByLabel(/size/i).fill('32');

    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(/listing created/i)).toBeVisible();
  });
});
```

**Tasks**:
- [ ] P9-02-D-1: Test dashboard display
- [ ] P9-02-D-2: Test signal browsing
- [ ] P9-02-D-3: Test listing creation
- [ ] P9-02-D-4: Test response submission

---

### P9-02-E: Payment Flow E2E Tests

```typescript
// e2e/payment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test('should display subscription plans', async ({ page }) => {
    await page.goto('/subscription');

    await expect(page.getByText(/free/i)).toBeVisible();
    await expect(page.getByText(/basic/i)).toBeVisible();
    await expect(page.getByText(/premium/i)).toBeVisible();
    await expect(page.getByText(/enterprise/i)).toBeVisible();
  });

  test('should navigate to checkout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPass123!');
    await page.getByRole('button', { name: /login/i }).click();

    await page.goto('/subscription');
    await page.getByTestId('plan-basic').getByRole('button', { name: /select/i }).click();

    await expect(page).toHaveURL(/\/checkout/);
  });
});
```

**Tasks**:
- [ ] P9-02-E-1: Test plans display
- [ ] P9-02-E-2: Test plan selection
- [ ] P9-02-E-3: Test checkout navigation

---

## P9-03: API Documentation

### P9-03-A: OpenAPI Schema Enhancement

**Tasks**:
- [ ] P9-03-A-1: Add detailed descriptions to all endpoints
- [ ] P9-03-A-2: Add request/response examples
- [ ] P9-03-A-3: Document error responses
- [ ] P9-03-A-4: Add authentication requirements

---

### P9-03-B: API Usage Guide

**File**: `.specs/api-guide.md`

**Tasks**:
- [ ] P9-03-B-1: Write authentication guide
- [ ] P9-03-B-2: Write endpoint usage examples
- [ ] P9-03-B-3: Document rate limits
- [ ] P9-03-B-4: Add error handling guide

---

## Test Commands

```bash
# Backend tests
cd backend
pytest                              # Run all tests
pytest tests/test_auth.py           # Run specific test file
pytest -k "test_login"              # Run tests matching pattern
pytest --cov=app --cov-report=html  # Generate coverage report

# Frontend E2E tests
npx playwright test                 # Run all E2E tests
npx playwright test auth.spec.ts    # Run specific test file
npx playwright test --ui            # Interactive UI mode
npx playwright show-report          # Show test report
```

---

## Definition of Done

- [ ] All backend unit tests pass
- [ ] All E2E tests pass
- [ ] Test coverage >80% for critical paths
- [ ] API documentation complete
- [ ] No flaky tests
- [ ] CI/CD pipeline includes tests

---

## Notes

- Use test database separate from development
- Mock external services (DID BaaS, Toss Payments) in tests
- E2E tests use real API but test database
- Run tests before each merge to master
