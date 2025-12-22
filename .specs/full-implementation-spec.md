# RealCare Full Implementation Specification

> Spec-Kit Methodology v2.0
> Generated: 2024-12-22
> Target: Complete Platform Implementation

---

## Executive Summary

This specification covers the complete implementation of RealCare - a Life Care OS for Korean real estate, from current MVP to full-featured B2B/B2C platform with blockchain integration.

### Technology Stack

| Layer | Current | Target |
|-------|---------|--------|
| Frontend | React 19 + Vite 6 + TanStack | Same (enhanced) |
| Backend | Client-side only | FastAPI + PostgreSQL |
| Auth | localStorage | JWT + Social Login + DID |
| Blockchain | None | Xphere (via DID BaaS) |
| DID/VC | None | DID BaaS SDK |
| AI | Gemini API | Gemini + RAG |
| Cache | None | Redis |

### Integration Points

- **DID BaaS**: https://trendy.storydot.kr/did-baas/api/v1/
- **Xphere Chain ID**: 20250217
- **DID BaaS SDK**: @did-baas/sdk (npm)

---

## Phase Overview

| Phase | Name | Priority | Status |
|-------|------|----------|--------|
| 1 | Infrastructure (Current) | DONE | 70% |
| 2 | Backend API Foundation | CRITICAL | 0% |
| 3 | Authentication System | CRITICAL | 0% |
| 4 | Feature Completion | HIGH | Partial |
| 5 | B2B Agent Platform | MEDIUM | 0% |
| 6 | Legal Care & Blockchain | MEDIUM | 0% |
| 7 | Payment & Monetization | MEDIUM | 0% |

---

## Phase 1: Infrastructure (CURRENT STATE)

### Completed Features

- [x] React 19 + Vite 6 + TypeScript
- [x] TanStack Router (file-based routing)
- [x] TanStack Query (server state)
- [x] TanStack Form + Zod validation
- [x] Tailwind CSS v4 styling
- [x] i18n (Korean/English)
- [x] Sentry error tracking
- [x] Bundle optimization (lazy loading)
- [x] E2E tests (Playwright)

### Current Capabilities

- Reality Check Engine (70%)
- Contract Analysis AI (80%)
- Owner Signal (30%)
- Smart Move-in (50%)

---

## Phase 2: Backend API Foundation

### P2-01: FastAPI Project Setup

```
backend/
├── app/
│   ├── main.py              # FastAPI entry
│   ├── config.py            # Settings (Pydantic)
│   ├── database.py          # SQLAlchemy async
│   ├── api/
│   │   ├── v1/
│   │   │   ├── router.py    # API router
│   │   │   ├── auth.py      # Auth endpoints
│   │   │   ├── users.py     # User endpoints
│   │   │   ├── reality.py   # Reality Check endpoints
│   │   │   ├── signals.py   # Owner Signal endpoints
│   │   │   ├── contracts.py # Contract endpoints
│   │   │   ├── timeline.py  # Move-in endpoints
│   │   │   ├── agents.py    # B2B endpoints
│   │   │   └── did.py       # DID integration
│   │   └── deps.py          # Dependencies
│   ├── core/
│   │   ├── security.py      # JWT, password hashing
│   │   ├── did_client.py    # DID BaaS SDK wrapper
│   │   └── xphere.py        # Blockchain helpers
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── utils/               # Helpers
├── migrations/              # Alembic
├── tests/
├── requirements.txt
└── Dockerfile
```

**Tasks:**
- [ ] P2-01-A: Create FastAPI project structure
- [ ] P2-01-B: Setup PostgreSQL connection (async)
- [ ] P2-01-C: Setup Redis connection
- [ ] P2-01-D: Configure Alembic migrations
- [ ] P2-01-E: Setup logging and monitoring
- [ ] P2-01-F: Create Dockerfile and docker-compose

### P2-02: Database Schema

