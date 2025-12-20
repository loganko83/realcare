/**
 * Timeline Generator
 * Generates smart move-in timeline based on contract dates and conditions
 */

import type {
  Contract,
  TimelineItem,
  TimelineTemplate,
  TaskCategory,
} from '../../types/contract';

/**
 * Base timeline templates
 * D-Day is relative to move-in date (negative = before, positive = after)
 */
const BASE_TEMPLATES: TimelineTemplate[] = [
  // D-60: Initial preparation
  {
    dDay: -60,
    category: 'documents',
    title: 'Review contract documents',
    description: 'Verify all contract documents and property registry',
    priority: 'critical',
    subtasks: [
      'Check property registry (building ledger)',
      'Verify ownership and liens',
      'Review contract terms',
      'Confirm special conditions',
    ],
  },

  // D-45: Loan preparation (conditional)
  {
    dDay: -45,
    category: 'loan',
    title: 'Start loan application',
    description: 'Begin mortgage application process at multiple banks',
    priority: 'critical',
    subtasks: [
      'Compare loan products at 3+ banks',
      'Prepare required documents',
      'Submit loan applications',
      'Track approval status',
    ],
    conditions: { requiresLoan: true },
  },

  // D-40: Interior planning (conditional)
  {
    dDay: -40,
    category: 'interior',
    title: 'Plan interior work',
    description: 'Get quotes and plan renovation if needed',
    priority: 'high',
    subtasks: [
      'Visit property for measurements',
      'Get 3+ contractor quotes',
      'Decide on renovation scope',
      'Set budget and timeline',
    ],
    conditions: { hasInterior: true },
  },

  // D-30: Loan finalization
  {
    dDay: -30,
    category: 'loan',
    title: 'Finalize loan approval',
    description: 'Complete loan approval and schedule disbursement',
    priority: 'critical',
    subtasks: [
      'Provide additional documents if requested',
      'Confirm loan amount and terms',
      'Schedule disbursement date',
      'Prepare for closing',
    ],
    conditions: { requiresLoan: true },
  },

  // D-21: Interior start
  {
    dDay: -21,
    category: 'interior',
    title: 'Begin interior work',
    description: 'Start renovation work at the property',
    priority: 'high',
    subtasks: [
      'Sign contract with interior company',
      'Demolition work (if applicable)',
      'Flooring and painting',
      'Electrical and plumbing updates',
    ],
    conditions: { hasInterior: true },
  },

  // D-14: Moving preparation
  {
    dDay: -14,
    category: 'moving',
    title: 'Book moving company',
    description: 'Reserve moving service and start packing',
    priority: 'high',
    subtasks: [
      'Get quotes from 3+ moving companies',
      'Book moving date and time',
      'Start packing non-essentials',
      'Notify current landlord (if renting)',
    ],
    partnerServiceCategory: 'moving',
  },

  // D-10: Balance preparation
  {
    dDay: -10,
    category: 'finance',
    title: 'Prepare balance payment',
    description: 'Ensure all funds are ready for closing',
    priority: 'critical',
    subtasks: [
      'Confirm total amount needed',
      'Arrange fund transfers',
      'Prepare bank checks if needed',
      'Document all payment preparations',
    ],
  },

  // D-7: Utilities transfer
  {
    dDay: -7,
    category: 'utilities',
    title: 'Transfer utilities',
    description: 'Arrange utility transfers to your name',
    priority: 'medium',
    subtasks: [
      'Contact electricity provider',
      'Transfer gas service',
      'Set up internet installation',
      'Register water service',
    ],
  },

  // D-5: Pre-move cleaning
  {
    dDay: -5,
    category: 'cleaning',
    title: 'Schedule move-in cleaning',
    description: 'Book professional cleaning before moving in',
    priority: 'medium',
    subtasks: [
      'Book cleaning service',
      'Request deep cleaning',
      'Schedule for after interior completion',
    ],
    partnerServiceCategory: 'cleaning',
  },

  // D-3: Final inspection
  {
    dDay: -3,
    category: 'inspection',
    title: 'Final property inspection',
    description: 'Do thorough inspection before balance payment',
    priority: 'critical',
    subtasks: [
      'Check all fixtures and appliances',
      'Verify interior work completion',
      'Document any issues',
      'Confirm with seller/landlord',
    ],
  },

  // D-1: Balance payment
  {
    dDay: -1,
    category: 'finance',
    title: 'Balance payment',
    description: 'Complete final payment and receive keys',
    priority: 'critical',
    subtasks: [
      'Meet at agreed location',
      'Verify property condition',
      'Make balance payment',
      'Receive keys and documents',
    ],
  },

  // D-Day: Move in
  {
    dDay: 0,
    category: 'move_in',
    title: 'Move-in day',
    description: 'Move into your new home',
    priority: 'critical',
    subtasks: [
      'Supervise moving process',
      'Check all items upon arrival',
      'Test all utilities',
      'Complete move-in checklist',
    ],
  },

  // D+1: Post-move tasks
  {
    dDay: 1,
    category: 'documents',
    title: 'Address registration',
    description: 'Update your official address',
    priority: 'high',
    subtasks: [
      'Visit district office',
      'Register new address',
      'Update driver license if needed',
      'Notify relevant institutions',
    ],
  },

  // D+7: Settling in
  {
    dDay: 7,
    category: 'utilities',
    title: 'Complete utility setup',
    description: 'Finalize all utility registrations',
    priority: 'medium',
    subtasks: [
      'Verify all utility accounts',
      'Set up auto-pay if desired',
      'Complete internet setup',
      'Register for building management',
    ],
  },
];

