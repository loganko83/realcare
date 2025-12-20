/**
 * Korean Real Estate Tax Calculator
 * Comprehensive tax calculations for acquisition, transfer, and holding
 */

import { RegionRegulation, getRegulationByCode } from '../constants/regulations';
import { formatKRW } from './dsr';

export interface TaxCalculationInput {
  propertyPrice: number;          // Property price in KRW
  regionCode: string;
  houseCount: number;             // Number of houses after purchase
  areaSquareMeters: number;       // Property area in sqm
  isFirstHome?: boolean;
  // For transfer tax
  purchasePrice?: number;         // Original purchase price
  holdingPeriodYears?: number;    // Years held
  // For holding tax
  publicPrice?: number;           // Official assessed price
}

export interface AcquisitionTaxResult {
  acquisitionTax: number;
  localEducationTax: number;
  ruralSpecialTax: number;        // If area > 85sqm
  total: number;
  effectiveRate: number;
  breakdown: {
    baseRate: number;
    adjustedRate: number;
    taxBase: number;
  };
}

export interface TransferTaxResult {
  capitalGain: number;
  basicDeduction: number;
  longTermDeduction: number;
  longTermDeductionRate: number;
  taxableIncome: number;
  incomeTax: number;
  localIncomeTax: number;
  total: number;
  effectiveRate: number;
  bracket: {
    rate: number;
    deduction: number;
    name: string;
  };
}

export interface HoldingTaxResult {
  propertyTax: number;
  comprehensivePropertyTax: number;
  localEducationTax: number;
  total: number;
  breakdown: {
    taxBase: number;
    fairValueRatio: number;
    multiplier: number;
  };
}

export interface TaxResult {
  acquisition: AcquisitionTaxResult;
  transfer?: TransferTaxResult;
  holding: HoldingTaxResult;
  totalInitialCost: number;
  annualHoldingCost: number;
}

// Korean income tax brackets (2024)
const INCOME_TAX_BRACKETS = [
  { limit: 14000000, rate: 6, deduction: 0, name: '6%' },
  { limit: 50000000, rate: 15, deduction: 1260000, name: '15%' },
  { limit: 88000000, rate: 24, deduction: 5760000, name: '24%' },
  { limit: 150000000, rate: 35, deduction: 15440000, name: '35%' },
  { limit: 300000000, rate: 38, deduction: 19940000, name: '38%' },
  { limit: 500000000, rate: 40, deduction: 25940000, name: '40%' },
  { limit: 1000000000, rate: 42, deduction: 35940000, name: '42%' },
  { limit: Infinity, rate: 45, deduction: 65940000, name: '45%' },
];

// Long-term holding deduction rates
const LONG_TERM_RATES: Record<number, number> = {
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16,
  9: 18,
  10: 20,
  11: 22,
  12: 24,
  13: 26,
  14: 28,
  15: 30, // Max 30%
};

// Property tax rates by value tier
const PROPERTY_TAX_RATES = [
  { limit: 60000000, rate: 0.1 },
  { limit: 150000000, rate: 0.15 },
  { limit: 300000000, rate: 0.25 },
  { limit: Infinity, rate: 0.4 },
];

/**
 * Calculate acquisition tax
 */
