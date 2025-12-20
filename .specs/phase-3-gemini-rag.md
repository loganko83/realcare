# Phase 3: Gemini File Search API (RAG) Integration

> Implement knowledge-augmented AI with Korean real estate regulations and contract templates

## Overview

Integrate Gemini File Search API to create a Retrieval Augmented Generation (RAG) system that enhances AI responses with domain-specific knowledge about Korean real estate.

## Architecture

### RAG System Design
```
┌──────────────────────────────────────────────────────────────────┐
│                    Gemini RAG Architecture                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  Knowledge Store                           │    │
│  │                                                            │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │    │
│  │  │ Regulations │  │  Contract   │  │   Legal     │       │    │
│  │  │   Store     │  │  Templates  │  │  Precedents │       │    │
│  │  │             │  │   Store     │  │   Store     │       │    │
│  │  │ • LTV/DSR   │  │ • Lease     │  │ • Court     │       │    │
│  │  │ • Tax laws  │  │ • Sale      │  │   rulings   │       │    │
│  │  │ • Zones     │  │ • Standard  │  │ • Common    │       │    │
│  │  │ • Updates   │  │   clauses   │  │   disputes  │       │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                     │
│                              ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  Gemini File Search                        │    │
│  │                                                            │    │
│  │   User Query ──▶ Semantic Search ──▶ Relevant Chunks       │    │
│  │                                                            │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                     │
│                              ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                 Gemini 2.5 Flash                           │    │
│  │                                                            │    │
│  │   Query + Retrieved Context ──▶ Grounded Response          │    │
│  │                                                            │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Specification: File Search Store Management

### User Stories

**US-3.1**: As an admin, I want to upload regulation documents so that AI responses are based on current laws.

**US-3.2**: As a user, I want AI answers to cite specific regulations so that I can verify the information.

**US-3.3**: As a user, I want contract analysis to reference standard templates so that I know what's typical.

### Technical Requirements

#### TR-3.1: File Search Store Setup
```typescript
// src/services/gemini/fileSearchStore.ts

import { GoogleGenAI, FileSearchStore } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface StoreConfig {
  displayName: string;
  description: string;
}

export const STORE_CONFIGS = {
  regulations: {
    displayName: 'realcare-regulations',
    description: 'Korean real estate regulations, LTV/DSR rules, tax laws',
  },
  contracts: {
    displayName: 'realcare-contracts',
    description: 'Standard contract templates and clause analysis',
  },
  precedents: {
    displayName: 'realcare-precedents',
    description: 'Legal precedents and dispute resolutions',
  },
} as const;

export type StoreType = keyof typeof STORE_CONFIGS;

// Store references cached after creation
let storeCache: Record<StoreType, FileSearchStore | null> = {
  regulations: null,
  contracts: null,
  precedents: null,
};

export async function getOrCreateStore(type: StoreType): Promise<FileSearchStore> {
  if (storeCache[type]) {
    return storeCache[type]!;
  }

  const config = STORE_CONFIGS[type];

  // Check if store exists
  const existingStores = await ai.fileSearchStores.list();
  const existing = existingStores.find(s => s.displayName === config.displayName);

  if (existing) {
    storeCache[type] = existing;
    return existing;
  }

  // Create new store
  const newStore = await ai.fileSearchStores.create({
    config: {
      displayName: config.displayName,
    }
  });

  storeCache[type] = newStore;
  return newStore;
}