```sql
-- Core tables
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',  -- user, agent, admin
    did_address VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE user_financials (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    annual_income BIGINT,
    total_assets BIGINT,
    total_debt BIGINT,
    house_count INTEGER DEFAULT 0,
    is_first_home BOOLEAN DEFAULT TRUE,
    credit_score INTEGER,
    updated_at TIMESTAMP
);

CREATE TABLE reality_reports (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    property_price BIGINT,
    region_code VARCHAR(10),
    ltv_ratio DECIMAL(5,2),
    dsr_ratio DECIMAL(5,2),
    reality_score INTEGER,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE owner_signals (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES users(id),
    property_type VARCHAR(20),
    signal_type VARCHAR(20),  -- sale, rent
    region_code VARCHAR(10),
    address_masked VARCHAR(255),
    address_full VARCHAR(255),  -- encrypted
    price_range_min BIGINT,
    price_range_max BIGINT,
    status VARCHAR(20) DEFAULT 'active',
    view_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contact_requests (
    id UUID PRIMARY KEY,
    signal_id UUID REFERENCES owner_signals(id),
    requester_id UUID REFERENCES users(id),
    reality_score INTEGER,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    contract_type VARCHAR(20),
    property_address VARCHAR(255),
    property_price BIGINT,
    deposit_amount BIGINT,
    monthly_rent BIGINT,
    contract_date DATE,
    move_in_date DATE,
    data JSONB,
    blockchain_hash VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE timeline_tasks (
    id UUID PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id),
    title VARCHAR(255),
    description TEXT,
    due_date DATE,
    d_day INTEGER,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMP
);

-- B2B Tables
CREATE TABLE agent_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    company_name VARCHAR(255),
    license_number VARCHAR(50),
    regions TEXT[],
    subscription_tier VARCHAR(20),
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agent_subscriptions (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES agent_profiles(id),
    tier VARCHAR(20),  -- starter, pro, enterprise
    price_monthly INTEGER,
    started_at TIMESTAMP,
    expires_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE
);

-- Blockchain/DID Tables
CREATE TABLE did_records (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    did_address VARCHAR(100) UNIQUE,
    status VARCHAR(20),
    tx_hash VARCHAR(100),
    block_number BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE verifiable_credentials (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    credential_type VARCHAR(50),
    issuer_did VARCHAR(100),
    subject_did VARCHAR(100),
    claims JSONB,
    proof JSONB,
    status VARCHAR(20),
    issued_at TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE contract_stamps (
    id UUID PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id),
    document_hash VARCHAR(100),
    tx_hash VARCHAR(100),
    block_number BIGINT,
    stamped_at TIMESTAMP
);
```

**Tasks:**
- [ ] P2-02-A: Create SQLAlchemy models
- [ ] P2-02-B: Create initial migration
- [ ] P2-02-C: Create Pydantic schemas
- [ ] P2-02-D: Add indexes for performance

### P2-03: API Endpoints

```yaml
# Auth Endpoints (Public)
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/verify-phone
GET  /api/v1/auth/social/kakao
GET  /api/v1/auth/social/naver

# User Endpoints (Authenticated)
GET  /api/v1/users/me
PUT  /api/v1/users/me
GET  /api/v1/users/me/financials
PUT  /api/v1/users/me/financials
GET  /api/v1/users/me/did
POST /api/v1/users/me/did/issue

# Reality Check Endpoints
POST /api/v1/reality/calculate
GET  /api/v1/reality/reports
GET  /api/v1/reality/reports/{id}
POST /api/v1/reality/compare
GET  /api/v1/reality/action-plan/{report_id}

# Owner Signal Endpoints
GET  /api/v1/signals
POST /api/v1/signals
GET  /api/v1/signals/{id}
PUT  /api/v1/signals/{id}
DELETE /api/v1/signals/{id}
GET  /api/v1/signals/my
POST /api/v1/signals/{id}/contact

# Contract Endpoints
GET  /api/v1/contracts
POST /api/v1/contracts
GET  /api/v1/contracts/{id}
PUT  /api/v1/contracts/{id}
GET  /api/v1/contracts/{id}/timeline
POST /api/v1/contracts/{id}/timeline/task
PUT  /api/v1/contracts/{id}/timeline/task/{task_id}
POST /api/v1/contracts/{id}/stamp  # Blockchain stamp

# Agent Endpoints (B2B)
GET  /api/v1/agents/dashboard
GET  /api/v1/agents/signals
GET  /api/v1/agents/leads
POST /api/v1/agents/subscribe
GET  /api/v1/agents/subscription

# DID Endpoints
POST /api/v1/did/issue
GET  /api/v1/did/{address}
POST /api/v1/did/verify
POST /api/v1/did/credentials/issue
POST /api/v1/did/credentials/verify
POST /api/v1/did/presentations/create
```

