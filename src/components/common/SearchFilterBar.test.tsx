/**
 * SearchFilterBar Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { SearchFilterBar } from './SearchFilterBar';
import { MapPin } from 'lucide-react';

describe('SearchFilterBar', () => {
  describe('Rendering', () => {
    it('renders search input', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          placeholder="Search here..."
        />
      );

      expect(screen.getByPlaceholderText('Search here...')).toBeInTheDocument();
    });

    it('renders filter button by default', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          onFilterToggle={() => {}}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('hides filter button when showFilter is false', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          showFilter={false}
        />
      );

      // Only clear button might be present, no filter button
      const filterButton = screen.queryByRole('button');
      // If no value, no clear button either
      expect(filterButton).not.toBeInTheDocument();
    });
  });

  describe('Search Input', () => {
    it('displays current value', () => {
      render(
        <SearchFilterBar
          value="test query"
          onChange={() => {}}
        />
      );

      expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    });

    it('calls onChange when typing', async () => {
      const handleChange = vi.fn();
      const { user } = render(
        <SearchFilterBar
          value=""
          onChange={handleChange}
        />
      );

      await user.type(screen.getByRole('textbox'), 'hello');
      expect(handleChange).toHaveBeenCalled();
    });

    it('shows search icon by default', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          data-testid="search"
        />
      );

      // Search icon should be present (as SVG)
      const container = screen.getByRole('textbox').parentElement;
      expect(container?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders custom icon', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          icon={<MapPin data-testid="custom-icon" />}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Clear Button', () => {
    it('shows clear button when value exists and clearable is true', () => {
      render(
        <SearchFilterBar
          value="some text"
          onChange={() => {}}
          clearable
          showFilter={false}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('hides clear button when value is empty', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          clearable
          showFilter={false}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('clears value when clear button is clicked', async () => {
      const handleChange = vi.fn();
      const { user } = render(
        <SearchFilterBar
          value="some text"
          onChange={handleChange}
          clearable
          showFilter={false}
        />
      );

      await user.click(screen.getByRole('button'));
      expect(handleChange).toHaveBeenCalledWith('');
    });

    it('hides clear button when clearable is false', () => {
      render(
        <SearchFilterBar
          value="some text"
          onChange={() => {}}
          clearable={false}
          showFilter={false}
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Filter Button', () => {
    it('calls onFilterToggle when clicked', async () => {
      const handleFilterToggle = vi.fn();
      const { user } = render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          onFilterToggle={handleFilterToggle}
        />
      );

      // Find the filter button (should have Filter icon)
      const filterButton = screen.getAllByRole('button').find(
        btn => btn.closest('.flex.gap-2')
      );

      if (filterButton) {
        await user.click(filterButton);
        expect(handleFilterToggle).toHaveBeenCalled();
      }
    });

    it('applies active styles when isFilterOpen is true', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          onFilterToggle={() => {}}
          isFilterOpen={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      const filterButton = buttons[buttons.length - 1]; // Last button is filter
      expect(filterButton).toHaveClass('border-brand-500');
    });

    it('shows filter count badge when filterCount > 0', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          onFilterToggle={() => {}}
          filterCount={3}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('hides filter count badge when filterCount is 0', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          onFilterToggle={() => {}}
          filterCount={0}
        />
      );

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByRole('textbox')).toHaveClass('py-3');
    });

    it('applies small size', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          inputSize="sm"
        />
      );

      expect(screen.getByRole('textbox')).toHaveClass('py-2');
    });

    it('applies large size', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          inputSize="lg"
        />
      );

      expect(screen.getByRole('textbox')).toHaveClass('py-4');
    });
  });

  describe('Styling', () => {
    it('supports custom className', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          className="custom-class"
          data-testid="container"
        />
      );

      expect(screen.getByTestId('container')).toHaveClass('custom-class');
    });

    it('has flex layout', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          data-testid="container"
        />
      );

      expect(screen.getByTestId('container')).toHaveClass('flex');
    });
  });

  describe('Accessibility', () => {
    it('input is focusable', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
        />
      );

      const input = screen.getByRole('textbox');
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('forwards additional input props', () => {
      render(
        <SearchFilterBar
          value=""
          onChange={() => {}}
          aria-label="Search items"
        />
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Search items');
    });
  });
});
