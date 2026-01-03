/**
 * useMultiStepForm Hook Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMultiStepForm } from './useMultiStepForm';

describe('useMultiStepForm', () => {
  describe('Initialization', () => {
    it('starts at step 1 by default', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4 })
      );
      expect(result.current.step).toBe(1);
    });

    it('respects initialStep option', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, initialStep: 2 })
      );
      expect(result.current.step).toBe(2);
    });

    it('returns correct totalSteps', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 5 })
      );
      expect(result.current.totalSteps).toBe(5);
    });
  });

  describe('Step Navigation', () => {
    it('increments step with nextStep', async () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4 })
      );

      await act(async () => {
        await result.current.nextStep();
      });

      expect(result.current.step).toBe(2);
    });

    it('decrements step with prevStep', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, initialStep: 3 })
      );

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.step).toBe(2);
    });

    it('goes to specific step with goToStep', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4 })
      );

      act(() => {
        result.current.goToStep(3);
      });

      expect(result.current.step).toBe(3);
    });

    it('does not go below step 1', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, initialStep: 1 })
      );

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.step).toBe(1);
    });

    it('does not go above totalSteps', async () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, initialStep: 4 })
      );

      await act(async () => {
        await result.current.nextStep();
      });

      expect(result.current.step).toBe(4);
    });

    it('goToStep ignores invalid step numbers', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4 })
      );

      act(() => {
        result.current.goToStep(0);
      });
      expect(result.current.step).toBe(1);

      act(() => {
        result.current.goToStep(5);
      });
      expect(result.current.step).toBe(1);
    });
  });

  describe('Step Flags', () => {
    it('isFirstStep is true on step 1', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4 })
      );
      expect(result.current.isFirstStep).toBe(true);
    });

    it('isFirstStep is false after step 1', async () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4 })
      );

      await act(async () => {
        await result.current.nextStep();
      });

      expect(result.current.isFirstStep).toBe(false);
    });

    it('isLastStep is false before last step', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4 })
      );
      expect(result.current.isLastStep).toBe(false);
    });

    it('isLastStep is true on last step', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, initialStep: 4 })
      );
      expect(result.current.isLastStep).toBe(true);
    });
  });

  describe('Progress', () => {
    it('calculates progress correctly at step 1', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4 })
      );
      expect(result.current.progress).toBe(25);
    });

    it('calculates progress correctly at step 2', async () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4 })
      );

      await act(async () => {
        await result.current.nextStep();
      });

      expect(result.current.progress).toBe(50);
    });

    it('calculates progress correctly at last step', () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, initialStep: 4 })
      );
      expect(result.current.progress).toBe(100);
    });
  });

  describe('Reset', () => {
    it('resets to initial step', async () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4 })
      );

      await act(async () => {
        await result.current.nextStep();
      });

      await act(async () => {
        await result.current.nextStep();
      });

      expect(result.current.step).toBe(3);

      act(() => {
        result.current.reset();
      });

      expect(result.current.step).toBe(1);
    });

    it('resets to custom initial step', async () => {
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, initialStep: 2 })
      );

      await act(async () => {
        await result.current.nextStep();
      });

      expect(result.current.step).toBe(3);

      act(() => {
        result.current.reset();
      });

      expect(result.current.step).toBe(2);
    });
  });

  describe('Callbacks', () => {
    it('calls onStepChange when step changes via nextStep', async () => {
      const onStepChange = vi.fn();
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, onStepChange })
      );

      await act(async () => {
        await result.current.nextStep();
      });

      expect(onStepChange).toHaveBeenCalledWith(2);
    });

    it('calls onStepChange when step changes via prevStep', () => {
      const onStepChange = vi.fn();
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, initialStep: 3, onStepChange })
      );

      act(() => {
        result.current.prevStep();
      });

      expect(onStepChange).toHaveBeenCalledWith(2);
    });

    it('calls onStepChange when step changes via goToStep', () => {
      const onStepChange = vi.fn();
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, onStepChange })
      );

      act(() => {
        result.current.goToStep(3);
      });

      expect(onStepChange).toHaveBeenCalledWith(3);
    });

    it('calls onStepChange when reset', async () => {
      const onStepChange = vi.fn();
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, onStepChange })
      );

      await act(async () => {
        await result.current.nextStep();
      });

      onStepChange.mockClear();

      act(() => {
        result.current.reset();
      });

      expect(onStepChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Validation', () => {
    it('validates step before advancing', async () => {
      const validateStep = vi.fn().mockResolvedValue(true);
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, validateStep })
      );

      await act(async () => {
        await result.current.nextStep();
      });

      expect(validateStep).toHaveBeenCalledWith(1);
      expect(result.current.step).toBe(2);
    });

    it('does not advance if validation fails', async () => {
      const validateStep = vi.fn().mockResolvedValue(false);
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, validateStep })
      );

      await act(async () => {
        await result.current.nextStep();
      });

      expect(validateStep).toHaveBeenCalledWith(1);
      expect(result.current.step).toBe(1);
    });

    it('nextStep returns true when validation passes', async () => {
      const validateStep = vi.fn().mockResolvedValue(true);
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, validateStep })
      );

      let returnValue: boolean = false;
      await act(async () => {
        returnValue = await result.current.nextStep();
      });

      expect(returnValue).toBe(true);
    });

    it('nextStep returns false when validation fails', async () => {
      const validateStep = vi.fn().mockResolvedValue(false);
      const { result } = renderHook(() =>
        useMultiStepForm({ totalSteps: 4, validateStep })
      );

      let returnValue: boolean = true;
      await act(async () => {
        returnValue = await result.current.nextStep();
      });

      expect(returnValue).toBe(false);
    });
  });
});
