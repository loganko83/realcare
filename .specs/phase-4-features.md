# Phase 4: Owner Signal & Smart Move-in

> Implement remaining core features from the RealCare specification

## Overview

This phase implements two major feature systems that were specified but not yet built:
1. **Owner Signal** - Anonymous property listing system for owners
2. **Smart Move-in** - Contract lifecycle management with timeline and tasks

## Part A: Owner Signal System

### Current State
- Not implemented
- Only mock data for subscription listings exists

### Target Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    Owner Signal System                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Owner     │───▶│   Signal    │◀───│   Viewer    │         │
│  │   (Seller)  │    │   Board     │    │  (Buyer)    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│        │                  │                  │                   │
│        ▼                  ▼                  ▼                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Property   │    │   Match     │    │  Reality    │         │
│  │ Verification│    │   Engine    │    │   Score     │         │
│  │             │    │             │    │  Check      │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                           │                                      │
│                           ▼                                      │
│                    ┌─────────────┐                               │
│                    │   Contact   │                               │
│                    │   Request   │                               │
│                    │   (Masked)  │                               │
│                    └─────────────┘                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Specification: Signal Creation

#### User Stories

**US-4.1**: As a property owner, I want to signal my intent to sell/lease without revealing my contact info.

**US-4.2**: As a property owner, I want to set my price range and preferences.

**US-4.3**: As a property owner, I want to control who can contact me.

#### Technical Requirements

##### TR-4.1: Signal Data Model
```typescript
// src/types/ownerSignal.ts

export interface OwnerSignal {
  id: string;
  ownerId: string;
  property: PropertyInfo;
  signalType: 'sale' | 'jeonse' | 'monthly';
  pricing: {
    minPrice: number;
    maxPrice: number;
    isNegotiable: boolean;
    monthlyRent?: number;  // For monthly rentals
  };
  preferences: {
    preferredBuyerType?: ('individual' | 'corporate' | 'agent')[];
    urgency: 'urgent' | 'flexible' | 'exploring';
    availableFrom?: string;  // ISO date
  };
  status: 'active' | 'paused' | 'matched' | 'expired' | 'completed';
  visibility: 'public' | 'verified_only' | 'agents_only';
  stats: {
    viewCount: number;
    contactRequestCount: number;
  };
  expiresAt: string;  // ISO date
  createdAt: string;
  updatedAt: string;
}

export interface PropertyInfo {
  id: string;
  address: string;
  addressMasked: string;  // e.g., "Seoul Gangnam-gu ***"
  coordinates?: { lat: number; lng: number };
  propertyType: 'apartment' | 'villa' | 'officetel' | 'house' | 'land';
  areaSquareMeters: number;
  floor?: number;
  totalFloors?: number;
  buildingYear?: number;
  features?: string[];
  verified: boolean;
  verificationMethod?: 'registry' | 'building_ledger' | 'manual';
}
```

##### TR-4.2: Signal Service
```typescript
// src/services/ownerSignal.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// For MVP, using localStorage. Later migrate to backend API.
const STORAGE_KEY = 'realcare_owner_signals';

export function useMySignals() {
  return useQuery({
    queryKey: ['mySignals'],
    queryFn: async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const signals: OwnerSignal[] = stored ? JSON.parse(stored) : [];
      return signals.filter(s => s.ownerId === getCurrentUserId());
    },
  });
}

export function usePublicSignals(filters?: SignalFilters) {
  return useQuery({
    queryKey: ['publicSignals', filters],
    queryFn: async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const signals: OwnerSignal[] = stored ? JSON.parse(stored) : [];

      return signals
        .filter(s => s.status === 'active')
        .filter(s => !filters?.signalType || s.signalType === filters.signalType)
        .filter(s => !filters?.minPrice || s.pricing.maxPrice >= filters.minPrice)
        .filter(s => !filters?.maxPrice || s.pricing.minPrice <= filters.maxPrice)
        .map(maskSensitiveData);
    },
  });
}

export function useCreateSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSignalInput) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const signals: OwnerSignal[] = stored ? JSON.parse(stored) : [];

      const newSignal: OwnerSignal = {
        id: crypto.randomUUID(),
        ownerId: getCurrentUserId(),
        property: input.property,
        signalType: input.signalType,
        pricing: input.pricing,
        preferences: input.preferences,
        status: 'active',
        visibility: input.visibility || 'public',
        stats: { viewCount: 0, contactRequestCount: 0 },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      signals.push(newSignal);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));

      return newSignal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySignals'] });
      queryClient.invalidateQueries({ queryKey: ['publicSignals'] });
    },
  });
}

function maskSensitiveData(signal: OwnerSignal): OwnerSignal {
  return {
    ...signal,
    ownerId: '***',
    property: {
      ...signal.property,
      address: signal.property.addressMasked,
      coordinates: undefined,
    },
  };
}
```

