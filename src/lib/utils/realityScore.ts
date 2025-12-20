/**
 * Reality Score Calculator
 * Calculates comprehensive purchase feasibility score (0-100)
 */

import { RegionRegulation, getRegulationByCode, DEFAULT_REGULATION } from '../constants/regulations';
import { calculateDSR, calculatePTI, formatKRW } from './dsr';

export interface UserFinancials {
  annualIncome: number;          // Annual income in KRW
  totalAssets: number;           // Total assets in KRW
  cashAssets: number;            // Liquid cash available in KRW
  totalDebt: number;             // Total existing debt in KRW
  monthlyDebtPayment: number;    // Monthly debt payments in KRW
  houseCount: number;            // Number of houses owned
  isFirstHome: boolean;          // First-time home buyer
}

export interface RealityScoreInput {
  propertyPrice: number;
  userFinancials: UserFinancials;
  regionCode: string;
  loanTermYears: number;
  interestRate: number;
}

export interface RiskFactor {
  type: 'critical' | 'warning' | 'info';
  category: 'loan' | 'cash' | 'regulation' | 'income' | 'debt';
  title: string;
  message: string;
  suggestion?: string;
  impact: number;  // Score reduction (negative)
}

export interface ScoreBreakdown {
  ltvScore: number;              // 0-25 points
  dsrScore: number;              // 0-25 points
  cashGapScore: number;          // 0-25 points
  stabilityScore: number;        // 0-25 points
}

export interface FinancialAnalysis {
  maxLoanByLTV: number;
  maxLoanByDSR: number;
  maxLoanAmount: number;
  requiredCash: number;
  availableCash: number;
  gapAmount: number;
  monthlyRepayment: number;
  dsrPercentage: number;
  ptiPercentage: number;
  applicableLTV: number;
  limitingFactor: 'LTV' | 'DSR' | 'CASH';
}

export interface RealityScoreResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: ScoreBreakdown;
  analysis: FinancialAnalysis;
  risks: RiskFactor[];
  region: RegionRegulation;
  summary: string;
}

/**
 * Calculate the applicable LTV limit based on user's house ownership
 */
function getApplicableLTV(
  region: RegionRegulation,
  userFinancials: UserFinancials
): number {
  if (userFinancials.isFirstHome || userFinancials.houseCount === 0) {
    return region.ltvLimits.firstHome;
  }
  if (userFinancials.houseCount === 1) {
    return region.ltvLimits.owned1;
  }
  return region.ltvLimits.owned2Plus;
}

/**
 * Calculate LTV score (0-25 points)
 */
function calculateLTVScore(ltv: number): number {
  if (ltv >= 70) return 25;
  if (ltv >= 60) return 22;
  if (ltv >= 50) return 18;
  if (ltv >= 40) return 14;
  if (ltv >= 30) return 10;
  if (ltv > 0) return 5;
  return 0;
}

/**
 * Calculate DSR score (0-25 points)
 */
function calculateDSRScore(dsrPercentage: number): number {
  if (dsrPercentage <= 25) return 25;
  if (dsrPercentage <= 30) return 22;
  if (dsrPercentage <= 35) return 18;
  if (dsrPercentage <= 40) return 14;
  if (dsrPercentage <= 50) return 8;
  if (dsrPercentage <= 60) return 4;
  return 0;
}

/**
 * Calculate cash gap score (0-25 points)
 */
function calculateCashGapScore(gap: number, price: number): number {
  if (price <= 0) return 0;
  const gapRatio = gap / price;

  if (gapRatio <= 0) return 25;           // No gap
  if (gapRatio <= 0.05) return 22;        // 5% or less
  if (gapRatio <= 0.10) return 18;        // 10% or less
  if (gapRatio <= 0.15) return 14;        // 15% or less
  if (gapRatio <= 0.20) return 10;        // 20% or less
  if (gapRatio <= 0.30) return 5;         // 30% or less
  return 0;
}

/**
 * Calculate stability score based on PTI (0-25 points)
 */
function calculateStabilityScore(monthlyPayment: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  const pti = monthlyPayment / monthlyIncome;

  if (pti <= 0.20) return 25;
  if (pti <= 0.25) return 22;
  if (pti <= 0.30) return 18;
  if (pti <= 0.35) return 14;
  if (pti <= 0.40) return 10;
  if (pti <= 0.50) return 5;
  return 0;
}

