# Phase 13: System Remediation

> Generated: 2025-12-23
> Updated: 2025-12-23
> Status: MOSTLY COMPLETE
> Priority: CRITICAL

## Overview

System audit identified critical issues requiring immediate remediation:
- Security vulnerability (default SECRET_KEY)
- 189 TypeScript compilation errors
- Frontend-Backend schema mismatch

## Issue Summary

| Category | Severity | Count | Status |
|----------|----------|-------|--------|
| Security (SECRET_KEY) | CRITICAL | 1 | DONE (local config updated) |
| TypeScript Errors | HIGH | 189→173 | PARTIAL (build passes) |
| Schema Mismatch | HIGH | 1 | DONE |
| OAuth Configuration | MEDIUM | 2 | DOCUMENTED |

---

## Sprint 13.1: Security Fixes

### P13-01-A: Generate Production SECRET_KEY
**Status**: PENDING
**Priority**: CRITICAL

**Issue**: JWT secret key using default value `"your-secret-key-change-in-production"`

**Location**: `backend/app/core/config.py:37`

**Fix**:
1. Generate cryptographically secure 32-byte key
2. Add to `ecosystem.config.cjs` environment variables
3. Deploy to server

### P13-01-B: Document OAuth Redirect URI Registration
**Status**: PENDING
**Priority**: MEDIUM

**Issue**: Google OAuth redirect URI not registered in Google Console

**Required URI**:
```
https://trendy.storydot.kr/real/api/v1/auth/social/google/callback
```

**Instructions**:
1. Go to Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Edit OAuth 2.0 Client ID
4. Add authorized redirect URI

---

## Sprint 13.2: TypeScript Error Fixes

### P13-02-A: Add Vite Client Types
**Status**: PENDING
**Priority**: HIGH

**Issue**: `ImportMeta.env` type errors due to missing Vite types

**Location**: `tsconfig.json`

**Fix**: Add `"vite/client"` to compiler options types array

### P13-02-B: Fix RealityCheckResult Interface
**Status**: PENDING
**Priority**: HIGH

**Issue**: ~40 errors from RealityCheckResult interface mismatch

**Location**: `src/components/realityCheck/RealityCheckForm.tsx`

**Root Cause**: Interface definition doesn't match actual calculation return values

### P13-02-C: Fix React Class Component Types
**Status**: PENDING
**Priority**: HIGH

**Issue**: ErrorBoundary class component type errors

**Location**: `src/components/ErrorBoundary.tsx`

### P13-02-D: Fix Module Import Paths
**Status**: PENDING
**Priority**: HIGH

**Issue**: ~15 module resolution errors in admin/agent routes

**Locations**:
- `src/routes/admin/*.tsx`
- `src/routes/agent/*.tsx`

### P13-02-E: Fix jsPDF Type Compatibility
**Status**: PENDING
**Priority**: MEDIUM

**Issue**: jsPDF API type mismatches

**Location**: `src/lib/utils/pdfBranding.ts`

---

## Sprint 13.3: API Integration

### P13-03-A: Create API Transformation Layer
**Status**: PENDING
**Priority**: HIGH

**Issue**: Frontend and backend use different schemas for RealityCheck

**Frontend Schema** (`src/lib/hooks/useRealityCheck.ts`):
```typescript
interface RealityCheckInput {
  propertyPrice: number;
  regionCode: string;
  areaSquareMeters: number;
  annualIncome: number;
  cashAssets: number;
  houseCount: number;
  isFirstHome: boolean;
  loanTermYears: number;
  interestRate: number;
}
```

**Backend Schema** (`backend/app/schemas/reality.py`):
```python
class RealityCheckInput(BaseModel):
    property_price: int
    transaction_type: str
    region: str
    annual_income: int
    available_cash: int
    existing_debt: int
    monthly_expenses: int
    house_count: int
```

**Fix**: Create transformation utility to convert between schemas

### P13-03-B: Connect Frontend to Backend API
**Status**: PENDING
**Priority**: HIGH

**Issue**: Frontend performs local calculations instead of calling backend API

**Fix**: Update `useRealityCheck` hook to call backend `/api/v1/reality/calculate`

---

## Task Checklist

### Phase 1: Security (Immediate)
- [x] P13-01-A: Generate and configure SECRET_KEY (local config updated)
- [x] P13-01-B: Document Google OAuth redirect URI

### Phase 2: TypeScript (High Priority)
- [x] P13-02-A: Add vite/client types to tsconfig.json
- [x] P13-02-B: Fix RealityCheckResult interface
- [x] P13-02-C: Fix ErrorBoundary React types
- [x] P13-02-D: Fix path alias (@/ -> ./src/*)
- [x] P13-02-E: Fix pdfBranding type issues
- [x] P13-02-F: Fix taxCalculator missing limit property
- [x] P13-02-G: Install @types/react and @types/react-dom
- [ ] P13-02-H: Remaining TypeScript strict mode errors (non-blocking)

### Phase 3: API Integration
- [x] P13-03-A: Update RealityCheckForm to use correct input format
- [ ] P13-03-B: Connect frontend to backend API (optional)

---

## Success Criteria

1. `npm run build` completes with 0 TypeScript errors
2. SECRET_KEY is cryptographically secure and unique
3. Frontend RealityCheck calls backend API
4. All OAuth providers have correct redirect URIs

---

## Server Deployment Instructions

### Deploy SECRET_KEY to Server

The updated `ecosystem.config.cjs` file includes the secure SECRET_KEY. Deploy it:

```bash
# Option 1: SCP upload
scp -i C:/server/firstkeypair.pem C:/dev/real/backend/ecosystem.config.cjs ubuntu@trendy.storydot.kr:/mnt/storage/real/backend/

# Option 2: Manual SSH and paste content
ssh -i C:/server/firstkeypair.pem ubuntu@trendy.storydot.kr
cat > /mnt/storage/real/backend/ecosystem.config.cjs << 'EOF'
# Copy content from local C:/dev/real/backend/ecosystem.config.cjs
# Contains SECRET_KEY and OAuth credentials (not stored in git)
EOF
```

**Note**: The actual ecosystem.config.cjs with secrets is stored locally at:
`C:/dev/real/backend/ecosystem.config.cjs`

### Restart PM2 After Deployment

```bash
ssh -i C:/server/firstkeypair.pem ubuntu@trendy.storydot.kr
cd /mnt/storage/real/backend
pm2 delete realcare-api
pm2 start ecosystem.config.cjs
pm2 save
```

### Register Google OAuth Redirect URI

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select the OAuth 2.0 Client ID
3. Add this to "Authorized redirect URIs":
   ```
   https://trendy.storydot.kr/real/api/v1/auth/social/google/callback
   ```
4. Save

---

## Notes

- All code comments in English only
- Follow existing code patterns in codebase
- Test each fix before moving to next
