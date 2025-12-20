/**
 * AI-Powered Action Plan Generator
 * Uses Gemini API to generate personalized real estate advice
 */

import { GoogleGenerativeAI } from '@google/genai';
import { RealityScoreResult } from '../../lib/utils/realityScore';
import { formatKRW } from '../../lib/utils/dsr';

// Initialize Gemini client
const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY
  ? process.env.GEMINI_API_KEY
  : '';

export interface UserGoals {
  targetMoveInDate?: string;
  flexibility: 'low' | 'medium' | 'high';
  priorities: ('price' | 'location' | 'size' | 'timing')[];
}

export interface ActionItem {
  priority: number;
  action: string;
  impact: string;
  timeframe: string;
  category: 'savings' | 'debt' | 'income' | 'property' | 'timing';
}

export interface AlternativeScenario {
  name: string;
  description: string;
  priceRange: string;
  feasibilityScore: number;
  keyDifference: string;
}

export interface ActionPlan {
  summary: string;
  immediateActions: ActionItem[];
  alternativeScenarios: AlternativeScenario[];
  warnings: string[];
  encouragement: string;
}

export interface ActionPlanInput {
  realityScore: RealityScoreResult;
  userGoals: UserGoals;
  propertyPrice: number;
}

/**
 * Build prompt for Gemini
 */
function buildActionPlanPrompt(input: ActionPlanInput): string {
  const { realityScore, userGoals, propertyPrice } = input;

  return `You are an expert Korean real estate financial advisor. Analyze this situation and provide actionable advice.

## User Financial Profile
- Reality Score: ${realityScore.score}/100 (Grade: ${realityScore.grade})
- Target Property Price: ${formatKRW(propertyPrice)}
- Max Loan Available: ${formatKRW(realityScore.analysis.maxLoanAmount)}
- Cash Required: ${formatKRW(realityScore.analysis.requiredCash)}
- Cash Available: ${formatKRW(realityScore.analysis.availableCash)}
- Cash Gap: ${formatKRW(realityScore.analysis.gapAmount)}
- Monthly Payment: ${formatKRW(realityScore.analysis.monthlyRepayment)}
- DSR: ${realityScore.analysis.dsrPercentage}%
- PTI: ${realityScore.analysis.ptiPercentage}%
- Limiting Factor: ${realityScore.analysis.limitingFactor}

## Location
- Region: ${realityScore.region.name}
- Speculative Zone: ${realityScore.region.isSpeculativeZone ? 'Yes' : 'No'}
- Adjusted Zone: ${realityScore.region.isAdjustedZone ? 'Yes' : 'No'}
- Applicable LTV: ${realityScore.analysis.applicableLTV}%

## Score Breakdown
- LTV Score: ${realityScore.breakdown.ltvScore}/25
- DSR Score: ${realityScore.breakdown.dsrScore}/25
- Cash Gap Score: ${realityScore.breakdown.cashGapScore}/25
- Stability Score: ${realityScore.breakdown.stabilityScore}/25

## Identified Risks
${realityScore.risks.map(r => `- [${r.type.toUpperCase()}] ${r.title}: ${r.message}`).join('\n')}

## User Goals
- Target Move-in: ${userGoals.targetMoveInDate || 'Flexible'}
- Flexibility: ${userGoals.flexibility}
- Priorities: ${userGoals.priorities.join(', ')}

Based on this analysis, provide:
1. A brief summary of their situation (2-3 sentences)
2. 3-5 immediate action items with priority, impact, and timeframe
3. 2-3 alternative scenarios if current plan is challenging
4. Any critical warnings
5. A brief encouragement message

Respond in JSON format matching this structure:
{
  "summary": "string",
  "immediateActions": [
    {
      "priority": 1,
      "action": "string",
      "impact": "string",
      "timeframe": "string",
      "category": "savings|debt|income|property|timing"
    }
  ],
  "alternativeScenarios": [
    {
      "name": "string",
      "description": "string",
      "priceRange": "string",
      "feasibilityScore": 0-100,
      "keyDifference": "string"
    }
  ],
  "warnings": ["string"],
  "encouragement": "string"
}`;
}

/**
 * Generate action plan using Gemini API
 */
export async function generateActionPlan(input: ActionPlanInput): Promise<ActionPlan> {
  if (!apiKey) {
    return generateFallbackPlan(input);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildActionPlanPrompt(input);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const response = result.response;
    const text = response.text();

    return JSON.parse(text) as ActionPlan;
  } catch (error) {
    console.error('Gemini API error:', error);
    return generateFallbackPlan(input);
  }
}

/**
 * Generate fallback plan when API is unavailable
 */
