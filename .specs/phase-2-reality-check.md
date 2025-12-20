# Phase 2: Reality Check Engine

> Implement comprehensive financial simulation with Korean real estate regulations

## Current State Analysis

### Implemented
| Feature | Status | Gap |
|---------|--------|-----|
| Basic LTV/DSR calculation | Partial | Hardcoded 70%/40%, no region logic |
| Tax calculators | Partial | Missing holding tax, incomplete rates |
| AI financial advice | Done | Basic Gemini integration |
| Score visualization | Done | Radial chart with Recharts |

### Missing Features
1. **Region-based regulations** - No 투기과열지구/조정대상지역 logic
2. **Multi-house tax rates** - Simplified, not accurate
3. **Detailed DSR calculation** - Missing debt breakdown
4. **Scenario comparison** - Not implemented
5. **Action plan generation** - Not implemented
6. **Report persistence** - Not saving to backend

## Target Architecture

### Data Flow
```
┌──────────────────────────────────────────────────────────────┐
│                    Reality Check Engine                        │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │   User      │───▶│  Regulation │───▶│  Calculator │       │
│  │   Input     │    │   Lookup    │    │   Engine    │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
│        │                   │                  │               │
│        │                   ▼                  ▼               │
│        │            ┌─────────────┐    ┌─────────────┐       │
│        │            │  Region DB  │    │   Tax DB    │       │
│        │            │  (JSON)     │    │   (JSON)    │       │
│        │            └─────────────┘    └─────────────┘       │
│        │                                      │               │
│        ▼                                      ▼               │
│  ┌─────────────┐                       ┌─────────────┐       │
│  │   Gemini    │◀──────────────────────│   Score     │       │
│  │   AI        │                       │   Engine    │       │
│  └─────────────┘                       └─────────────┘       │
│        │                                      │               │
│        ▼                                      ▼               │
│  ┌─────────────────────────────────────────────────┐         │
│  │                 Reality Report                    │         │
│  │  • Score (0-100)                                 │         │
│  │  • Loan Analysis                                 │         │
│  │  • Tax Analysis                                  │         │
│  │  • Gap Analysis                                  │         │
│  │  • Action Plan (AI)                              │         │
│  │  • Scenario Comparison                           │         │
│  └─────────────────────────────────────────────────┘         │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## Specification: Regulation Data Model

### User Stories

**US-2.1**: As a user, I want to select my target property location so that regulations are automatically applied.

**US-2.2**: As a user, I want to see which regulations affect my purchase so that I understand the constraints.

### Technical Requirements

#### TR-2.1: Region Data Schema
```typescript
// src/lib/constants/regulations.ts

export interface RegionRegulation {
  code: string;           // Administrative code
  name: string;           // e.g., "Seoul Gangnam-gu"
  isSpeculativeZone: boolean;       // 투기과열지구
  isAdjustedZone: boolean;          // 조정대상지역
  ltvLimits: {
    firstHome: number;              // First-time buyer LTV %
    owned1: number;                 // 1 house owner LTV %
    owned2Plus: number;             // 2+ house owner LTV %
  };
  acquisitionTaxRates: {
    under6억: number;               // Rate for <600M
    between6_9억: number;           // Rate for 600M-900M
    over9억: number;                // Rate for >900M
    multiHouse2: number;            // 2 house rate
    multiHouse3Plus: number;        // 3+ house rate
  };
  holdingTaxMultiplier: number;     // 종부세 multiplier
  effectiveDate: string;            // When regulations took effect
}

export const SEOUL_REGULATIONS: Record<string, RegionRegulation> = {
  "11680": {  // Gangnam-gu
    code: "11680",
    name: "Seoul Gangnam-gu",
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
  // ... other districts
};
```

#### TR-2.2: DSR Calculation Engine
```typescript
// src/lib/utils/dsr.ts

export interface DSRInput {
  annualIncome: number;           // Annual income in KRW
  newMortgage: {
    principal: number;
    interestRate: number;
    termYears: number;
  };
  existingDebts: {
    mortgage?: { monthlyPayment: number };
    creditLoan?: { monthlyPayment: number };
    carLoan?: { monthlyPayment: number };
    other?: { monthlyPayment: number };
  };
}

export interface DSRResult {
  totalAnnualPayment: number;
  dsrPercentage: number;
  isWithinLimit: boolean;
  maxAdditionalLoan: number;
  breakdown: {
    newMortgageAnnual: number;
    existingDebtAnnual: number;
  };
}

export function calculateDSR(input: DSRInput): DSRResult {
  const DSR_LIMIT = 40;

  // Calculate monthly payment for new mortgage (amortization formula)
  const r = input.newMortgage.interestRate / 100 / 12;
  const n = input.newMortgage.termYears * 12;
  const P = input.newMortgage.principal;

  const monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const newMortgageAnnual = monthlyPayment * 12;

  // Sum existing debts
  const existingDebtMonthly = Object.values(input.existingDebts)
    .reduce((sum, debt) => sum + (debt?.monthlyPayment || 0), 0);
  const existingDebtAnnual = existingDebtMonthly * 12;

  const totalAnnualPayment = newMortgageAnnual + existingDebtAnnual;
  const dsrPercentage = (totalAnnualPayment / input.annualIncome) * 100;

  // Calculate max additional loan
  const availableAnnualPayment = (input.annualIncome * DSR_LIMIT / 100) - existingDebtAnnual;
  const maxMonthlyPayment = availableAnnualPayment / 12;
  const maxAdditionalLoan = maxMonthlyPayment * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));

  return {
    totalAnnualPayment,
    dsrPercentage: Math.round(dsrPercentage * 100) / 100,
    isWithinLimit: dsrPercentage <= DSR_LIMIT,
    maxAdditionalLoan: Math.max(0, maxAdditionalLoan),
    breakdown: {
      newMortgageAnnual,
      existingDebtAnnual,
    },
  };
}
```

## Specification: Reality Score Algorithm

### User Stories

**US-2.3**: As a user, I want a single score (0-100) that tells me if this purchase is realistic.

**US-2.4**: As a user, I want to understand what factors affect my score.

### Technical Requirements

#### TR-2.3: Score Calculation Engine
```typescript
// src/lib/utils/realityScore.ts

