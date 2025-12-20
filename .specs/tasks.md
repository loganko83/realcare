# RealCare Implementation Tasks

> Consolidated task list following Spec-Kit methodology

## Task Overview

| Phase | Name | Tasks | Priority | Dependencies |
|-------|------|-------|----------|--------------|
| 1 | Infrastructure & TanStack | 12 | Critical | None |
| 2 | Reality Check Engine | 10 | Critical | Phase 1 |
| 3 | Gemini RAG Integration | 8 | High | Phase 1 |
| 4A | Owner Signal | 8 | Medium | Phase 1, 2 |
| 4B | Smart Move-in | 10 | Medium | Phase 1 |

---

## Phase 1: Infrastructure & TanStack

### P1-T01: Install TanStack Dependencies
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install @tanstack/react-router @tanstack/router-devtools
npm install @tanstack/react-form @tanstack/zod-form-adapter
npm install zod ky
```
- **Effort**: Small
- **Blocked by**: None

### P1-T02: Create Project Directory Structure
Restructure project to use `src/` with proper organization:
```
src/
├── main.tsx
├── App.tsx
├── router.tsx
├── components/
├── routes/
├── lib/
├── services/
├── stores/
└── types/
```
- **Effort**: Medium
- **Blocked by**: None

### P1-T03: Update Vite Configuration
- Update path aliases for new structure
- Configure for `src/` directory
- **Effort**: Small
- **Blocked by**: P1-T02

### P1-T04: Setup TanStack Query Provider
- Create `src/lib/queryClient.ts`
- Wrap app with `QueryClientProvider`
- Add DevTools in development
- **Effort**: Small
- **Blocked by**: P1-T01, P1-T02

### P1-T05: Setup TanStack Router
- Create `src/router.tsx` with route definitions
- Create route components for all pages
- Replace tab navigation with router links
- **Effort**: Large
- **Blocked by**: P1-T02

### P1-T06: Migrate Navigation Component
- Update Navigation to use router links
- Maintain mobile-first design
- Add active state styling
- **Effort**: Small
- **Blocked by**: P1-T05

### P1-T07: Create Query Hooks for Saved Analyses
- `useSavedAnalyses()` - list saved analyses
- `useSaveAnalysis()` - save new analysis
- `useDeleteAnalysis()` - delete analysis
- **Effort**: Medium
- **Blocked by**: P1-T04

### P1-T08: Create Query Hooks for Contracts
- `useContracts()` - list user contracts
- `useContract(id)` - single contract
- `useCreateContract()` - create contract
- `useUpdateContract()` - update contract
- **Effort**: Medium
- **Blocked by**: P1-T04

### P1-T09: Create Query Hooks for Favorites
- `useFavorites()` - list favorites
- `useToggleFavorite()` - add/remove favorite
- **Effort**: Small
- **Blocked by**: P1-T04

### P1-T10: Migrate Financial Check Form
- Convert to TanStack Form
- Add Zod validation schema
- Handle submission with query mutation
- **Effort**: Medium
- **Blocked by**: P1-T01

### P1-T11: Migrate Contract Registration Form
- Convert to TanStack Form
- Add Zod validation schema
- Integrate with contract query hooks
- **Effort**: Medium
- **Blocked by**: P1-T08, P1-T10

### P1-T12: Add TypeScript Strict Mode
- Update `tsconfig.json` for strict mode
- Fix any type errors
- **Effort**: Medium
- **Blocked by**: All above

---

## Phase 2: Reality Check Engine

### P2-T01: Create Regulation Data Constants
- Define region regulation types
- Add Seoul district regulations
- Add other major city regulations
- **Effort**: Large
- **Blocked by**: P1-T02

### P2-T02: Implement DSR Calculator
- Create `calculateDSR()` function
- Handle existing debt breakdown
- Calculate max loan by DSR
- Add unit tests
- **Effort**: Medium
- **Blocked by**: P1-T02

### P2-T03: Implement LTV Calculator
- Create `calculateLTV()` function
- Handle region-based limits
- Handle house count logic
- Add unit tests
- **Effort**: Medium
- **Blocked by**: P2-T01

### P2-T04: Implement Reality Score Engine
- Create `calculateRealityScore()` function
- Implement score breakdown (LTV, DSR, Gap, Stability)
- Generate risk factors
- Add unit tests
- **Effort**: Large
- **Blocked by**: P2-T02, P2-T03

### P2-T05: Implement Comprehensive Tax Calculator
- Create acquisition tax calculator
- Create transfer tax calculator
- Create holding tax calculator
- Add all tax brackets and rates
- **Effort**: Large
- **Blocked by**: P2-T01

### P2-T06: Create Region Selector Component
- Dropdown with search
- Group by city/district
- Show regulation summary on selection
- **Effort**: Medium
- **Blocked by**: P2-T01

### P2-T07: Create Score Visualization Component
- Circular gauge for overall score
- Breakdown bar chart
- Risk factor list
- **Effort**: Medium
- **Blocked by**: P2-T04

### P2-T08: Integrate AI Action Plan
- Create Gemini prompt for action plan
- Parse structured response
- Display recommendations
- **Effort**: Medium
- **Blocked by**: P2-T04

### P2-T09: Create Scenario Comparison
- Allow multiple scenarios
- Side-by-side comparison UI
- Highlight differences
- **Effort**: Medium
- **Blocked by**: P2-T04

### P2-T10: Create Report Generation
- Combine all analyses
- Generate PDF report
- Save report history
- **Effort**: Medium
- **Blocked by**: P2-T04, P2-T05

---

## Phase 3: Gemini RAG Integration

### P3-T01: Create File Search Store Service
- Implement store creation/retrieval
- Handle three store types
- Cache store references
- **Effort**: Medium
- **Blocked by**: P1-T02

### P3-T02: Prepare Regulation Documents
- Write LTV/DSR regulation document
- Write tax regulation documents
- Write zone classification document
- Format for optimal chunking
- **Effort**: Large
- **Blocked by**: P2-T01

### P3-T03: Prepare Contract Template Documents
- Write standard lease template
- Write standard sale template
- Write risky clause guide
- **Effort**: Large
- **Blocked by**: None

### P3-T04: Prepare Legal Precedent Documents
- Collect relevant court cases
- Write precedent summaries
- Organize by dispute type
- **Effort**: Large
- **Blocked by**: None

### P3-T05: Implement Document Upload Service
- Create upload function
- Handle chunking configuration
- Track upload status
- **Effort**: Medium
- **Blocked by**: P3-T01

### P3-T06: Integrate RAG with Contract Analysis
- Modify `analyzeContract()` to use File Search
- Include contracts and precedents stores
- Extract and display citations
- **Effort**: Medium
- **Blocked by**: P3-T01, P3-T03

### P3-T07: Integrate RAG with Financial Advice
- Modify `getFinancialAdvice()` to use File Search
- Include regulations store
- Show applicable regulations
- **Effort**: Medium
- **Blocked by**: P3-T01, P3-T02

### P3-T08: Create Knowledge Admin Interface
- List documents in stores
- Upload new documents
- Delete outdated documents
- Show store statistics
- **Effort**: Medium
- **Blocked by**: P3-T01

---

## Phase 4A: Owner Signal

### P4A-T01: Create Signal Data Types
- Define `OwnerSignal` interface
- Define `PropertyInfo` interface
- Define `ContactRequest` interface
- **Effort**: Small
- **Blocked by**: P1-T02

### P4A-T02: Implement Signal Service
- `useMySignals()` hook
- `usePublicSignals()` hook
- `useCreateSignal()` mutation
- `useUpdateSignal()` mutation
- **Effort**: Medium
- **Blocked by**: P4A-T01, P1-T04

### P4A-T03: Create Signal Form
- Property information fields
- Signal type selection
- Pricing inputs
- Preference settings
- **Effort**: Medium
- **Blocked by**: P4A-T01, P1-T10

### P4A-T04: Create Signal Listing Page
- Signal cards with masking
- Filter sidebar
- Pagination
- **Effort**: Medium
- **Blocked by**: P4A-T02

### P4A-T05: Implement Contact Request Flow
- Reality Score gate
- Request form
- Request submission
- **Effort**: Medium
- **Blocked by**: P4A-T02, P2-T04

### P4A-T06: Create My Signals Management
- List user's signals
- Edit/pause/delete actions
- View contact requests
- Accept/reject requests
- **Effort**: Medium
- **Blocked by**: P4A-T02

### P4A-T07: Create Signal Detail Page
- Full property info (masked)
- Contact request button
- Similar signals
- **Effort**: Small
- **Blocked by**: P4A-T02

### P4A-T08: Add Signal Routes
- `/signals` - listing
- `/signals/create` - creation
- `/signals/:id` - detail
- `/signals/my` - management
- **Effort**: Small
- **Blocked by**: P1-T05

---

## Phase 4B: Smart Move-in

### P4B-T01: Create Contract Data Types
- Define `Contract` interface
- Define `TimelineItem` interface
- Define `PartnerService` interface
- **Effort**: Small
- **Blocked by**: P1-T02

### P4B-T02: Implement Timeline Generator
- Create template definitions
- Implement `generateTimeline()` function
- Handle contract type conditions
- **Effort**: Medium
- **Blocked by**: P4B-T01

### P4B-T03: Create Partner Service Data
- Define all partner services
- Organize by category
- Include URLs and discounts
- **Effort**: Small
- **Blocked by**: P4B-T01

### P4B-T04: Implement Contract Service
- `useContracts()` hook
- `useContract(id)` hook
- `useCreateContract()` mutation
- Auto-generate timeline on create
- **Effort**: Medium
- **Blocked by**: P4B-T01, P4B-T02

### P4B-T05: Create Task Management Hooks
- `useUpdateTaskStatus()` mutation
- `useToggleSubtask()` mutation
- `useAddCustomTask()` mutation
- **Effort**: Medium
- **Blocked by**: P4B-T04

### P4B-T06: Create Timeline Visualization
- Vertical timeline layout
- D-day indicators
- Status colors
- Progress tracking
- **Effort**: Large
- **Blocked by**: P4B-T02

### P4B-T07: Create Task Card Component
- Title and description
- Subtask checklist
- Partner service link
- Complete button
- **Effort**: Medium
- **Blocked by**: P4B-T05

### P4B-T08: Create Contract Registration Form
- Property info fields
- Date pickers
- Financial details
- Counter-party info
- **Effort**: Medium
- **Blocked by**: P4B-T04, P1-T10

### P4B-T09: Implement Notification System
- Calculate upcoming deadlines
- Show in-app notifications
- Optional push notifications (PWA)
- **Effort**: Medium
- **Blocked by**: P4B-T04

### P4B-T10: Add Contract Routes
- `/contracts` - listing
- `/contracts/create` - registration
- `/contracts/:id` - overview
- `/contracts/:id/timeline` - timeline view
- **Effort**: Small
- **Blocked by**: P1-T05

---

## Implementation Order

### Sprint 1: Foundation
1. P1-T01 Install Dependencies
2. P1-T02 Directory Structure
3. P1-T03 Vite Configuration
4. P1-T04 Query Provider
5. P1-T05 Router Setup
6. P1-T06 Navigation Migration

### Sprint 2: Query Migration
7. P1-T07 Saved Analyses Hooks
8. P1-T08 Contract Hooks
9. P1-T09 Favorites Hooks
10. P1-T10 Financial Form Migration
11. P1-T11 Contract Form Migration
12. P1-T12 TypeScript Strict

### Sprint 3: Reality Check Core
13. P2-T01 Regulation Data
14. P2-T02 DSR Calculator
15. P2-T03 LTV Calculator
16. P2-T04 Reality Score Engine
17. P2-T05 Tax Calculator

### Sprint 4: Reality Check UI
18. P2-T06 Region Selector
19. P2-T07 Score Visualization
20. P2-T08 AI Action Plan
21. P2-T09 Scenario Comparison
22. P2-T10 Report Generation

### Sprint 5: RAG Foundation
23. P3-T01 File Search Store Service
24. P3-T02 Regulation Documents
25. P3-T03 Contract Templates
26. P3-T04 Legal Precedents

### Sprint 6: RAG Integration
27. P3-T05 Document Upload
28. P3-T06 Contract Analysis RAG
29. P3-T07 Financial Advice RAG
30. P3-T08 Knowledge Admin

### Sprint 7: Owner Signal
31. P4A-T01 Signal Types
32. P4A-T02 Signal Service
33. P4A-T03 Signal Form
34. P4A-T04 Signal Listing
35. P4A-T05 Contact Request
36. P4A-T06 My Signals
37. P4A-T07 Signal Detail
38. P4A-T08 Signal Routes

### Sprint 8: Smart Move-in
39. P4B-T01 Contract Types
40. P4B-T02 Timeline Generator
41. P4B-T03 Partner Services
42. P4B-T04 Contract Service
43. P4B-T05 Task Hooks
44. P4B-T06 Timeline Visualization
45. P4B-T07 Task Card
46. P4B-T08 Contract Form
47. P4B-T09 Notifications
48. P4B-T10 Contract Routes

---

## Definition of Done

For each task:
- [ ] Code implemented and tested
- [ ] TypeScript types defined
- [ ] Component/function documented
- [ ] No console errors
- [ ] Works on mobile viewport
- [ ] Code reviewed (if applicable)

## Notes

- All tasks assume English-only code comments
- Korean text only in user-facing strings
- TanStack devtools enabled in development only
- LocalStorage used for MVP; backend integration in future phase