### Specification: Signal Viewing & Contact

#### User Stories

**US-4.4**: As a buyer, I want to browse available properties matching my criteria.

**US-4.5**: As a buyer, I want to request contact with an owner after proving financial readiness.

**US-4.6**: As an owner, I want to review contact requests before revealing my identity.

#### Technical Requirements

##### TR-4.3: Contact Request System
```typescript
// src/types/contactRequest.ts

export interface ContactRequest {
  id: string;
  signalId: string;
  requesterId: string;
  ownerResponse?: 'accepted' | 'rejected' | 'pending';
  requesterProfile: {
    realityScore?: number;
    financiallyVerified: boolean;
    message: string;
  };
  contactInfo?: {  // Only revealed after owner accepts
    name: string;
    phone: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  respondedAt?: string;
}

// src/services/contactRequest.ts

export function useSubmitContactRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      signalId: string;
      message: string;
      realityScore?: number;
    }) => {
      // Validate user has completed Reality Check
      if (!input.realityScore || input.realityScore < 40) {
        throw new Error('Reality Check required with score >= 40');
      }

      const request: ContactRequest = {
        id: crypto.randomUUID(),
        signalId: input.signalId,
        requesterId: getCurrentUserId(),
        requesterProfile: {
          realityScore: input.realityScore,
          financiallyVerified: input.realityScore >= 70,
          message: input.message,
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Store request
      saveContactRequest(request);

      // Update signal stats
      incrementSignalContactCount(input.signalId);

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myContactRequests'] });
    },
  });
}
```

## Part B: Smart Move-in System

### Current State
- Basic contract history exists in Settings page
- D-day notifications implemented
- No task management
- No partner service integration

### Target Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    Smart Move-in System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Contract                                │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │ Draft   │─▶│ Active  │─▶│ Move-in │─▶│Complete │     │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Timeline                                │   │
│  │                                                            │   │
│  │  D-60        D-45        D-14        D-7         D-0      │   │
│  │   │           │           │           │           │       │   │
│  │   ▼           ▼           ▼           ▼           ▼       │   │
│  │  ┌───┐      ┌───┐       ┌───┐       ┌───┐       ┌───┐    │   │
│  │  │ 대 │      │ 인 │       │ 이 │       │ 이 │       │ 입 │    │   │
│  │  │ 출 │      │ 테 │       │ 사 │       │ 체 │       │ 주 │    │   │
│  │  │ 비 │      │ 리 │       │ 예 │       │ 한 │       │ 완 │    │   │
│  │  │ 교 │      │ 어 │       │ 약 │       │ 도 │       │ 료 │    │   │
│  │  └───┘      └───┘       └───┘       └───┘       └───┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Partner Services                          │   │
│  │   Loan      Interior     Moving      Cleaning    Registry │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Specification: Contract Lifecycle

#### User Stories

**US-4.7**: As a user, I want to register my contract and get an automated timeline.

**US-4.8**: As a user, I want to see all tasks I need to complete before move-in.

**US-4.9**: As a user, I want reminders for important deadlines.

#### Technical Requirements

