/**
 * FormSelect Component
 * Reusable select/dropdown with label and validation
 */

import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  selectSize?: 'sm' | 'md' | 'lg';
}

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

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      helperText,
      error,
      options = [],
      groups = [],
      placeholder,
      icon,
      fullWidth = true,
      selectSize = 'md',
      className = '',
      id,
      ...selectProps
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;

    const baseSelectStyles = `
      ${sizeStyles[selectSize]}
      ${fullWidth ? 'w-full' : ''}
      border transition-all duration-200
      ${hasError
        ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
      }
      ${icon ? 'pl-10' : ''}
      outline-none bg-white appearance-none cursor-pointer
    `.trim();

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={selectId}
            className={`${labelSizeStyles[selectSize]} font-medium text-slate-600 mb-2 block`}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={`${baseSelectStyles} ${className}`}
            {...selectProps}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {groups.length > 0
              ? groups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              : options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {(helperText || error) && (
          <p className={`mt-1 text-xs ${hasError ? 'text-red-500' : 'text-slate-400'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export default FormSelect;
