/**
 * Card Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { Card } from './Card';

describe('Card', () => {
  describe('Rendering', () => {
    it('renders children content', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card.tagName).toBe('DIV');
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      render(<Card data-testid="card">Default</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('shadow-sm');
      expect(card).toHaveClass('border');
    });

    it('applies elevated variant styles', () => {
      render(
        <Card variant="elevated" data-testid="card">
          Elevated
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-lg');
    });

    it('applies outlined variant styles', () => {
      render(
        <Card variant="outlined" data-testid="card">
          Outlined
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border');
    });

    it('applies flat variant styles', () => {
      render(
        <Card variant="flat" data-testid="card">
          Flat
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-gray-50');
    });
  });

  describe('Padding', () => {
    it('applies medium padding by default', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass('p-6');
    });

    it('applies no padding when specified', () => {
      render(
        <Card padding="none" data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).not.toHaveClass('p-4');
      expect(card).not.toHaveClass('p-6');
      expect(card).not.toHaveClass('p-8');
    });

    it('applies small padding', () => {
      render(
        <Card padding="sm" data-testid="card">
          Content
        </Card>
      );
      expect(screen.getByTestId('card')).toHaveClass('p-4');
    });

    it('applies large padding', () => {
      render(
        <Card padding="lg" data-testid="card">
          Content
        </Card>
      );
      expect(screen.getByTestId('card')).toHaveClass('p-8');
    });
  });

  describe('Styling', () => {
    it('always has rounded corners', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass('rounded-2xl');
    });

    it('supports custom className', () => {
      render(
        <Card className="custom-class" data-testid="card">
          Content
        </Card>
      );
      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });

    it('preserves both default and custom classes', () => {
      render(
        <Card className="my-custom" data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-2xl');
      expect(card).toHaveClass('my-custom');
    });
  });

  describe('Props Forwarding', () => {
    it('forwards additional props to div element', () => {
      render(
        <Card data-testid="card" aria-label="Custom card">
          Content
        </Card>
      );
      expect(screen.getByTestId('card')).toHaveAttribute('aria-label', 'Custom card');
    });
  });
});
