/**
 * SelectButton Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { SelectButton } from './SelectButton';

const OPTIONS = [
  { id: 'option1', label: 'Option 1' },
  { id: 'option2', label: 'Option 2' },
  { id: 'option3', label: 'Option 3' },
];

const OPTIONS_WITH_DESC = [
  { id: 'opt1', label: 'First', description: 'First option description' },
  { id: 'opt2', label: 'Second', description: 'Second option description' },
];

describe('SelectButton', () => {
  describe('Rendering', () => {
    it('renders all options', () => {
      render(
        <SelectButton
          options={OPTIONS}
          value="option1"
          onChange={() => {}}
        />
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('renders options as buttons', () => {
      render(
        <SelectButton
          options={OPTIONS}
          value="option1"
          onChange={() => {}}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });
  });

  describe('Selection', () => {
    it('shows selected option with active styles', () => {
      render(
        <SelectButton
          options={OPTIONS}
          value="option2"
          onChange={() => {}}
        />
      );

      const selectedButton = screen.getByText('Option 2').closest('button');
      expect(selectedButton).toHaveClass('bg-brand-600');
    });

    it('shows unselected options with inactive styles', () => {
      render(
        <SelectButton
          options={OPTIONS}
          value="option1"
          onChange={() => {}}
        />
      );

      const unselectedButton = screen.getByText('Option 2').closest('button');
      expect(unselectedButton).toHaveClass('bg-gray-100');
    });

    it('calls onChange when option is clicked', async () => {
      const handleChange = vi.fn();
      const { user } = render(
        <SelectButton
          options={OPTIONS}
          value="option1"
          onChange={handleChange}
        />
      );

      await user.click(screen.getByText('Option 2'));
      expect(handleChange).toHaveBeenCalledWith('option2');
    });
  });

  describe('Variants', () => {
    describe('Pill Variant', () => {
      it('applies pill styles by default', () => {
        render(
          <SelectButton
            options={OPTIONS}
            value="option1"
            onChange={() => {}}
          />
        );

        const button = screen.getByText('Option 1').closest('button');
        expect(button).toHaveClass('rounded-xl');
      });

      it('uses grid layout', () => {
        render(
          <SelectButton
            options={OPTIONS}
            value="option1"
            onChange={() => {}}
            data-testid="container"
          />
        );

        const container = screen.getByTestId('container');
        expect(container).toHaveClass('grid');
      });
    });

    describe('Toggle Variant', () => {
      it('applies toggle styles', () => {
        render(
          <SelectButton
            options={OPTIONS}
            value="option1"
            onChange={() => {}}
            variant="toggle"
          />
        );

        const button = screen.getByText('Option 1').closest('button');
        expect(button).toHaveClass('flex-1');
      });

      it('uses flex layout', () => {
        render(
          <SelectButton
            options={OPTIONS}
            value="option1"
            onChange={() => {}}
            variant="toggle"
            data-testid="container"
          />
        );

        const container = screen.getByTestId('container');
        expect(container).toHaveClass('flex');
      });
    });

    describe('Card Variant', () => {
      it('renders descriptions in card variant', () => {
        render(
          <SelectButton
            options={OPTIONS_WITH_DESC}
            value="opt1"
            onChange={() => {}}
            variant="card"
          />
        );

        expect(screen.getByText('First option description')).toBeInTheDocument();
        expect(screen.getByText('Second option description')).toBeInTheDocument();
      });

      it('shows check mark on selected card', () => {
        render(
          <SelectButton
            options={OPTIONS_WITH_DESC}
            value="opt1"
            onChange={() => {}}
            variant="card"
            showCheck
          />
        );

        const selectedCard = screen.getByText('First').closest('button');
        // Check icon should be present in the selected card
        expect(selectedCard?.querySelector('svg')).toBeInTheDocument();
      });

      it('applies card border styles', () => {
        render(
          <SelectButton
            options={OPTIONS_WITH_DESC}
            value="opt1"
            onChange={() => {}}
            variant="card"
          />
        );

        const selectedButton = screen.getByText('First').closest('button');
        expect(selectedButton).toHaveClass('border-brand-500');
      });
    });
  });

  describe('Multiple Selection', () => {
    it('supports array value for multiple selection', () => {
      render(
        <SelectButton
          options={OPTIONS}
          value={['option1', 'option2']}
          onChange={() => {}}
          multiple
        />
      );

      const option1 = screen.getByText('Option 1').closest('button');
      const option2 = screen.getByText('Option 2').closest('button');
      const option3 = screen.getByText('Option 3').closest('button');

      expect(option1).toHaveClass('bg-brand-600');
      expect(option2).toHaveClass('bg-brand-600');
      expect(option3).toHaveClass('bg-gray-100');
    });
  });

  describe('Sizes', () => {
    it('applies small size', () => {
      render(
        <SelectButton
          options={OPTIONS}
          value="option1"
          onChange={() => {}}
          size="sm"
        />
      );

      const button = screen.getByText('Option 1').closest('button');
      expect(button).toHaveClass('py-2');
    });

    it('applies medium size by default', () => {
      render(
        <SelectButton
          options={OPTIONS}
          value="option1"
          onChange={() => {}}
        />
      );

      const button = screen.getByText('Option 1').closest('button');
      expect(button).toHaveClass('py-3');
    });

    it('applies large size', () => {
      render(
        <SelectButton
          options={OPTIONS}
          value="option1"
          onChange={() => {}}
          size="lg"
        />
      );

      const button = screen.getByText('Option 1').closest('button');
      expect(button).toHaveClass('py-4');
    });
  });

  describe('Columns', () => {
    it('applies correct column class', () => {
      render(
        <SelectButton
          options={OPTIONS}
          value="option1"
          onChange={() => {}}
          columns={3}
          data-testid="container"
        />
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('all options are keyboard accessible', () => {
      render(
        <SelectButton
          options={OPTIONS}
          value="option1"
          onChange={() => {}}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('buttons have type="button"', () => {
      render(
        <SelectButton
          options={OPTIONS}
          value="option1"
          onChange={() => {}}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});
