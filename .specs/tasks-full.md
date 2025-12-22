# RealCare Full Implementation Tasks

> Comprehensive task list for complete platform implementation
> Generated: 2024-12-22
> Total Tasks: 127

---

## Task Summary

| Phase | Name | Tasks | Status |
|-------|------|-------|--------|
| 2 | Backend Foundation | 21 | NOT STARTED |
| 3 | Authentication | 15 | NOT STARTED |
| 4 | Feature Completion | 32 | PARTIAL |
| 5 | B2B Platform | 18 | NOT STARTED |
| 6 | Blockchain/DID | 22 | NOT STARTED |
| 7 | Payment | 12 | NOT STARTED |
| Q | Quick Wins (No Backend) | 7 | NOT STARTED |

---

## Quick Wins (Implement First - No Backend Required)

### Q-01: Scenario Comparison in Reality Check
**Priority**: HIGH | **Effort**: 2 days | **Impact**: HIGH
**Status**: COMPLETED (2024-12-22)

Add "Buy Now vs Buy Later" comparison feature to Reality Check.

**Subtasks:**
- [x] Q-01-A: Create comparison data structure
- [x] Q-01-B: Implement 1-year projection calculator
- [x] Q-01-C: Create side-by-side comparison UI
- [x] Q-01-D: Add price appreciation slider
- [x] Q-01-E: Add interest rate change slider

**Files created/modified:**
- `src/components/realityCheck/ScenarioComparison.tsx` (new)
- `src/components/realityCheck/RealityCheckForm.tsx` (updated)

---

### Q-02: Calculator Sharing (Viral Growth)
**Priority**: HIGH | **Effort**: 1 day | **Impact**: HIGH
**Status**: COMPLETED (2024-12-22)

Add ability to share Reality Check results via URL.

**Subtasks:**
- [x] Q-02-A: Encode calculation state to URL params (lz-string compression)
- [x] Q-02-B: Decode and restore state from URL
- [x] Q-02-C: Add share button with copy-to-clipboard
- [x] Q-02-D: Web Share API integration for mobile
- [x] Q-02-E: Add KakaoTalk share button

**Files created/modified:**
- `src/components/realityCheck/ShareButton.tsx` (new)
- `src/lib/utils/shareUtils.ts` (new)
- `src/components/realityCheck/RealityCheckForm.tsx` (updated)

---

### Q-03: Property Map in Owner Signal
**Priority**: MEDIUM | **Effort**: 3 days | **Impact**: MEDIUM

Add Kakao/Naver map for property location selection.

**Subtasks:**
- [ ] Q-03-A: Add kakao-maps-sdk dependency
- [ ] Q-03-B: Create MapSelector component
- [ ] Q-03-C: Implement address search
- [ ] Q-03-D: Add marker placement
- [ ] Q-03-E: Reverse geocode to get address
- [ ] Q-03-F: Integrate into signal creation form

**Files to modify:**
- `package.json`
- `src/components/ownerSignal/MapSelector.tsx` (new)
- `src/routes/signals.tsx`

---

### Q-04: Enhanced Timeline with Categories
**Priority**: MEDIUM | **Effort**: 2 days | **Impact**: MEDIUM

Group move-in tasks by category with visual separation.

**Subtasks:**
- [ ] Q-04-A: Define task categories (legal, financial, moving, setup)
- [ ] Q-04-B: Create category icons and colors
- [ ] Q-04-C: Implement collapsible category sections
- [ ] Q-04-D: Add category progress indicators

**Files to modify:**
- `src/lib/constants/partnerServices.ts`
- `src/components/timeline/TimelineCategory.tsx` (new)
- `src/routes/timeline.tsx`

---

### Q-05: Onboarding Tutorial
**Priority**: MEDIUM | **Effort**: 2 days | **Impact**: MEDIUM

First-time user tutorial explaining key features.