/**
 * Sale-specific templates
 */
const SALE_TEMPLATES: TimelineTemplate[] = [
  {
    dDay: -30,
    category: 'documents',
    title: 'Prepare ownership transfer',
    description: 'Prepare documents for property registration',
    priority: 'critical',
    subtasks: [
      'Get property appraisal',
      'Prepare acquisition tax payment',
      'Gather identification documents',
      'Contact judicial scrivener',
    ],
    conditions: { contractType: ['sale'] },
  },
  {
    dDay: 0,
    category: 'documents',
    title: 'Complete ownership registration',
    description: 'Register property ownership at registry office',
    priority: 'critical',
    subtasks: [
      'Submit registration documents',
      'Pay acquisition tax',
      'Receive registration confirmation',
    ],
    conditions: { contractType: ['sale'] },
  },
];

/**
 * Jeonse-specific templates
 */
const JEONSE_TEMPLATES: TimelineTemplate[] = [
  {
    dDay: -7,
    category: 'documents',
    title: 'Confirm deposit return date',
    description: 'Verify deposit return from previous residence',
    priority: 'high',
    subtasks: [
      'Notify previous landlord of move-out',
      'Confirm deposit return timing',
      'Schedule fund flow for new deposit',
    ],
    conditions: { contractType: ['jeonse'] },
  },
  {
    dDay: 1,
    category: 'documents',
    title: 'Register lease (Hwakjeongiljja)',
    description: 'Register lease for legal protection',
    priority: 'critical',
    subtasks: [
      'Get contract notarized',
      'Register at district office',
      'Obtain confirmation date stamp',
    ],
    conditions: { contractType: ['jeonse', 'monthly'] },
  },
];

/**
 * Generate timeline based on contract details
 */