**Tasks:**
- [ ] P2-03-A: Implement auth endpoints
- [ ] P2-03-B: Implement user endpoints
- [ ] P2-03-C: Implement reality endpoints
- [ ] P2-03-D: Implement signal endpoints
- [ ] P2-03-E: Implement contract endpoints
- [ ] P2-03-F: Implement agent endpoints
- [ ] P2-03-G: Implement DID endpoints

---

## Phase 3: Authentication System

### P3-01: JWT Authentication

```python
# core/security.py
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=30)
    return jwt.encode(
        {"sub": user_id, "role": role, "exp": expire},
        settings.SECRET_KEY,
        algorithm="HS256"
    )

def create_refresh_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=7)
    return jwt.encode(
        {"sub": user_id, "type": "refresh", "exp": expire},
        settings.SECRET_KEY,
        algorithm="HS256"
    )
```

**Tasks:**
- [ ] P3-01-A: Implement JWT creation/verification
- [ ] P3-01-B: Implement password hashing
- [ ] P3-01-C: Create auth middleware
- [ ] P3-01-D: Implement token refresh flow

### P3-02: Social Login

```python
# Kakao OAuth
KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize"
KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me"

# Naver OAuth
NAVER_AUTH_URL = "https://nid.naver.com/oauth2.0/authorize"
NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
NAVER_USER_URL = "https://openapi.naver.com/v1/nid/me"
```

**Tasks:**
- [ ] P3-02-A: Implement Kakao OAuth flow
- [ ] P3-02-B: Implement Naver OAuth flow
- [ ] P3-02-C: Handle social account linking

### P3-03: Phone Verification (PASS)

```python
# PASS integration for phone verification
# Required for Korean regulatory compliance
```

**Tasks:**
- [ ] P3-03-A: Integrate PASS API
- [ ] P3-03-B: Implement SMS verification fallback
- [ ] P3-03-C: Store verification status

### P3-04: Frontend Auth Integration

```typescript
// src/lib/auth/authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// src/lib/auth/useAuth.ts
export function useAuth() {
  const login = useMutation({...});
  const logout = useMutation({...});
  const register = useMutation({...});
  return { login, logout, register, user };
}
```

**Tasks:**
- [ ] P3-04-A: Create auth store (Zustand)
- [ ] P3-04-B: Create useAuth hook
- [ ] P3-04-C: Create ProtectedRoute component
- [ ] P3-04-D: Update API client with auth headers
- [ ] P3-04-E: Create login/register pages
- [ ] P3-04-F: Add social login buttons

---

## Phase 4: Feature Completion

### P4-01: Reality Check Enhancement

**Missing Features:**
- [ ] Scenario comparison (buy now vs later)
- [ ] AI-powered action plan generation
- [ ] Report saving to user account
- [ ] PDF report with branding
- [ ] Rental business registration simulation
- [ ] After-tax ROI analysis

**Tasks:**
- [ ] P4-01-A: Implement scenario comparison UI
- [ ] P4-01-B: Create comparison calculation logic
- [ ] P4-01-C: Integrate Gemini for action plans
- [ ] P4-01-D: Implement report persistence (API)
- [ ] P4-01-E: Enhance PDF export with branding
- [ ] P4-01-F: Add rental business calculator
- [ ] P4-01-G: Add ROI analysis

### P4-02: Owner Signal Completion

