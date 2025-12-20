/**
 * RAG-Enhanced Financial Advice
 * Uses Gemini with knowledge base for grounded financial advice
 */

import { GoogleGenerativeAI } from '@google/genai';
import { RealityScoreResult } from '../../lib/utils/realityScore';
import { Citation, extractCitations } from './fileSearchStore';
import { formatKRW } from '../../lib/utils/dsr';

// Import knowledge documents
import ltvDsrContent from '../../data/knowledge/regulations/ltv_dsr_2024.md?raw';
import acquisitionTaxContent from '../../data/knowledge/regulations/acquisition_tax_2024.md?raw';

const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY
  ? process.env.GEMINI_API_KEY
  : '';

export interface ApplicableRegulation {
  name: string;
  description: string;
  impact: string;
  source: string;
  effectiveDate?: string;
}

export interface Recommendation {
  priority: number;
  category: 'savings' | 'debt' | 'income' | 'property' | 'timing' | 'tax';
  title: string;
  description: string;
  impact: string;
  timeframe: string;
  steps: string[];
}

export interface FinancialAdviceResult {
  summary: string;
  applicableRegulations: ApplicableRegulation[];
  recommendations: Recommendation[];
  taxImplications: TaxImplication[];
  warnings: string[];
  opportunities: string[];
  citations: Citation[];
  generatedAt: string;
}

export interface TaxImplication {
  taxType: string;
  estimatedAmount: number;
  description: string;
  reducible: boolean;
  reductionMethod?: string;
}

export interface FinancialAdviceInput {
  realityScore: RealityScoreResult;
  userContext: {
    region: string;
    regionName: string;
    isFirstHome: boolean;
    houseCount: number;
    annualIncome: number;
    targetPrice: number;
    cashAvailable: number;
    targetMoveInDate?: string;
  };
}

/**
 * Build knowledge context for financial advice
 */
function buildFinancialKnowledgeContext(): string {
  return `
## Korean Real Estate Regulations Reference

### LTV/DSR Regulations
${ltvDsrContent}

### Acquisition Tax Information
${acquisitionTaxContent}
`;
}

/**
 * Get financial advice with RAG enhancement
 */
