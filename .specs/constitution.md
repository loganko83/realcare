# RealCare Project Constitution

> Spec-Driven Development Constitution for RealCare - Real Estate Care Platform
> Updated: 2024-12-22 (v2.0)

## Project Identity

| Attribute | Value |
|-----------|-------|
| **Name** | RealCare |
| **Version** | 2.0.0 |
| **Type** | PropTech SaaS Platform (B2B/B2C) |
| **Primary Language** | TypeScript (Frontend), Python (Backend) |
| **Target Users** | Korean real estate buyers, sellers, renters, and licensed agents |

## Core Principles

### 1. User-Centric Design
- Every feature must solve a real pain point in the Korean real estate market
- Prioritize clarity over complexity in financial calculations
- All Korean regulatory logic (LTV, DSR, taxes) must be accurate and up-to-date

### 2. Technical Excellence
- Type-safe development with TypeScript strict mode
- Server state management via TanStack Query
- Client routing via TanStack Router
- Form handling via TanStack Form
- All code comments and variable names in English only

### 3. AI-First Architecture
- Gemini AI for contract analysis and financial advice
- RAG (Retrieval Augmented Generation) via Gemini File Search API
- Knowledge base includes Korean real estate regulations, standard contracts, legal precedents

### 4. Blockchain-First Trust
- DID (Decentralized Identity) for user verification
- Verifiable Credentials for trust scoring
- Xphere blockchain for immutable contract stamping
- Zero-Knowledge Proofs for privacy-preserving verification

### 5. Data Security
- No hardcoded API keys (environment variables only)
- User financial data encrypted at rest
- Contract documents stored securely with access control
- DID-based identity for sensitive operations

## Technology Stack

### Frontend
```yaml
Framework: React 19 + Vite 6
Language: TypeScript 5.8
State: TanStack Query v5
Routing: TanStack Router v1 (file-based)
Forms: TanStack Form + Zod
Styling: Tailwind CSS v4
Charts: Recharts (lazy-loaded)
Icons: lucide-react
AI: @google/generative-ai (Gemini)
PDF: jsPDF + html2canvas (lazy-loaded)
Maps: Naver Maps SDK
Error Tracking: Sentry
```

### Backend
```yaml
Runtime: FastAPI (Python 3.11+)
Database: PostgreSQL 15 + SQLAlchemy async + asyncpg
Migrations: Alembic
Cache: Redis 7
Auth: JWT (python-jose) + bcrypt
Validation: Pydantic v2
HTTP Client: httpx (async)
Logging: structlog
```

### External Services
```yaml
# AI Service
AI Provider: Google Gemini 2.5 Flash
RAG: Gemini File Search API

# Blockchain & Identity
Blockchain: Xphere (EVM Layer1)
  Chain ID: 20250217
  RPC URL: https://en-bkk.x-phere.com
DID Service: DID BaaS
  Server Path: /mnt/storage/did_baas
  Local Port: 8091
  Standards: W3C DID Core 1.0, W3C VC Data Model 1.1

# Payment Gateway
Payment: Toss Payments
  API Version: 2022-11-16
  Docs: https://docs.tosspayments.com

# Social Login
OAuth Providers:
  - Kakao (kakao.com)
  - Naver (naver.com)
  - Google (google.com)

# Maps & Real Estate Data
Maps: Naver Maps API
Real Estate Data: Naver Real Estate (land.naver.com)
```

## Development Standards

### Code Style
- ESLint + Prettier for formatting
- No Korean text in code (comments, variables, strings)
- No emojis in code
- Consistent file naming: PascalCase for components, camelCase for utilities

### Git Workflow
- Feature branches from `master`
- Conventional commits (feat:, fix:, docs:, refactor:)
- PR reviews required for `master`

### Testing Strategy
- Backend: pytest + httpx for API tests
- Frontend: Playwright for E2E tests
- Coverage target: >80% for critical paths

## Architecture Decisions

### ADR-001: TanStack over Redux/Zustand
**Decision**: Use TanStack Query for server state instead of Redux or Zustand
**Rationale**: Most state is server-derived, built-in caching and background refetching

### ADR-002: Gemini File Search for RAG
**Decision**: Use Gemini File Search API instead of Pinecone/Chroma
**Rationale**: Already using Gemini for AI, managed service with no infrastructure overhead

### ADR-003: FastAPI Backend
**Decision**: Use FastAPI with async SQLAlchemy
**Rationale**: High performance, automatic OpenAPI docs, excellent async support

### ADR-004: Xphere for Blockchain
**Decision**: Use Xphere EVM chain instead of Polygon/Ethereum
**Rationale**: Lower gas costs, Korean ecosystem support, EVM compatibility

### ADR-005: DID BaaS for Identity
**Decision**: Use DID BaaS service at /mnt/storage/did_baas
**Rationale**: W3C standards compliance, ZKP support, BBS+ signatures

### ADR-006: Toss Payments for PG
**Decision**: Use Toss Payments instead of Inicis/KCP
**Rationale**: Modern API, better developer experience, widespread adoption in Korea

### ADR-007: Naver Maps over Kakao Maps
**Decision**: Use Naver Maps with Naver Real Estate integration
**Rationale**: Better real estate data integration, comprehensive property information

## Feature Prioritization (MoSCoW)

### Must Have (MVP - Completed)
- [x] Reality Check calculator with accurate LTV/DSR
- [x] Contract risk analysis with Gemini AI
- [x] Tax calculator (acquisition, transfer, holding)
- [x] User authentication (JWT)
- [x] Backend API with PostgreSQL

### Should Have (Phase 8-10)
- [ ] Login/Register UI components
- [ ] Social login (Kakao, Naver, Google)
- [ ] B2B Agent dashboard UI
- [ ] Subscription payment UI
- [ ] DID wallet UI
- [ ] Naver Maps integration
- [ ] Toss Payments integration
- [ ] Real blockchain transactions

### Could Have (Phase 11-12)
- [ ] Admin dashboard
- [ ] Email/Push notifications
- [ ] File upload for contracts
- [ ] Advanced analytics
- [ ] Rate limiting
- [ ] Redis caching

### Won't Have (v2.0)
- Mobile app (React Native)
- Multi-language beyond Korean/English
- International market support

## Success Metrics

| Metric | Target |
|--------|--------|
| API Response Time | <200ms p95 |
| Error Rate | <0.1% |
| Reality Score accuracy | >95% vs manual |
| User Registration | >100/week |
| Agent Conversion | >5% trial to paid |
| Contract Stamps | >50/month |

## Versioning

This constitution follows semantic versioning. Major changes require team review.

- **1.0.0** (2024-12-20): Initial constitution
- **2.0.0** (2024-12-22): Added backend, blockchain, payment integrations
