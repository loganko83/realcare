# RealCare Implementation Tasks

> Consolidated task list following Spec-Kit methodology
> Updated: 2024-12-22

## Phase Overview

| Phase | Name | Tasks | Priority | Status |
|-------|------|-------|----------|--------|
| 1-4 | Foundation & MVP | 48 | Critical | DONE |
| 5-7 | Backend Platform | 35 | Critical | DONE |
| 8 | Frontend UI Completion | 32 | High | DONE |
| 9 | Testing & QA | 24 | High | TODO |
| 10 | Real Integrations | 40 | Medium-High | TODO |
| 11 | Operations & Management | 28 | Medium | TODO |
| 12 | Security & Performance | 24 | Medium | TODO |

**Total Remaining: 116 tasks**

---

## Completed Phases (1-8)

### Phase 1-4: Foundation (DONE)
- [x] TanStack Router, Query, Form setup
- [x] Reality Check calculations
- [x] Gemini RAG integration
- [x] Owner Signal basic features
- [x] Smart Move-in timeline

### Phase 5: B2B Agent Platform (DONE)
- [x] Agent model and database schema
- [x] Agent registration API
- [x] Agent dashboard API
- [x] Listings management API
- [x] Signal response tracking

### Phase 6: DID/Blockchain Integration (DONE)
- [x] DID service (mock)
- [x] Xphere blockchain service (mock)
- [x] DID creation endpoint
- [x] Contract verification endpoint

### Phase 7: Payment Integration (DONE)
- [x] Payment model and schema
- [x] Subscription plans API
- [x] Payment processing API
- [x] Subscription management API

---

### Phase 8: Frontend UI Completion (DONE)
- [x] Login page with form validation
- [x] Register page with multi-step flow
- [x] Forgot/Reset password pages
- [x] Auth context enhancement
- [x] Protected route component
- [x] Agent registration page
- [x] Agent dashboard page
- [x] Listings management page
- [x] Plans page with comparison
- [x] Checkout page
- [x] DID wallet page with credentials and contracts

---

## Phase 9: Testing & Quality

> Details: `.specs/phase-9-testing.md`

### Sprint 9.1: Backend Unit Tests
| ID | Task | Status |
|----|------|--------|
| P9-01-A | Test infrastructure setup | TODO |
| P9-01-B | Test fixtures (conftest.py) | TODO |
| P9-01-C | Authentication tests | TODO |
| P9-01-D | Reality check tests | TODO |
| P9-01-E | Agent tests | TODO |
| P9-01-F | Payment tests | TODO |

### Sprint 9.2: Frontend E2E Tests
| ID | Task | Status |
|----|------|--------|
| P9-02-A | Playwright configuration | TODO |
| P9-02-B | Authentication E2E tests | TODO |
| P9-02-C | Reality check E2E tests | TODO |
| P9-02-D | Agent dashboard E2E tests | TODO |
| P9-02-E | Payment flow E2E tests | TODO |

### Sprint 9.3: Documentation
| ID | Task | Status |
|----|------|--------|
| P9-03-A | OpenAPI schema enhancement | TODO |
| P9-03-B | API usage guide | TODO |

---

## Phase 10: Real Integrations

> Details: `.specs/phase-10-real-integrations.md`

### Sprint 10.1: DID BaaS
| ID | Task | Status |
|----|------|--------|
| P10-01-A | DID BaaS service update | TODO |
| P10-01-B | Credential types definition | TODO |
| P10-01-C | DID wallet frontend | TODO |

### Sprint 10.2: Xphere Blockchain
| ID | Task | Status |
|----|------|--------|
| P10-02-A | Xphere RPC integration | TODO |
| P10-02-B | Contract hash storage | TODO |

### Sprint 10.3: Toss Payments
| ID | Task | Status |
|----|------|--------|
| P10-03-A | Toss Payments service | TODO |
| P10-03-B | Payment webhook handler | TODO |
| P10-03-C | Frontend payment widget | TODO |

### Sprint 10.4: Social Login
| ID | Task | Status |
|----|------|--------|
| P10-04-A | OAuth service (Kakao, Naver, Google) | TODO |
| P10-04-B | OAuth endpoints | TODO |
| P10-04-C | Social login buttons | TODO |