export function generateTimeline(contract: Contract): TimelineItem[] {
  const moveInDate = new Date(contract.dates.moveInDate);
  const allTemplates = [
    ...BASE_TEMPLATES,
    ...SALE_TEMPLATES,
    ...JEONSE_TEMPLATES,
  ];

  const applicableTemplates = allTemplates.filter(template => {
    // Check contract type condition
    if (template.conditions?.contractType) {
      if (!template.conditions.contractType.includes(contract.contractType)) {
        return false;
      }
    }

    // Check loan condition
    if (template.conditions?.requiresLoan !== undefined) {
      if (template.conditions.requiresLoan !== contract.requiresLoan) {
        return false;
      }
    }

    // Check interior condition
    if (template.conditions?.hasInterior !== undefined) {
      if (template.conditions.hasInterior !== contract.hasInterior) {
        return false;
      }
    }

    return true;
  });

  // Sort by D-Day
  applicableTemplates.sort((a, b) => a.dDay - b.dDay);

  // Generate timeline items
  return applicableTemplates.map((template, index) => {
    const itemDate = new Date(moveInDate);
    itemDate.setDate(itemDate.getDate() + template.dDay);

    return {
      id: `timeline_${contract.id}_${index}`,
      dDay: template.dDay,
      date: itemDate.toISOString().split('T')[0],
      category: template.category,
      title: template.title,
      description: template.description,
      status: 'pending' as const,
      priority: template.priority,
      subtasks: template.subtasks?.map((title, subIdx) => ({
        id: `subtask_${contract.id}_${index}_${subIdx}`,
        title,
        completed: false,
      })),
      partnerService: template.partnerServiceCategory
        ? { id: '', name: '', category: template.partnerServiceCategory, description: '' }
        : undefined,
    };
  });
}

/**
 * Get tasks due within specified days
 */
export function getUpcomingTasks(
  timeline: TimelineItem[],
  daysAhead: number = 7
): TimelineItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return timeline.filter(item => {
    const itemDate = new Date(item.date);
    return (
      itemDate >= today &&
      itemDate <= futureDate &&
      item.status !== 'completed' &&
      item.status !== 'skipped'
    );
  });
}

/**
 * Get overdue tasks
 */
export function getOverdueTasks(timeline: TimelineItem[]): TimelineItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return timeline.filter(item => {
    const itemDate = new Date(item.date);
    return (
      itemDate < today &&
      item.status !== 'completed' &&
      item.status !== 'skipped'
    );
  });
}

/**
 * Calculate timeline completion percentage
 */
export function getTimelineProgress(timeline: TimelineItem[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const completed = timeline.filter(
    item => item.status === 'completed' || item.status === 'skipped'
  ).length;
  const total = timeline.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

/**
 * Get critical path items
 */
export function getCriticalTasks(timeline: TimelineItem[]): TimelineItem[] {
  return timeline.filter(
    item =>
      item.priority === 'critical' &&
      item.status !== 'completed' &&
      item.status !== 'skipped'
  );
}

/**
 * Get tasks by category
 */
export function getTasksByCategory(
  timeline: TimelineItem[],
  category: TaskCategory
): TimelineItem[] {
  return timeline.filter(item => item.category === category);
}

/**
 * Format D-Day display
 */
export function formatDDay(dDay: number): string {
  if (dDay === 0) return 'D-Day';
  if (dDay < 0) return `D${dDay}`;
  return `D+${dDay}`;
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: TaskCategory): string {
  const names: Record<TaskCategory, string> = {
    loan: 'Loan',
    interior: 'Interior',
    moving: 'Moving',
    cleaning: 'Cleaning',
    finance: 'Finance',
    documents: 'Documents',
    utilities: 'Utilities',
    inspection: 'Inspection',
    move_in: 'Move-in',
  };
  return names[category] || category;
}

/**
 * Get category icon name (for use with icon libraries)
 */
export function getCategoryIcon(category: TaskCategory): string {
  const icons: Record<TaskCategory, string> = {
    loan: 'landmark',
    interior: 'paintbrush',
    moving: 'truck',
    cleaning: 'sparkles',
    finance: 'wallet',
    documents: 'file-text',
    utilities: 'zap',
    inspection: 'search',
    move_in: 'home',
  };
  return icons[category] || 'circle';
}