**Subtasks:**
- [ ] Q-05-A: Create tutorial step definitions
- [ ] Q-05-B: Implement tooltip-based tour
- [ ] Q-05-C: Add skip/complete tracking
- [ ] Q-05-D: Show tutorial on first visit

**Files to modify:**
- `src/components/onboarding/TutorialOverlay.tsx` (new)
- `src/lib/constants/tutorialSteps.ts` (new)
- `src/routes/__root.tsx`

---

### Q-06: Branded PDF Report
**Priority**: LOW | **Effort**: 1 day | **Impact**: LOW

Enhance PDF export with RealCare branding.

**Subtasks:**
- [ ] Q-06-A: Add logo to PDF header
- [ ] Q-06-B: Add footer with disclaimer
- [ ] Q-06-C: Improve chart rendering
- [ ] Q-06-D: Add QR code for verification

**Files to modify:**
- `src/components/realityCheck/PdfExport.tsx`
- `public/logo-print.png` (new)

---

### Q-07: Contact Request Form in Owner Signal
**Priority**: HIGH | **Effort**: 1 day | **Impact**: HIGH
**Status**: COMPLETED (2024-12-22)

Allow users to submit contact requests for signals.

**Subtasks:**
- [x] Q-07-A: Create contact request modal with 3-step flow
- [x] Q-07-B: Require Reality Score to contact (50+ threshold)
- [x] Q-07-C: Store requests in localStorage (temp)
- [x] Q-07-D: Contact preference selection (kakao/phone/email)

**Files created/modified:**
- `src/components/ownerSignal/ContactRequestModal.tsx` (new)
- `src/routes/signals.tsx` (updated)

---

## Phase 2: Backend Foundation

### P2-01: FastAPI Project Setup
**Priority**: CRITICAL | **Effort**: 2 days

**Subtasks:**
- [ ] P2-01-A: Create backend/ directory structure
- [ ] P2-01-B: Setup FastAPI with uvicorn
- [ ] P2-01-C: Configure CORS for frontend
- [ ] P2-01-D: Setup Pydantic Settings
- [ ] P2-01-E: Create health check endpoint
- [ ] P2-01-F: Setup logging (structlog)

**Commands:**
```bash
mkdir -p backend/app/{api,core,models,schemas,services}
cd backend
python -m venv venv
pip install fastapi uvicorn[standard] pydantic-settings
```

---

### P2-02: Database Setup
**Priority**: CRITICAL | **Effort**: 2 days

**Subtasks:**
- [ ] P2-02-A: Install SQLAlchemy async + asyncpg
- [ ] P2-02-B: Create database.py with async engine
- [ ] P2-02-C: Create base model class
- [ ] P2-02-D: Setup Alembic for migrations
- [ ] P2-02-E: Create initial migration

**Dependencies:**
```
sqlalchemy[asyncio]
asyncpg
alembic
```

---

### P2-03: User Model & Schema
**Priority**: CRITICAL | **Effort**: 1 day

**Subtasks:**
- [ ] P2-03-A: Create User SQLAlchemy model
- [ ] P2-03-B: Create UserCreate Pydantic schema
- [ ] P2-03-C: Create UserResponse Pydantic schema
- [ ] P2-03-D: Create UserFinancials model

**Files:**
- `backend/app/models/user.py`
- `backend/app/schemas/user.py`

---

### P2-04: Reality Report Model
**Priority**: HIGH | **Effort**: 1 day

**Subtasks:**
- [ ] P2-04-A: Create RealityReport model
- [ ] P2-04-B: Create report schemas
- [ ] P2-04-C: Add migration

---

### P2-05: Owner Signal Model
**Priority**: HIGH | **Effort**: 1 day

**Subtasks:**
- [ ] P2-05-A: Create OwnerSignal model
- [ ] P2-05-B: Create ContactRequest model
- [ ] P2-05-C: Create signal schemas
- [ ] P2-05-D: Add migration

