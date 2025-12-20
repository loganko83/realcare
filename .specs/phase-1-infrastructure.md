# Phase 1: Infrastructure & TanStack Integration

> Modernize the codebase with TanStack ecosystem and establish proper project structure

## Current State Analysis

### Implemented Features
| Feature | Status | Location |
|---------|--------|----------|
| Basic navigation (5 tabs) | Done | `App.tsx`, `components/Navigation.tsx` |
| Contract AI analysis | Done | `pages/Contract.tsx`, `services/geminiService.ts` |
| Financial calculators | Done | `pages/Calculators.tsx` |
| Subscription listings | Done | `pages/Subscription.tsx` |
| Contract history | Done | `pages/Settings.tsx` |
| Home dashboard | Done | `pages/Home.tsx` |

### Current Architecture Issues
1. **No proper state management** - Uses `useState` throughout
2. **No routing** - Tab-based SPA with manual switch/case
3. **No form validation** - Direct DOM input handling
4. **No data fetching layer** - Direct API calls in components
5. **No proper project structure** - Flat file organization
6. **LocalStorage only** - No server persistence

## Target Architecture

### Directory Structure
```
C:\dev\real\
├── .specs/                    # Spec-kit specifications
│   ├── constitution.md
│   ├── phase-1-infrastructure.md
│   ├── phase-2-reality-check.md
│   ├── phase-3-rag.md
│   └── phase-4-features.md
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Root component
│   ├── router.tsx             # TanStack Router config
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Layout components
│   │   └── features/          # Feature-specific components
│   ├── routes/
│   │   ├── __root.tsx         # Root layout
│   │   ├── index.tsx          # Home page
│   │   ├── calculators/
│   │   ├── contract/
│   │   ├── subscription/
│   │   └── settings/
│   ├── lib/
│   │   ├── api/               # API client and endpoints
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Utility functions
│   │   └── constants/         # Constants and enums
│   ├── services/
│   │   └── gemini/            # Gemini AI services
│   ├── stores/                # TanStack Query stores
│   └── types/                 # TypeScript types
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── CLAUDE.md
```

## Specification: TanStack Query Integration

### User Stories

**US-1.1**: As a developer, I want cached API responses so that repeated data fetches are instant.

**US-1.2**: As a user, I want to see loading states during data fetching so that I know the app is working.

**US-1.3**: As a user, I want stale data to refresh automatically so that I always see current information.

### Technical Requirements

#### TR-1.1: Query Client Setup
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

#### TR-1.2: Query Hooks Pattern
```typescript
// src/lib/hooks/useContractAnalysis.ts
import { useMutation } from '@tanstack/react-query';
import { analyzeContract } from '@/services/gemini';

export function useContractAnalysis() {
  return useMutation({
    mutationFn: ({ text, fileBase64, mimeType }: AnalysisInput) =>
      analyzeContract(text, fileBase64, mimeType),
    onError: (error) => {
      console.error('Contract analysis failed:', error);
    },
  });
}
```

#### TR-1.3: Saved Analyses Query
```typescript
// src/lib/hooks/useSavedAnalyses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'realcare_saved_analyses';

export function useSavedAnalyses() {
  return useQuery({
    queryKey: ['savedAnalyses'],
    queryFn: () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });
}

export function useSaveAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysis: AnalysisRecord) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(analysis);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return list;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedAnalyses'] });
    },
  });
}
```

## Specification: TanStack Router Integration

### User Stories

**US-2.1**: As a user, I want to navigate using browser back/forward buttons so that navigation feels native.

**US-2.2**: As a user, I want to share URLs that link to specific pages so that I can share content.

**US-2.3**: As a developer, I want type-safe routing so that route errors are caught at compile time.

### Technical Requirements

#### TR-2.1: Router Configuration
```typescript
// src/router.tsx
import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { RootLayout } from '@/components/layout/RootLayout';
import { HomePage } from '@/routes/index';
import { CalculatorsPage } from '@/routes/calculators';
import { ContractPage } from '@/routes/contract';
import { SubscriptionPage } from '@/routes/subscription';
import { SettingsPage } from '@/routes/settings';

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const calculatorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calculators',
  component: CalculatorsPage,
});

const contractRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contract',
  component: ContractPage,
});

const subscriptionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/subscription',
  component: SubscriptionPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  calculatorsRoute,
  contractRoute,
  subscriptionRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

#### TR-2.2: Route Search Params (Calculator Tab)
```typescript
// src/routes/calculators.tsx
import { createRoute } from '@tanstack/react-router';
import { z } from 'zod';

const calculatorSearchSchema = z.object({
  tab: z.enum(['check', 'tax', 'loan']).optional().default('check'),
});

export const calculatorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calculators',
  validateSearch: calculatorSearchSchema,
  component: CalculatorsPage,
});

// In component:
const { tab } = Route.useSearch();
```

## Specification: TanStack Form Integration

### User Stories

**US-3.1**: As a user, I want form validation feedback so that I know what inputs are incorrect.

**US-3.2**: As a developer, I want type-safe form handling so that form errors are caught at compile time.

### Technical Requirements

#### TR-3.1: Financial Check Form
```typescript
// src/components/features/FinancialCheckForm.tsx
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';

const financialSchema = z.object({
  income: z.number().min(0).max(10000),
  cash: z.number().min(0).max(100000),
  price: z.number().min(100).max(100000),
});

export function FinancialCheckForm({ onSubmit }: Props) {
  const form = useForm({
    defaultValues: {
      income: 60,
      cash: 200,
      price: 800,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
    validatorAdapter: zodValidator(),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="income" validators={{ onChange: financialSchema.shape.income }}>
        {(field) => (
          <div>
            <label>Annual Income (M KRW)</label>
            <input
              type="range"
              min="20"
              max="200"
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
            {field.state.meta.errors && <span>{field.state.meta.errors}</span>}
          </div>
        )}
      </form.Field>
      {/* ... other fields */}
    </form>
  );
}
```

## Implementation Tasks

### Task 1.1: Install Dependencies
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install @tanstack/react-router @tanstack/router-devtools
npm install @tanstack/react-form @tanstack/zod-form-adapter
npm install zod
```

### Task 1.2: Restructure Project Directory
- Create `src/` directory
- Move existing files into proper structure
- Update import paths with `@/` alias

### Task 1.3: Setup Query Provider
- Create `src/lib/queryClient.ts`
- Wrap app with `QueryClientProvider`
- Add React Query DevTools (dev only)

### Task 1.4: Setup Router
- Create `src/router.tsx`
- Create route components in `src/routes/`
- Replace tab-based navigation with router links

### Task 1.5: Migrate State to Query
- Convert `useSavedAnalyses` to TanStack Query
- Convert `useContracts` to TanStack Query
- Convert `useFavorites` to TanStack Query

### Task 1.6: Migrate Forms
- Convert Financial Check form to TanStack Form
- Convert Contract Registration form to TanStack Form
- Add Zod validation schemas

## Acceptance Criteria

- [ ] Project follows new directory structure
- [ ] All routes are URL-addressable
- [ ] Browser back/forward navigation works
- [ ] Forms show validation errors
- [ ] React Query DevTools visible in development
- [ ] No TypeScript errors
- [ ] All existing features still work
