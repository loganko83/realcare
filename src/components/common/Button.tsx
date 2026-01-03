/**
 * Button Component
 * Reusable button with multiple variants and sizes
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-sm',
  secondary: 'bg-slate-800 text-white font-bold hover:bg-slate-900 shadow-lg',
  ghost: 'bg-gray-100 text-slate-600 font-medium hover:bg-gray-200',
  outline: 'border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 bg-transparent',
  danger: 'bg-red-600 text-white font-bold hover:bg-red-700',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'py-2 px-3 text-sm rounded-lg',
  md: 'py-3 px-4 text-sm rounded-xl',
  lg: 'py-4 px-6 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          inline-flex items-center justify-center gap-2
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `.trim()}
        {...props}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          icon && iconPosition === 'left' && icon
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
