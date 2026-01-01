# Phase 14: Comprehensive System Improvements

> Spec-Kit methodology for RealCare system-wide improvements
> Created: 2026-01-01
> Priority: Critical to Low

## Overview

This phase addresses all identified issues from the system audit, covering security, API completion, database improvements, CI/CD fixes, and test coverage expansion.

---

## Sprint 14.1: Critical Security Fixes (P0)

### P14-01-A: Refresh Token Security
**Priority**: Critical
**Risk**: Token exposure in URL logs

**Current Issue**:
```python
# backend/app/api/v1/endpoints/auth.py
@router.post("/refresh")
async def refresh_token(
    refresh_token: str,  # Query parameter - INSECURE
    ...
):
```

**Solution**: Move refresh token to POST body with proper schema.

**Files**:
- `backend/app/api/v1/endpoints/auth.py`
- `backend/app/schemas/auth.py`

---

### P14-01-B: CI/CD Pipeline Dependency
**Priority**: Critical
**Risk**: Bad code deploying to production

**Current Issue**:
```yaml
# .github/workflows/deploy.yml
deploy:
  needs: []  # Runs independently of CI
```

**Solution**: Add proper job dependencies.

**Files**:
- `.github/workflows/deploy.yml`

---

### P14-01-C: Database Index Missing
**Priority**: Critical
**Risk**: Performance degradation on signal queries

**Current Issue**: `signal_interests` table lacks indexes on `signal_id` and `user_id`.

**Solution**: Add Alembic migration for indexes.

**Files**:
- `backend/alembic/versions/005_*.py` (new migration)

---

## Sprint 14.2: Core Feature Implementation (P1)

### P14-02-A: Owner Signals DB Implementation
**Priority**: High
**Risk**: Core feature non-functional

**Current State**: All endpoints return placeholders/empty.

**Implementation**:
1. SignalRepository with full CRUD
2. SignalService business logic
3. Update endpoints to use repository

**Files**:
- `backend/app/repositories/signal.py` (new)
- `backend/app/services/signal.py` (new)
- `backend/app/api/v1/endpoints/signals.py`

---

### P14-02-B: Contracts DB Implementation
**Priority**: High
**Risk**: Core feature non-functional

**Current State**: All endpoints return placeholders/404.

**Implementation**:
1. ContractRepository with full CRUD
2. ContractService business logic
3. TimelineTask management
4. Update endpoints

**Files**:
- `backend/app/repositories/contract.py` (new)
- `backend/app/services/contract.py` (new)
- `backend/app/api/v1/endpoints/contracts.py`

---

### P14-02-C: OAuth Callback Implementation
**Priority**: High
**Risk**: Social login broken

**Current State**: Returns 501 Not Implemented.

**Implementation**:
1. Kakao OAuth callback processing
2. Naver OAuth callback processing
3. User creation/linking logic

**Files**:
- `backend/app/api/v1/endpoints/auth.py`
- `backend/app/services/auth.py`

---

### P14-02-D: Gemini AI Integration
**Priority**: High
**Risk**: AI features non-functional

**Implementation**:
1. Contract analysis with Gemini
2. Reality check action plans
3. Risk assessment

**Files**:
- `backend/app/services/gemini.py` (new)
- `backend/app/api/v1/endpoints/contracts.py`
- `backend/app/api/v1/endpoints/reality.py`

---

### P14-02-E: Payment FK Constraint Fix
**Priority**: High
**Risk**: Legal compliance (payment history loss)

**Current Issue**: `payments.user_id` CASCADE delete loses payment records.

**Solution**: Change to RESTRICT, add archive pattern.

**Files**:
- `backend/alembic/versions/006_*.py` (new migration)

---

## Sprint 14.3: Medium Priority Improvements (P2)

### P14-03-A: Token Blacklist Implementation
**Priority**: Medium
**Risk**: Tokens valid after logout

**Implementation**:
1. Redis-based blacklist
2. Logout invalidation
3. Token validation check

**Files**:
- `backend/app/core/security.py`
- `backend/app/services/auth.py`

---

### P14-03-B: Enhanced Health Checks
**Priority**: Medium
**Risk**: Deployment issues undetected

**Implementation**:
1. Database connectivity check
2. Redis connectivity check
3. External service status

**Files**:
- `backend/app/api/v1/endpoints/health.py`
- `.github/workflows/deploy.yml`

---

### P14-03-C: Rate Limiter Improvement
**Priority**: Medium
**Risk**: Rate limit bypass

**Current Issue**: Uses Python `hash()` for token identification.

**Solution**: Extract user ID from JWT for proper tracking.

**Files**:
- `backend/app/middleware/rate_limit.py`

---

### P14-03-D: Verified Agent Test Fixture
**Priority**: Medium
**Risk**: Incomplete test coverage

**Implementation**: Add fixture that creates verified agents.

**Files**:
- `backend/tests/conftest.py`

---

### P14-03-E: Push Notification Preferences DB
**Priority**: Medium
**Risk**: Preferences not persisted

**Implementation**: Save preferences to database.

**Files**:
- `backend/app/api/v1/endpoints/push.py`
- `backend/app/repositories/notification.py` (new)

---

## Sprint 14.4: Low Priority Enhancements (P3)

### P14-04-A: Datetime Consistency
**Priority**: Low
**Risk**: Potential timestamp mismatches

**Implementation**: Standardize all datetime to `datetime.now(timezone.utc)`.

**Files**:
- `backend/app/repositories/user.py`
- Various model files

---

### P14-04-B: Float Precision Fix
**Priority**: Low
**Risk**: Calculation precision issues

**Implementation**: Change `success_rate`, `rating` to Numeric(3,2).

**Files**:
- `backend/app/models/agent.py`
- New Alembic migration

---

### P14-04-C: Soft Delete Pattern
**Priority**: Low
**Risk**: Audit trail loss

**Implementation**: Add `is_deleted`, `deleted_at` to critical models.

**Files**:
- `backend/app/models/base.py`
- Multiple model files

---

## Task Summary

| Sprint | Tasks | Priority | Estimated |
|--------|-------|----------|-----------|
| 14.1 | 3 | Critical | P0 |
| 14.2 | 5 | High | P1 |
| 14.3 | 5 | Medium | P2 |
| 14.4 | 3 | Low | P3 |

**Total**: 16 tasks

---

## Definition of Done

- [ ] Code implemented
- [ ] Tests added/updated
- [ ] No TypeScript/Python errors
- [ ] Migration tested
- [ ] Documentation updated

---

## Notes

- All code comments in English
- Korean only in user-facing strings
- Follow existing patterns in codebase
