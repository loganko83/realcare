/**
 * Partner Services Data
 * Curated list of partner services for Smart Move-in
 */

import type { PartnerService, TaskCategory } from '../../types/contract';

/**
 * Partner services organized by category
 */
export const PARTNER_SERVICES: PartnerService[] = [
  // Moving Services
  {
    id: 'moving_yongdalee',
    name: 'Yongdalee Express',
    category: 'moving',
    description: 'Nationwide moving service with real-time tracking',
    url: 'https://www.yongdalee.co.kr',
    phone: '1588-1234',
    discount: 'RealCare customers 10% off',
    logo: '/partners/yongdalee.png',
  },
  {
    id: 'moving_hanjin',
    name: 'Hanjin Express Moving',
    category: 'moving',
    description: 'Professional moving with insurance coverage',
    url: 'https://www.hanjin.co.kr',
    phone: '1588-0011',
    discount: 'Free packing materials',
    logo: '/partners/hanjin.png',
  },
  {
    id: 'moving_daekyo',
    name: 'Daekyo Moving',
    category: 'moving',
    description: 'Premium moving service with storage options',
    url: 'https://www.daekyo-moving.co.kr',
    phone: '1577-2424',
    discount: '5% cashback',
    logo: '/partners/daekyo.png',
  },

  // Cleaning Services
  {
    id: 'cleaning_misohome',
    name: 'Miso Home',
    category: 'cleaning',
    description: 'Professional home cleaning and move-in cleaning',
    url: 'https://www.miso.kr',
    phone: '1522-0120',
    discount: 'First clean 20% off',
    logo: '/partners/miso.png',
  },
  {
    id: 'cleaning_daeri',
    name: 'Daeri Jubu',
    category: 'cleaning',
    description: 'Thorough move-in deep cleaning specialists',
    url: 'https://www.daerijubu.com',
    phone: '1600-3030',
    discount: 'RealCare 15% off',
    logo: '/partners/daeri.png',
  },

  // Interior/Renovation Services
  {
    id: 'interior_ohouse',
    name: 'Ohouse Interior',
    category: 'interior',
    description: 'Design to completion interior service',
    url: 'https://ohouse.com',
    phone: '1644-1190',
    discount: 'Free design consultation',
    logo: '/partners/ohouse.png',
  },
  {
    id: 'interior_zipggu',
    name: 'Zipggu',
    category: 'interior',
    description: 'Affordable interior renovation packages',
    url: 'https://www.zipggu.co.kr',
    phone: '1599-3366',
    discount: 'Up to 500K discount',
    logo: '/partners/zipggu.png',
  },
  {
    id: 'interior_hanssem',
    name: 'Hanssem Rehaus',
    category: 'interior',
    description: 'Premium kitchen and bathroom renovation',
    url: 'https://www.hanssem.com',
    phone: '1544-8200',
    discount: 'Interest-free 12 months',
    logo: '/partners/hanssem.png',
  },

  // Loan Services
  {
    id: 'loan_toss',
    name: 'Toss Bank Mortgage',
    category: 'loan',
    description: 'Quick online mortgage comparison and application',
    url: 'https://www.tossbank.com',
    phone: '1599-4905',
    discount: 'No application fees',
    logo: '/partners/toss.png',
  },
  {
    id: 'loan_kakao',
    name: 'Kakao Bank Mortgage',
    category: 'loan',
    description: 'Competitive rates with simple mobile application',
    url: 'https://www.kakaobank.com',
    phone: '1599-3333',
    discount: 'Lowest rate guarantee',
    logo: '/partners/kakao.png',
  },
  {
    id: 'loan_finder',
    name: 'BankSalad',
    category: 'loan',
    description: 'Compare loans from 20+ banks instantly',
    url: 'https://www.banksalad.com',
    phone: '1600-7786',
    discount: 'Free loan consulting',
    logo: '/partners/banksalad.png',
  },

  // Inspection Services
  {
    id: 'inspection_homcheck',
    name: 'HomCheck',
    category: 'inspection',
    description: 'Professional property inspection before purchase',
    url: 'https://www.homcheck.co.kr',
    phone: '02-1234-5678',
    discount: 'RealCare 20% off',
    logo: '/partners/homcheck.png',
  },
  {
    id: 'inspection_jipcheck',
    name: 'JipCheck Pro',
    category: 'inspection',
    description: 'Detailed inspection with report and warranty',
    url: 'https://www.jipcheck.com',
    phone: '1522-8899',
    discount: 'Free re-inspection',
    logo: '/partners/jipcheck.png',
  },

  // Document/Legal Services
  {
    id: 'docs_lawfirm',
    name: 'Real Estate Law Partners',
    category: 'documents',
    description: 'Contract review and legal consultation',
    url: 'https://www.relplaw.co.kr',
    phone: '02-555-1234',
    discount: 'First consultation free',
    logo: '/partners/relp.png',
  },
  {
    id: 'docs_scrivener',
    name: 'Seoul Judicial Scrivener',
    category: 'documents',
    description: 'Property registration and document services',
    url: 'https://www.seoulscrivener.co.kr',
    phone: '02-777-8888',
    discount: 'Express service at standard rate',
    logo: '/partners/scrivener.png',
  },

  // Utility Services
  {
    id: 'utility_kepco',
    name: 'KEPCO Online',
    category: 'utilities',
    description: 'Electricity transfer and new connection',
    url: 'https://cyber.kepco.co.kr',
    phone: '123',
    logo: '/partners/kepco.png',
  },
  {
    id: 'utility_citygas',
    name: 'City Gas Application',
    category: 'utilities',
    description: 'Gas connection and safety inspection',
    url: 'https://www.citygas.or.kr',
    phone: '1544-9000',
    logo: '/partners/citygas.png',
  },

  // Finance/Tax Services
  {
    id: 'finance_taxagent',
    name: 'Real Estate Tax Pro',
    category: 'finance',
    description: 'Tax calculation and reporting for property transactions',
    url: 'https://www.retaxpro.co.kr',
    phone: '02-333-7777',
    discount: 'Free tax estimate',
    logo: '/partners/taxagent.png',
  },
];

/**
 * Get partner services by category
 */
export function getPartnersByCategory(category: TaskCategory): PartnerService[] {
  return PARTNER_SERVICES.filter(partner => partner.category === category);
}

/**
 * Get partner service by ID
 */
export function getPartnerById(id: string): PartnerService | undefined {
  return PARTNER_SERVICES.find(partner => partner.id === id);
}

/**
 * Get featured partners (those with discounts)
 */
export function getFeaturedPartners(): PartnerService[] {
  return PARTNER_SERVICES.filter(partner => partner.discount);
}

/**
 * Get all categories that have partners
 */
export function getActiveCategories(): TaskCategory[] {
  const categories = new Set(PARTNER_SERVICES.map(p => p.category));
  return Array.from(categories);
}

/**
 * Search partners by name or description
 */
export function searchPartners(query: string): PartnerService[] {
  const lowerQuery = query.toLowerCase();
  return PARTNER_SERVICES.filter(
    partner =>
      partner.name.toLowerCase().includes(lowerQuery) ||
      partner.description.toLowerCase().includes(lowerQuery)
  );
}