/**
 * Convert total score to letter grade
 */
function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Generate summary message based on score
 */
function generateSummary(score: number, grade: string, analysis: FinancialAnalysis): string {
  const messages: Record<string, string> = {
    A: `Excellent! Your financial situation is well-prepared for this purchase. Max loan: ${formatKRW(analysis.maxLoanAmount)}, you only need ${formatKRW(analysis.requiredCash)} in cash.`,
    B: `Good position. This purchase is feasible with proper planning. Consider the ${analysis.limitingFactor} constraint.`,
    C: `Moderate risk. ${analysis.gapAmount > 0 ? `You need an additional ${formatKRW(analysis.gapAmount)}.` : ''} Review your options carefully.`,
    D: `High risk. Current financial constraints make this purchase challenging. Consider alternatives or wait to improve your position.`,
    F: `Not recommended. Significant financial gaps exist. Focus on saving or consider lower-priced properties.`,
  };

  return messages[grade] || messages.F;
}

/**
 * Identify risk factors
 */
function identifyRisks(
  analysis: FinancialAnalysis,
  region: RegionRegulation,
  userFinancials: UserFinancials
): RiskFactor[] {
  const risks: RiskFactor[] = [];

  // Critical: No loan available
  if (analysis.applicableLTV === 0) {
    risks.push({
      type: 'critical',
      category: 'regulation',
      title: 'Loan Unavailable',
      message: 'As a multi-house owner in a regulated zone, mortgage loans are not available for this purchase.',
      suggestion: 'Consider selling existing property first or look at non-regulated areas.',
      impact: -30,
    });
  }

  // Critical: Cash gap too large
  if (analysis.gapAmount > analysis.availableCash) {
    risks.push({
      type: 'critical',
      category: 'cash',
      title: 'Insufficient Funds',
      message: `You need an additional ${formatKRW(analysis.gapAmount - analysis.availableCash)} beyond your current savings.`,
      suggestion: 'Consider lower-priced properties or wait to save more.',
      impact: -25,
    });
  }

  // Warning: DSR limit exceeded
  if (analysis.dsrPercentage > 40) {
    risks.push({
      type: 'warning',
      category: 'loan',
      title: 'DSR Limit Exceeded',
      message: `Your DSR (${analysis.dsrPercentage.toFixed(1)}%) exceeds the 40% limit. Loan amount will be reduced.`,
      suggestion: 'Reduce existing debt or consider extending loan term.',
      impact: -15,
    });
  }

  // Warning: High PTI
  if (analysis.ptiPercentage > 35) {
    risks.push({
      type: 'warning',
      category: 'income',
      title: 'High Payment Burden',
      message: `Monthly payment (${analysis.ptiPercentage.toFixed(1)}% of income) may strain your budget.`,
      suggestion: 'Ensure you have emergency savings after purchase.',
      impact: -10,
    });
  }

  // Warning: Speculative zone
  if (region.isSpeculativeZone) {
    risks.push({
      type: 'warning',
      category: 'regulation',
      title: 'Speculation Overheating Zone',
      message: 'This area has stricter loan regulations. LTV limits are reduced.',
      suggestion: 'Prepare more down payment than usual.',
      impact: -5,
    });
  }

  // Info: Multi-house tax
  if (userFinancials.houseCount >= 2) {
    risks.push({
      type: 'info',
      category: 'regulation',
      title: 'Multi-House Tax Applies',
      message: 'Higher acquisition tax (8-12%) applies for 2+ house owners.',
      suggestion: 'Factor in higher acquisition costs.',
      impact: -3,
    });
  }

  // Info: DSR near limit
  if (analysis.dsrPercentage > 30 && analysis.dsrPercentage <= 40) {
    risks.push({
      type: 'info',
      category: 'loan',
      title: 'DSR Near Limit',
      message: `Your DSR (${analysis.dsrPercentage.toFixed(1)}%) is approaching the 40% limit.`,
      suggestion: 'Minimize additional debt after purchase.',
      impact: -2,
    });
  }

  return risks;
}

/**
 * Main Reality Score calculation
 */