---

### P2-06: Contract Model
**Priority**: HIGH | **Effort**: 1 day

**Subtasks:**
- [ ] P2-06-A: Create Contract model
- [ ] P2-06-B: Create TimelineTask model
- [ ] P2-06-C: Create contract schemas
- [ ] P2-06-D: Add migration

---

### P2-07: Agent Model (B2B)
**Priority**: MEDIUM | **Effort**: 1 day

**Subtasks:**
- [ ] P2-07-A: Create AgentProfile model
- [ ] P2-07-B: Create AgentSubscription model
- [ ] P2-07-C: Create agent schemas
- [ ] P2-07-D: Add migration

---

### P2-08: DID Record Model
**Priority**: MEDIUM | **Effort**: 1 day

**Subtasks:**
- [ ] P2-08-A: Create DidRecord model
- [ ] P2-08-B: Create VerifiableCredential model
- [ ] P2-08-C: Create ContractStamp model
- [ ] P2-08-D: Add migration

---

### P2-09: Redis Setup
**Priority**: HIGH | **Effort**: 0.5 days

**Subtasks:**
- [ ] P2-09-A: Install redis-py
- [ ] P2-09-B: Create Redis client singleton
- [ ] P2-09-C: Setup token blacklist
- [ ] P2-09-D: Setup rate limiting

---

### P2-10: API Router Structure
**Priority**: CRITICAL | **Effort**: 0.5 days

**Subtasks:**
- [ ] P2-10-A: Create v1 router
- [ ] P2-10-B: Create endpoint routers
- [ ] P2-10-C: Mount all routers

---

### P2-11: User CRUD Endpoints
**Priority**: CRITICAL | **Effort**: 1 day

**Subtasks:**
- [ ] P2-11-A: GET /users/me
- [ ] P2-11-B: PUT /users/me
- [ ] P2-11-C: GET /users/me/financials
- [ ] P2-11-D: PUT /users/me/financials

---

### P2-12: Reality Check Endpoints
**Priority**: HIGH | **Effort**: 1.5 days

**Subtasks:**
- [ ] P2-12-A: POST /reality/calculate
- [ ] P2-12-B: GET /reality/reports
- [ ] P2-12-C: GET /reality/reports/{id}
- [ ] P2-12-D: POST /reality/compare
- [ ] P2-12-E: GET /reality/action-plan/{id}

---

### P2-13: Owner Signal Endpoints
**Priority**: HIGH | **Effort**: 1.5 days

**Subtasks:**
- [ ] P2-13-A: GET /signals
- [ ] P2-13-B: POST /signals
- [ ] P2-13-C: GET /signals/{id}
- [ ] P2-13-D: PUT /signals/{id}
- [ ] P2-13-E: DELETE /signals/{id}
- [ ] P2-13-F: GET /signals/my
- [ ] P2-13-G: POST /signals/{id}/contact

---

### P2-14: Contract Endpoints
**Priority**: HIGH | **Effort**: 1.5 days

**Subtasks:**
- [ ] P2-14-A: GET /contracts
- [ ] P2-14-B: POST /contracts
- [ ] P2-14-C: GET /contracts/{id}
- [ ] P2-14-D: GET /contracts/{id}/timeline
- [ ] P2-14-E: POST /contracts/{id}/timeline/task
- [ ] P2-14-F: PUT /contracts/{id}/timeline/task/{id}

---

### P2-15: Gemini Service Integration
**Priority**: HIGH | **Effort**: 1 day

**Subtasks:**
- [ ] P2-15-A: Create GeminiService class
- [ ] P2-15-B: Move API key to backend
- [ ] P2-15-C: Create /ai/analyze endpoint
- [ ] P2-15-D: Create /ai/action-plan endpoint

---

### P2-16: Docker Configuration
**Priority**: MEDIUM | **Effort**: 1 day