export function calculateAcquisitionTax(input: TaxCalculationInput): AcquisitionTaxResult {
  const { propertyPrice, regionCode, houseCount, areaSquareMeters, isFirstHome } = input;
  const region = getRegulationByCode(regionCode);

  let baseRate: number;

  // Determine base rate based on house count and price
  if (houseCount >= 3) {
    baseRate = region.acquisitionTaxRates.multiHouse3Plus;
  } else if (houseCount === 2) {
    baseRate = region.acquisitionTaxRates.multiHouse2;
  } else {
    // Single house - progressive rates based on price
    const priceIn억 = propertyPrice / 100000000;
    if (priceIn억 <= 6) {
      baseRate = region.acquisitionTaxRates.under6억;
    } else if (priceIn억 <= 9) {
      baseRate = region.acquisitionTaxRates.between6_9억;
    } else {
      baseRate = region.acquisitionTaxRates.over9억;
    }
  }

  // First-time home buyer discount (if applicable)
  let adjustedRate = baseRate;
  if (isFirstHome && houseCount === 1 && propertyPrice <= 600000000) {
    adjustedRate = Math.max(0.4, baseRate - 0.5); // Reduced rate for first home
  }

  // Calculate taxes
  const acquisitionTax = propertyPrice * (adjustedRate / 100);

  // Local education tax (20% of acquisition tax for houses)
  const localEducationTax = acquisitionTax * 0.2;

  // Rural special tax (if area > 85sqm and not multi-house)
  let ruralSpecialTax = 0;
  if (areaSquareMeters > 85 && houseCount <= 1) {
    ruralSpecialTax = acquisitionTax * 0.2;
  }

  const total = acquisitionTax + localEducationTax + ruralSpecialTax;
  const effectiveRate = (total / propertyPrice) * 100;

  return {
    acquisitionTax: Math.round(acquisitionTax),
    localEducationTax: Math.round(localEducationTax),
    ruralSpecialTax: Math.round(ruralSpecialTax),
    total: Math.round(total),
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    breakdown: {
      baseRate,
      adjustedRate,
      taxBase: propertyPrice,
    },
  };
}

/**
 * Calculate transfer (capital gains) tax
 */
export function calculateTransferTax(input: TaxCalculationInput): TransferTaxResult {
  const { propertyPrice, purchasePrice = 0, holdingPeriodYears = 0 } = input;

  const capitalGain = propertyPrice - purchasePrice;

  // No tax if no gain
  if (capitalGain <= 0) {
    return {
      capitalGain: Math.max(0, capitalGain),
      basicDeduction: 0,
      longTermDeduction: 0,
      longTermDeductionRate: 0,
      taxableIncome: 0,
      incomeTax: 0,
      localIncomeTax: 0,
      total: 0,
      effectiveRate: 0,
      bracket: { rate: 0, deduction: 0, name: 'N/A' },
    };
  }

  // Basic deduction
  const basicDeduction = 2500000;

  // Long-term holding deduction (3+ years)
  let longTermDeductionRate = 0;
  if (holdingPeriodYears >= 3) {
    const cappedYears = Math.min(holdingPeriodYears, 15);
    longTermDeductionRate = LONG_TERM_RATES[cappedYears] || 30;
  }

  const longTermDeduction = capitalGain * (longTermDeductionRate / 100);

  // Taxable income
  const taxableIncome = Math.max(0, capitalGain - basicDeduction - longTermDeduction);

  // Short-term holding penalty (less than 1 year: 70%, less than 2 years: 60%)
  let incomeTax: number;
  let bracket = INCOME_TAX_BRACKETS[0];

  if (holdingPeriodYears < 1) {
    incomeTax = taxableIncome * 0.70;
    bracket = { rate: 70, deduction: 0, name: '70% (Short-term)' };
  } else if (holdingPeriodYears < 2) {
    incomeTax = taxableIncome * 0.60;
    bracket = { rate: 60, deduction: 0, name: '60% (Short-term)' };
  } else {
    // Progressive tax
    for (const b of INCOME_TAX_BRACKETS) {
      if (taxableIncome <= b.limit) {
        bracket = b;
        break;
      }
    }
    incomeTax = taxableIncome * (bracket.rate / 100) - bracket.deduction;
  }

  // Local income tax (10% of income tax)
  const localIncomeTax = incomeTax * 0.1;

  const total = incomeTax + localIncomeTax;
  const effectiveRate = capitalGain > 0 ? (total / capitalGain) * 100 : 0;

  return {
    capitalGain: Math.round(capitalGain),
    basicDeduction,
    longTermDeduction: Math.round(longTermDeduction),
    longTermDeductionRate,
    taxableIncome: Math.round(taxableIncome),
    incomeTax: Math.round(incomeTax),
    localIncomeTax: Math.round(localIncomeTax),
    total: Math.round(total),
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    bracket,
  };
}

/**
 * Calculate holding tax (annual property tax + comprehensive property tax)
 */