export async function uploadDocument(
  storeType: StoreType,
  file: File | string,
  metadata?: Record<string, string>
): Promise<string> {
  const store = await getOrCreateStore(storeType);

  const operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file,
    fileSearchStoreName: store.name,
    config: {
      displayName: typeof file === 'string' ? file : file.name,
      // Chunking config for Korean text
      chunkingConfig: {
        maxChunkSizeTokens: 512,
        overlapTokens: 100,
      },
      ...(metadata && { metadata }),
    },
  });

  // Wait for processing to complete
  const result = await operation.waitForCompletion();
  return result.name;
}
```

#### TR-3.2: Knowledge Base Documents

**Regulations Store Documents:**
```
regulations/
├── ltv_dsr_2024.md           # LTV/DSR regulations by region
├── acquisition_tax_2024.md   # Acquisition tax rules
├── transfer_tax_2024.md      # Transfer tax rules
├── holding_tax_2024.md       # Property tax, comprehensive tax
├── speculative_zones.md      # 투기과열지구 list
├── adjusted_zones.md         # 조정대상지역 list
├── first_home_benefits.md    # 생애최초 benefits
└── rental_business.md        # 임대사업자 regulations
```

**Contracts Store Documents:**
```
contracts/
├── standard_lease_template.md    # 표준 임대차 계약서
├── standard_sale_template.md     # 표준 매매 계약서
├── dangerous_clauses.md          # Common risky clauses
├── negotiation_points.md         # Key negotiation items
├── tenant_rights.md              # 임차인 권리 (전세보호법 등)
└── deposit_protection.md         # 보증금 보호 제도
```

**Precedents Store Documents:**
```
precedents/
├── deposit_disputes.md           # 보증금 분쟁 판례
├── contract_termination.md       # 계약 해지 판례
├── defect_liability.md           # 하자담보 책임 판례
├── fraud_cases.md                # 전세사기 관련 판례
└── landlord_tenant.md            # 임대인-임차인 분쟁
```

#### TR-3.3: Sample Knowledge Document Format
```markdown
<!-- regulations/ltv_dsr_2024.md -->
# LTV/DSR Regulations 2024

## Overview
Last Updated: 2024-01-15
Source: Financial Services Commission

## LTV (Loan-to-Value) Limits

### Speculative Overheated Districts (투기과열지구)
- First-time home buyers: 50%
- 1 house owners: 30%
- 2+ house owners: 0% (no mortgage)

Applicable areas:
- Seoul: All districts
- Gyeonggi: Gwacheon, Seongnam (Bundang, Sujeong)...

### Adjusted Areas (조정대상지역)
- First-time home buyers: 60%
- 1 house owners: 50%
- 2+ house owners: 30%

### Non-regulated Areas
- All buyers: 70%

## DSR (Debt Service Ratio) Limits

### Standard DSR: 40%
Applies to all regulated area mortgage loans.

### Calculation Method
DSR = (Annual principal + interest payments for all loans) / Annual income × 100

### Exceptions
- Loans under 100M: Subject to simplified DTI instead
- Jeonse loans: Different calculation applies

## References
- Financial Services Commission Notice 2024-1
- Korea Housing Finance Corporation Guidelines
```

## Specification: RAG-Enhanced Contract Analysis

### User Stories

**US-3.4**: As a user, I want contract analysis to compare my contract against standard templates.

**US-3.5**: As a user, I want to see relevant legal precedents for risky clauses.

### Technical Requirements

#### TR-3.4: Enhanced Contract Analysis with RAG
```typescript
// src/services/gemini/contractAnalysisRAG.ts

import { GoogleGenAI, Type } from "@google/genai";
import { getOrCreateStore } from "./fileSearchStore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ContractAnalysisResult {
  summary: string;
  safetyScore: number;
  risks: ClauseRisk[];
  comparisonWithStandard: StandardComparison[];
  relevantPrecedents: PrecedentReference[];
  negotiationGuide: NegotiationPoint[];
  citations: Citation[];
}

export interface ClauseRisk {
  clause: string;
  riskLevel: 'high' | 'medium' | 'low';
  explanation: string;
  suggestion: string[];
  relatedStandard?: string;
}

export interface Citation {
  source: string;
  excerpt: string;
  relevance: string;
}