export interface RealityScoreInput {
  propertyPrice: number;
  userFinancials: {
    annualIncome: number;
    totalAssets: number;
    cashAssets: number;
    totalDebt: number;
    houseCount: number;
    isFirstHome: boolean;
  };
  region: RegionRegulation;
  loanTermYears: number;
  interestRate: number;
}

export interface RealityScoreResult {
  score: number;                    // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    ltvScore: number;               // 0-25 points
    dsrScore: number;               // 0-25 points
    cashGapScore: number;           // 0-25 points
    stabilityScore: number;         // 0-25 points
  };
  analysis: {
    maxLoanAmount: number;
    requiredCash: number;
    gapAmount: number;
    monthlyRepayment: number;
    dti: number;
    dsr: number;
  };
  risks: RiskFactor[];
}

export interface RiskFactor {
  type: 'critical' | 'warning' | 'info';
  category: 'loan' | 'cash' | 'regulation' | 'income';
  message: string;
  suggestion?: string;
}

export function calculateRealityScore(input: RealityScoreInput): RealityScoreResult {
  const { propertyPrice, userFinancials, region, loanTermYears, interestRate } = input;

  // 1. Calculate LTV
  const applicableLTV = userFinancials.isFirstHome
    ? region.ltvLimits.firstHome
    : userFinancials.houseCount === 0
      ? region.ltvLimits.firstHome
      : userFinancials.houseCount === 1
        ? region.ltvLimits.owned1
        : region.ltvLimits.owned2Plus;

  const maxLoanByLTV = propertyPrice * (applicableLTV / 100);

  // 2. Calculate DSR limit
  const dsrResult = calculateDSR({
    annualIncome: userFinancials.annualIncome,
    newMortgage: {
      principal: maxLoanByLTV,
      interestRate,
      termYears: loanTermYears,
    },
    existingDebts: {},
  });

  const maxLoanByDSR = dsrResult.maxAdditionalLoan;
  const maxLoanAmount = Math.min(maxLoanByLTV, maxLoanByDSR);

  // 3. Calculate cash requirement
  const requiredCash = propertyPrice - maxLoanAmount;
  const gapAmount = Math.max(0, requiredCash - userFinancials.cashAssets);

  // 4. Calculate scores
  const ltvScore = calculateLTVScore(applicableLTV, maxLoanByLTV, propertyPrice);
  const dsrScore = calculateDSRScore(dsrResult.dsrPercentage);
  const cashGapScore = calculateCashGapScore(gapAmount, propertyPrice);
  const stabilityScore = calculateStabilityScore(
    dsrResult.totalAnnualPayment / 12,
    userFinancials.annualIncome / 12
  );

  const totalScore = ltvScore + dsrScore + cashGapScore + stabilityScore;

  // 5. Identify risks
  const risks = identifyRisks({
    gapAmount,
    dsrPercentage: dsrResult.dsrPercentage,
    applicableLTV,
    region,
    userFinancials,
  });

  return {
    score: Math.round(totalScore),
    grade: scoreToGrade(totalScore),
    breakdown: { ltvScore, dsrScore, cashGapScore, stabilityScore },
    analysis: {
      maxLoanAmount,
      requiredCash,
      gapAmount,
      monthlyRepayment: dsrResult.totalAnnualPayment / 12,
      dti: 0, // Calculate separately if needed
      dsr: dsrResult.dsrPercentage,
    },
    risks,
  };
}

function calculateLTVScore(ltv: number, maxLoan: number, price: number): number {
  // 25 points max
  if (ltv >= 70) return 25;
  if (ltv >= 50) return 20;
  if (ltv >= 30) return 10;
  return 5;
}

