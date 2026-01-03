/**
 * ProgressBar Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  describe('Rendering', () => {
    it('renders correct number of steps', () => {
      render(<ProgressBar current={2} total={4} data-testid="progress" />);

      const progressContainer = screen.getByTestId('progress');
      const steps = progressContainer.querySelectorAll('.flex-1');
      expect(steps).toHaveLength(4);
    });
  });

  describe('Progress State', () => {
    it('marks completed steps with active color', () => {
      render(<ProgressBar current={3} total={5} data-testid="progress" />);

      const progressContainer = screen.getByTestId('progress');
      const steps = progressContainer.querySelectorAll('.flex-1');

      // First 3 steps should be active
      expect(steps[0]).toHaveClass('bg-brand-600');
      expect(steps[1]).toHaveClass('bg-brand-600');
      expect(steps[2]).toHaveClass('bg-brand-600');
      // Remaining should be inactive
      expect(steps[3]).toHaveClass('bg-gray-200');
      expect(steps[4]).toHaveClass('bg-gray-200');
    });

    it('shows all inactive when current is 0', () => {
      render(<ProgressBar current={0} total={3} data-testid="progress" />);

      const progressContainer = screen.getByTestId('progress');
      const steps = progressContainer.querySelectorAll('.flex-1');

      steps.forEach(step => {
        expect(step).toHaveClass('bg-gray-200');
      });
    });

    it('shows all active when current equals total', () => {
      render(<ProgressBar current={4} total={4} data-testid="progress" />);

      const progressContainer = screen.getByTestId('progress');
      const steps = progressContainer.querySelectorAll('.flex-1');

      steps.forEach(step => {
        expect(step).toHaveClass('bg-brand-600');
      });
    });
  });

  describe('Variants', () => {
    describe('Line Variant', () => {
      it('renders line variant by default', () => {
        render(<ProgressBar current={2} total={4} data-testid="progress" />);

        const progressContainer = screen.getByTestId('progress');
        const steps = progressContainer.querySelectorAll('.flex-1');

        // Line variant has flex-1 class for equal width
        expect(steps[0]).toHaveClass('flex-1');
      });

      it('applies correct height for size', () => {
        render(<ProgressBar current={2} total={4} size="md" data-testid="progress" />);

        const progressContainer = screen.getByTestId('progress');
        const steps = progressContainer.querySelectorAll('.flex-1');

        expect(steps[0]).toHaveClass('h-1.5');
      });
    });

    describe('Dots Variant', () => {
      it('renders dots variant', () => {
        render(<ProgressBar current={2} total={4} variant="dots" data-testid="progress" />);

        const progressContainer = screen.getByTestId('progress');
        const dots = progressContainer.querySelectorAll('.rounded-full');

        expect(dots.length).toBeGreaterThan(0);
      });

      it('dots are centered', () => {
        render(<ProgressBar current={2} total={4} variant="dots" data-testid="progress" />);

        const progressContainer = screen.getByTestId('progress');
        expect(progressContainer).toHaveClass('justify-center');
      });
    });
  });

  describe('Sizes', () => {
    describe('Line Sizes', () => {
      it('applies small size', () => {
        render(<ProgressBar current={2} total={4} size="sm" data-testid="progress" />);

        const progressContainer = screen.getByTestId('progress');
        const steps = progressContainer.querySelectorAll('.flex-1');

        expect(steps[0]).toHaveClass('h-1');
      });

      it('applies medium size by default', () => {
        render(<ProgressBar current={2} total={4} data-testid="progress" />);

        const progressContainer = screen.getByTestId('progress');
        const steps = progressContainer.querySelectorAll('.flex-1');

        expect(steps[0]).toHaveClass('h-1.5');
      });

      it('applies large size', () => {
        render(<ProgressBar current={2} total={4} size="lg" data-testid="progress" />);

        const progressContainer = screen.getByTestId('progress');
        const steps = progressContainer.querySelectorAll('.flex-1');

        expect(steps[0]).toHaveClass('h-2');
      });
    });
  });

  describe('Labels', () => {
    it('does not show labels by default', () => {
      render(
        <ProgressBar
          current={2}
          total={4}
          labels={['Step 1', 'Step 2', 'Step 3', 'Step 4']}
        />
      );

      expect(screen.queryByText('Step 1')).not.toBeInTheDocument();
    });

    it('shows labels when showLabels is true', () => {
      render(
        <ProgressBar
          current={2}
          total={4}
          showLabels
          labels={['Step 1', 'Step 2', 'Step 3', 'Step 4']}
        />
      );

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
      expect(screen.getByText('Step 4')).toBeInTheDocument();
    });

    it('highlights completed step labels', () => {
      render(
        <ProgressBar
          current={2}
          total={4}
          showLabels
          labels={['Step 1', 'Step 2', 'Step 3', 'Step 4']}
        />
      );

      expect(screen.getByText('Step 1')).toHaveClass('text-brand-600');
      expect(screen.getByText('Step 2')).toHaveClass('text-brand-600');
      expect(screen.getByText('Step 3')).toHaveClass('text-slate-400');
    });
  });

  describe('Custom Colors', () => {
    it('supports custom active color', () => {
      render(
        <ProgressBar
          current={2}
          total={4}
          activeColor="bg-green-500"
          data-testid="progress"
        />
      );

      const progressContainer = screen.getByTestId('progress');
      const steps = progressContainer.querySelectorAll('.flex-1');

      expect(steps[0]).toHaveClass('bg-green-500');
    });

    it('supports custom inactive color', () => {
      render(
        <ProgressBar
          current={2}
          total={4}
          inactiveColor="bg-red-100"
          data-testid="progress"
        />
      );

      const progressContainer = screen.getByTestId('progress');
      const steps = progressContainer.querySelectorAll('.flex-1');

      expect(steps[3]).toHaveClass('bg-red-100');
    });
  });

  describe('Styling', () => {
    it('steps have rounded corners', () => {
      render(<ProgressBar current={2} total={4} data-testid="progress" />);

      const progressContainer = screen.getByTestId('progress');
      const steps = progressContainer.querySelectorAll('.flex-1');

      steps.forEach(step => {
        expect(step).toHaveClass('rounded-full');
      });
    });

    it('supports custom className', () => {
      render(
        <ProgressBar
          current={2}
          total={4}
          className="my-custom-class"
          data-testid="progress"
        />
      );

      expect(screen.getByTestId('progress')).toHaveClass('my-custom-class');
    });

    it('has transition animation', () => {
      render(<ProgressBar current={2} total={4} data-testid="progress" />);

      const progressContainer = screen.getByTestId('progress');
      const steps = progressContainer.querySelectorAll('.flex-1');

      steps.forEach(step => {
        expect(step).toHaveClass('transition-all');
      });
    });
  });
});