function generateFallbackPlan(input: ActionPlanInput): ActionPlan {
  const { realityScore, propertyPrice } = input;
  const { analysis, grade, risks } = realityScore;

  const immediateActions: ActionItem[] = [];
  const warnings: string[] = [];
  const alternativeScenarios: AlternativeScenario[] = [];

  // Generate actions based on situation
  if (analysis.gapAmount > 0) {
    immediateActions.push({
      priority: 1,
      action: `Save an additional ${formatKRW(analysis.gapAmount)} before purchase`,
      impact: 'Required to complete the transaction',
      timeframe: calculateSavingsTime(analysis.gapAmount, analysis.monthlyRepayment * 0.3),
      category: 'savings',
    });
  }

  if (analysis.dsrPercentage > 35) {
    immediateActions.push({
      priority: 2,
      action: 'Reduce existing debt to lower DSR',
      impact: `Reduces DSR from ${analysis.dsrPercentage.toFixed(1)}% closer to 30%`,
      timeframe: '3-6 months',
      category: 'debt',
    });
  }

  if (analysis.limitingFactor === 'LTV' && analysis.applicableLTV < 60) {
    immediateActions.push({
      priority: 2,
      action: 'Consider non-regulated areas with higher LTV limits',
      impact: 'Could increase max loan by 10-20%',
      timeframe: 'Immediate',
      category: 'property',
    });
  }

  if (analysis.ptiPercentage > 30) {
    immediateActions.push({
      priority: 3,
      action: 'Build 6-month emergency fund before purchase',
      impact: 'Financial safety net for high PTI',
      timeframe: '6-12 months',
      category: 'savings',
    });
  }

  // Default action if few issues
  if (immediateActions.length === 0) {
    immediateActions.push({
      priority: 1,
      action: 'Compare mortgage rates across 3-5 banks',
      impact: 'Could save 0.2-0.5% on interest',
      timeframe: '1-2 weeks',
      category: 'property',
    });
  }

  // Add alternative scenarios
  const lowerPrice = propertyPrice * 0.8;
  alternativeScenarios.push({
    name: 'Lower Price Range',
    description: `Consider properties at ${formatKRW(lowerPrice)} or below`,
    priceRange: `${formatKRW(lowerPrice * 0.9)} - ${formatKRW(lowerPrice)}`,
    feasibilityScore: Math.min(100, realityScore.score + 15),
    keyDifference: 'Reduced cash requirement and monthly payment',
  });

  if (realityScore.region.isSpeculativeZone) {
    alternativeScenarios.push({
      name: 'Non-Regulated Area',
      description: 'Similar properties in non-speculative zones',
      priceRange: `${formatKRW(propertyPrice * 0.85)} - ${formatKRW(propertyPrice)}`,
      feasibilityScore: Math.min(100, realityScore.score + 20),
      keyDifference: 'Higher LTV (up to 70%) available',
    });
  }

  // Extract warnings from risks
  risks.filter(r => r.type === 'critical' || r.type === 'warning').forEach(risk => {
    warnings.push(`${risk.title}: ${risk.suggestion || risk.message}`);
  });

  // Generate summary
  let summary: string;
  switch (grade) {
    case 'A':
      summary = 'Your financial position is excellent for this purchase. All key metrics are within safe limits. Proceed with confidence after comparing mortgage options.';
      break;
    case 'B':
      summary = 'This purchase is feasible with your current finances. Minor optimizations could improve your position. Consider the recommended actions before finalizing.';
      break;
    case 'C':
      summary = 'This purchase is moderately challenging. You may need to adjust your timeline or explore alternatives. Focus on the immediate actions to improve feasibility.';
      break;
    case 'D':
      summary = 'Significant financial gaps exist for this purchase. Consider lower-priced properties or allow more time to save. The alternative scenarios may be more realistic.';
      break;
    default:
      summary = 'This purchase is currently not recommended. Focus on improving your financial position before considering this price range. The alternatives below are more achievable.';
  }

  // Encouragement
  const encouragements: Record<string, string> = {
    A: 'You are well-positioned for homeownership. This is an exciting milestone!',
    B: 'With a bit more preparation, you will be ready. Keep up the good work!',
    C: 'Homeownership is within reach. Focus on the action items and you will get there.',
    D: 'Every journey starts with a step. Focus on savings and debt reduction - your home awaits.',
    F: 'Take your time and build a solid foundation. Future you will thank present you for being patient.',
  };

  return {
    summary,
    immediateActions,
    alternativeScenarios,
    warnings,
    encouragement: encouragements[grade] || encouragements.F,
  };
}

/**
 * Calculate estimated time to save a target amount
 */
function calculateSavingsTime(targetAmount: number, monthlySavings: number): string {
  if (monthlySavings <= 0) return 'Unable to estimate';

  const months = Math.ceil(targetAmount / monthlySavings);

  if (months < 6) return `${months} months`;
  if (months < 12) return `${months} months (about ${Math.ceil(months / 3)} quarters)`;
  if (months < 24) return `${Math.ceil(months / 12)} year(s)`;
  return `${Math.ceil(months / 12)} years (consider alternative options)`;
}

/**
 * React Query mutation wrapper
 */
export function useActionPlan() {
  // This can be used with useMutation from @tanstack/react-query
  return {
    generatePlan: generateActionPlan,
    generateFallback: generateFallbackPlan,
  };
}
