/**
 * Owner Signal Types
 * Anonymous property listing system for owners
 */

export interface PropertyInfo {
  id: string;
  address: string;
  addressMasked: string;
  district: string;
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

export interface OwnerSignal {
  id: string;
  ownerId: string;
  property: PropertyInfo;
  signalType: 'sale' | 'jeonse' | 'monthly';
  pricing: {
    minPrice: number;
    maxPrice: number;
    isNegotiable: boolean;
    monthlyRent?: number;
  };
  preferences: {
    preferredBuyerType?: ('individual' | 'corporate' | 'agent')[];
    urgency: 'urgent' | 'flexible' | 'exploring';
    availableFrom?: string;
  };
  status: 'active' | 'paused' | 'matched' | 'expired' | 'completed';
  visibility: 'public' | 'verified_only' | 'agents_only';
  stats: {
    viewCount: number;
    contactRequestCount: number;
  };
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

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
  contactInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  respondedAt?: string;
}

export interface SignalFilters {
  signalType?: OwnerSignal['signalType'];
  propertyType?: PropertyInfo['propertyType'];
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  urgency?: OwnerSignal['preferences']['urgency'];
}

export interface CreateSignalInput {
  property: Omit<PropertyInfo, 'id' | 'verified' | 'verificationMethod' | 'addressMasked'>;
  signalType: OwnerSignal['signalType'];
  pricing: OwnerSignal['pricing'];
  preferences: OwnerSignal['preferences'];
  visibility?: OwnerSignal['visibility'];
}

export interface CreateContactRequestInput {
  signalId: string;
  message: string;
  realityScore?: number;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
}
