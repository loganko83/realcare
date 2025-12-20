# RealCare Project Constitution

> Spec-Driven Development Constitution for RealCare - Real Estate Care Platform

## Project Identity

| Attribute | Value |
|-----------|-------|
| **Name** | RealCare |
| **Version** | 1.0.0 |
| **Type** | PropTech SaaS Platform |
| **Primary Language** | TypeScript |
| **Target Users** | Korean real estate buyers, sellers, renters, and agents |

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

### 4. Data Security
- No hardcoded API keys (environment variables only)
- User financial data encrypted at rest
- Contract documents stored securely with access control

## Technology Stack

### Frontend (Current)
```yaml
Framework: React 19 + Vite 6
Language: TypeScript 5.8
Styling: Tailwind CSS (CDN)
Charts: Recharts
Icons: lucide-react
AI: @google/genai (Gemini)
PDF: jsPDF + html2canvas
```

### Frontend (Target)
```yaml
State Management: TanStack Query v5
Routing: TanStack Router v1
Forms: TanStack Form v0
Validation: Zod
HTTP Client: ky or fetch with wrapper
```

### AI/RAG
```yaml
LLM: Gemini 2.5 Flash
RAG: Gemini File Search API
Knowledge Store: FileSearchStore for regulations and contracts
```

### Backend (Planned)
```yaml
Runtime: Node.js or FastAPI (Python)
Database: PostgreSQL
Cache: Redis
Auth: JWT
```

## Development Standards

### Code Style
- ESLint + Prettier for formatting
- No Korean text in code (comments, variables, strings)
- No emojis in code
- Consistent file naming: PascalCase for components, camelCase for utilities

### Git Workflow
- Feature branches from `main`
- Conventional commits (feat:, fix:, docs:, refactor:)
- PR reviews required for `main`

### Testing Strategy
- Unit tests for calculation logic
- Integration tests for API calls
- E2E tests for critical user flows

## Architecture Decisions

### ADR-001: TanStack over Redux/Zustand
**Decision**: Use TanStack Query for server state instead of Redux or Zustand
**Rationale**:
- Most state is server-derived (regulations, calculations, analyses)
- Built-in caching, deduplication, background refetching
- Reduces boilerplate significantly

### ADR-002: Gemini File Search for RAG
**Decision**: Use Gemini File Search API instead of Pinecone/Chroma
**Rationale**:
- Already using Gemini for AI features
- Managed service, no infrastructure overhead
- Automatic chunking and embedding

### ADR-003: Client-Side First
**Decision**: Start with client-side application, add backend incrementally
**Rationale**:
- Faster iteration on UI/UX
- Core calculations can run client-side
- Backend added for persistence, auth, and sensitive operations

## Feature Prioritization (MoSCoW)

### Must Have (MVP)
- Reality Check calculator with accurate LTV/DSR
- Contract risk analysis with Gemini AI
- Tax calculator (acquisition, transfer, holding)
- Basic user data persistence (localStorage initially)

### Should Have
- User authentication
- Server-side data persistence
- RAG with Korean regulations knowledge base
- Push notifications for contract deadlines

### Could Have
- Owner Signal system
- Smart Move-in timeline
- Agent dashboard
- Mobile app (React Native)

### Won't Have (v1.0)
- Blockchain notarization
- Payment processing
- Real-time property data integration

## Success Metrics

| Metric | Target |
|--------|--------|
| Reality Score calculation accuracy | >95% vs manual calculation |
| Contract analysis response time | <5 seconds |
| User task completion rate | >80% |
| Mobile Lighthouse score | >90 |

## Versioning

This constitution follows semantic versioning. Major changes require team review.

- **1.0.0** (2024-12-20): Initial constitution
