/**
 * FormInput Component
 * Reusable form input with label and validation states
 */

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';

type BaseInputProps = {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
};

export type FormInputProps = BaseInputProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
    as?: 'input';
  };

export type FormTextareaProps = BaseInputProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: 'textarea';
  };

const sizeStyles = {
  sm: 'p-2 text-sm rounded-lg',
  md: 'p-3 text-base rounded-xl',
  lg: 'p-4 text-lg rounded-xl',
};

const labelSizeStyles = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const FormInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormInputProps | FormTextareaProps
>((props, ref) => {
  const {
    as = 'input',
    label,
    helperText,
    error,
    icon,
    fullWidth = true,
    inputSize = 'md',
    className = '',
    id,
    ...inputProps
  } = props;

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = !!error;

  const baseInputStyles = `
    ${sizeStyles[inputSize]}
    ${fullWidth ? 'w-full' : ''}
    border transition-all duration-200
    ${hasError
      ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
    }
    ${icon ? 'pl-10' : ''}
    outline-none
  `.trim();

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className={`${labelSizeStyles[inputSize]} font-medium text-slate-600 mb-2 block`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        {as === 'textarea' ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            className={`${baseInputStyles} ${className} resize-none`}
            {...(inputProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={inputId}
            className={`${baseInputStyles} ${className}`}
            {...(inputProps as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>
      {(helperText || error) && (
        <p className={`mt-1 text-xs ${hasError ? 'text-red-500' : 'text-slate-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
