# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RealCare is a Korean real estate care service application that helps users with property transactions. It provides:
- **Contract Care**: AI-powered contract risk analysis using Gemini API
- **Financial Calculators**: Loan limits (LTV/DSR), tax calculations (acquisition/transfer), affordability checks
- **Subscription Info**: Real estate subscription/presale listings with favorites
- **Contract Management**: User contract history tracking with expiration alerts

## Tech Stack

- **Framework**: React 19 + Vite 6 + TypeScript
- **AI**: Google Gemini API (`@google/genai`)
- **Charts**: Recharts
- **PDF Export**: jsPDF + html2canvas
- **Icons**: lucide-react
- **Styling**: Tailwind CSS (via CDN in index.html)

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run preview  # Preview production build
```

## Environment Setup

Create `.env.local` with:
```
GEMINI_API_KEY=your_api_key_here
```

The API key is exposed to the client via Vite's `define` config as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

## Architecture

### File Structure
```
/                       # Root directory (no src/ folder)
├── App.tsx            # Main app with tab navigation state
├── index.tsx          # React entry point
├── components/
│   └── Navigation.tsx # Bottom tab navigation
├── pages/
│   ├── Home.tsx       # Dashboard with user state cards
│   ├── Contract.tsx   # AI contract analysis (main feature)
│   ├── Calculators.tsx # Financial calculators (3 tabs)
│   ├── Subscription.tsx # Presale listings
│   └── Settings.tsx   # User profile & contract history
└── services/
    └── geminiService.ts # Gemini API integration
```

### State Management
- No external state library; uses React `useState` throughout
- Local storage for persistence: `realcare_saved_analyses`, `realcare_my_contracts`, `realcare_favorites`

### Navigation Pattern
Tab-based SPA with 5 tabs: Home, Calculators (calc), Subscription, Contract, Settings. Navigation state managed in `App.tsx` via `currentTab` state.

## Key Implementation Details

### Gemini AI Integration (`services/geminiService.ts`)
- `analyzeContract(text, fileBase64?, mimeType?)`: Analyzes contract text/images, returns structured JSON with risks
- `getFinancialAdvice(income, cash, price)`: Provides financial feasibility advice
- Uses `gemini-2.5-flash` model with structured JSON responses via `responseSchema`

### Contract Analysis (`pages/Contract.tsx`)
- Supports image upload (camera/gallery) and PDF
- Converts files to base64 for Gemini multimodal analysis
- Saves analysis results to localStorage
- PDF export via html2canvas + jsPDF
- Share functionality with Web Share API fallback to clipboard

### Financial Calculators (`pages/Calculators.tsx`)
Three sub-calculators:
1. **Financial Check**: Affordability score with AI advice
2. **Tax Calculator**: Acquisition tax (by house count), transfer tax (by holding period)
3. **Loan Calculator**: LTV/DSR limit calculation with pie chart visualization

### Korean-specific Business Logic
- LTV limit: 70%
- DSR limit: 40%
- Acquisition tax rates vary by house count (1/2/3+)
- Transfer tax with long-term holding deductions
- Contract expiration alerts at 90/60 days (Korean lease law)

## Path Alias

`@` is aliased to the project root (configured in `vite.config.ts`).

## Development Specifications (Spec-Kit)

Located in `.specs/` directory following [GitHub Spec-Kit](https://github.com/github/spec-kit) methodology:

- `.specs/constitution.md`: Project principles and governance
- `.specs/phase-1-infrastructure.md`: TanStack integration (Query, Router, Form)
- `.specs/phase-2-reality-check.md`: Financial simulation engine with Korean regulations
- `.specs/phase-3-gemini-rag.md`: Gemini File Search API (RAG) integration
- `.specs/phase-4-features.md`: Owner Signal and Smart Move-in systems
- `.specs/tasks.md`: Consolidated implementation task list

### Target Tech Stack (Post-Migration)
- **State Management**: TanStack Query v5
- **Routing**: TanStack Router v1
- **Forms**: TanStack Form + Zod validation
- **AI/RAG**: Gemini File Search API for knowledge-augmented responses

## Related Specifications

- `RealCare_Development_Specification.md`: Full product requirements, system architecture, API design
- `SafeCon_Development_Specification.md`: Related legal contract service specification (blockchain notarization, DID)
