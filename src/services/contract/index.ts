/**
 * Contract Service
 * Manages contracts and timeline with TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Contract,
  CreateContractInput,
  TimelineItem,
} from '../../types/contract';
import { generateTimeline } from '../../lib/utils/timelineGenerator';
import { getPartnersByCategory } from '../../lib/constants/partnerServices';

const CONTRACTS_STORAGE_KEY = 'realcare_contracts';

// Simple user ID for MVP (would come from auth in production)
function getCurrentUserId(): string {
  let userId = localStorage.getItem('realcare_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('realcare_user_id', userId);
  }
  return userId;
}

// Storage helpers
function getContracts(): Contract[] {
  const stored = localStorage.getItem(CONTRACTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveContracts(contracts: Contract[]): void {
  localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
}

/**
 * Get all contracts for current user
 */
export function useMyContracts() {
  return useQuery({
    queryKey: ['myContracts'],
    queryFn: async () => {
      const contracts = getContracts();
      const userId = getCurrentUserId();
      return contracts.filter(c => c.userId === userId);
    },
  });
}

/**
 * Get single contract by ID
 */
export function useContract(contractId: string) {
  return useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      const contracts = getContracts();
      const userId = getCurrentUserId();
      const contract = contracts.find(
        c => c.id === contractId && c.userId === userId
      );
      return contract || null;
    },
    enabled: !!contractId,
  });
}

/**
 * Get active contract (currently in progress)
 */
export function useActiveContract() {
  return useQuery({
    queryKey: ['activeContract'],
    queryFn: async () => {
      const contracts = getContracts();
      const userId = getCurrentUserId();
      return contracts.find(
        c =>
          c.userId === userId &&
          (c.status === 'active' || c.status === 'moving')
      ) || null;
    },
  });
}

/**
 * Create new contract with auto-generated timeline
 */
export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContractInput) => {
      const contracts = getContracts();
      const userId = getCurrentUserId();

      // Determine counterparty role based on contract type
      const counterpartyRole = (() => {
        if (input.counterparty.role) return input.counterparty.role;
        if (input.contractType === 'sale') return 'seller' as const;
        return 'landlord' as const;
      })();

      const newContract: Contract = {
        id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        property: input.property,
        contractType: input.contractType,
        dates: input.dates,
        financials: input.financials,
        counterparty: {
          ...input.counterparty,
          role: counterpartyRole,
        },
        documents: [],
        timeline: [], // Will be generated
        status: 'active',
        requiresLoan: input.requiresLoan ?? false,
        hasInterior: input.hasInterior ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Generate timeline based on contract
      newContract.timeline = generateTimeline(newContract);

      // Attach partner services to relevant timeline items
      newContract.timeline = newContract.timeline.map(item => {
        if (item.partnerService?.category) {
          const partners = getPartnersByCategory(item.partnerService.category);
          if (partners.length > 0) {
            // Assign first featured partner
            const featured = partners.find(p => p.discount) || partners[0];
            item.partnerService = featured;
          }
        }
        return item;
      });

      contracts.push(newContract);
      saveContracts(contracts);

      return newContract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      queryClient.invalidateQueries({ queryKey: ['activeContract'] });
    },
  });
}

/**
 * Update contract status
 */
export function useUpdateContractStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      status,
    }: {
      contractId: string;
      status: Contract['status'];
    }) => {
      const contracts = getContracts();
      const index = contracts.findIndex(c => c.id === contractId);

      if (index === -1) throw new Error('Contract not found');

      contracts[index] = {
        ...contracts[index],
        status,
        updatedAt: new Date().toISOString(),
      };

      saveContracts(contracts);
      return contracts[index];
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      queryClient.invalidateQueries({ queryKey: ['activeContract'] });
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
  });
}

/**
 * Update timeline item status
 */
export function useUpdateTimelineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      itemId,
      updates,
    }: {
      contractId: string;
      itemId: string;
      updates: Partial<TimelineItem>;
    }) => {
      const contracts = getContracts();
      const contractIndex = contracts.findIndex(c => c.id === contractId);

      if (contractIndex === -1) throw new Error('Contract not found');

      const contract = contracts[contractIndex];
      const itemIndex = contract.timeline.findIndex(t => t.id === itemId);

      if (itemIndex === -1) throw new Error('Timeline item not found');

      contract.timeline[itemIndex] = {
        ...contract.timeline[itemIndex],
        ...updates,
        ...(updates.status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
      };

      contract.updatedAt = new Date().toISOString();
      saveContracts(contracts);

      return contract;
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
    },
  });
}

/**
 * Update subtask completion
 */
