/**
 * Reality Check Hook
 * Combines Reality Score calculation with AI-powered action plans
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  calculateRealityScore,
  RealityScoreInput,
  RealityScoreResult,
  UserFinancials,
} from '../utils/realityScore';
import {
  calculateAllTaxes,
  TaxCalculationInput,
  TaxResult,
} from '../utils/taxCalculator';
import {
  generateActionPlan,
  ActionPlan,
  ActionPlanInput,
  UserGoals,
} from '../../services/gemini/actionPlan';
import { getRegionOptions, getRegulationByCode, RegionRegulation } from '../constants/regulations';

export interface RealityCheckInput {
  // Property info
  propertyPrice: number;
  regionCode: string;
  areaSquareMeters: number;

  // User financials
  annualIncome: number;
  cashAssets: number;
  totalAssets?: number;
  totalDebt?: number;
  monthlyDebtPayment?: number;
  houseCount: number;
  isFirstHome: boolean;

  // Loan settings
  loanTermYears: number;
  interestRate: number;

  // Goals
  userGoals?: UserGoals;
}

export interface RealityCheckResult {
  score: RealityScoreResult;
  taxes: TaxResult;
  actionPlan?: ActionPlan;
}

/**
 * Transform input for Reality Score calculation
 */
function toRealityScoreInput(input: RealityCheckInput): RealityScoreInput {
  const userFinancials: UserFinancials = {
    annualIncome: input.annualIncome,
    totalAssets: input.totalAssets || input.cashAssets,
    cashAssets: input.cashAssets,
    totalDebt: input.totalDebt || 0,
    monthlyDebtPayment: input.monthlyDebtPayment || 0,
    houseCount: input.houseCount,
    isFirstHome: input.isFirstHome,
  };

  return {
    propertyPrice: input.propertyPrice,
    userFinancials,
    regionCode: input.regionCode,
    loanTermYears: input.loanTermYears,
    interestRate: input.interestRate,
  };
}

/**
 * Transform input for Tax calculation
 */
function toTaxInput(input: RealityCheckInput): TaxCalculationInput {
  return {
    propertyPrice: input.propertyPrice,
    regionCode: input.regionCode,
    houseCount: input.houseCount + 1, // After purchase
    areaSquareMeters: input.areaSquareMeters,
    isFirstHome: input.isFirstHome,
  };
}

/**
 * Full Reality Check calculation
 */
async function performRealityCheck(input: RealityCheckInput): Promise<RealityCheckResult> {
  // Calculate Reality Score
  const scoreInput = toRealityScoreInput(input);
  const score = calculateRealityScore(scoreInput);

  // Calculate Taxes
  const taxInput = toTaxInput(input);
  const taxes = calculateAllTaxes(taxInput);

  // Generate Action Plan if goals provided
  let actionPlan: ActionPlan | undefined;
  if (input.userGoals) {
    const planInput: ActionPlanInput = {
      realityScore: score,
      userGoals: input.userGoals,
      propertyPrice: input.propertyPrice,
    };
    actionPlan = await generateActionPlan(planInput);
  }

  return {
    score,
    taxes,
    actionPlan,
  };
}

/**
 * React Query hook for Reality Check
 */
export function useRealityCheck() {
  return useMutation({
    mutationFn: performRealityCheck,
    mutationKey: ['realityCheck'],
  });
}

/**
 * Hook for just the Reality Score (without API call)
 */
export function useRealityScore(input: RealityScoreInput | null) {
  return useQuery({
    queryKey: ['realityScore', input],
    queryFn: () => (input ? calculateRealityScore(input) : null),
    enabled: !!input,
    staleTime: Infinity,
  });
}

/**
 * Hook for tax calculation
 */
export function useTaxCalculation(input: TaxCalculationInput | null) {
  return useQuery({
    queryKey: ['taxCalculation', input],
    queryFn: () => (input ? calculateAllTaxes(input) : null),
    enabled: !!input,
    staleTime: Infinity,
  });
}

/**
 * Hook for region options
 */
export function useRegionOptions() {
  return useQuery({
    queryKey: ['regionOptions'],
    queryFn: getRegionOptions,
    staleTime: Infinity,
  });
}

/**
 * Hook for getting regulation by code
 */
export function useRegulation(code: string | null) {
  return useQuery({
    queryKey: ['regulation', code],
    queryFn: () => (code ? getRegulationByCode(code) : null),
    enabled: !!code,
    staleTime: Infinity,
  });
}

// Re-export types for convenience
export type { RealityScoreResult, UserFinancials, RealityScoreInput } from '../utils/realityScore';
export type { TaxResult, TaxCalculationInput } from '../utils/taxCalculator';
export type { ActionPlan, UserGoals } from '../../services/gemini/actionPlan';
export type { RegionRegulation } from '../constants/regulations';