##### TR-4.4: Contract with Timeline
```typescript
// src/types/contract.ts

export interface Contract {
  id: string;
  userId: string;
  property: PropertyInfo;
  contractType: 'sale' | 'jeonse' | 'monthly';
  dates: {
    contractDate: string;      // When signed
    moveInDate: string;        // D-0
    contractEndDate?: string;  // For rentals
  };
  financials: {
    totalPrice: number;
    deposit: number;
    interimPayment?: number;
    balance: number;
    monthlyRent?: number;
  };
  counterparty: {
    name: string;
    phone?: string;
    role: 'seller' | 'landlord' | 'buyer' | 'tenant';
  };
  documents: ContractDocument[];
  timeline: TimelineItem[];
  status: 'draft' | 'active' | 'moving' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface TimelineItem {
  id: string;
  dDay: number;              // Negative = before move-in
  date: string;
  category: TaskCategory;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  priority: 'critical' | 'high' | 'medium' | 'low';
  partnerService?: PartnerService;
  subtasks?: Subtask[];
  completedAt?: string;
  notes?: string;
}

export type TaskCategory =
  | 'loan'
  | 'interior'
  | 'moving'
  | 'cleaning'
  | 'finance'
  | 'documents'
  | 'utilities'
  | 'inspection'
  | 'move_in';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface PartnerService {
  id: string;
  name: string;
  category: TaskCategory;
  description: string;
  url?: string;
  phone?: string;
  discount?: string;
}
```

##### TR-4.5: Timeline Generator
```typescript
// src/lib/utils/timelineGenerator.ts

export interface TimelineTemplate {
  dDay: number;
  category: TaskCategory;
  title: string;
  description: string;
  priority: TimelineItem['priority'];
  subtasks?: string[];
  partnerServiceCategory?: TaskCategory;
  conditions?: {
    contractType?: Contract['contractType'][];
    requiresLoan?: boolean;
    hasInterior?: boolean;
  };
}

const DEFAULT_TIMELINE_TEMPLATE: TimelineTemplate[] = [
  {
    dDay: -60,
    category: 'loan',
    title: 'Loan product comparison',
    description: 'Compare mortgage rates and prepare documents',
    priority: 'critical',
    subtasks: [
      'Collect income verification documents',
      'Get credit report',
      'Compare 3+ banks',
      'Submit loan application',
    ],
    partnerServiceCategory: 'loan',
    conditions: { requiresLoan: true },
  },
  {
    dDay: -45,
    category: 'interior',
    title: 'Interior planning',
    description: 'Get quotes if renovation needed',
    priority: 'medium',
    subtasks: [
      'Visit property for measurements',
      'Get 3+ quotes',
      'Decide on scope',
    ],
    partnerServiceCategory: 'interior',
  },
  {
    dDay: -30,
    category: 'documents',
    title: 'Document verification',
    description: 'Verify registry and building records',
    priority: 'high',
    subtasks: [
      'Check registry for liens',
      'Verify building permit',
      'Review contract terms',
    ],
  },
  {
    dDay: -14,
    category: 'moving',
    title: 'Moving service booking',
    description: 'Book moving company and confirm date',
    priority: 'high',
    subtasks: [
      'Get 3+ quotes',
      'Book preferred company',
      'Confirm moving date',
      'Start packing non-essentials',
    ],
    partnerServiceCategory: 'moving',
  },
  {
    dDay: -7,
    category: 'finance',
    title: 'Transfer limit increase',
    description: 'Increase bank transfer limits for balance payment',
    priority: 'critical',
    subtasks: [
      'Visit bank or use app',
      'Request limit increase',
      'Verify transfer capability',
    ],
  },
  {
    dDay: -7,
    category: 'utilities',
    title: 'Utility transfer',
    description: 'Arrange utility account transfers',
    priority: 'medium',
    subtasks: [
      'Electricity transfer',
      'Gas transfer',
      'Water transfer',
      'Internet setup',
    ],
  },
  {
    dDay: -3,
    category: 'inspection',
    title: 'Final inspection',
    description: 'Walk through property before move-in',
    priority: 'high',
    subtasks: [
      'Check all fixtures',
      'Test utilities',
      'Document any issues',
      'Confirm with seller/landlord',
    ],
  },
  {
    dDay: 0,
    category: 'move_in',
    title: 'Move-in day',
    description: 'Balance payment and key handover',
    priority: 'critical',
    subtasks: [
      'Transfer balance payment',
      'Confirm receipt',
      'Receive keys',
      'Sign handover document',
      'Take meter readings',
    ],
  },
  {
    dDay: 1,
    category: 'documents',
    title: 'Post move-in registration',
    description: 'Register residence and set up fixed date',
    priority: 'high',
    conditions: { contractType: ['jeonse', 'monthly'] },
    subtasks: [
      'Register address change',
      'Get fixed date stamp (확정일자)',
      'Update driver license if needed',
    ],
  },
  {
    dDay: 7,
    category: 'cleaning',
    title: 'Move-in cleaning',
    description: 'Deep clean before settling in',
    priority: 'low',
    partnerServiceCategory: 'cleaning',
  },
];

export function generateTimeline(
  contract: Contract,
  options?: { requiresLoan?: boolean; hasInterior?: boolean }
): TimelineItem[] {
  const moveInDate = new Date(contract.dates.moveInDate);

  return DEFAULT_TIMELINE_TEMPLATE
    .filter(template => {
      // Filter by conditions
      if (template.conditions?.contractType) {
        if (!template.conditions.contractType.includes(contract.contractType)) {
          return false;
        }
      }
      if (template.conditions?.requiresLoan && !options?.requiresLoan) {
        return false;
      }
      return true;
    })
    .map(template => {
      const taskDate = new Date(moveInDate);
      taskDate.setDate(taskDate.getDate() + template.dDay);

      return {
        id: crypto.randomUUID(),
        dDay: template.dDay,
        date: taskDate.toISOString().split('T')[0],
        category: template.category,
        title: template.title,
        description: template.description,
        status: 'pending' as const,
        priority: template.priority,
        subtasks: template.subtasks?.map(title => ({
          id: crypto.randomUUID(),
          title,
          completed: false,
        })),
        partnerService: template.partnerServiceCategory
          ? getPartnerForCategory(template.partnerServiceCategory)
          : undefined,
      };
    })
    .sort((a, b) => a.dDay - b.dDay);
}
```

