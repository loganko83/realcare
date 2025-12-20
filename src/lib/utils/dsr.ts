/**
 * DSR (Debt Service Ratio) Calculator
 * Korean financial regulation calculation utilities
 */

import { DSR_LIMITS } from '../constants/regulations';

export interface ExistingDebt {
  type: 'mortgage' | 'credit' | 'car' | 'student' | 'other';
  monthlyPayment: number;
  remainingPrincipal?: number;
}

export interface NewMortgage {
  principal: number;         // Loan amount in KRW
  interestRate: number;      // Annual interest rate (%)
  termYears: number;         // Loan term in years
  repaymentType: 'amortizing' | 'interest_only' | 'bullet';
}

export interface DSRInput {
  annualIncome: number;
  newMortgage: NewMortgage;
  existingDebts: ExistingDebt[];
  isVulnerableGroup?: boolean;
}

export interface DSRResult {
  totalAnnualPayment: number;
  newMortgageAnnualPayment: number;
  existingDebtAnnualPayment: number;
  dsrPercentage: number;
  dsrLimit: number;
  isWithinLimit: boolean;
  maxAdditionalLoan: number;
  monthlyPayment: number;
  breakdown: {
    newMortgage: {
      principal: number;
      interest: number;
      monthly: number;
      annual: number;
    };
    existingDebts: {
      type: string;
      monthlyPayment: number;
      annualPayment: number;
    }[];
  };
}

/**
 * Calculate monthly payment using amortization formula
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
  repaymentType: 'amortizing' | 'interest_only' | 'bullet' = 'amortizing'
): number {
  if (principal <= 0 || termYears <= 0) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  if (repaymentType === 'interest_only') {
    // Interest only payment
    return principal * monthlyRate;
  }

  if (repaymentType === 'bullet') {
    // Bullet loan: interest only, principal at end
    // For DSR, we calculate as if it were amortizing
    return principal * monthlyRate;
  }

  // Standard amortizing loan
  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return payment;
}

/**
 * Calculate maximum loan amount given DSR constraints
 */
export function calculateMaxLoan(
  annualIncome: number,
  annualRate: number,
  termYears: number,
  existingDebtAnnualPayment: number,
  dsrLimit: number = DSR_LIMITS.STANDARD
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  const availableAnnualPayment = (annualIncome * dsrLimit / 100) - existingDebtAnnualPayment;
  if (availableAnnualPayment <= 0) return 0;

  const availableMonthlyPayment = availableAnnualPayment / 12;

  if (monthlyRate === 0) {
    return availableMonthlyPayment * numPayments;
  }

  // Reverse the amortization formula to get principal
  const maxLoan = availableMonthlyPayment *
    (Math.pow(1 + monthlyRate, numPayments) - 1) /
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments));

  return Math.max(0, maxLoan);
}

/**
 * Main DSR calculation function
 */
export function calculateDSR(input: DSRInput): DSRResult {
  const { annualIncome, newMortgage, existingDebts, isVulnerableGroup } = input;

  // Determine DSR limit
  const dsrLimit = isVulnerableGroup ? DSR_LIMITS.VULNERABLE : DSR_LIMITS.STANDARD;

  // Calculate new mortgage payment
  const newMortgageMonthly = calculateMonthlyPayment(
    newMortgage.principal,
    newMortgage.interestRate,
    newMortgage.termYears,
    newMortgage.repaymentType
  );
  const newMortgageAnnual = newMortgageMonthly * 12;

  // Break down new mortgage payment
  const monthlyRate = newMortgage.interestRate / 100 / 12;
  const firstMonthInterest = newMortgage.principal * monthlyRate;
  const firstMonthPrincipal = newMortgageMonthly - firstMonthInterest;

  // Calculate existing debt payments
  const existingDebtBreakdown = existingDebts.map(debt => ({
    type: debt.type,
    monthlyPayment: debt.monthlyPayment,
    annualPayment: debt.monthlyPayment * 12,
  }));

  const existingDebtAnnualPayment = existingDebtBreakdown.reduce(
    (sum, debt) => sum + debt.annualPayment,
    0
  );

  // Total annual payment
  const totalAnnualPayment = newMortgageAnnual + existingDebtAnnualPayment;

  // Calculate DSR percentage
  const dsrPercentage = annualIncome > 0
    ? (totalAnnualPayment / annualIncome) * 100
    : 0;

  // Calculate max additional loan
  const maxAdditionalLoan = calculateMaxLoan(
    annualIncome,
    newMortgage.interestRate,
    newMortgage.termYears,
    existingDebtAnnualPayment,
    dsrLimit
  );

  return {
    totalAnnualPayment,
    newMortgageAnnualPayment: newMortgageAnnual,
    existingDebtAnnualPayment,
    dsrPercentage: Math.round(dsrPercentage * 100) / 100,
    dsrLimit,
    isWithinLimit: dsrPercentage <= dsrLimit,
    maxAdditionalLoan: Math.max(0, maxAdditionalLoan),
    monthlyPayment: totalAnnualPayment / 12,
    breakdown: {
      newMortgage: {
        principal: firstMonthPrincipal,
        interest: firstMonthInterest,
        monthly: newMortgageMonthly,
        annual: newMortgageAnnual,
      },
      existingDebts: existingDebtBreakdown,
    },
  };
}

/**
 * Calculate DTI (Debt to Income) ratio
 * DTI considers total debt, not just payments
 */
export function calculateDTI(
  totalDebt: number,
  annualIncome: number
): { dti: number; isHealthy: boolean } {
  if (annualIncome <= 0) {
    return { dti: 0, isHealthy: false };
  }

  const dti = (totalDebt / annualIncome) * 100;
  const isHealthy = dti <= 200; // General guideline: DTI under 200%

  return {
    dti: Math.round(dti * 100) / 100,
    isHealthy,
  };
}

/**
 * Calculate PTI (Payment to Income) ratio
 * Monthly payment as percentage of monthly income
 */
export function calculatePTI(
  monthlyPayment: number,
  monthlyIncome: number
): { pti: number; riskLevel: 'low' | 'medium' | 'high' } {
  if (monthlyIncome <= 0) {
    return { pti: 0, riskLevel: 'high' };
  }

  const pti = (monthlyPayment / monthlyIncome) * 100;

  let riskLevel: 'low' | 'medium' | 'high';
  if (pti <= 25) {
    riskLevel = 'low';
  } else if (pti <= 35) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    pti: Math.round(pti * 100) / 100,
    riskLevel,
  };
}

/**
 * Format currency for display
 */
export function formatKRW(amount: number): string {
  if (amount >= 100000000) {
    const eok = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    return man > 0 ? `${eok}B ${man}M KRW` : `${eok}B KRW`;
  }
  if (amount >= 10000) {
    return `${Math.floor(amount / 10000)}M KRW`;
  }
  return `${amount.toLocaleString()} KRW`;
}
