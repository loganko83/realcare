/**
 * SearchFilterBar Component
 * Reusable search input with filter toggle
 */

import { type InputHTMLAttributes, type ReactNode } from 'react';
import { Search, Filter, X } from 'lucide-react';

export interface SearchFilterBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  value: string;
  onChange: (value: string) => void;
  onFilterToggle?: () => void;
  isFilterOpen?: boolean;
  filterCount?: number;
  showFilter?: boolean;
  icon?: ReactNode;
  clearable?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    input: 'py-2 pl-9 pr-3 text-sm',
    icon: 'left-2.5 w-4 h-4',
    button: 'p-2',
  },
  md: {
    input: 'py-3 pl-10 pr-4',
    icon: 'left-3 w-5 h-5',
    button: 'p-2.5',
  },
  lg: {
    input: 'py-4 pl-12 pr-5 text-lg',
    icon: 'left-4 w-6 h-6',
    button: 'p-3',
  },
};

export function SearchFilterBar({
  value,
  onChange,
  onFilterToggle,
  isFilterOpen = false,
  filterCount = 0,
  showFilter = true,
  icon,
  clearable = true,
  inputSize = 'md',
  placeholder = 'Search...',
  className = '',
  'data-testid': testId,
  ...props
}: SearchFilterBarProps) {
  const styles = sizeStyles[inputSize];

  return (
    <div className={`flex gap-2 ${className}`} data-testid={testId}>
      <div className="flex-1 relative">
        <div className={`absolute ${styles.icon} top-1/2 -translate-y-1/2 text-gray-400`}>
          {icon || <Search className="w-full h-full" />}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full ${styles.input}
            border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
            transition-all
            ${clearable && value ? 'pr-10' : ''}
          `}
          {...props}
        />
        {clearable && value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showFilter && onFilterToggle && (
        <button
          type="button"
          onClick={onFilterToggle}
          className={`
            ${styles.button}
            rounded-xl border transition-all relative
            ${isFilterOpen
              ? 'border-brand-500 bg-brand-50 text-brand-600'
              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <Filter size={inputSize === 'sm' ? 16 : inputSize === 'lg' ? 24 : 20} />
          {filterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center">
              {filterCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

export default SearchFilterBar;