export function calculateHoldingTax(input: TaxCalculationInput): HoldingTaxResult {
  const { propertyPrice, regionCode, houseCount } = input;
  const region = getRegulationByCode(regionCode);

  // Use public price (typically 60-80% of market price)
  const publicPrice = input.publicPrice || propertyPrice * 0.7;

  // Fair value ratio (currently 60% for comprehensive tax)
  const fairValueRatio = 0.6;
  const taxBase = publicPrice * fairValueRatio;

  // Property tax calculation
  let propertyTax = 0;
  let remainingBase = taxBase;

  for (const tier of PROPERTY_TAX_RATES) {
    const tierAmount = Math.min(remainingBase, tier.limit);
    propertyTax += tierAmount * (tier.rate / 100);
    remainingBase -= tierAmount;
    if (remainingBase <= 0) break;
  }

  // Comprehensive property tax (for high-value or multi-house)
  let comprehensivePropertyTax = 0;
  const compTaxThreshold = 1100000000; // 11억 threshold per person

  if (publicPrice > compTaxThreshold || houseCount >= 2) {
    const compTaxBase = Math.max(0, taxBase - (compTaxThreshold * fairValueRatio));
    // Simplified comprehensive tax rate
    let compRate = 0.5;
    if (houseCount >= 3) compRate = 2.0;
    else if (houseCount === 2) compRate = 1.2;

    comprehensivePropertyTax = compTaxBase * (compRate / 100) * region.holdingTaxMultiplier;
  }

  // Local education tax (20% of property tax)
  const localEducationTax = propertyTax * 0.2;

  const total = propertyTax + comprehensivePropertyTax + localEducationTax;

  return {
    propertyTax: Math.round(propertyTax),
    comprehensivePropertyTax: Math.round(comprehensivePropertyTax),
    localEducationTax: Math.round(localEducationTax),
    total: Math.round(total),
    breakdown: {
      taxBase: Math.round(taxBase),
      fairValueRatio,
      multiplier: region.holdingTaxMultiplier,
    },
  };
}

/**
 * Calculate all taxes
 */
export function calculateAllTaxes(input: TaxCalculationInput): TaxResult {
  const acquisition = calculateAcquisitionTax(input);
  const transfer = input.purchasePrice !== undefined
    ? calculateTransferTax(input)
    : undefined;
  const holding = calculateHoldingTax(input);

  return {
    acquisition,
    transfer,
    holding,
    totalInitialCost: acquisition.total,
    annualHoldingCost: holding.total,
  };
}

/**
 * Format tax result for display
 */
export function formatTaxSummary(result: TaxResult): string {
  const lines: string[] = [];

  lines.push(`[Acquisition Tax] ${formatKRW(result.acquisition.total)} (${result.acquisition.effectiveRate}%)`);
  lines.push(`  - Acquisition: ${formatKRW(result.acquisition.acquisitionTax)}`);
  lines.push(`  - Education: ${formatKRW(result.acquisition.localEducationTax)}`);

  if (result.acquisition.ruralSpecialTax > 0) {
    lines.push(`  - Rural Special: ${formatKRW(result.acquisition.ruralSpecialTax)}`);
  }

  if (result.transfer) {
    lines.push('');
    lines.push(`[Transfer Tax] ${formatKRW(result.transfer.total)} (${result.transfer.effectiveRate}%)`);
    lines.push(`  - Capital Gain: ${formatKRW(result.transfer.capitalGain)}`);
    lines.push(`  - Deductions: ${formatKRW(result.transfer.basicDeduction + result.transfer.longTermDeduction)}`);
    lines.push(`  - Tax Bracket: ${result.transfer.bracket.name}`);
  }

  lines.push('');
  lines.push(`[Annual Holding] ${formatKRW(result.holding.total)}`);
  lines.push(`  - Property Tax: ${formatKRW(result.holding.propertyTax)}`);

  if (result.holding.comprehensivePropertyTax > 0) {
    lines.push(`  - Comprehensive: ${formatKRW(result.holding.comprehensivePropertyTax)}`);
  }

  return lines.join('\n');
}
