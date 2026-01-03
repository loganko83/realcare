/**
 * FormInput Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { FormInput } from './FormInput';
import { Mail } from 'lucide-react';

describe('FormInput', () => {
  describe('Rendering', () => {
    it('renders an input element by default', () => {
      render(<FormInput placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders a textarea when as="textarea"', () => {
      render(<FormInput as="textarea" placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders with label', () => {
      render(<FormInput label="Email Address" />);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('associates label with input using htmlFor', () => {
      render(<FormInput label="Username" id="user" />);
      const label = screen.getByText('Username');
      expect(label).toHaveAttribute('for', 'user');
    });

    it('generates id from label if not provided', () => {
      render(<FormInput label="Full Name" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'full-name');
    });
  });

  describe('Input Types', () => {
    it('supports text input', () => {
      render(<FormInput type="text" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');
    });

    it('supports email input', () => {
      render(<FormInput type="email" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');
    });

    it('supports password input', () => {
      render(<FormInput type="password" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');
    });

    it('supports number input', () => {
      render(<FormInput type="number" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
    });

    it('supports tel input', () => {
      render(<FormInput type="tel" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'tel');
    });

    it('supports date input', () => {
      render(<FormInput type="date" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'date');
    });
  });

  describe('Helper Text and Errors', () => {
    it('displays helper text', () => {
      render(<FormInput helperText="This is a hint" />);
      expect(screen.getByText('This is a hint')).toBeInTheDocument();
    });

    it('displays error message', () => {
      render(<FormInput error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('error takes precedence over helper text', () => {
      render(
        <FormInput
          helperText="This is a hint"
          error="This field is required"
        />
      );
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.queryByText('This is a hint')).not.toBeInTheDocument();
    });

    it('applies error styling to input', () => {
      render(<FormInput error="Error" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('border-red-300');
    });

    it('error text has red color', () => {
      render(<FormInput error="Error message" />);
      expect(screen.getByText('Error message')).toHaveClass('text-red-500');
    });
  });

  describe('Icon', () => {
    it('renders with icon', () => {
      render(<FormInput icon={<Mail data-testid="icon" />} />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('adds padding for icon', () => {
      render(<FormInput icon={<Mail />} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('pl-10');
    });
  });

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      render(<FormInput data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('p-3');
    });

    it('applies small size', () => {
      render(<FormInput inputSize="sm" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('p-2');
    });

    it('applies large size', () => {
      render(<FormInput inputSize="lg" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('p-4');
    });
  });

  describe('Interactions', () => {
    it('handles value changes', async () => {
      const handleChange = vi.fn();
      const { user } = render(
        <FormInput onChange={handleChange} data-testid="input" />
      );

      await user.type(screen.getByTestId('input'), 'hello');
      expect(handleChange).toHaveBeenCalled();
    });

    it('can be controlled', () => {
      render(<FormInput value="controlled" onChange={() => {}} data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveValue('controlled');
    });

    it('supports disabled state', () => {
      render(<FormInput disabled data-testid="input" />);
      expect(screen.getByTestId('input')).toBeDisabled();
    });

    it('supports readOnly state', () => {
      render(<FormInput readOnly data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('readonly');
    });
  });

  describe('Full Width', () => {
    it('is full width by default', () => {
      render(<FormInput data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('w-full');
    });

    it('can be non-full width', () => {
      render(<FormInput fullWidth={false} data-testid="input" />);
      expect(screen.getByTestId('input')).not.toHaveClass('w-full');
    });
  });

  describe('Textarea', () => {
    it('renders textarea with rows', () => {
      render(<FormInput as="textarea" rows={5} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '5');
    });

    it('textarea has resize-none class', () => {
      render(<FormInput as="textarea" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('resize-none');
    });
  });
});
