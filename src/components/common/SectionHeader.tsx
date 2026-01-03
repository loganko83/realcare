/**
 * SectionHeader Component
 * Reusable section header with icon and optional subtitle
 */

import { type ReactNode, type HTMLAttributes, type ComponentType } from 'react';
import { type LucideProps } from 'lucide-react';

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ComponentType<LucideProps>;
  iconSize?: number;
  iconColor?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    title: 'text-base',
    subtitle: 'text-xs',
    gap: 'gap-1.5',
    iconSize: 16,
  },
  md: {
    title: 'text-lg',
    subtitle: 'text-sm',
    gap: 'gap-2',
    iconSize: 20,
  },
  lg: {
    title: 'text-xl',
    subtitle: 'text-base',
    gap: 'gap-3',
    iconSize: 24,
  },
};

export function SectionHeader({
  icon: Icon,
  iconSize,
  iconColor = 'text-brand-600',
  title,
  subtitle,
  action,
  size = 'md',
  className = '',
  ...props
}: SectionHeaderProps) {
  const styles = sizeStyles[size];
  const finalIconSize = iconSize || styles.iconSize;

  return (
    <div
      className={`flex items-start justify-between mb-4 ${className}`}
      {...props}
    >
      <div>
        <h2 className={`font-bold ${styles.title} text-slate-800 flex items-center ${styles.gap}`}>
          {Icon && <Icon size={finalIconSize} className={iconColor} />}
          {title}
        </h2>
        {subtitle && (
          <p className={`${styles.subtitle} text-slate-500 mt-1`}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export default SectionHeader;
