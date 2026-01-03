/**
 * ProgressBar Component
 * Multi-step progress indicator
 */

import { type HTMLAttributes } from 'react';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  current: number;
  total: number;
  variant?: 'line' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  labels?: string[];
  activeColor?: string;
  inactiveColor?: string;
}

const sizeStyles = {
  line: {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  },
  dots: {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  },
};

export function ProgressBar({
  current,
  total,
  variant = 'line',
  size = 'md',
  showLabels = false,
  labels = [],
  activeColor = 'bg-brand-600',
  inactiveColor = 'bg-gray-200',
  className = '',
  ...props
}: ProgressBarProps) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center gap-2 ${className}`} {...props}>
        {steps.map((step) => (
          <div key={step} className="flex flex-col items-center gap-1">
            <div
              className={`
                ${sizeStyles.dots[size]}
                rounded-full transition-all duration-300
                ${step <= current ? activeColor : inactiveColor}
              `}
            />
            {showLabels && labels[step - 1] && (
              <span className="text-xs text-slate-500">{labels[step - 1]}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      <div className="flex gap-2">
        {steps.map((step) => (
          <div
            key={step}
            className={`
              flex-1 ${sizeStyles.line[size]} rounded-full transition-all duration-300
              ${step <= current ? activeColor : inactiveColor}
            `}
          />
        ))}
      </div>
      {showLabels && labels.length > 0 && (
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <span
              key={step}
              className={`text-xs ${
                step <= current ? 'text-brand-600 font-medium' : 'text-slate-400'
              }`}
            >
              {labels[step - 1] || `Step ${step}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
