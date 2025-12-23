import { useMutation } from '@tanstack/react-query';

interface ContractInput {
  text?: string;
  fileBase64?: string;
  mimeType?: string;
}

export interface Risk {
  clause: string;
  explanation: string;
  severity: 'High' | 'Medium' | 'Low';
  suggestion: string[];
}

export interface AnalysisResult {
  summary: string;
  risks: Risk[];
}

interface SaveAnalysisInput {
  analysis: AnalysisResult;
  originalText: string;
  attachedFile: {
    name: string;
    type: string;
    size: number;
  } | null;
}

async function analyzeContract(input: ContractInput): Promise<AnalysisResult> {
  // Mock API call - replace with actual Gemini API integration
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulated analysis result
  const mockResult: AnalysisResult = {
    summary: 'The contract contains several clauses that require careful review. There are potential concerns regarding deposit protection and early termination penalties that should be addressed before signing.',
    risks: [
      {
        clause: 'If the tenant terminates the contract early, 50% of the deposit will be forfeited as penalty.',
        explanation: 'This penalty clause exceeds the typical 10-20% range and may be considered excessive under Korean Civil Law Article 398.',
        severity: 'High',
        suggestion: [
          'Negotiate to reduce the penalty to 10-20% of the deposit',
          'Request a grace period for early termination',
          'Document any verbal agreements about flexibility'
        ]
      },
      {
        clause: 'The landlord may enter the property at any time for inspection purposes.',
        explanation: 'This clause violates tenant privacy rights. Korean law requires 24-hour advance notice for non-emergency inspections.',
        severity: 'Medium',
        suggestion: [
          'Request amendment to require 24-48 hour advance notice',
          'Specify inspection hours (e.g., 10am-6pm on weekdays)',
          'Add clause excluding weekends and holidays'
        ]
      },
      {
        clause: 'Deposit will be returned within 60 days after contract termination.',
        explanation: 'The standard return period is 1-2 weeks. A 60-day delay may indicate financial instability or intent to delay.',
        severity: 'Low',
        suggestion: [
          'Negotiate for 2-week return period',
          'Request bank guarantee for the deposit',
          'Verify property ownership and mortgage status'
        ]
      }
    ]
  };

  // If no content provided, return empty result
  if (!input.text && !input.fileBase64) {
    return {
      summary: 'No contract content provided for analysis.',
      risks: []
    };
  }

  return mockResult;
}

async function saveAnalysisToStorage(input: SaveAnalysisInput): Promise<{ success: boolean; id: string }> {
  // Mock save operation - replace with actual backend API
  await new Promise(resolve => setTimeout(resolve, 500));

  const savedAnalyses = JSON.parse(localStorage.getItem('realcare_analyses') || '[]');
  const newEntry = {
    id: `analysis_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...input
  };

  savedAnalyses.unshift(newEntry);
  localStorage.setItem('realcare_analyses', JSON.stringify(savedAnalyses.slice(0, 50))); // Keep last 50

  return { success: true, id: newEntry.id };
}

export function useContractAnalysis() {
  return useMutation({
    mutationFn: analyzeContract,
    mutationKey: ['contractAnalysis'],
  });
}

export function useSaveAnalysis() {
  return useMutation({
    mutationFn: saveAnalysisToStorage,
    mutationKey: ['saveAnalysis'],
  });
}
