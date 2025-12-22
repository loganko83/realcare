# Phase 8: Frontend UI Completion

> Spec-Kit Methodology v2.0
> Priority: HIGH
> Dependencies: Phase 2-7 (Backend Complete)
> Estimated Tasks: 32

---

## Overview

This phase completes the frontend UI components for features that have backend APIs but no user interface. The focus is on authentication flows, B2B agent features, payment/subscription, and DID wallet management.

## Prerequisites

- [x] Backend API running on port 8092
- [x] JWT authentication endpoints working
- [x] Agent, Payment, Blockchain endpoints available
- [x] TanStack Router file-based routing configured

---

## P8-01: Authentication UI

### P8-01-A: Login Page

**Route**: `/login`
**File**: `src/routes/login.tsx`

```typescript
// Component structure
interface LoginPageProps {}

// Features:
// 1. Email/Password form
// 2. Social login buttons (Kakao, Naver, Google)
// 3. Remember me checkbox
// 4. Forgot password link
// 5. Register link
// 6. Error handling with toast notifications
```

**UI Components**:
- `LoginForm`: TanStack Form with Zod validation
- `SocialLoginButtons`: OAuth provider buttons
- `PasswordInput`: Toggle visibility component

**Validation Schema**:
```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});
```

**API Integration**:
```typescript
// Using existing apiClient
const login = useMutation({
  mutationFn: (data: LoginData) => authApi.login(data.email, data.password),
  onSuccess: (tokens) => {
    apiClient.setTokens(tokens);
    navigate({ to: '/' });
  },
});
```

**Tasks**:
- [ ] P8-01-A-1: Create login route file
- [ ] P8-01-A-2: Implement LoginForm component
- [ ] P8-01-A-3: Add form validation with Zod
- [ ] P8-01-A-4: Integrate with authApi.login
- [ ] P8-01-A-5: Add error handling and loading states
- [ ] P8-01-A-6: Style with Tailwind (mobile-first)

---

### P8-01-B: Register Page

**Route**: `/register`
**File**: `src/routes/register.tsx`

```typescript
// Component structure
interface RegisterPageProps {}

// Features:
// 1. Multi-step registration form
// 2. Email, password, name, phone fields
// 3. Terms agreement checkboxes
// 4. Phone verification (optional)
// 5. Social signup options
```

**Validation Schema**:
```typescript
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  passwordConfirm: z.string(),
  name: z.string().min(2).max(50),
  phone: z.string().regex(/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/).optional(),
  agreeTerms: z.boolean().refine(v => v === true),
  agreePrivacy: z.boolean().refine(v => v === true),
  agreeMarketing: z.boolean().optional(),
}).refine(data => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
});
```

**Tasks**:
- [ ] P8-01-B-1: Create register route file
- [ ] P8-01-B-2: Implement RegisterForm component
- [ ] P8-01-B-3: Add password strength indicator
- [ ] P8-01-B-4: Add terms agreement checkboxes
- [ ] P8-01-B-5: Integrate with authApi.register
- [ ] P8-01-B-6: Add success redirect to login

---

### P8-01-C: Forgot Password Flow

**Routes**: `/forgot-password`, `/reset-password`

**Tasks**:
- [ ] P8-01-C-1: Create forgot password page
- [ ] P8-01-C-2: Email input with validation
- [ ] P8-01-C-3: Create reset password page
- [ ] P8-01-C-4: New password form with token validation

---

### P8-01-D: Auth Context Enhancement

**File**: `src/lib/contexts/AuthContext.tsx`