export function calculateRealityScore(input: RealityScoreInput): RealityScoreResult {
  const { propertyPrice, userFinancials, regionCode, loanTermYears, interestRate } = input;

  // Get region regulation
  const region = getRegulationByCode(regionCode);

  // Calculate applicable LTV
  const applicableLTV = getApplicableLTV(region, userFinancials);
  const maxLoanByLTV = propertyPrice * (applicableLTV / 100);

  // Calculate DSR-based loan limit
  const dsrResult = calculateDSR({
    annualIncome: userFinancials.annualIncome,
    newMortgage: {
      principal: maxLoanByLTV,
      interestRate,
      termYears: loanTermYears,
      repaymentType: 'amortizing',
    },
    existingDebts: userFinancials.monthlyDebtPayment > 0 ? [
      { type: 'other', monthlyPayment: userFinancials.monthlyDebtPayment }
    ] : [],
    isVulnerableGroup: userFinancials.isFirstHome,
  });

  const maxLoanByDSR = dsrResult.maxAdditionalLoan;

  // Determine actual max loan (lesser of LTV or DSR)
  const maxLoanAmount = Math.min(maxLoanByLTV, maxLoanByDSR);
  const limitingFactor = maxLoanByLTV <= maxLoanByDSR ? 'LTV' : 'DSR';

  // Calculate cash requirements
  const requiredCash = propertyPrice - maxLoanAmount;
  const availableCash = userFinancials.cashAssets;
  const gapAmount = Math.max(0, requiredCash - availableCash);

  // Calculate actual loan needed (if user has enough cash)
  const actualLoanNeeded = Math.max(0, propertyPrice - availableCash);
  const actualLoan = Math.min(actualLoanNeeded, maxLoanAmount);

  // Recalculate DSR with actual loan
  const actualDsrResult = calculateDSR({
    annualIncome: userFinancials.annualIncome,
    newMortgage: {
      principal: actualLoan,
      interestRate,
      termYears: loanTermYears,
      repaymentType: 'amortizing',
    },
    existingDebts: userFinancials.monthlyDebtPayment > 0 ? [
      { type: 'other', monthlyPayment: userFinancials.monthlyDebtPayment }
    ] : [],
    isVulnerableGroup: userFinancials.isFirstHome,
  });

  // Calculate PTI
  const monthlyIncome = userFinancials.annualIncome / 12;
  const ptiResult = calculatePTI(actualDsrResult.monthlyPayment, monthlyIncome);

  // Build analysis
  const analysis: FinancialAnalysis = {
    maxLoanByLTV,
    maxLoanByDSR,
    maxLoanAmount,
    requiredCash,
    availableCash,
    gapAmount,
    monthlyRepayment: actualDsrResult.monthlyPayment,
    dsrPercentage: actualDsrResult.dsrPercentage,
    ptiPercentage: ptiResult.pti,
    applicableLTV,
    limitingFactor: gapAmount > 0 ? 'CASH' : limitingFactor,
  };

  // Calculate scores
  const ltvScore = calculateLTVScore(applicableLTV);
  const dsrScore = calculateDSRScore(actualDsrResult.dsrPercentage);
  const cashGapScore = calculateCashGapScore(gapAmount, propertyPrice);
  const stabilityScore = calculateStabilityScore(actualDsrResult.monthlyPayment, monthlyIncome);

  const breakdown: ScoreBreakdown = {
    ltvScore,
    dsrScore,
    cashGapScore,
    stabilityScore,
  };

  const totalScore = ltvScore + dsrScore + cashGapScore + stabilityScore;
  const grade = scoreToGrade(totalScore);

  // Identify risks
  const risks = identifyRisks(analysis, region, userFinancials);

  // Generate summary
  const summary = generateSummary(totalScore, grade, analysis);

  return {
    score: Math.round(totalScore),
    grade,
    breakdown,
    analysis,
    risks,
    region,
    summary,
  };
}

/**
 * Compare multiple scenarios
 */
export function compareScenarios(
  baseInput: RealityScoreInput,
  alternatives: Partial<RealityScoreInput>[]
): RealityScoreResult[] {
  const results: RealityScoreResult[] = [];

  // Base scenario
  results.push(calculateRealityScore(baseInput));

  // Alternative scenarios
  for (const alt of alternatives) {
    const altInput: RealityScoreInput = {
      ...baseInput,
      ...alt,
      userFinancials: {
        ...baseInput.userFinancials,
        ...(alt.userFinancials || {}),
      },
    };
    results.push(calculateRealityScore(altInput));
  }

  return results;
}