**Missing Features:**
- [ ] Property verification (registry lookup)
- [ ] Map-based property selection
- [ ] Anonymous signal system
- [ ] B2B agent dashboard
- [ ] Contact request workflow
- [ ] Signal expiration system
- [ ] View/contact statistics

**Tasks:**
- [ ] P4-02-A: Integrate property registry API
- [ ] P4-02-B: Add Kakao/Naver map component
- [ ] P4-02-C: Implement anonymous masking
- [ ] P4-02-D: Create contact request flow
- [ ] P4-02-E: Add signal expiration logic
- [ ] P4-02-F: Create statistics dashboard

### P4-03: Smart Move-in Completion

**Missing Features:**
- [ ] Auto-generated timeline from contract data
- [ ] Partner service integration
- [ ] Push notification scheduling
- [ ] Document storage/management
- [ ] Loan application tracking

**Tasks:**
- [ ] P4-03-A: Implement timeline generator
- [ ] P4-03-B: Create partner service links
- [ ] P4-03-C: Setup push notifications (PWA)
- [ ] P4-03-D: Add document upload/storage
- [ ] P4-03-E: Create loan tracking feature

### P4-04: Contract Analysis Enhancement

**Missing Features:**
- [ ] Standard contract template comparison
- [ ] Industry-specific clause database
- [ ] Negotiation tip generation
- [ ] Contract version tracking
- [ ] Blockchain hash recording

**Tasks:**
- [ ] P4-04-A: Add standard templates to RAG
- [ ] P4-04-B: Enhance clause extraction
- [ ] P4-04-C: Generate negotiation tips
- [ ] P4-04-D: Implement version tracking

---

## Phase 5: B2B Agent Platform

### P5-01: Agent Registration

**Tasks:**
- [ ] P5-01-A: Create agent registration form
- [ ] P5-01-B: Verify real estate license
- [ ] P5-01-C: Setup region selection
- [ ] P5-01-D: Create agent profile page

### P5-02: Subscription System

```yaml
Tiers:
  starter:
    price: 99,000 KRW/month
    signals_per_month: 50
    contact_requests: 20
    features:
      - Basic signal search
      - Reality Score view

  pro:
    price: 199,000 KRW/month
    signals_per_month: 200
    contact_requests: 100
    features:
      - Advanced filters
      - Lead scoring
      - Priority support

  enterprise:
    price: 399,000 KRW/month
    signals_per_month: unlimited
    contact_requests: unlimited
    features:
      - API access
      - White-label reports
      - Dedicated support
```

**Tasks:**
- [ ] P5-02-A: Create subscription tiers
- [ ] P5-02-B: Implement usage tracking
- [ ] P5-02-C: Create upgrade/downgrade flow
- [ ] P5-02-D: Add subscription management UI

### P5-03: Agent Dashboard

**Tasks:**
- [ ] P5-03-A: Create signal monitoring view
- [ ] P5-03-B: Implement region-based filtering
- [ ] P5-03-C: Create lead management
- [ ] P5-03-D: Add transaction tracking
- [ ] P5-03-E: Create commission calculator

---

## Phase 6: Legal Care & Blockchain Integration

### P6-01: DID BaaS Integration

```typescript
// src/services/did/didClient.ts
import { DidBaasSDK } from '@did-baas/sdk';

export const didSDK = new DidBaasSDK({
  baseUrl: 'https://trendy.storydot.kr/did-baas',
  apiKey: process.env.DID_BAAS_API_KEY
});

// Issue DID for user
export async function issueDid(userId: string) {
  return didSDK.did.issue({
    metadata: { userId, type: 'realcare-user' }
  });
}

// Create identity credential
export async function issueIdentityCredential(
  issuerDid: string,
  subjectDid: string,
  claims: { name: string; phone: string; verified: boolean }
) {
  return didSDK.credentials.issueW3c({
    issuerDid,
    subjectDid,
    schemaId: 'identity-basic-v1',
    claims
  });
}
```

**Tasks:**
- [ ] P6-01-A: Install @did-baas/sdk
- [ ] P6-01-B: Create DID client wrapper
- [ ] P6-01-C: Implement DID issuance for users
- [ ] P6-01-D: Create DID management UI
- [ ] P6-01-E: Link DID to user account

