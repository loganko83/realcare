/**
 * useMultiStepForm Hook
 * Reusable multi-step form logic
 */

import { useState, useCallback, useMemo } from 'react';

export interface UseMultiStepFormOptions {
  totalSteps: number;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  validateStep?: (step: number) => boolean | Promise<boolean>;
}

export interface UseMultiStepFormReturn {
  step: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  nextStep: () => Promise<boolean>;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

export function useMultiStepForm({
  totalSteps,
  initialStep = 1,
  onStepChange,
  validateStep,
}: UseMultiStepFormOptions): UseMultiStepFormReturn {
  const [step, setStep] = useState(initialStep);

  const isFirstStep = step === 1;
  const isLastStep = step === totalSteps;
  const progress = useMemo(() => (step / totalSteps) * 100, [step, totalSteps]);

  const goToStep = useCallback(
    (newStep: number) => {
      if (newStep >= 1 && newStep <= totalSteps) {
        setStep(newStep);
        onStepChange?.(newStep);
      }
    },
    [totalSteps, onStepChange]
  );

  const nextStep = useCallback(async () => {
    let currentStep = step;

    if (currentStep >= totalSteps) return false;

    if (validateStep) {
      const isValid = await validateStep(currentStep);
      if (!isValid) return false;
    }

    const newStep = currentStep + 1;
    setStep(newStep);
    onStepChange?.(newStep);
    return true;
  }, [step, totalSteps, validateStep, onStepChange]);

  const prevStep = useCallback(() => {
    if (isFirstStep) return;

    const newStep = step - 1;
    setStep(newStep);
    onStepChange?.(newStep);
  }, [step, isFirstStep, onStepChange]);

  const reset = useCallback(() => {
    setStep(initialStep);
    onStepChange?.(initialStep);
  }, [initialStep, onStepChange]);

  return {
    step,
    totalSteps,
    isFirstStep,
    isLastStep,
    progress,
    nextStep,
    prevStep,
    goToStep,
    reset,
  };
}

export default useMultiStepForm;
