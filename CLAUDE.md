# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RealCare is a Korean real estate care service with a React frontend and FastAPI backend:
- **Contract Care**: AI-powered contract risk analysis using Gemini API
- **Reality Check**: Financial feasibility analysis with Korean LTV/DSR regulations
- **Owner Signal**: Anonymous property selling intent registration
- **B2B Agent Platform**: Subscription-based tools for real estate professionals
- **DID/Blockchain**: Xphere blockchain integration for contract verification
- **i18n Support**: Korean (default) and English

## Tech Stack

**Frontend**: React 19 + Vite 6 + TypeScript, TanStack Router/Query/Form, Tailwind CSS v4, Recharts, jsPDF

**Backend**: FastAPI + SQLAlchemy (async) + PostgreSQL + Alembic, JWT auth with bcrypt, Pydantic v2

## Development Commands

### Frontend
```bash
npm install      # Install dependencies
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Database migrations
alembic upgrade head                    # Apply all migrations
alembic revision -m "description"       # Create new migration

# Run server
uvicorn app.main:app --reload --port 8092
```

## Environment Setup

**Frontend** `.env.local`:
```
GEMINI_API_KEY=your_key
VITE_SENTRY_DSN=optional_sentry_dsn
```

**Backend** `.env`:
```
DATABASE_URL=postgresql+asyncpg://realcare:realcare@localhost:5432/realcare
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your_key
DID_BAAS_URL=http://localhost:8091/api/v1
XPHERE_RPC_URL=https://rpc.xphere.network
```

## Architecture

### Directory Structure
```
src/                          # Frontend (React)
├── routes/                   # TanStack file-based routing
├── components/               # UI components
├── services/gemini/          # Gemini AI with RAG
├── lib/
│   ├── api/client.ts         # Backend API client
│   ├── utils/                # Calculators (dsr.ts, taxCalculator.ts)
│   ├── constants/            # Korean regulations
│   └── i18n/                 # Translations
└── types/

backend/                      # FastAPI
├── app/
│   ├── main.py               # App entry, CORS, lifespan
│   ├── core/
│   │   ├── config.py         # Pydantic Settings
│   │   ├── database.py       # Async SQLAlchemy
│   │   └── security.py       # bcrypt password hashing
│   ├── api/v1/
│   │   ├── router.py         # Route aggregator
│   │   └── endpoints/        # Route handlers
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas
│   ├── services/             # Business logic
│   └── repositories/         # Database operations
└── alembic/versions/         # Database migrations
```

### Key Patterns

**Routing**: TanStack Router with file-based routing. `routeTree.gen.ts` is auto-generated. Base path is `/real/` for subdirectory deployment.

**Frontend API Client**: `src/lib/api/client.ts` - singleton with JWT token management, auto-refresh on 401.

**Backend Dependency Injection**: FastAPI's `Depends()` for database sessions and auth. Example:
```python
@router.get("/me")
async def get_me(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.get_current_user(token)
```

**State Management**:
- TanStack Query for server state (staleTime: 5min)
- LocalStorage keys: `realcare_access_token`, `realcare_refresh_token`, `realcare_saved_analyses`, `realcare_language`

## API Endpoints

Backend runs on port 8092. API prefix: `/api/v1`

| Route | Description |
|-------|-------------|
| `/auth` | Registration, login (JWT), token refresh |
| `/reality` | LTV/DSR calculations, reports |
| `/signals` | Owner signal CRUD |
| `/contracts` | Contract management, timeline |
| `/agents` | B2B platform (registration, listings, dashboard) |
| `/blockchain` | DID creation, contract verification on Xphere |
| `/payments` | Subscriptions (FREE/BASIC/PREMIUM/ENTERPRISE) |

API docs: `/api/docs` (Swagger) or `/api/redoc`

## Korean Real Estate Domain

**LTV Limits** (`src/lib/constants/regulations.ts`):
- Speculative zones (Gangnam, Seocho, Songpa): 50% first-home, 30% 1-house, 0% 2+
- Adjusted zones (Mapo, Seongdong): 70% first-home, 60% 1-house, 30% 2+
- Non-regulated: 70% for all

**DSR Limits**: 40% standard, 60% for vulnerable groups

**Reality Score**: Composite 0-100 score based on LTV headroom, DSR utilization, cash gap, income stability.

## Path Alias

`@` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`).

## Deployment

- Frontend builds to `/real/` subdirectory
- Backend proxied via Nginx at `/real/api/` -> `localhost:8092`
- Production: `https://trendy.storydot.kr/real/`

## Development Specifications

Located in `.specs/` following GitHub Spec-Kit methodology. See `.specs/tasks.md` for implementation task list.
