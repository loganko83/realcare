/**
 * RAG-Enhanced Contract Analysis
 * Uses Gemini with knowledge base for grounded contract analysis
 */

import { GoogleGenerativeAI } from '@google/genai';
import { Citation, extractCitations } from './fileSearchStore';

// Import knowledge documents
import ltvDsrContent from '../../data/knowledge/regulations/ltv_dsr_2024.md?raw';
import acquisitionTaxContent from '../../data/knowledge/regulations/acquisition_tax_2024.md?raw';
import standardLeaseContent from '../../data/knowledge/contracts/standard_lease_template.md?raw';
import dangerousClausesContent from '../../data/knowledge/contracts/dangerous_clauses.md?raw';

const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY
  ? process.env.GEMINI_API_KEY
  : '';

export interface ClauseRisk {
  clause: string;
  riskLevel: 'high' | 'medium' | 'low';
  explanation: string;
  suggestions: string[];
  relatedStandard?: string;
  legalBasis?: string;
}

export interface StandardComparison {
  aspect: string;
  standardVersion: string;
  contractVersion: string;
  difference: string;
  recommendation: string;
}

export interface PrecedentReference {
  caseId: string;
  summary: string;
  relevance: string;
  outcome: string;
}

export interface NegotiationPoint {
  priority: number;
  item: string;
  currentState: string;
  targetState: string;
  script: string;
}

export interface ContractAnalysisResult {
  summary: string;
  safetyScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  risks: ClauseRisk[];
  comparisonWithStandard: StandardComparison[];
  relevantPrecedents: PrecedentReference[];
  negotiationGuide: NegotiationPoint[];
  citations: Citation[];
  analyzedAt: string;
}

/**
 * Build knowledge context for the prompt
 */
function buildKnowledgeContext(): string {
  return `
## Knowledge Base Context

### Standard Lease Contract Guidelines
${standardLeaseContent}

### Dangerous Clauses Reference
${dangerousClausesContent}

### Relevant Regulations
${ltvDsrContent}

${acquisitionTaxContent}
`;
}

/**
 * Analyze contract with RAG enhancement
 */
export async function analyzeContractWithRAG(
  contractText: string,
  contractType: 'lease' | 'sale' | 'monthly' = 'lease',
  fileBase64?: string,
  mimeType?: string
): Promise<ContractAnalysisResult> {
  if (!apiKey) {
    return generateFallbackAnalysis(contractText, contractType);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const knowledgeContext = buildKnowledgeContext();

    const prompt = `You are an expert Korean real estate contract analyzer. Analyze this ${contractType} contract from the perspective of the tenant/buyer.

${knowledgeContext}

## Contract to Analyze:
${contractText}

## Analysis Instructions:
1. Compare each clause against the standard templates in the knowledge base
2. Identify any dangerous or unusual clauses
3. Reference specific laws or precedents when applicable
4. Provide specific negotiation scripts for problematic clauses
5. Calculate an overall safety score (0-100)

## Response Format (JSON):
{
  "summary": "Brief 2-3 sentence summary of the contract's overall safety",
  "safetyScore": 0-100,
  "risks": [
    {
      "clause": "The problematic clause text",
      "riskLevel": "high|medium|low",
      "explanation": "Why this is risky",
      "suggestions": ["Specific suggestion 1", "Specific suggestion 2"],
      "relatedStandard": "What the standard contract says",
      "legalBasis": "Relevant law or precedent"
    }
  ],
  "comparisonWithStandard": [
    {
      "aspect": "Deposit return period",
      "standardVersion": "Within 14 days",
      "contractVersion": "Within 60 days",
      "difference": "4x longer than standard",
      "recommendation": "Negotiate to 14 days"
    }
  ],
  "relevantPrecedents": [
    {
      "caseId": "2023Da12345",
      "summary": "Court ruled penalty clauses exceeding 20% are excessive",
      "relevance": "Applies to the early termination clause",
      "outcome": "Penalty reduced to 10%"
    }
  ],
  "negotiationGuide": [
    {
      "priority": 1,
      "item": "Early termination penalty",
      "currentState": "50% forfeiture",
      "targetState": "10-15% maximum",
      "script": "I understand the need for commitment, but 50% is above market standard. Could we agree on 10-15%?"
    }
  ]
}

Respond ONLY with valid JSON.`;

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

    // Add image/PDF if provided
    if (fileBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: fileBase64,
          mimeType,
        }
      });
    }

    parts.push({ text: prompt });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    });

    const response = result.response;
    const text = response.text();

    const parsed = JSON.parse(text) as Omit<ContractAnalysisResult, 'citations' | 'analyzedAt' | 'grade'>;

    // Extract citations from grounding metadata if available
    const citations = extractCitations(response.candidates?.[0]?.groundingMetadata);

    // Add knowledge base citations
    citations.push(
      { source: 'Standard Lease Template', excerpt: 'Ministry of Land guidelines', relevance: 'Contract comparison' },
      { source: 'Dangerous Clauses Guide', excerpt: 'Risk identification reference', relevance: 'Risk analysis' }
    );

    return {
      ...parsed,
      grade: scoreToGrade(parsed.safetyScore),
      citations,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Contract analysis error:', error);
    return generateFallbackAnalysis(contractText, contractType);
  }
}