function calculateDSRScore(dsrPercentage: number): number {
  // 25 points max
  if (dsrPercentage <= 30) return 25;
  if (dsrPercentage <= 35) return 20;
  if (dsrPercentage <= 40) return 15;
  if (dsrPercentage <= 50) return 5;
  return 0;
}

function calculateCashGapScore(gap: number, price: number): number {
  // 25 points max
  const gapRatio = gap / price;
  if (gapRatio === 0) return 25;
  if (gapRatio <= 0.1) return 20;
  if (gapRatio <= 0.2) return 15;
  if (gapRatio <= 0.3) return 10;
  return 0;
}

function calculateStabilityScore(monthlyPayment: number, monthlyIncome: number): number {
  // 25 points max - PTI (Payment to Income) based
  const pti = monthlyPayment / monthlyIncome;
  if (pti <= 0.25) return 25;
  if (pti <= 0.30) return 20;
  if (pti <= 0.35) return 15;
  if (pti <= 0.40) return 10;
  return 5;
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
```

## Specification: AI-Powered Action Plan

### User Stories

**US-2.5**: As a user, I want personalized advice on how to improve my chances of purchase.

**US-2.6**: As a user, I want to see alternative scenarios if my current plan is not feasible.

### Technical Requirements

#### TR-2.4: Action Plan Generator
```typescript
// src/services/gemini/actionPlan.ts

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ActionPlanInput {
  realityScore: RealityScoreResult;
  userGoals: {
    targetMoveInDate?: string;
    flexibility: 'low' | 'medium' | 'high';
    priorities: ('price' | 'location' | 'size' | 'timing')[];
  };
}

export async function generateActionPlan(input: ActionPlanInput): Promise<ActionPlan> {
  const prompt = buildActionPlanPrompt(input);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: `You are a Korean real estate financial advisor.
        Provide actionable, specific advice based on the user's financial situation.
        Be realistic but encouraging. All responses must be in Korean.
        Focus on practical steps the user can take within 1-6 months.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          immediateActions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                priority: { type: Type.NUMBER },
                action: { type: Type.STRING },
                impact: { type: Type.STRING },
                timeframe: { type: Type.STRING },
              }
            }
          },
          alternativeScenarios: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                priceRange: { type: Type.STRING },
                feasibilityScore: { type: Type.NUMBER },
              }
            }
          },
          warnings: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
```

## Specification: Tax Calculator Enhancement

### User Stories

**US-2.7**: As a user, I want accurate tax calculations including all Korean real estate taxes.

### Technical Requirements

#### TR-2.5: Comprehensive Tax Calculator
```typescript
// src/lib/utils/taxCalculator.ts

export interface TaxCalculationInput {
  transactionType: 'purchase' | 'sale';
  propertyPrice: number;
  region: RegionRegulation;
  houseCount: number;
  areaSquareMeters: number;
  holdingPeriodYears?: number;
  purchasePrice?: number;        // For transfer tax
}

export interface TaxResult {
  acquisition: {
    acquisitionTax: number;
    localEducationTax: number;
    agriculturalTax: number;      // If area > 85sqm
    total: number;
    effectiveRate: number;
  };
  transfer?: {
    capitalGain: number;
    longTermDeduction: number;
    basicDeduction: number;
    taxableIncome: number;
    incomeTax: number;
    localIncomeTax: number;
    total: number;
    effectiveRate: number;
  };
  holding: {
    propertyTaxEstimate: number;  // Annual
    comprehensiveTaxEstimate: number;  // If applicable
    total: number;
  };
}

export function calculateAllTaxes(input: TaxCalculationInput): TaxResult {
  return {
    acquisition: calculateAcquisitionTax(input),
    transfer: input.transactionType === 'sale'
      ? calculateTransferTax(input)
      : undefined,
    holding: calculateHoldingTax(input),
  };
}
```

## Implementation Tasks

### Task 2.1: Create Regulation Data
- Create `src/lib/constants/regulations.ts`
- Add Seoul districts regulation data
- Add other major cities

### Task 2.2: Implement DSR Calculator
- Create `src/lib/utils/dsr.ts`
- Add unit tests for edge cases
- Integrate with existing loan calculator

### Task 2.3: Implement Reality Score
- Create `src/lib/utils/realityScore.ts`
- Create score visualization component
- Add breakdown display

### Task 2.4: Enhance Tax Calculators
- Create `src/lib/utils/taxCalculator.ts`
- Add comprehensive holding tax
- Add accurate transfer tax with brackets

### Task 2.5: Implement AI Action Plan
- Create `src/services/gemini/actionPlan.ts`
- Integrate with Reality Check page
- Add scenario comparison UI

### Task 2.6: Create Report System
- Create report data model
- Add save/load functionality via TanStack Query
- Add PDF export for reports

## Acceptance Criteria

- [ ] Region selection affects LTV/DSR calculations
- [ ] Multi-house owner scenarios work correctly
- [ ] Reality Score reflects all factors accurately
- [ ] AI action plan provides actionable advice
- [ ] Tax calculations match manual verification
- [ ] Reports can be saved and retrieved