```typescript
// Enhanced AuthContext
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithSocial: (provider: 'kakao' | 'naver' | 'google') => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

**Tasks**:
- [ ] P8-01-D-1: Add social login methods
- [ ] P8-01-D-2: Add user state persistence
- [ ] P8-01-D-3: Add token refresh on app load
- [ ] P8-01-D-4: Create useRequireAuth hook

---

### P8-01-E: Protected Routes

**File**: `src/components/auth/ProtectedRoute.tsx`

```typescript
// Wrap routes that require authentication
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate({ to: '/login', search: { redirect: window.location.pathname } });
    return null;
  }

  return <>{children}</>;
}
```

**Tasks**:
- [ ] P8-01-E-1: Create ProtectedRoute component
- [ ] P8-01-E-2: Add redirect after login
- [ ] P8-01-E-3: Apply to protected routes

---

## P8-02: Agent Dashboard UI

### P8-02-A: Agent Registration Page

**Route**: `/agent/register`
**File**: `src/routes/agent/register.tsx`

```typescript
// Multi-step agent registration
// Step 1: Business information
// Step 2: License verification
// Step 3: Region selection
// Step 4: Plan selection
```

**Form Schema**:
```typescript
const agentRegisterSchema = z.object({
  // Step 1
  companyName: z.string().min(2),
  representative: z.string().min(2),
  businessNumber: z.string().regex(/^\d{3}-\d{2}-\d{5}$/),
  address: z.string().min(10),

  // Step 2
  licenseNumber: z.string(),
  licenseImage: z.any(), // File upload

  // Step 3
  regions: z.array(z.string()).min(1, 'Select at least one region'),
  specialties: z.array(z.string()).optional(),

  // Step 4
  initialPlan: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']),
});
```

**Tasks**:
- [ ] P8-02-A-1: Create agent registration route
- [ ] P8-02-A-2: Implement multi-step form wizard
- [ ] P8-02-A-3: Create region selector with map preview
- [ ] P8-02-A-4: Add license upload component
- [ ] P8-02-A-5: Integrate with agentsApi

---

### P8-02-B: Agent Dashboard Page

**Route**: `/agent/dashboard`
**File**: `src/routes/agent/dashboard.tsx`

```typescript
// Dashboard sections
interface AgentDashboardProps {}

// Components:
// 1. StatsOverview: Monthly stats cards
// 2. RecentSignals: Latest matching signals
// 3. PendingResponses: Signals awaiting response
// 4. SubscriptionStatus: Current plan and limits
// 5. QuickActions: Common actions
```

**API Hooks**:
```typescript
// src/lib/hooks/useAgentDashboard.ts
export function useAgentDashboard() {
  const dashboardQuery = useQuery({
    queryKey: ['agent', 'dashboard'],
    queryFn: () => apiClient.get('/agents/dashboard'),
  });

  const signalsQuery = useQuery({
    queryKey: ['agent', 'signals', 'available'],
    queryFn: () => apiClient.get('/agents/signals/available'),
  });

  return { dashboard: dashboardQuery, signals: signalsQuery };
}
```

**Tasks**:
- [ ] P8-02-B-1: Create dashboard route
- [ ] P8-02-B-2: Implement StatsOverview component
- [ ] P8-02-B-3: Create RecentSignals list
- [ ] P8-02-B-4: Add SubscriptionStatus card
- [ ] P8-02-B-5: Create QuickActions buttons
- [ ] P8-02-B-6: Add responsive grid layout

---

### P8-02-C: Agent Listings Management

**Route**: `/agent/listings`
**File**: `src/routes/agent/listings.tsx`

```typescript
// Features:
// 1. List agent's property listings
// 2. Create new listing
// 3. Edit existing listing
// 4. Toggle listing visibility
// 5. View listing analytics
```

**Tasks**:
- [ ] P8-02-C-1: Create listings list page
- [ ] P8-02-C-2: Create listing form (create/edit)
- [ ] P8-02-C-3: Add listing status toggle
- [ ] P8-02-C-4: Create listing analytics view

---

### P8-02-D: Signal Response Management

**Route**: `/agent/responses`
**File**: `src/routes/agent/responses.tsx`

```typescript
// Features:
// 1. View available owner signals
// 2. Submit response to signal
// 3. Track response status
// 4. Communication history
```

**Tasks**:
- [ ] P8-02-D-1: Create signal browser with filters
- [ ] P8-02-D-2: Implement response submission form
- [ ] P8-02-D-3: Add response status tracking
- [ ] P8-02-D-4: Create response history list

---

## P8-03: Subscription & Payment UI

### P8-03-A: Plans Page

**Route**: `/subscription`
**File**: `src/routes/subscription.tsx` (update existing)

```typescript
// Features:
// 1. Display all subscription plans
// 2. Feature comparison table
// 3. Current plan highlight
// 4. Upgrade/downgrade buttons
// 5. Billing cycle toggle (monthly/yearly)
```

**Component Structure**:
```typescript
// src/components/subscription/PlanCard.tsx
interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  billingCycle: 'monthly' | 'yearly';
  onSelect: () => void;
}