export async function analyzeContractWithRAG(
  contractText: string,
  contractType: 'lease' | 'sale' | 'monthly',
  fileBase64?: string,
  mimeType?: string
): Promise<ContractAnalysisResult> {
  // Get relevant stores
  const contractsStore = await getOrCreateStore('contracts');
  const precedentsStore = await getOrCreateStore('precedents');

  const parts: any[] = [];

  // Add file if provided
  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: fileBase64,
        mimeType,
      }
    });
  }

  const prompt = `Analyze this ${contractType} contract from the perspective of the tenant/buyer.

Contract text:
${contractText}

Instructions:
1. Identify all risk clauses comparing with standard templates
2. For each risk, cite relevant standard clause or precedent
3. Provide specific negotiation suggestions
4. Calculate an overall safety score (0-100)

All responses must be in Korean.`;

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      systemInstruction: `You are an expert Korean real estate contract analyzer.
        Use the provided knowledge base to ground your analysis.
        Always cite sources when making claims about standard practices or legal requirements.
        Be thorough but practical in your suggestions.`,
      tools: [{
        fileSearch: {
          fileSearchStoreNames: [
            contractsStore.name,
            precedentsStore.name,
          ]
        }
      }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          safetyScore: { type: Type.NUMBER },
          risks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                clause: { type: Type.STRING },
                riskLevel: { type: Type.STRING },
                explanation: { type: Type.STRING },
                suggestion: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                relatedStandard: { type: Type.STRING },
              }
            }
          },
          comparisonWithStandard: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                clause: { type: Type.STRING },
                standardVersion: { type: Type.STRING },
                contractVersion: { type: Type.STRING },
                difference: { type: Type.STRING },
              }
            }
          },
          relevantPrecedents: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                caseId: { type: Type.STRING },
                summary: { type: Type.STRING },
                relevance: { type: Type.STRING },
              }
            }
          },
          negotiationGuide: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                priority: { type: Type.NUMBER },
                item: { type: Type.STRING },
                script: { type: Type.STRING },
              }
            }
          },
        }
      }
    }
  });

  const result = JSON.parse(response.text || "{}");

  // Extract citations from grounding metadata
  const citations = extractCitations(response.candidates?.[0]?.groundingMetadata);

  return {
    ...result,
    citations,
  };
}

function extractCitations(groundingMetadata: any): Citation[] {
  if (!groundingMetadata?.groundingChunks) {
    return [];
  }

  return groundingMetadata.groundingChunks.map((chunk: any) => ({
    source: chunk.retrievedContext?.title || 'Unknown',
    excerpt: chunk.retrievedContext?.text || '',
    relevance: 'Retrieved from knowledge base',
  }));
}
```

## Specification: RAG-Enhanced Financial Advice

### User Stories

**US-3.6**: As a user, I want financial advice that cites current regulations.

**US-3.7**: As a user, I want to know which regulations affect my specific situation.

### Technical Requirements

#### TR-3.5: Financial Advice with Regulation Context
```typescript
// src/services/gemini/financialAdviceRAG.ts

import { GoogleGenAI } from "@google/genai";
import { getOrCreateStore } from "./fileSearchStore";
import { RealityScoreResult } from "@/lib/utils/realityScore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface FinancialAdviceResult {
  summary: string;
  applicableRegulations: ApplicableRegulation[];
  recommendations: Recommendation[];
  warnings: string[];
  citations: Citation[];
}

export interface ApplicableRegulation {
  name: string;
  description: string;
  impact: string;
  source: string;
}