/**
 * Convert safety score to letter grade
 */
function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Generate fallback analysis when API is unavailable
 */
function generateFallbackAnalysis(
  contractText: string,
  contractType: string
): ContractAnalysisResult {
  const risks: ClauseRisk[] = [];
  const lowerText = contractText.toLowerCase();

  // Check for common dangerous patterns
  if (lowerText.includes('50%') && lowerText.includes('penalty')) {
    risks.push({
      clause: 'Early termination penalty clause',
      riskLevel: 'high',
      explanation: 'Penalty appears to exceed standard 10-20% range',
      suggestions: [
        'Negotiate reduction to 10-15%',
        'Request longer notice period instead of penalty',
        'Cite Civil Act Article 398 if landlord refuses'
      ],
      relatedStandard: 'Standard contracts limit penalties to 10-20%',
      legalBasis: 'Civil Act Article 398 - Excessive penalty reduction'
    });
  }

  if (lowerText.includes('any time') && (lowerText.includes('enter') || lowerText.includes('inspection'))) {
    risks.push({
      clause: 'Landlord entry clause',
      riskLevel: 'high',
      explanation: 'Unlimited landlord access violates tenant privacy rights',
      suggestions: [
        'Require 24-48 hours advance notice',
        'Limit inspection hours to 10:00-18:00',
        'Exception only for genuine emergencies'
      ],
      relatedStandard: 'Standard requires advance notice for inspections',
      legalBasis: 'Constitutional right to privacy'
    });
  }

  if (lowerText.includes('60 days') && lowerText.includes('deposit')) {
    risks.push({
      clause: 'Deposit return period',
      riskLevel: 'medium',
      explanation: 'Extended deposit return period exceeds standard 14 days',
      suggestions: [
        'Negotiate to 14 days',
        'Request bank guarantee if refused',
        'Verify landlord financial stability'
      ],
      relatedStandard: 'Standard deposit return is within 14 days',
      legalBasis: 'Housing Lease Protection Act'
    });
  }

  // Calculate score based on risks
  let safetyScore = 80;
  risks.forEach(risk => {
    if (risk.riskLevel === 'high') safetyScore -= 20;
    else if (risk.riskLevel === 'medium') safetyScore -= 10;
    else safetyScore -= 5;
  });
  safetyScore = Math.max(0, Math.min(100, safetyScore));

  return {
    summary: `This ${contractType} contract has ${risks.length} identified concern(s). ${
      risks.filter(r => r.riskLevel === 'high').length > 0
        ? 'High-risk clauses require negotiation before signing.'
        : 'Review the medium-risk items before proceeding.'
    }`,
    safetyScore,
    grade: scoreToGrade(safetyScore),
    risks,
    comparisonWithStandard: [],
    relevantPrecedents: [],
    negotiationGuide: risks.map((risk, idx) => ({
      priority: idx + 1,
      item: risk.clause,
      currentState: 'Unfavorable terms',
      targetState: risk.suggestions[0] || 'Standard terms',
      script: `I would like to discuss the ${risk.clause.toLowerCase()}. ${risk.suggestions[0] || 'Could we align this with standard practice?'}`
    })),
    citations: [
      { source: 'Standard Lease Template', excerpt: 'Ministry of Land guidelines', relevance: 'Comparison basis' },
      { source: 'Dangerous Clauses Guide', excerpt: 'Risk identification', relevance: 'Analysis reference' }
    ],
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Quick risk check without full analysis
 */
export function quickRiskCheck(contractText: string): {
  hasHighRisk: boolean;
  riskIndicators: string[];
} {
  const indicators: string[] = [];
  const lowerText = contractText.toLowerCase();

  if (lowerText.includes('50%') || lowerText.includes('forfeiture')) {
    indicators.push('Potential excessive penalty');
  }
  if (lowerText.includes('any time') && lowerText.includes('enter')) {
    indicators.push('Unlimited landlord access');
  }
  if (lowerText.includes('waive') && lowerText.includes('right')) {
    indicators.push('Rights waiver clause');
  }
  if (lowerText.includes('60 days') || lowerText.includes('90 days')) {
    indicators.push('Extended deposit return');
  }

  return {
    hasHighRisk: indicators.length > 0,
    riskIndicators: indicators,
  };
}