// src/components/subscription/FeatureComparison.tsx
interface FeatureComparisonProps {
  plans: SubscriptionPlan[];
}
```

**Tasks**:
- [ ] P8-03-A-1: Create PlanCard component
- [ ] P8-03-A-2: Create FeatureComparison table
- [ ] P8-03-A-3: Add billing cycle toggle
- [ ] P8-03-A-4: Highlight current plan for logged-in users
- [ ] P8-03-A-5: Add CTA buttons for each plan

---

### P8-03-B: Checkout Page

**Route**: `/checkout`
**File**: `src/routes/checkout.tsx`

```typescript
// Features:
// 1. Order summary
// 2. Payment method selection (placeholder for Toss)
// 3. Billing information form
// 4. Terms agreement
// 5. Payment confirmation
```

**Tasks**:
- [ ] P8-03-B-1: Create checkout route
- [ ] P8-03-B-2: Implement order summary component
- [ ] P8-03-B-3: Add payment method selector
- [ ] P8-03-B-4: Create billing form
- [ ] P8-03-B-5: Add payment processing UI (loading, success, error)

---

### P8-03-C: Payment History

**Route**: `/payments`
**File**: `src/routes/payments.tsx`

```typescript
// Features:
// 1. List all payments
// 2. Payment status badges
// 3. Invoice download
// 4. Refund request
```

**Tasks**:
- [ ] P8-03-C-1: Create payment history page
- [ ] P8-03-C-2: Implement payment list with pagination
- [ ] P8-03-C-3: Add status filters
- [ ] P8-03-C-4: Create payment detail modal

---

### P8-03-D: Subscription Management

**Route**: `/settings/subscription`
**File**: `src/routes/settings/subscription.tsx`

```typescript
// Features:
// 1. Current subscription details
// 2. Next billing date
// 3. Cancel subscription option
// 4. Auto-renew toggle
// 5. Payment method update
```

**Tasks**:
- [ ] P8-03-D-1: Create subscription settings page
- [ ] P8-03-D-2: Implement cancellation flow with confirmation
- [ ] P8-03-D-3: Add auto-renew toggle
- [ ] P8-03-D-4: Create upgrade prompt component

---

## P8-04: DID Wallet UI

### P8-04-A: DID Wallet Page

**Route**: `/wallet`
**File**: `src/routes/wallet.tsx`

```typescript
// Features:
// 1. DID address display
// 2. Create DID button (if not exists)
// 3. Wallet balance (XPH tokens)
// 4. Verifiable Credentials list
// 5. Contract verification badges
```

**Component Structure**:
```typescript
// src/components/wallet/DIDCard.tsx
interface DIDCardProps {
  didId: string;
  walletAddress: string;
  createdAt: string;
}

// src/components/wallet/CredentialCard.tsx
interface CredentialCardProps {
  credential: VerifiableCredential;
  onVerify: () => void;
}

