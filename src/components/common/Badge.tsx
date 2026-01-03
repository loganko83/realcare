/**
 * Badge Component
 * Reusable badge/tag for status indicators
 */

import { type HTMLAttributes, type ReactNode } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'urgent' | 'flexible' | 'exploring' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gray-100 text-gray-700',
  urgent: 'bg-red-100 text-red-700',
  flexible: 'bg-blue-100 text-blue-700',
  exploring: 'bg-purple-100 text-purple-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
};

const dotColors: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gray-500',
  urgent: 'bg-red-500',
  flexible: 'bg-blue-500',
  exploring: 'bg-purple-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-sky-500',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  variant = 'default',
  size = 'sm',
  dot = false,
  icon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        inline-flex items-center gap-1.5
        font-bold rounded-full
        ${className}
      `.trim()}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {icon}
      {children}
    </span>
  );
}

export default Badge;