### Sprint 10.5: Naver Maps & Real Estate
| ID | Task | Status |
|----|------|--------|
| P10-05-A | Naver Maps SDK setup | TODO |
| P10-05-B | Property map component | TODO |
| P10-05-C | Naver Real Estate integration | TODO |

---

## Phase 11: Operations & Management

> Details: `.specs/phase-11-operations.md`

### Sprint 11.1: Admin Dashboard
| ID | Task | Status |
|----|------|--------|
| P11-01-A | Admin authentication | TODO |
| P11-01-B | Admin dashboard frontend | TODO |
| P11-01-C | User management | TODO |
| P11-01-D | Agent verification | TODO |

### Sprint 11.2: Email Notifications
| ID | Task | Status |
|----|------|--------|
| P11-02-A | Email service setup | TODO |
| P11-02-B | Email templates | TODO |
| P11-02-C | Email triggers | TODO |

### Sprint 11.3: Push Notifications
| ID | Task | Status |
|----|------|--------|
| P11-03-A | Web push setup | TODO |
| P11-03-B | Frontend push integration | TODO |

### Sprint 11.4: File Upload
| ID | Task | Status |
|----|------|--------|
| P11-04-A | File upload service | TODO |
| P11-04-B | Upload endpoints | TODO |
| P11-04-C | Frontend upload component | TODO |

### Sprint 11.5: Analytics
| ID | Task | Status |
|----|------|--------|
| P11-05-A | Event tracking service | TODO |

---

## Phase 12: Security & Performance

> Details: `.specs/phase-12-security-performance.md`

### Sprint 12.1: Redis Caching
| ID | Task | Status |
|----|------|--------|
| P12-01-A | Cache service | TODO |
| P12-01-B | Cache integration | TODO |

### Sprint 12.2: Rate Limiting
| ID | Task | Status |
|----|------|--------|
| P12-02-A | Rate limiter middleware | TODO |

### Sprint 12.3: Security
| ID | Task | Status |
|----|------|--------|
| P12-03-A | Request validation | TODO |
| P12-03-B | Security headers | TODO |

### Sprint 12.4: Database Performance
| ID | Task | Status |
|----|------|--------|
| P12-04-A | Query optimization | TODO |
| P12-04-B | Database indexes | TODO |

### Sprint 12.5: Frontend Performance
| ID | Task | Status |
|----|------|--------|
| P12-05-A | Bundle optimization | TODO |
| P12-05-B | Lazy loading | TODO |
| P12-05-C | Image optimization | TODO |

### Sprint 12.6: Monitoring
| ID | Task | Status |
|----|------|--------|
| P12-06-A | Structured logging | TODO |
| P12-06-B | Health checks | TODO |
| P12-06-C | Nginx configuration | TODO |

---

## External Service Configuration

### Required API Keys

```bash
# DID BaaS (Local)
DID_BAAS_URL=http://localhost:8091/api/v1

# Xphere Blockchain
XPHERE_RPC_URL=https://en-bkk.x-phere.com
XPHERE_CHAIN_ID=20250217

# Toss Payments
TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

# Social OAuth
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Naver Maps
NAVER_MAP_CLIENT_ID=...
```

---

## Implementation Priority

### Immediate (Sprint 1-2)
1. **P8-01**: Login/Register UI - Users need to authenticate
2. **P8-01-E**: Protected routes - Security baseline

### Short-term (Sprint 3-4)
3. **P8-02**: Agent dashboard - B2B value proposition
4. **P8-03**: Payment UI - Revenue enablement
5. **P10-03**: Toss Payments - Real payments

### Medium-term (Sprint 5-8)
6. **P10-04**: Social login - User acquisition
7. **P10-05**: Naver Maps - Property visualization
8. **P9**: Testing - Quality assurance
9. **P10-01/02**: DID/Blockchain real integration

### Long-term (Sprint 9-12)
10. **P11**: Operations features
11. **P12**: Security & Performance

---

## Definition of Done

For each task:
- [ ] Code implemented and tested
- [ ] TypeScript types defined
- [ ] No console errors
- [ ] Mobile responsive (Tailwind)
- [ ] i18n support (Korean/English)
- [ ] Code reviewed

---

## Notes

- All code comments in English only
- Korean text only in user-facing strings
- Backend runs on port 8092
- DID BaaS runs on port 8091
- Frontend builds to `/real/` subdirectory