export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      itemId,
      subtaskId,
      completed,
    }: {
      contractId: string;
      itemId: string;
      subtaskId: string;
      completed: boolean;
    }) => {
      const contracts = getContracts();
      const contractIndex = contracts.findIndex(c => c.id === contractId);

      if (contractIndex === -1) throw new Error('Contract not found');

      const contract = contracts[contractIndex];
      const itemIndex = contract.timeline.findIndex(t => t.id === itemId);

      if (itemIndex === -1) throw new Error('Timeline item not found');

      const item = contract.timeline[itemIndex];
      if (!item.subtasks) throw new Error('No subtasks found');

      const subtaskIndex = item.subtasks.findIndex(s => s.id === subtaskId);
      if (subtaskIndex === -1) throw new Error('Subtask not found');

      item.subtasks[subtaskIndex].completed = completed;

      // Auto-complete parent if all subtasks done
      const allDone = item.subtasks.every(s => s.completed);
      if (allDone && item.status !== 'completed') {
        item.status = 'completed';
        item.completedAt = new Date().toISOString();
      }

      contract.updatedAt = new Date().toISOString();
      saveContracts(contracts);

      return contract;
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
  });
}

/**
 * Add custom timeline item
 */
export function useAddCustomTimelineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      item,
    }: {
      contractId: string;
      item: Omit<TimelineItem, 'id' | 'isCustom'>;
    }) => {
      const contracts = getContracts();
      const contractIndex = contracts.findIndex(c => c.id === contractId);

      if (contractIndex === -1) throw new Error('Contract not found');

      const contract = contracts[contractIndex];

      const newItem: TimelineItem = {
        ...item,
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isCustom: true,
      };

      // Insert in correct position based on date
      const insertIndex = contract.timeline.findIndex(
        t => t.date > newItem.date
      );
      if (insertIndex === -1) {
        contract.timeline.push(newItem);
      } else {
        contract.timeline.splice(insertIndex, 0, newItem);
      }

      contract.updatedAt = new Date().toISOString();
      saveContracts(contracts);

      return contract;
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
  });
}

/**
 * Delete custom timeline item
 */
export function useDeleteTimelineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      itemId,
    }: {
      contractId: string;
      itemId: string;
    }) => {
      const contracts = getContracts();
      const contractIndex = contracts.findIndex(c => c.id === contractId);

      if (contractIndex === -1) throw new Error('Contract not found');

      const contract = contracts[contractIndex];
      const item = contract.timeline.find(t => t.id === itemId);

      if (!item) throw new Error('Timeline item not found');
      if (!item.isCustom) throw new Error('Cannot delete system timeline items');

      contract.timeline = contract.timeline.filter(t => t.id !== itemId);
      contract.updatedAt = new Date().toISOString();
      saveContracts(contracts);

      return contract;
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
  });
}

/**
 * Add document to contract
 */
export function useAddDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      document,
    }: {
      contractId: string;
      document: {
        name: string;
        type: 'contract' | 'registry' | 'building_ledger' | 'id' | 'other';
        url?: string;
      };
    }) => {
      const contracts = getContracts();
      const contractIndex = contracts.findIndex(c => c.id === contractId);

      if (contractIndex === -1) throw new Error('Contract not found');

      const contract = contracts[contractIndex];
      contract.documents.push({
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...document,
        uploadedAt: new Date().toISOString(),
      });

      contract.updatedAt = new Date().toISOString();
      saveContracts(contracts);

      return contract;
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
  });
}

/**
 * Delete contract
 */
export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      const contracts = getContracts();
      const filtered = contracts.filter(c => c.id !== contractId);
      saveContracts(filtered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myContracts'] });
      queryClient.invalidateQueries({ queryKey: ['activeContract'] });
    },
  });
}

/**
 * Get timeline summary for dashboard
 */
export function useTimelineSummary(contractId: string) {
  return useQuery({
    queryKey: ['timelineSummary', contractId],
    queryFn: async () => {
      const contracts = getContracts();
      const contract = contracts.find(c => c.id === contractId);

      if (!contract) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const timeline = contract.timeline;
      const completed = timeline.filter(t => t.status === 'completed').length;
      const total = timeline.length;

      const overdue = timeline.filter(t => {
        const itemDate = new Date(t.date);
        return itemDate < today && t.status !== 'completed' && t.status !== 'skipped';
      });

      const upcoming = timeline.filter(t => {
        const itemDate = new Date(t.date);
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return (
          itemDate >= today &&
          itemDate <= weekFromNow &&
          t.status !== 'completed' &&
          t.status !== 'skipped'
        );
      });

      const critical = timeline.filter(
        t => t.priority === 'critical' && t.status !== 'completed' && t.status !== 'skipped'
      );

      return {
        progress: {
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
        overdue: overdue.length,
        upcoming: upcoming.length,
        critical: critical.length,
        nextTask: upcoming[0] || critical[0] || null,
      };
    },
    enabled: !!contractId,
  });
}