### Specification: Task Management

#### User Stories

**US-4.10**: As a user, I want to mark tasks as complete and track my progress.

**US-4.11**: As a user, I want to add custom tasks to my timeline.

**US-4.12**: As a user, I want push notifications for upcoming deadlines.

#### Technical Requirements

##### TR-4.6: Task Service with TanStack Query
```typescript
// src/services/contract/tasks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useContractTimeline(contractId: string) {
  return useQuery({
    queryKey: ['contract', contractId, 'timeline'],
    queryFn: async () => {
      const contract = await getContract(contractId);
      return contract.timeline;
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      taskId,
      status,
    }: {
      contractId: string;
      taskId: string;
      status: TimelineItem['status'];
    }) => {
      const contract = await getContract(contractId);
      const timeline = contract.timeline.map(item =>
        item.id === taskId
          ? {
              ...item,
              status,
              completedAt: status === 'completed' ? new Date().toISOString() : undefined,
            }
          : item
      );

      await updateContract(contractId, { timeline });
      return timeline;
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
  });
}

export function useToggleSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      taskId,
      subtaskId,
    }: {
      contractId: string;
      taskId: string;
      subtaskId: string;
    }) => {
      const contract = await getContract(contractId);
      const timeline = contract.timeline.map(item => {
        if (item.id !== taskId) return item;

        const subtasks = item.subtasks?.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );

        // Auto-complete task if all subtasks done
        const allComplete = subtasks?.every(st => st.completed);

        return {
          ...item,
          subtasks,
          status: allComplete ? 'completed' : item.status,
          completedAt: allComplete ? new Date().toISOString() : item.completedAt,
        };
      });

      await updateContract(contractId, { timeline });
      return timeline;
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
  });
}

export function useAddCustomTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      task,
    }: {
      contractId: string;
      task: Omit<TimelineItem, 'id' | 'status'>;
    }) => {
      const contract = await getContract(contractId);
      const newTask: TimelineItem = {
        ...task,
        id: crypto.randomUUID(),
        status: 'pending',
      };

      const timeline = [...contract.timeline, newTask].sort(
        (a, b) => a.dDay - b.dDay
      );

      await updateContract(contractId, { timeline });
      return timeline;
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
  });
}
```

### Specification: Partner Services

#### User Stories

**US-4.13**: As a user, I want to discover partner services relevant to my current task.

**US-4.14**: As a user, I want to access partner services directly from my timeline.

