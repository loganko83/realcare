/**
 * Owner Signal Service
 * Manages anonymous property listings with TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  OwnerSignal,
  ContactRequest,
  SignalFilters,
  CreateSignalInput,
  CreateContactRequestInput,
} from '../../types/ownerSignal';

const SIGNALS_STORAGE_KEY = 'realcare_owner_signals';
const REQUESTS_STORAGE_KEY = 'realcare_contact_requests';

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
function getSignals(): OwnerSignal[] {
  const stored = localStorage.getItem(SIGNALS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveSignals(signals: OwnerSignal[]): void {
  localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(signals));
}

function getContactRequests(): ContactRequest[] {
  const stored = localStorage.getItem(REQUESTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveContactRequests(requests: ContactRequest[]): void {
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
}

// Mask sensitive data for public view
function maskSignal(signal: OwnerSignal): OwnerSignal {
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

// Generate masked address
function generateMaskedAddress(address: string): string {
  const parts = address.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]} ***`;
  }
  return `${parts[0]} ***`;
}

/**
 * Get current user's signals
 */
export function useMySignals() {
  return useQuery({
    queryKey: ['mySignals'],
    queryFn: async () => {
      const signals = getSignals();
      const userId = getCurrentUserId();
      return signals.filter(s => s.ownerId === userId);
    },
  });
}

// Serialize filters for stable queryKey
function serializeFilters(filters?: SignalFilters): string {
  if (!filters) return '';
  return JSON.stringify({
    signalType: filters.signalType ?? null,
    propertyType: filters.propertyType ?? null,
    district: filters.district ?? null,
    minPrice: filters.minPrice ?? null,
    maxPrice: filters.maxPrice ?? null,
    minArea: filters.minArea ?? null,
    maxArea: filters.maxArea ?? null,
    urgency: filters.urgency ?? null,
  });
}

/**
 * Get public signals with filters
 */
export function usePublicSignals(filters?: SignalFilters) {
  // Serialize filters for stable queryKey (prevents infinite refetches)
  const serializedFilters = serializeFilters(filters);

  return useQuery({
    queryKey: ['publicSignals', serializedFilters],
    queryFn: async () => {
      const signals = getSignals();
      const now = new Date().toISOString();

      return signals
        .filter(s => s.status === 'active' && s.expiresAt > now)
        .filter(s => !filters?.signalType || s.signalType === filters.signalType)
        .filter(s => !filters?.propertyType || s.property.propertyType === filters.propertyType)
        .filter(s => !filters?.district || s.property.district === filters.district)
        .filter(s => !filters?.minPrice || s.pricing.maxPrice >= filters.minPrice)
        .filter(s => !filters?.maxPrice || s.pricing.minPrice <= filters.maxPrice)
        .filter(s => !filters?.minArea || s.property.areaSquareMeters >= filters.minArea)
        .filter(s => !filters?.maxArea || s.property.areaSquareMeters <= filters.maxArea)
        .filter(s => !filters?.urgency || s.preferences.urgency === filters.urgency)
        .map(maskSignal);
    },
  });
}

/**
 * Get single signal by ID
 */
export function useSignal(signalId: string) {
  return useQuery({
    queryKey: ['signal', signalId],
    queryFn: async () => {
      const signals = getSignals();
      const signal = signals.find(s => s.id === signalId);
      if (!signal) return null;

      const userId = getCurrentUserId();
      return signal.ownerId === userId ? signal : maskSignal(signal);
    },
    enabled: !!signalId,
  });
}

/**
 * Create new signal
 */
export function useCreateSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSignalInput) => {
      const signals = getSignals();
      const userId = getCurrentUserId();

      const newSignal: OwnerSignal = {
        id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ownerId: userId,
        property: {
          ...input.property,
          id: `prop_${Date.now()}`,
          addressMasked: generateMaskedAddress(input.property.address),
          verified: false,
        },
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
      saveSignals(signals);

      return newSignal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySignals'] });
      queryClient.invalidateQueries({ queryKey: ['publicSignals'] });
    },
  });
}

/**
 * Update signal status
 */
export function useUpdateSignalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      signalId,
      status,
    }: {
      signalId: string;
      status: OwnerSignal['status'];
    }) => {
      const signals = getSignals();
      const index = signals.findIndex(s => s.id === signalId);

      if (index === -1) throw new Error('Signal not found');

      signals[index] = {
        ...signals[index],
        status,
        updatedAt: new Date().toISOString(),
      };

      saveSignals(signals);
      return signals[index];
    },
    onSuccess: (_, { signalId }) => {
      queryClient.invalidateQueries({ queryKey: ['mySignals'] });
      queryClient.invalidateQueries({ queryKey: ['publicSignals'] });
      queryClient.invalidateQueries({ queryKey: ['signal', signalId] });
    },
  });
}

/**
 * Delete signal
 */
export function useDeleteSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (signalId: string) => {
      const signals = getSignals();
      const filtered = signals.filter(s => s.id !== signalId);
      saveSignals(filtered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySignals'] });
      queryClient.invalidateQueries({ queryKey: ['publicSignals'] });
    },
  });
}

/**
 * Submit contact request
 */
export function useSubmitContactRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactRequestInput) => {
      // Validate reality score
      if (!input.realityScore || input.realityScore < 40) {
        throw new Error('Reality Check required with score >= 40');
      }

      const request: ContactRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        signalId: input.signalId,
        requesterId: getCurrentUserId(),
        requesterProfile: {
          realityScore: input.realityScore,
          financiallyVerified: input.realityScore >= 70,
          message: input.message,
        },
        contactInfo: input.contactInfo,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Save request
      const requests = getContactRequests();
      requests.push(request);
      saveContactRequests(requests);

      // Update signal stats
      const signals = getSignals();
      const signalIndex = signals.findIndex(s => s.id === input.signalId);
      if (signalIndex !== -1) {
        signals[signalIndex].stats.contactRequestCount++;
        saveSignals(signals);
      }

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myContactRequests'] });
      queryClient.invalidateQueries({ queryKey: ['signalRequests'] });
    },
  });
}

/**
 * Get requests for my signals
 */
export function useSignalRequests(signalId?: string) {
  return useQuery({
    queryKey: ['signalRequests', signalId],
    queryFn: async () => {
      const requests = getContactRequests();
      const signals = getSignals();
      const userId = getCurrentUserId();

      // Get requests for signals I own
      const mySignalIds = signals.filter(s => s.ownerId === userId).map(s => s.id);

      return requests.filter(r =>
        mySignalIds.includes(r.signalId) &&
        (!signalId || r.signalId === signalId)
      );
    },
  });
}

/**
 * Respond to contact request
 */
export function useRespondToRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      response,
    }: {
      requestId: string;
      response: 'accepted' | 'rejected';
    }) => {
      const requests = getContactRequests();
      const index = requests.findIndex(r => r.id === requestId);

      if (index === -1) throw new Error('Request not found');

      requests[index] = {
        ...requests[index],
        ownerResponse: response,
        status: response,
        respondedAt: new Date().toISOString(),
      };

      saveContactRequests(requests);
      return requests[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalRequests'] });
    },
  });
}
