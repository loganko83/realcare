import { useMutation } from '@tanstack/react-query';

interface FinancialInput {
  income: number;
  cash: number;
  price: number;
}

async function fetchFinancialAdvice(input: FinancialInput): Promise<string> {
  // Mock API call - replace with actual Gemini API integration
  await new Promise(resolve => setTimeout(resolve, 1500));

  const loanNeeded = input.price - input.cash;
  const maxLoan = input.income * 8;
  const loanRatio = loanNeeded / input.price;

  let advice = '';

  if (loanRatio > 0.7) {
    advice = `[High Risk Analysis]\n\nYour loan ratio (${Math.round(loanRatio * 100)}%) exceeds the safe threshold. With an annual income of ${input.income}M KRW, the maximum recommended loan is about ${maxLoan}M KRW.\n\nRecommendations:\n1. Consider properties in the ${Math.round(input.cash + maxLoan)}M KRW range\n2. Build additional savings before purchase\n3. Explore government housing support programs`;
  } else if (loanNeeded > maxLoan) {
    advice = `[Moderate Risk Analysis]\n\nBased on DSR regulations (40% limit), your loan capacity may be limited. Current analysis:\n- Required loan: ${loanNeeded}M KRW\n- Estimated max loan: ${maxLoan}M KRW\n\nRecommendations:\n1. Verify exact loan limits with banks\n2. Consider extending loan term to 40 years\n3. Check for special mortgage programs`;
  } else {
    advice = `[Positive Analysis]\n\nYour financial situation appears stable for this purchase.\n- Cash: ${input.cash}M KRW\n- Required loan: ${loanNeeded}M KRW\n- Loan ratio: ${Math.round(loanRatio * 100)}%\n\nNext steps:\n1. Compare mortgage rates across banks\n2. Prepare documentation for loan approval\n3. Consider fixed vs variable rate options`;
  }

  return advice;
}

export function useFinancialAdvice() {
  return useMutation({
    mutationFn: fetchFinancialAdvice,
    mutationKey: ['financialAdvice'],
  });
}
