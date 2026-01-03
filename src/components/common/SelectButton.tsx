/**
 * SelectButton Component
 * Reusable toggle/selection button group
 */

import { type ReactNode, type HTMLAttributes } from 'react';
import { Check } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  id: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

export interface SelectButtonProps<T extends string = string>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: SelectOption<T>[];
  value: T | T[];
  onChange: (value: T) => void;
  variant?: 'pill' | 'card' | 'toggle';
  size?: 'sm' | 'md' | 'lg';
  columns?: 1 | 2 | 3 | 4;
  multiple?: boolean;
  showCheck?: boolean;
}

const pillStyles = {
  base: 'rounded-xl text-sm font-bold transition',
  active: 'bg-brand-600 text-white',
  inactive: 'bg-gray-100 text-slate-600 hover:bg-gray-200',
  size: {
    sm: 'py-2 px-3',
    md: 'py-3 px-4',
    lg: 'py-4 px-6',
  },
};

const cardStyles = {
  base: 'rounded-xl border text-left transition flex items-center justify-between',
  active: 'border-brand-500 bg-brand-50',
  inactive: 'border-gray-200 hover:border-gray-300',
  size: {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  },
};

const toggleStyles = {
  base: 'rounded-xl text-sm font-medium transition',
  active: 'bg-brand-600 text-white',
  inactive: 'bg-gray-100 text-slate-600 hover:bg-gray-200',
  size: {
    sm: 'py-2 px-3',
    md: 'py-2.5 px-4',
    lg: 'py-3 px-5',
  },
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export function SelectButton<T extends string = string>({
  options,
  value,
  onChange,
  variant = 'pill',
  size = 'md',
  columns = 2,
  multiple = false,
  showCheck = false,
  className = '',
  ...props
}: SelectButtonProps<T>) {
  const isSelected = (optionId: T) => {
    if (Array.isArray(value)) {
      return value.includes(optionId);
    }
    return value === optionId;
  };

  const styles = variant === 'card' ? cardStyles : variant === 'toggle' ? toggleStyles : pillStyles;

  if (variant === 'card') {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {options.map((option) => {
          const selected = isSelected(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`
                w-full ${styles.base}
                ${styles.size[size]}
                ${selected ? styles.active : styles.inactive}
              `}
            >
              <div className="flex items-center gap-3">
                {option.icon}
                <div>
                  <p className="font-bold text-slate-800">{option.label}</p>
                  {option.description && (
                    <p className="text-sm text-slate-500">{option.description}</p>
                  )}
                </div>
              </div>
              {(showCheck || variant === 'card') && selected && (
                <Check size={20} className="text-brand-600 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  const gridClass = variant === 'toggle' ? 'flex gap-2' : `grid ${columnClasses[columns]} gap-2`;

  return (
    <div className={`${gridClass} ${className}`} {...props}>
      {options.map((option) => {
        const selected = isSelected(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`
              ${variant === 'toggle' ? 'flex-1' : ''}
              ${styles.base}
              ${styles.size[size]}
              ${selected ? styles.active : styles.inactive}
            `}
          >
            {option.icon && <span className="mr-2">{option.icon}</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SelectButton;