export async function getFinancialAdviceWithRAG(
  input: FinancialAdviceInput
): Promise<FinancialAdviceResult> {
  const { realityScore, userContext } = input;

  if (!apiKey) {
    return generateFallbackAdvice(input);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const knowledgeContext = buildFinancialKnowledgeContext();

    const prompt = `You are an expert Korean real estate financial advisor. Provide personalized advice based on this analysis.

${knowledgeContext}

## User Financial Analysis

**Reality Score:** ${realityScore.score}/100 (Grade: ${realityScore.grade})

**Score Breakdown:**
- LTV Score: ${realityScore.breakdown.ltvScore}/25
- DSR Score: ${realityScore.breakdown.dsrScore}/25
- Cash Gap Score: ${realityScore.breakdown.cashGapScore}/25
- Stability Score: ${realityScore.breakdown.stabilityScore}/25

**Financial Details:**
- Target Property: ${formatKRW(userContext.targetPrice)}
- Annual Income: ${formatKRW(userContext.annualIncome)}
- Available Cash: ${formatKRW(userContext.cashAvailable)}
- Max Loan Available: ${formatKRW(realityScore.analysis.maxLoanAmount)}
- Required Cash: ${formatKRW(realityScore.analysis.requiredCash)}
- Cash Gap: ${formatKRW(realityScore.analysis.gapAmount)}
- Monthly Payment: ${formatKRW(realityScore.analysis.monthlyRepayment)}
- DSR: ${realityScore.analysis.dsrPercentage}%
- Limiting Factor: ${realityScore.analysis.limitingFactor}

**User Profile:**
- Region: ${userContext.regionName}
- Is Speculative Zone: ${realityScore.region.isSpeculativeZone}
- Is Adjusted Zone: ${realityScore.region.isAdjustedZone}
- Current Houses Owned: ${userContext.houseCount}
- First-time Buyer: ${userContext.isFirstHome}
- Target Move-in: ${userContext.targetMoveInDate || 'Flexible'}

**Identified Risks:**
${realityScore.risks.map(r => `- [${r.type}] ${r.title}: ${r.message}`).join('\n')}

## Instructions

Provide comprehensive financial advice that:
1. Identifies which specific regulations apply to this user
2. Calculates approximate tax implications
3. Provides actionable recommendations with priorities
4. Highlights opportunities (first-time buyer benefits, timing, etc.)
5. Warns about potential issues

## Response Format (JSON):

{
  "summary": "2-3 sentence overview of their situation and key advice",
  "applicableRegulations": [
    {
      "name": "DSR 40% Limit",
      "description": "Debt service ratio cannot exceed 40% of annual income",
      "impact": "Your DSR is X%, so you can borrow up to Y",
      "source": "Financial Services Commission 2024",
      "effectiveDate": "2024-01-01"
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "category": "savings|debt|income|property|timing|tax",
      "title": "Build Additional Savings",
      "description": "You need X more for the down payment",
      "impact": "Reduces required loan by X",
      "timeframe": "6-12 months",
      "steps": ["Step 1", "Step 2"]
    }
  ],
  "taxImplications": [
    {
      "taxType": "Acquisition Tax",
      "estimatedAmount": 12000000,
      "description": "2.2% rate applies for 600-900M properties",
      "reducible": true,
      "reductionMethod": "First-time buyer reduction available"
    }
  ],
  "warnings": ["Warning message 1"],
  "opportunities": ["Opportunity 1"]
}

Respond ONLY with valid JSON.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    });

    const response = result.response;
    const text = response.text();

    const parsed = JSON.parse(text) as Omit<FinancialAdviceResult, 'citations' | 'generatedAt'>;

    // Extract citations
    const citations = extractCitations(response.candidates?.[0]?.groundingMetadata);
    citations.push(
      { source: 'LTV/DSR Regulations 2024', excerpt: 'FSC guidelines', relevance: 'Loan limits' },
      { source: 'Acquisition Tax 2024', excerpt: 'Tax calculation basis', relevance: 'Tax estimates' }
    );

    return {
      ...parsed,
      citations,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Financial advice error:', error);
    return generateFallbackAdvice(input);
  }
}

/**
 * Generate fallback advice when API is unavailable
 */
function generateFallbackAdvice(input: FinancialAdviceInput): FinancialAdviceResult {
  const { realityScore, userContext } = input;
  const { analysis, region, risks } = realityScore;

  const applicableRegulations: ApplicableRegulation[] = [];
  const recommendations: Recommendation[] = [];
  const taxImplications: TaxImplication[] = [];
  const warnings: string[] = [];
  const opportunities: string[] = [];

  // Determine applicable regulations
  if (region.isSpeculativeZone) {
    applicableRegulations.push({
      name: 'Speculative Zone LTV Limits',
      description: `LTV limited to ${analysis.applicableLTV}% in ${userContext.regionName}`,
      impact: `Maximum loan: ${formatKRW(analysis.maxLoanByLTV)}`,
      source: 'Financial Services Commission',
      effectiveDate: '2024-01-01',
    });
  }

  applicableRegulations.push({
    name: 'DSR 40% Regulation',
    description: 'Total debt payments cannot exceed 40% of annual income',
    impact: `Your DSR: ${analysis.dsrPercentage.toFixed(1)}% (${analysis.dsrPercentage <= 40 ? 'Within limit' : 'Exceeds limit'})`,
    source: 'Financial Services Commission',
    effectiveDate: '2024-01-01',
  });

  // Generate recommendations based on situation
  if (analysis.gapAmount > 0) {
    recommendations.push({
      priority: 1,
      category: 'savings',
      title: 'Build Additional Savings',
      description: `You need ${formatKRW(analysis.gapAmount)} more to complete this purchase`,
      impact: 'Enables you to proceed with the purchase',
      timeframe: calculateSavingsTimeframe(analysis.gapAmount, userContext.annualIncome * 0.2),
      steps: [
        'Set up automatic monthly savings',
        'Reduce discretionary spending',
        'Consider temporary income sources',
        'Review current assets that could be liquidated'
      ],
    });
  }

  if (analysis.dsrPercentage > 35) {
    recommendations.push({
      priority: 2,
      category: 'debt',
      title: 'Optimize Debt Structure',
      description: 'Reduce existing debt to improve DSR ratio',
      impact: `Could increase loan capacity by up to ${formatKRW(analysis.maxLoanAmount * 0.1)}`,
      timeframe: '3-6 months',
      steps: [
        'Pay off high-interest credit card debt',
        'Consolidate loans if possible',
        'Avoid new debt before mortgage application'
      ],
    });
  }

  if (analysis.limitingFactor === 'LTV' && !region.isSpeculativeZone) {
    recommendations.push({
      priority: 3,
      category: 'property',
      title: 'Consider Non-Regulated Areas',
      description: 'Higher LTV limits available in non-speculative zones',
      impact: 'Could increase loan capacity by 10-20%',
      timeframe: 'Immediate',
      steps: [
        'Research similar properties in adjacent non-regulated areas',
        'Compare total costs including commute',
        'Evaluate neighborhood development potential'
      ],
    });
  }

  // Tax implications
  const priceIn억 = userContext.targetPrice / 100000000;
  let taxRate = priceIn억 <= 6 ? 1.1 : priceIn억 <= 9 ? 2.2 : 3.5;
  if (userContext.houseCount >= 2) taxRate = 8.4;
  if (userContext.houseCount >= 3) taxRate = 12.4;

  taxImplications.push({
    taxType: 'Acquisition Tax',
    estimatedAmount: Math.round(userContext.targetPrice * (taxRate / 100)),
    description: `${taxRate}% rate applies (${userContext.houseCount >= 2 ? 'multi-house' : priceIn억 <= 6 ? 'under 600M' : priceIn억 <= 9 ? '600-900M' : 'over 900M'})`,
    reducible: userContext.isFirstHome && priceIn억 <= 6,
    reductionMethod: userContext.isFirstHome ? 'First-time buyer 50% reduction available' : undefined,
  });

  // Warnings from risks
  risks.filter(r => r.type === 'critical' || r.type === 'warning').forEach(risk => {
    warnings.push(`${risk.title}: ${risk.message}`);
  });

  // Opportunities
  if (userContext.isFirstHome) {
    opportunities.push('First-time buyer benefits may apply: reduced acquisition tax and relaxed LTV limits');
  }
  if (analysis.dsrPercentage < 30) {
    opportunities.push('Your DSR is well below the limit, giving you flexibility for future financial needs');
  }
  if (!region.isSpeculativeZone && !region.isAdjustedZone) {
    opportunities.push('Non-regulated area: You have access to maximum LTV limits (70%)');
  }

  // Generate summary
  let summary: string;
  if (realityScore.grade === 'A' || realityScore.grade === 'B') {
    summary = `Your financial position is ${realityScore.grade === 'A' ? 'excellent' : 'good'} for this purchase. ${
      analysis.gapAmount > 0 ? `You need an additional ${formatKRW(analysis.gapAmount)}, but this is achievable.` : 'All funding requirements are met.'
    }`;
  } else if (realityScore.grade === 'C') {
    summary = `This purchase is moderately challenging. Focus on ${
      analysis.limitingFactor === 'CASH' ? 'building savings' : analysis.limitingFactor === 'DSR' ? 'reducing debt' : 'exploring alternative properties'
    } to improve feasibility.`;
  } else {
    summary = `Significant gaps exist for this purchase. Consider ${
      formatKRW(userContext.targetPrice * 0.8)
    } or lower price range, or plan for a longer savings period.`;
  }

  return {
    summary,
    applicableRegulations,
    recommendations,
    taxImplications,
    warnings,
    opportunities,
    citations: [
      { source: 'LTV/DSR Regulations 2024', excerpt: 'FSC guidelines', relevance: 'Loan calculations' },
      { source: 'Acquisition Tax 2024', excerpt: 'Tax rates', relevance: 'Tax estimates' }
    ],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate savings timeframe
 */
function calculateSavingsTimeframe(target: number, annualSavings: number): string {
  if (annualSavings <= 0) return 'Unable to estimate';
  const months = Math.ceil((target / annualSavings) * 12);
  if (months <= 6) return `${months} months`;
  if (months <= 12) return '6-12 months';
  if (months <= 24) return '1-2 years';
  return '2+ years';
}