// src/components/wallet/BalanceCard.tsx
interface BalanceCardProps {
  balance: {
    wei: string;
    xph: number;
  };
}
```

**Tasks**:
- [ ] P8-04-A-1: Create wallet route
- [ ] P8-04-A-2: Implement DIDCard with copy address
- [ ] P8-04-A-3: Create CredentialCard component
- [ ] P8-04-A-4: Add BalanceCard component
- [ ] P8-04-A-5: Create "Create DID" flow

---

### P8-04-B: DID Creation Flow

**Component**: `src/components/wallet/CreateDIDModal.tsx`

```typescript
// Steps:
// 1. Explain what DID is
// 2. Confirm creation
// 3. Processing animation
// 4. Success with DID display
```

**Tasks**:
- [ ] P8-04-B-1: Create modal component
- [ ] P8-04-B-2: Add explanation content
- [ ] P8-04-B-3: Implement creation API call
- [ ] P8-04-B-4: Add success animation

---

### P8-04-C: Contract Verification UI

**Component**: `src/components/contract/BlockchainBadge.tsx`

```typescript
// Features:
// 1. Verification status badge
// 2. View on blockchain link
// 3. Verify contract button
// 4. Verification certificate modal
```

**Tasks**:
- [ ] P8-04-C-1: Create BlockchainBadge component
- [ ] P8-04-C-2: Add verification status indicator
- [ ] P8-04-C-3: Create verification certificate modal
- [ ] P8-04-C-4: Integrate with contract detail page

---

## P8-05: Navigation Updates

### P8-05-A: User Menu Component

**File**: `src/components/layout/UserMenu.tsx`

```typescript
// Features:
// 1. User avatar/initial
// 2. Dropdown with links
// 3. Login/Register for guests
// 4. Role-based menu items (user vs agent)
```

**Tasks**:
- [ ] P8-05-A-1: Create UserMenu component
- [ ] P8-05-A-2: Add dropdown with navigation links
- [ ] P8-05-A-3: Show different menu for agents
- [ ] P8-05-A-4: Integrate into Navigation component

---

### P8-05-B: Agent Navigation

**File**: `src/components/layout/AgentNavigation.tsx`

```typescript
// Separate navigation for agent dashboard area
// Links: Dashboard, Listings, Signals, Responses, Settings
```

**Tasks**:
- [ ] P8-05-B-1: Create agent-specific navigation
- [ ] P8-05-B-2: Add to agent route layout
- [ ] P8-05-B-3: Highlight active route

---

## File Structure

```
src/
├── routes/
│   ├── login.tsx                    # P8-01-A
│   ├── register.tsx                 # P8-01-B
│   ├── forgot-password.tsx          # P8-01-C
│   ├── reset-password.tsx           # P8-01-C
│   ├── checkout.tsx                 # P8-03-B
│   ├── payments.tsx                 # P8-03-C
│   ├── wallet.tsx                   # P8-04-A
│   ├── agent/
│   │   ├── register.tsx             # P8-02-A
│   │   ├── dashboard.tsx            # P8-02-B
│   │   ├── listings.tsx             # P8-02-C
│   │   └── responses.tsx            # P8-02-D
│   └── settings/
│       └── subscription.tsx         # P8-03-D
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── SocialLoginButtons.tsx
│   │   ├── PasswordInput.tsx
│   │   └── ProtectedRoute.tsx
│   ├── agent/
│   │   ├── StatsOverview.tsx
│   │   ├── RecentSignals.tsx
│   │   ├── ListingCard.tsx
│   │   └── ResponseForm.tsx
│   ├── subscription/
│   │   ├── PlanCard.tsx
│   │   ├── FeatureComparison.tsx
│   │   └── CheckoutForm.tsx
│   ├── wallet/
│   │   ├── DIDCard.tsx
│   │   ├── CredentialCard.tsx
│   │   ├── BalanceCard.tsx
│   │   └── CreateDIDModal.tsx
│   └── layout/
│       ├── UserMenu.tsx
│       └── AgentNavigation.tsx
└── lib/
    ├── hooks/
    │   ├── useAgentDashboard.ts
    │   ├── useSubscription.ts
    │   └── useWallet.ts
    └── api/
        └── client.ts                 # Add new API methods
```

---

## Definition of Done

For each component/page:
- [ ] TypeScript types fully defined
- [ ] TanStack Form with Zod validation (for forms)
- [ ] TanStack Query hooks for API calls
- [ ] Loading states implemented
- [ ] Error handling with user-friendly messages
- [ ] Mobile-responsive design (Tailwind)
- [ ] Keyboard accessible
- [ ] No console errors
- [ ] Works in Korean and English (i18n)

---

## Dependencies

```bash
# No new dependencies needed
# Using existing:
# - @tanstack/react-form
# - @tanstack/react-query
# - @tanstack/react-router
# - zod
# - lucide-react
# - tailwindcss
```

---

## Implementation Order

1. **Sprint 8.1**: Authentication UI (P8-01)
   - Login, Register, Forgot Password
   - Auth context enhancement
   - Protected routes

2. **Sprint 8.2**: Agent Dashboard (P8-02)
   - Agent registration
   - Dashboard page
   - Listings management
   - Signal responses

3. **Sprint 8.3**: Payment UI (P8-03)
   - Plans page update
   - Checkout flow
   - Payment history
   - Subscription management

4. **Sprint 8.4**: Wallet UI (P8-04)
   - DID wallet page
   - DID creation flow
   - Contract verification UI
   - Navigation updates

---

## Notes

- All forms use TanStack Form + Zod for consistency
- API calls use existing `apiClient` singleton
- Loading states use existing Tailwind animations
- Error toasts use a new Toast component (to be created)
- All routes follow file-based routing convention