**Subtasks:**
- [ ] P2-16-A: Create Dockerfile
- [ ] P2-16-B: Create docker-compose.yml
- [ ] P2-16-C: Setup PostgreSQL container
- [ ] P2-16-D: Setup Redis container
- [ ] P2-16-E: Create production config

---

### P2-17: API Documentation
**Priority**: LOW | **Effort**: 0.5 days

**Subtasks:**
- [ ] P2-17-A: Configure OpenAPI metadata
- [ ] P2-17-B: Add endpoint descriptions
- [ ] P2-17-C: Add request/response examples

---

### P2-18: Error Handling
**Priority**: HIGH | **Effort**: 0.5 days

**Subtasks:**
- [ ] P2-18-A: Create exception handlers
- [ ] P2-18-B: Standardize error responses
- [ ] P2-18-C: Add validation error formatting

---

### P2-19: Middleware Setup
**Priority**: MEDIUM | **Effort**: 0.5 days

**Subtasks:**
- [ ] P2-19-A: Add request logging
- [ ] P2-19-B: Add request ID tracking
- [ ] P2-19-C: Add timing metrics

---

### P2-20: Server Deployment
**Priority**: CRITICAL | **Effort**: 1 day

**Subtasks:**
- [ ] P2-20-A: Create systemd service
- [ ] P2-20-B: Configure nginx reverse proxy
- [ ] P2-20-C: Setup SSL certificate
- [ ] P2-20-D: Configure environment variables

---

### P2-21: Frontend API Client Update
**Priority**: CRITICAL | **Effort**: 1 day

**Subtasks:**
- [ ] P2-21-A: Create API client with ky
- [ ] P2-21-B: Update all TanStack Query hooks
- [ ] P2-21-C: Add error handling
- [ ] P2-21-D: Add request interceptors

---

## Phase 3: Authentication System

### P3-01: JWT Implementation
**Priority**: CRITICAL | **Effort**: 1 day

**Subtasks:**
- [ ] P3-01-A: Install python-jose, passlib
- [ ] P3-01-B: Create JWT creation function
- [ ] P3-01-C: Create JWT verification function
- [ ] P3-01-D: Create password hashing
- [ ] P3-01-E: Create auth dependency

---

### P3-02: Registration Endpoint
**Priority**: CRITICAL | **Effort**: 0.5 days

**Subtasks:**
- [ ] P3-02-A: POST /auth/register
- [ ] P3-02-B: Email uniqueness check
- [ ] P3-02-C: Send verification email

---

### P3-03: Login Endpoint
**Priority**: CRITICAL | **Effort**: 0.5 days

**Subtasks:**
- [ ] P3-03-A: POST /auth/login
- [ ] P3-03-B: Return access + refresh tokens
- [ ] P3-03-C: Store refresh token in Redis

---

### P3-04: Token Refresh
**Priority**: CRITICAL | **Effort**: 0.5 days

**Subtasks:**
- [ ] P3-04-A: POST /auth/refresh
- [ ] P3-04-B: Validate refresh token
- [ ] P3-04-C: Rotate refresh token

---

### P3-05: Password Reset
**Priority**: HIGH | **Effort**: 0.5 days

**Subtasks:**
- [ ] P3-05-A: POST /auth/forgot-password
- [ ] P3-05-B: POST /auth/reset-password
- [ ] P3-05-C: Create reset token logic

---

### P3-06: Kakao OAuth
**Priority**: HIGH | **Effort**: 1 day

**Subtasks:**
- [ ] P3-06-A: Create Kakao OAuth client
- [ ] P3-06-B: GET /auth/social/kakao
- [ ] P3-06-C: GET /auth/social/kakao/callback
- [ ] P3-06-D: Link or create user account

---

### P3-07: Naver OAuth
**Priority**: HIGH | **Effort**: 1 day

