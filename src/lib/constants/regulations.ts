/**
 * Korean Real Estate Regulation Data
 * Based on current regulations as of 2024
 */

export interface RegionRegulation {
  code: string;
  name: string;
  nameKo: string;
  isSpeculativeZone: boolean;       // Speculation overheating zone
  isAdjustedZone: boolean;          // Adjusted target area
  ltvLimits: {
    firstHome: number;              // First-time buyer LTV %
    owned1: number;                 // 1 house owner LTV %
    owned2Plus: number;             // 2+ house owner LTV %
  };
  acquisitionTaxRates: {
    under6억: number;               // Rate for <600M KRW
    between6_9억: number;           // Rate for 600M-900M KRW
    over9억: number;                // Rate for >900M KRW
    multiHouse2: number;            // 2 house rate
    multiHouse3Plus: number;        // 3+ house rate
  };
  holdingTaxMultiplier: number;     // Comprehensive property tax multiplier
  effectiveDate: string;
}

// Seoul Districts
export const SEOUL_REGULATIONS: Record<string, RegionRegulation> = {
  "11680": {
    code: "11680",
    name: "Seoul Gangnam-gu",
    nameKo: "서울특별시 강남구",
    isSpeculativeZone: true,
    isAdjustedZone: true,
    ltvLimits: {
      firstHome: 50,
      owned1: 30,
      owned2Plus: 0,
    },
    acquisitionTaxRates: {
      under6억: 1.1,
      between6_9억: 2.2,
      over9억: 3.5,
      multiHouse2: 8.4,
      multiHouse3Plus: 12.4,
    },
    holdingTaxMultiplier: 1.0,
    effectiveDate: "2024-01-01",
  },
  "11650": {
    code: "11650",
    name: "Seoul Seocho-gu",
    nameKo: "서울특별시 서초구",
    isSpeculativeZone: true,
    isAdjustedZone: true,
    ltvLimits: {
      firstHome: 50,
      owned1: 30,
      owned2Plus: 0,
    },
    acquisitionTaxRates: {
      under6억: 1.1,
      between6_9억: 2.2,
      over9억: 3.5,
      multiHouse2: 8.4,
      multiHouse3Plus: 12.4,
    },
    holdingTaxMultiplier: 1.0,
    effectiveDate: "2024-01-01",
  },
  "11710": {
    code: "11710",
    name: "Seoul Songpa-gu",
    nameKo: "서울특별시 송파구",
    isSpeculativeZone: true,
    isAdjustedZone: true,
    ltvLimits: {
      firstHome: 50,
      owned1: 30,
      owned2Plus: 0,
    },
    acquisitionTaxRates: {
      under6억: 1.1,
      between6_9억: 2.2,
      over9억: 3.5,
      multiHouse2: 8.4,
      multiHouse3Plus: 12.4,
    },
    holdingTaxMultiplier: 1.0,
    effectiveDate: "2024-01-01",
  },
  "11440": {
    code: "11440",
    name: "Seoul Mapo-gu",
    nameKo: "서울특별시 마포구",
    isSpeculativeZone: false,
    isAdjustedZone: true,
    ltvLimits: {
      firstHome: 70,
      owned1: 60,
      owned2Plus: 30,
    },
    acquisitionTaxRates: {
      under6억: 1.1,
      between6_9억: 2.2,
      over9억: 3.5,
      multiHouse2: 8.4,
      multiHouse3Plus: 12.4,
    },
    holdingTaxMultiplier: 0.9,
    effectiveDate: "2024-01-01",
  },
  "11500": {
    code: "11500",
    name: "Seoul Gangdong-gu",
    nameKo: "서울특별시 강동구",
    isSpeculativeZone: false,
    isAdjustedZone: true,
    ltvLimits: {
      firstHome: 70,
      owned1: 60,
      owned2Plus: 30,
    },
    acquisitionTaxRates: {
      under6억: 1.1,
      between6_9억: 2.2,
      over9억: 3.5,
      multiHouse2: 8.4,
      multiHouse3Plus: 12.4,
    },
    holdingTaxMultiplier: 0.9,
    effectiveDate: "2024-01-01",
  },
  "11560": {
    code: "11560",
    name: "Seoul Yeongdeungpo-gu",
    nameKo: "서울특별시 영등포구",
    isSpeculativeZone: false,
    isAdjustedZone: true,
    ltvLimits: {
      firstHome: 70,
      owned1: 60,
      owned2Plus: 30,
    },
    acquisitionTaxRates: {
      under6억: 1.1,
      between6_9억: 2.2,
      over9억: 3.5,
      multiHouse2: 8.4,
      multiHouse3Plus: 12.4,
    },
    holdingTaxMultiplier: 0.9,
    effectiveDate: "2024-01-01",
  },
  "11200": {
    code: "11200",
    name: "Seoul Seongdong-gu",
    nameKo: "서울특별시 성동구",
    isSpeculativeZone: false,
    isAdjustedZone: true,
    ltvLimits: {
      firstHome: 70,
      owned1: 60,
      owned2Plus: 30,
    },
    acquisitionTaxRates: {
      under6억: 1.1,
      between6_9억: 2.2,
      over9억: 3.5,
      multiHouse2: 8.4,
      multiHouse3Plus: 12.4,
    },
    holdingTaxMultiplier: 0.9,
    effectiveDate: "2024-01-01",
  },
  "11230": {
    code: "11230",
    name: "Seoul Dongdaemun-gu",
    nameKo: "서울특별시 동대문구",
    isSpeculativeZone: false,
    isAdjustedZone: false,
    ltvLimits: {
      firstHome: 70,
      owned1: 70,
      owned2Plus: 60,
    },
    acquisitionTaxRates: {
      under6억: 1.1,
      between6_9억: 2.2,
      over9억: 3.5,
      multiHouse2: 8.4,
      multiHouse3Plus: 12.4,
    },
    holdingTaxMultiplier: 0.8,
    effectiveDate: "2024-01-01",
  },
};