### P6-02: Verifiable Credentials

**Credential Types:**
```yaml
RealCareUserCredential:
  claims:
    - userId
    - verificationLevel
    - memberSince

RealityScoreCredential:
  claims:
    - score
    - calculatedAt
    - region

PropertyOwnerCredential:
  claims:
    - propertyAddress
    - ownershipVerified
    - verifiedAt

AgentLicenseCredential:
  claims:
    - licenseNumber
    - companyName
    - regions
```

**Tasks:**
- [ ] P6-02-A: Define credential schemas
- [ ] P6-02-B: Implement credential issuance
- [ ] P6-02-C: Create credential verification flow
- [ ] P6-02-D: Add credential wallet UI

### P6-03: Contract Blockchain Stamping

```typescript
// Stamp contract hash on Xphere via DID BaaS
export async function stampContract(
  contractId: string,
  documentHash: string,
  signerDid: string
) {
  // Create credential for contract stamp
  const credential = await didSDK.credentials.issueW3c({
    issuerDid: REALCARE_ISSUER_DID,
    subjectDid: signerDid,
    schemaId: 'contract-stamp-v1',
    claims: {
      contractId,
      documentHash,
      stampedAt: new Date().toISOString()
    }
  });

  return credential;
}
```

**Tasks:**
- [ ] P6-03-A: Implement document hashing
- [ ] P6-03-B: Create stamp credential schema
- [ ] P6-03-C: Integrate stamping in contract flow
- [ ] P6-03-D: Create verification certificate UI

### P6-04: Zero-Knowledge Proofs

```typescript
// Prove Reality Score is above threshold without revealing exact score
export async function proveRealityScoreAbove(
  credentialId: string,
  threshold: number,
  nonce: string
) {
  return didSDK.zkp.proveScoreRange(
    credentialId,
    threshold,    // min
    undefined,    // no max
    nonce
  );
}
```

**Tasks:**
- [ ] P6-04-A: Implement ZKP for Reality Score
- [ ] P6-04-B: Implement ZKP for agent license
- [ ] P6-04-C: Create verification UI

---

## Phase 7: Payment & Monetization

### P7-01: Payment Integration

**Options:**
- Toss Payments (recommended for Korea)
- Kakao Pay
- Naver Pay

**Tasks:**
- [ ] P7-01-A: Integrate Toss Payments API
- [ ] P7-01-B: Implement subscription billing
- [ ] P7-01-C: Create payment history
- [ ] P7-01-D: Add receipt generation

### P7-02: Revenue Streams

| Stream | Implementation |
|--------|----------------|
| Agent Subscription | Monthly recurring |
| Premium Reports | Per-report purchase |
| Lead Marketplace | Per-contact fee |
| Financial Referral | Commission on conversion |

**Tasks:**
- [ ] P7-02-A: Implement subscription checkout
- [ ] P7-02-B: Implement one-time purchases
- [ ] P7-02-C: Create referral tracking
- [ ] P7-02-D: Add revenue dashboard (admin)

---

## Implementation Order

### Sprint 1-2: Backend Foundation (Phase 2)
1. FastAPI project setup
2. Database schema and migrations
3. Basic CRUD endpoints
4. Docker deployment

### Sprint 3-4: Authentication (Phase 3)
5. JWT authentication
6. Social login (Kakao, Naver)
7. Frontend auth integration
8. Protected routes

### Sprint 5-6: Feature Completion (Phase 4)
9. Reality Check enhancements
10. Owner Signal completion
11. Smart Move-in completion
12. Contract Analysis enhancement

### Sprint 7-8: B2B Platform (Phase 5)
13. Agent registration
14. Subscription system
15. Agent dashboard
16. Lead management

### Sprint 9-10: Blockchain Integration (Phase 6)
17. DID BaaS integration
18. Verifiable Credentials
19. Contract stamping
20. ZKP implementation

