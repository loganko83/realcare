/**
 * Contract and Smart Move-in Types
 * Contract lifecycle management with timeline
 */

export interface Contract {
  id: string;
  userId: string;
  property: ContractProperty;
  contractType: 'sale' | 'jeonse' | 'monthly';
  dates: {
    contractDate: string;
    moveInDate: string;
    contractEndDate?: string;
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
  requiresLoan: boolean;
  hasInterior: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContractProperty {
  address: string;
  propertyType: 'apartment' | 'villa' | 'officetel' | 'house';
  areaSquareMeters: number;
  floor?: number;
  unit?: string;
}

export interface ContractDocument {
  id: string;
  name: string;
  type: 'contract' | 'registry' | 'building_ledger' | 'id' | 'other';
  url?: string;
  uploadedAt: string;
}

export interface TimelineItem {
  id: string;
  dDay: number;
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
  isCustom?: boolean;
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
  logo?: string;
}

export interface CreateContractInput {
  property: ContractProperty;
  contractType: Contract['contractType'];
  dates: Contract['dates'];
  financials: Contract['financials'];
  counterparty: Omit<Contract['counterparty'], 'role'> & { role?: Contract['counterparty']['role'] };
  requiresLoan?: boolean;
  hasInterior?: boolean;
}

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