// Gyeonggi-do Regulations
export const GYEONGGI_REGULATIONS: Record<string, RegionRegulation> = {
  "41135": {
    code: "41135",
    name: "Seongnam Bundang-gu",
    nameKo: "성남시 분당구",
    isSpeculativeZone: true,
    isAdjustedZone: true,
    ltvLimits: {
      firstHome: 50,
      owned1: 30,
      owned2Plus: 0,
    },
    acquisitionTaxRates: {
      under6억: 1.1,
      between6_9억: 2.2,
      over9억: 3.5,
      multiHouse2: 8.4,
      multiHouse3Plus: 12.4,
    },
    holdingTaxMultiplier: 1.0,
    effectiveDate: "2024-01-01",
  },
  "41390": {
    code: "41390",
    name: "Goyang-si",
    nameKo: "고양시",
    isSpeculativeZone: false,
    isAdjustedZone: true,
    ltvLimits: {
      firstHome: 70,
      owned1: 60,
      owned2Plus: 30,
    },
    acquisitionTaxRates: {
      under6억: 1.1,
      between6_9억: 2.2,
      over9억: 3.5,
      multiHouse2: 8.4,
      multiHouse3Plus: 12.4,
    },
    holdingTaxMultiplier: 0.9,
    effectiveDate: "2024-01-01",
  },
  "41190": {
    code: "41190",
    name: "Bucheon-si",
    nameKo: "부천시",
    isSpeculativeZone: false,
    isAdjustedZone: false,
    ltvLimits: {
      firstHome: 70,
      owned1: 70,
      owned2Plus: 60,
    },
    acquisitionTaxRates: {
      under6억: 1.1,
      between6_9억: 2.2,
      over9억: 3.5,
      multiHouse2: 8.4,
      multiHouse3Plus: 12.4,
    },
    holdingTaxMultiplier: 0.8,
    effectiveDate: "2024-01-01",
  },
};

// Non-regulated regions (default)
export const DEFAULT_REGULATION: RegionRegulation = {
  code: "00000",
  name: "Non-Regulated Area",
  nameKo: "비규제지역",
  isSpeculativeZone: false,
  isAdjustedZone: false,
  ltvLimits: {
    firstHome: 70,
    owned1: 70,
    owned2Plus: 60,
  },
  acquisitionTaxRates: {
    under6억: 1.1,
    between6_9억: 2.2,
    over9억: 3.5,
    multiHouse2: 8.4,
    multiHouse3Plus: 12.4,
  },
  holdingTaxMultiplier: 0.7,
  effectiveDate: "2024-01-01",
};

// Combine all regulations
export const ALL_REGULATIONS: Record<string, RegionRegulation> = {
  ...SEOUL_REGULATIONS,
  ...GYEONGGI_REGULATIONS,
};

// Helper to get regulation by code
export function getRegulationByCode(code: string): RegionRegulation {
  return ALL_REGULATIONS[code] || DEFAULT_REGULATION;
}