### Sprint 11-12: Monetization (Phase 7)
21. Payment integration
22. Subscription billing
23. Premium features
24. Revenue tracking

---

## Technical Specifications

### API Client Configuration

```typescript
// src/lib/api/client.ts
import ky from 'ky';

export const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || 'https://trendy.storydot.kr/real/api/v1',
  hooks: {
    beforeRequest: [
      request => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      }
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          // Attempt token refresh
          const refreshed = await refreshToken();
          if (refreshed) {
            return ky(request);
          }
          // Redirect to login
          window.location.href = '/real/login';
        }
      }
    ]
  }
});
```

### DID BaaS Configuration

```typescript
// src/lib/did/config.ts
export const DID_CONFIG = {
  baseUrl: 'https://trendy.storydot.kr/did-baas',
  chainId: 20250217,  // Xphere
  schemas: {
    userIdentity: 'identity-basic-v1',
    realityScore: 'realcare-score-v1',
    contractStamp: 'contract-stamp-v1',
    agentLicense: 'agent-license-v1'
  }
};
```

### Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/realcare
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-key

# Social Login
KAKAO_CLIENT_ID=xxx
KAKAO_CLIENT_SECRET=xxx
NAVER_CLIENT_ID=xxx
NAVER_CLIENT_SECRET=xxx

# DID BaaS
DID_BAAS_API_KEY=your-did-baas-key
DID_BAAS_URL=https://trendy.storydot.kr/did-baas

# Payment
TOSS_CLIENT_KEY=xxx
TOSS_SECRET_KEY=xxx

# Frontend (.env.local)
VITE_API_URL=https://trendy.storydot.kr/real/api/v1
VITE_DID_BAAS_URL=https://trendy.storydot.kr/did-baas
VITE_SENTRY_DSN=xxx
```

---

## Deployment Architecture

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │      CDN        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     Nginx       │
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌────────▼────────┐   ┌──────▼───────┐
│   Frontend    │   │    Backend      │   │  DID BaaS    │
│   (Static)    │   │   (FastAPI)     │   │   (Java)     │
│   /real/      │   │   /real/api/    │   │  /did-baas/  │
└───────────────┘   └────────┬────────┘   └──────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌────────▼────────┐   ┌──────▼───────┐
│  PostgreSQL   │   │     Redis       │   │   Xphere     │
│   Database    │   │     Cache       │   │  Blockchain  │
└───────────────┘   └─────────────────┘   └──────────────┘
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | <200ms p95 | Prometheus |
| Error Rate | <0.1% | Sentry |
| User Registration | >100/week | DB count |
| Agent Conversion | >5% trial→paid | Payment data |
| Contract Stamps | >50/month | Blockchain count |
| Reality Score Usage | >500/week | API logs |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| DID BaaS downtime | High | Cache DIDs locally, queue stamps |
| Xphere network issues | Medium | Retry logic, status monitoring |
| Payment failures | High | Multiple payment providers |
| Data breach | Critical | Encryption, DID for sensitive data |

---

## Appendix: DID BaaS SDK Reference

```typescript
// Full SDK usage examples
import { DidBaasSDK } from '@did-baas/sdk';

const sdk = new DidBaasSDK({
  baseUrl: 'https://trendy.storydot.kr/did-baas',
  apiKey: 'your-api-key'
});

// DID Operations
const did = await sdk.did.issue();
const verified = await sdk.did.verify(did.didAddress);
const document = await sdk.did.getDocument(did.didAddress);

// Credential Operations
const credential = await sdk.credentials.issueW3c({...});
const result = await sdk.credentials.verifyW3c(credential);

// ZKP Operations
const proof = await sdk.zkp.proveScoreRange(credId, 70, undefined, nonce);
const verified = await sdk.zkp.verifyScoreProof(proof.proofId, 70, nonce);

// BBS+ Selective Disclosure
const sig = await sdk.bbs.sign({didAddress, messages});
const disclosed = await sdk.bbs.deriveProof({...revealedIndexes});
```

---

*This specification follows the Spec-Kit methodology and should be updated as implementation progresses.*