export async function getFinancialAdviceWithRAG(
  realityScore: RealityScoreResult,
  userContext: {
    region: string;
    isFirstHome: boolean;
    houseCount: number;
    annualIncome: number;
    targetPrice: number;
  }
): Promise<FinancialAdviceResult> {
  const regulationsStore = await getOrCreateStore('regulations');

  const prompt = `Based on this financial analysis, provide advice grounded in current regulations.

Reality Score: ${realityScore.score}/100 (Grade: ${realityScore.grade})

User Context:
- Region: ${userContext.region}
- First-time buyer: ${userContext.isFirstHome ? 'Yes' : 'No'}
- Current house count: ${userContext.houseCount}
- Annual income: ${(userContext.annualIncome / 10000).toFixed(0)}만원
- Target property: ${(userContext.targetPrice / 10000).toFixed(0)}만원

Analysis Results:
- Max loan: ${(realityScore.analysis.maxLoanAmount / 10000).toFixed(0)}만원
- Required cash: ${(realityScore.analysis.requiredCash / 10000).toFixed(0)}만원
- Gap: ${(realityScore.analysis.gapAmount / 10000).toFixed(0)}만원
- DSR: ${realityScore.analysis.dsr}%

Provide:
1. Which specific regulations apply to this user
2. Practical recommendations
3. Any warnings about regulatory changes or risks

All responses in Korean.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{
        fileSearch: {
          fileSearchStoreNames: [regulationsStore.name]
        }
      }]
    }
  });

  // Parse response with citations
  return parseFinancialAdviceResponse(response);
}
```

## Specification: Knowledge Base Administration

### User Stories

**US-3.8**: As an admin, I want to update the knowledge base when regulations change.

**US-3.9**: As an admin, I want to see which documents are in the knowledge base.

### Technical Requirements

#### TR-3.6: Admin Service for Knowledge Management
```typescript
// src/services/gemini/knowledgeAdmin.ts

import { GoogleGenAI } from "@google/genai";
import { getOrCreateStore, STORE_CONFIGS, StoreType } from "./fileSearchStore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DocumentInfo {
  name: string;
  displayName: string;
  sizeBytes: number;
  createTime: string;
  state: string;
}

export async function listDocuments(storeType: StoreType): Promise<DocumentInfo[]> {
  const store = await getOrCreateStore(storeType);

  // Note: This would use the actual API method
  // The exact API may vary - this is illustrative
  const files = await ai.fileSearchStores.listFiles({
    fileSearchStoreName: store.name,
  });

  return files.map(f => ({
    name: f.name,
    displayName: f.displayName || 'Unknown',
    sizeBytes: f.sizeBytes || 0,
    createTime: f.createTime || '',
    state: f.state || 'UNKNOWN',
  }));
}

export async function deleteDocument(
  storeType: StoreType,
  documentName: string
): Promise<void> {
  const store = await getOrCreateStore(storeType);

  await ai.fileSearchStores.deleteFile({
    fileSearchStoreName: store.name,
    fileName: documentName,
  });
}

export async function updateDocument(
  storeType: StoreType,
  documentName: string,
  newContent: string | File
): Promise<string> {
  // Delete old version
  await deleteDocument(storeType, documentName);

  // Upload new version
  const store = await getOrCreateStore(storeType);

  const operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file: newContent,
    fileSearchStoreName: store.name,
    config: {
      displayName: documentName,
    },
  });

  const result = await operation.waitForCompletion();
  return result.name;
}

export async function getStoreStats(): Promise<Record<StoreType, StoreStats>> {
  const stats: Record<StoreType, StoreStats> = {} as any;

  for (const [type, config] of Object.entries(STORE_CONFIGS)) {
    const store = await getOrCreateStore(type as StoreType);
    const files = await listDocuments(type as StoreType);

    stats[type as StoreType] = {
      name: config.displayName,
      documentCount: files.length,
      totalSizeBytes: files.reduce((sum, f) => sum + f.sizeBytes, 0),
      lastUpdated: files.reduce((latest, f) =>
        f.createTime > latest ? f.createTime : latest, ''),
    };
  }

  return stats;
}

export interface StoreStats {
  name: string;
  documentCount: number;
  totalSizeBytes: number;
  lastUpdated: string;
}
```

## Implementation Tasks

### Task 3.1: Setup File Search Stores
- Create store management service
- Initialize three stores (regulations, contracts, precedents)
- Test store creation and access

### Task 3.2: Prepare Knowledge Documents
- Create regulations documents (LTV, DSR, taxes)
- Create contract template documents
- Create precedent summaries
- Format all documents for optimal chunking

### Task 3.3: Implement Document Upload
- Create admin upload interface
- Implement batch upload for initial data
- Add metadata tagging

### Task 3.4: Integrate RAG with Contract Analysis
- Modify analyzeContract to use File Search
- Add citation extraction
- Update UI to show sources

### Task 3.5: Integrate RAG with Financial Advice
- Modify financial advice to use regulations store
- Add applicable regulation display
- Update UI to show regulation citations

### Task 3.6: Create Admin Dashboard
- List documents in each store
- Upload/delete/update documents
- Show store statistics

## Knowledge Base Content Plan

### Initial Documents (Priority Order)

1. **LTV/DSR Regulations** - Critical for Reality Check
2. **Acquisition Tax Tables** - Used in every calculation
3. **Standard Lease Contract** - Most common use case
4. **Tenant Rights Summary** - High user value
5. **Transfer Tax Rules** - For sellers
6. **Speculative Zone List** - Affects LTV

### Update Schedule

| Document Type | Update Frequency | Trigger |
|--------------|------------------|---------|
| Zone designations | Monthly | Government announcement |
| Tax rates | Annually | Tax law changes |
| Standard contracts | As needed | Template updates |
| Precedents | Quarterly | New significant rulings |

## Acceptance Criteria

- [ ] Three File Search stores created and accessible
- [ ] At least 10 documents uploaded to knowledge base
- [ ] Contract analysis shows citations from knowledge base
- [ ] Financial advice references specific regulations
- [ ] Admin can manage documents via UI
- [ ] RAG responses are more accurate than non-RAG