**Subtasks:**
- [ ] P3-07-A: Create Naver OAuth client
- [ ] P3-07-B: GET /auth/social/naver
- [ ] P3-07-C: GET /auth/social/naver/callback
- [ ] P3-07-D: Link or create user account

---

### P3-08: Phone Verification
**Priority**: MEDIUM | **Effort**: 2 days

**Subtasks:**
- [ ] P3-08-A: Research PASS API integration
- [ ] P3-08-B: Implement SMS fallback (Twilio/Naver)
- [ ] P3-08-C: Create verification flow

---

### P3-09: Role-Based Access
**Priority**: HIGH | **Effort**: 0.5 days

**Subtasks:**
- [ ] P3-09-A: Define role enum (user, agent, admin)
- [ ] P3-09-B: Create role check dependency
- [ ] P3-09-C: Apply to protected endpoints

---

### P3-10: Auth Store (Frontend)
**Priority**: CRITICAL | **Effort**: 0.5 days

**Subtasks:**
- [ ] P3-10-A: Install zustand
- [ ] P3-10-B: Create authStore
- [ ] P3-10-C: Persist tokens securely

---

### P3-11: useAuth Hook
**Priority**: CRITICAL | **Effort**: 0.5 days

**Subtasks:**
- [ ] P3-11-A: Create useAuth hook
- [ ] P3-11-B: Implement login mutation
- [ ] P3-11-C: Implement logout mutation
- [ ] P3-11-D: Implement register mutation

---

### P3-12: ProtectedRoute Component
**Priority**: CRITICAL | **Effort**: 0.5 days

**Subtasks:**
- [ ] P3-12-A: Create ProtectedRoute wrapper
- [ ] P3-12-B: Redirect to login if unauthenticated
- [ ] P3-12-C: Show loading state

---

### P3-13: Login Page
**Priority**: CRITICAL | **Effort**: 1 day

**Subtasks:**
- [ ] P3-13-A: Create login form
- [ ] P3-13-B: Add validation
- [ ] P3-13-C: Add social login buttons
- [ ] P3-13-D: Handle errors

---

### P3-14: Register Page
**Priority**: CRITICAL | **Effort**: 1 day

**Subtasks:**
- [ ] P3-14-A: Create register form
- [ ] P3-14-B: Add phone verification step
- [ ] P3-14-C: Add terms acceptance

---

### P3-15: API Client Auth Integration
**Priority**: CRITICAL | **Effort**: 0.5 days

**Subtasks:**
- [ ] P3-15-A: Add Authorization header
- [ ] P3-15-B: Handle 401 responses
- [ ] P3-15-C: Auto-refresh token

---

## Phase 4: Feature Completion

### P4-01 through P4-32: (See gap-analysis.md for details)

Key tasks:
- [ ] Scenario comparison implementation
- [ ] AI action plan generation
- [ ] Report persistence
- [ ] Property verification
- [ ] Map integration
- [ ] Anonymous signal masking
- [ ] Contact workflow
- [ ] Auto timeline generation
- [ ] Partner service integration
- [ ] Push notifications
- [ ] Document storage
- [ ] Contract templates
- [ ] Negotiation tips
- [ ] Version tracking

---

## Phase 5: B2B Platform

### P5-01 through P5-18: Agent Platform

Key tasks:
- [ ] Agent registration form
- [ ] License verification
- [ ] Subscription tier setup
- [ ] Usage tracking
- [ ] Signal monitoring dashboard
- [ ] Lead management
- [ ] Commission calculator
- [ ] Analytics dashboard

---

## Phase 6: Blockchain/DID Integration

### P6-01: Install DID BaaS SDK
**Priority**: HIGH | **Effort**: 0.5 days

**Subtasks:**
- [ ] P6-01-A: npm install @did-baas/sdk
- [ ] P6-01-B: Create SDK wrapper service
- [ ] P6-01-C: Configure API key

