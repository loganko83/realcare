/**
 * Badge Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { Badge } from './Badge';
import { Star } from 'lucide-react';

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders children text', () => {
      render(<Badge>Status</Badge>);
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders as a span element', () => {
      render(<Badge data-testid="badge">Content</Badge>);
      expect(screen.getByTestId('badge').tagName).toBe('SPAN');
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      render(<Badge data-testid="badge">Default</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-700');
    });

    it('applies urgent variant styles', () => {
      render(
        <Badge variant="urgent" data-testid="badge">
          Urgent
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-700');
    });

    it('applies flexible variant styles', () => {
      render(
        <Badge variant="flexible" data-testid="badge">
          Flexible
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('text-blue-700');
    });

    it('applies exploring variant styles', () => {
      render(
        <Badge variant="exploring" data-testid="badge">
          Exploring
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-purple-100');
      expect(badge).toHaveClass('text-purple-700');
    });

    it('applies success variant styles', () => {
      render(
        <Badge variant="success" data-testid="badge">
          Success
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-700');
    });

    it('applies warning variant styles', () => {
      render(
        <Badge variant="warning" data-testid="badge">
          Warning
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-yellow-100');
      expect(badge).toHaveClass('text-yellow-700');
    });

    it('applies error variant styles', () => {
      render(
        <Badge variant="error" data-testid="badge">
          Error
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('applies info variant styles', () => {
      render(
        <Badge variant="info" data-testid="badge">
          Info
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('bg-sky-100');
      expect(badge).toHaveClass('text-sky-700');
    });
  });

  describe('Sizes', () => {
    it('applies small size by default', () => {
      render(<Badge data-testid="badge">Small</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('px-2');
      expect(screen.getByTestId('badge')).toHaveClass('text-xs');
    });

    it('applies medium size', () => {
      render(
        <Badge size="md" data-testid="badge">
          Medium
        </Badge>
      );
      expect(screen.getByTestId('badge')).toHaveClass('px-2.5');
    });

    it('applies large size', () => {
      render(
        <Badge size="lg" data-testid="badge">
          Large
        </Badge>
      );
      expect(screen.getByTestId('badge')).toHaveClass('px-3');
      expect(screen.getByTestId('badge')).toHaveClass('text-sm');
    });
  });

  describe('Dot Indicator', () => {
    it('does not show dot by default', () => {
      render(<Badge data-testid="badge">No Dot</Badge>);
      const badge = screen.getByTestId('badge');
      const dots = badge.querySelectorAll('.w-1\\.5');
      expect(dots.length).toBe(0);
    });

    it('shows dot when enabled', () => {
      render(
        <Badge dot data-testid="badge">
          With Dot
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      const dot = badge.querySelector('.w-1\\.5');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('rounded-full');
    });

    it('dot color matches variant', () => {
      render(
        <Badge dot variant="success" data-testid="badge">
          Success
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      const dot = badge.querySelector('.w-1\\.5');
      expect(dot).toHaveClass('bg-green-500');
    });
  });

  describe('Icon', () => {
    it('renders with icon', () => {
      render(
        <Badge icon={<Star data-testid="icon" size={12} />}>
          Starred
        </Badge>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('has rounded-full shape', () => {
      render(<Badge data-testid="badge">Round</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('rounded-full');
    });

    it('has bold font weight', () => {
      render(<Badge data-testid="badge">Bold</Badge>);
      expect(screen.getByTestId('badge')).toHaveClass('font-bold');
    });

    it('supports custom className', () => {
      render(
        <Badge className="custom-class" data-testid="badge">
          Custom
        </Badge>
      );
      expect(screen.getByTestId('badge')).toHaveClass('custom-class');
    });
  });
});