// Get all regions as options for select
export function getRegionOptions(): { value: string; label: string; labelKo: string }[] {
  return Object.values(ALL_REGULATIONS).map(reg => ({
    value: reg.code,
    label: reg.name,
    labelKo: reg.nameKo,
  }));
}

// DSR Limits by loan type
export const DSR_LIMITS = {
  STANDARD: 40,              // Standard DSR limit (%)
  VULNERABLE: 60,            // For vulnerable groups (low income, first home)
  SPECIAL_MORTGAGE: 70,      // For special mortgage products
} as const;

// Income thresholds for vulnerable groups (annual income in 10K KRW)
export const INCOME_THRESHOLDS = {
  LOW_INCOME_SINGLE: 6000,   // 60M KRW single
  LOW_INCOME_MARRIED: 8500,  // 85M KRW married
  NEWLYWED_ELIGIBLE: 13000,  // 130M KRW for newlywed benefits
} as const;

// Region interface for UI selectors
export interface RegionOption {
  id: string;
  name: string;
  isSpeculativeZone: boolean;
  isAdjustedZone: boolean;
  maxLTV: number;
}

// Seoul districts for UI
export const SEOUL_DISTRICTS: RegionOption[] = [
  { id: 'gangnam', name: 'Gangnam-gu', isSpeculativeZone: true, isAdjustedZone: true, maxLTV: 50 },
  { id: 'seocho', name: 'Seocho-gu', isSpeculativeZone: true, isAdjustedZone: true, maxLTV: 50 },
  { id: 'songpa', name: 'Songpa-gu', isSpeculativeZone: true, isAdjustedZone: true, maxLTV: 50 },
  { id: 'yongsan', name: 'Yongsan-gu', isSpeculativeZone: true, isAdjustedZone: true, maxLTV: 50 },
  { id: 'mapo', name: 'Mapo-gu', isSpeculativeZone: false, isAdjustedZone: true, maxLTV: 60 },
  { id: 'seongdong', name: 'Seongdong-gu', isSpeculativeZone: false, isAdjustedZone: true, maxLTV: 60 },
  { id: 'gangdong', name: 'Gangdong-gu', isSpeculativeZone: false, isAdjustedZone: true, maxLTV: 60 },
  { id: 'yeongdeungpo', name: 'Yeongdeungpo-gu', isSpeculativeZone: false, isAdjustedZone: true, maxLTV: 60 },
  { id: 'gwanak', name: 'Gwanak-gu', isSpeculativeZone: false, isAdjustedZone: false, maxLTV: 70 },
  { id: 'dongdaemun', name: 'Dongdaemun-gu', isSpeculativeZone: false, isAdjustedZone: false, maxLTV: 70 },
  { id: 'seongbuk', name: 'Seongbuk-gu', isSpeculativeZone: false, isAdjustedZone: false, maxLTV: 70 },
  { id: 'nowon', name: 'Nowon-gu', isSpeculativeZone: false, isAdjustedZone: false, maxLTV: 70 },
];

// Gyeonggi cities for UI
export const GYEONGGI_CITIES: RegionOption[] = [
  { id: 'bundang', name: 'Seongnam Bundang', isSpeculativeZone: true, isAdjustedZone: true, maxLTV: 50 },
  { id: 'pangyo', name: 'Pangyo', isSpeculativeZone: true, isAdjustedZone: true, maxLTV: 50 },
  { id: 'gwacheon', name: 'Gwacheon', isSpeculativeZone: true, isAdjustedZone: true, maxLTV: 50 },
  { id: 'goyang', name: 'Goyang', isSpeculativeZone: false, isAdjustedZone: true, maxLTV: 60 },
  { id: 'suwon', name: 'Suwon', isSpeculativeZone: false, isAdjustedZone: true, maxLTV: 60 },
  { id: 'yongin', name: 'Yongin', isSpeculativeZone: false, isAdjustedZone: true, maxLTV: 60 },
  { id: 'hanam', name: 'Hanam', isSpeculativeZone: false, isAdjustedZone: true, maxLTV: 60 },
  { id: 'bucheon', name: 'Bucheon', isSpeculativeZone: false, isAdjustedZone: false, maxLTV: 70 },
  { id: 'ansan', name: 'Ansan', isSpeculativeZone: false, isAdjustedZone: false, maxLTV: 70 },
  { id: 'pyeongtaek', name: 'Pyeongtaek', isSpeculativeZone: false, isAdjustedZone: false, maxLTV: 70 },
];