**Code:**
```typescript
// src/services/did/didClient.ts
import { DidBaasSDK } from '@did-baas/sdk';

export const didSDK = new DidBaasSDK({
  baseUrl: 'https://trendy.storydot.kr/did-baas',
  apiKey: import.meta.env.VITE_DID_BAAS_API_KEY
});
```

---

### P6-02: DID Issuance for Users
**Priority**: HIGH | **Effort**: 1 day

**Subtasks:**
- [ ] P6-02-A: Add "Issue DID" button in settings
- [ ] P6-02-B: Call DID BaaS issue API
- [ ] P6-02-C: Store DID address in user profile
- [ ] P6-02-D: Show DID status (pending/confirmed)

---

### P6-03: DID Management UI
**Priority**: MEDIUM | **Effort**: 1 day

**Subtasks:**
- [ ] P6-03-A: Create DID wallet page
- [ ] P6-03-B: Show DID document
- [ ] P6-03-C: Add verification status

---

### P6-04: User Identity Credential
**Priority**: HIGH | **Effort**: 1 day

**Subtasks:**
- [ ] P6-04-A: Define identity schema
- [ ] P6-04-B: Issue credential on verification
- [ ] P6-04-C: Display in wallet

---

### P6-05: Reality Score Credential
**Priority**: HIGH | **Effort**: 1 day

**Subtasks:**
- [ ] P6-05-A: Define score schema
- [ ] P6-05-B: Issue on Reality Check completion
- [ ] P6-05-C: Enable sharing with verifier

---

### P6-06: Agent License Credential
**Priority**: MEDIUM | **Effort**: 1 day

**Subtasks:**
- [ ] P6-06-A: Define license schema
- [ ] P6-06-B: Issue on license verification
- [ ] P6-06-C: Enable ZKP verification

---

### P6-07: Contract Stamping Flow
**Priority**: HIGH | **Effort**: 2 days

**Subtasks:**
- [ ] P6-07-A: Hash contract document
- [ ] P6-07-B: Create stamp credential
- [ ] P6-07-C: Store blockchain TX hash
- [ ] P6-07-D: Generate verification certificate

---

### P6-08: ZKP for Reality Score
**Priority**: MEDIUM | **Effort**: 1 day

**Subtasks:**
- [ ] P6-08-A: Implement proveScoreRange
- [ ] P6-08-B: Create verification UI
- [ ] P6-08-C: Use in contact request

---

### P6-09 through P6-22: Additional DID/Blockchain Tasks

Key tasks:
- [ ] Credential wallet UI
- [ ] Verifiable Presentations
- [ ] Multi-party signing
- [ ] Dispute evidence
- [ ] Audit trail

---

## Phase 7: Payment Integration

### P7-01 through P7-12: Payment & Monetization

Key tasks:
- [ ] Toss Payments integration
- [ ] Subscription checkout
- [ ] Recurring billing
- [ ] Payment history
- [ ] Receipt generation
- [ ] Revenue dashboard

---

## Implementation Schedule

### Week 1-2: Quick Wins + Backend Setup
- Q-01 through Q-07
- P2-01 through P2-10

### Week 3-4: Backend Completion + Auth
- P2-11 through P2-21
- P3-01 through P3-09

### Week 5-6: Frontend Auth + Feature Completion
- P3-10 through P3-15
- P4-01 through P4-16

### Week 7-8: Feature Completion + B2B Start
- P4-17 through P4-32
- P5-01 through P5-09

### Week 9-10: B2B Completion + DID Start
- P5-10 through P5-18
- P6-01 through P6-08

### Week 11-12: DID Completion + Payment
- P6-09 through P6-22
- P7-01 through P7-12

---

## Definition of Done

Each task must meet:
- [ ] Code implemented and tested
- [ ] TypeScript types complete
- [ ] No console errors
- [ ] Mobile responsive
- [ ] API documented
- [ ] Error handling complete

---

*Last Updated: 2024-12-22*