#### Technical Requirements

##### TR-4.7: Partner Service Data
```typescript
// src/lib/constants/partnerServices.ts

export const PARTNER_SERVICES: PartnerService[] = [
  // Loan
  {
    id: 'kb-bank',
    name: 'KB Kookmin Bank',
    category: 'loan',
    description: 'Major bank with competitive mortgage rates',
    url: 'https://www.kbstar.com',
  },
  {
    id: 'woori-bank',
    name: 'Woori Bank',
    category: 'loan',
    description: 'Digital-first mortgage application',
    url: 'https://www.wooribank.com',
  },

  // Interior
  {
    id: 'ohouse',
    name: 'Today House',
    category: 'interior',
    description: 'Interior quotes and inspiration',
    url: 'https://ohou.se',
    discount: '10% partner discount',
  },

  // Moving
  {
    id: 'zimssa',
    name: 'Zimssa Moving',
    category: 'moving',
    description: 'Reliable moving service with online booking',
    url: 'https://www.zimssa.com',
  },
  {
    id: 'yonghwa',
    name: 'Yonghwa Express',
    category: 'moving',
    description: 'Nationwide moving service',
    phone: '1577-1234',
  },

  // Cleaning
  {
    id: 'miso',
    name: 'Miso Cleaning',
    category: 'cleaning',
    description: 'Move-in/move-out deep cleaning',
    url: 'https://miso.kr',
    discount: '15% partner discount',
  },
];

export function getPartnerForCategory(category: TaskCategory): PartnerService | undefined {
  return PARTNER_SERVICES.find(p => p.category === category);
}

export function getPartnersForCategory(category: TaskCategory): PartnerService[] {
  return PARTNER_SERVICES.filter(p => p.category === category);
}
```

## Implementation Tasks

### Phase 4A: Owner Signal
- **Task 4A.1**: Create signal data models and types
- **Task 4A.2**: Implement signal CRUD with TanStack Query
- **Task 4A.3**: Create signal creation form with TanStack Form
- **Task 4A.4**: Implement signal listing with filters
- **Task 4A.5**: Create contact request flow
- **Task 4A.6**: Add signal management UI

### Phase 4B: Smart Move-in
- **Task 4B.1**: Create contract and timeline data models
- **Task 4B.2**: Implement timeline generator
- **Task 4B.3**: Create task management hooks
- **Task 4B.4**: Build timeline visualization UI
- **Task 4B.5**: Add task completion flow
- **Task 4B.6**: Integrate partner services
- **Task 4B.7**: Implement notification system

## UI Components Needed

### Owner Signal
```
/routes/signals/
├── index.tsx          # Signal listing
├── create.tsx         # Create new signal
├── $signalId.tsx      # Signal detail
└── my-signals.tsx     # My signals management

/components/features/signals/
├── SignalCard.tsx
├── SignalForm.tsx
├── SignalFilters.tsx
├── ContactRequestForm.tsx
└── ContactRequestList.tsx
```

### Smart Move-in
```
/routes/contracts/
├── index.tsx          # Contract list
├── create.tsx         # Register new contract
├── $contractId/
│   ├── index.tsx      # Contract overview
│   ├── timeline.tsx   # Timeline view
│   └── documents.tsx  # Document management

/components/features/contracts/
├── ContractCard.tsx
├── ContractForm.tsx
├── TimelineView.tsx
├── TaskCard.tsx
├── TaskForm.tsx
├── PartnerServiceCard.tsx
└── ProgressIndicator.tsx
```

## Acceptance Criteria

### Owner Signal
- [ ] Owner can create signal with property info
- [ ] Signals are listed with proper masking
- [ ] Filters work (type, price, location)
- [ ] Contact request requires Reality Score
- [ ] Owner can accept/reject requests
- [ ] Contact info only revealed after acceptance

### Smart Move-in
- [ ] Contract registration generates timeline
- [ ] Timeline shows all tasks with dates
- [ ] Tasks can be marked complete
- [ ] Subtasks can be checked off
- [ ] Custom tasks can be added
- [ ] Partner services are accessible
- [ ] D-day countdown is accurate
- [ ] Overdue tasks are highlighted
