import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default:
      'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 dark:border dark:border-brand-800/60',
    success:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/60',
    warning:
      'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:border dark:border-amber-800/60',
    danger:
      'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 dark:border dark:border-rose-800/60',
    info:
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 dark:border dark:border-cyan-800/60',
    outline:
      'border border-slate-300 text-slate-700 dark:border-dark-800 dark:text-slate-300',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-md',
    md: 'text-xs px-2.5 py-1 font-medium rounded-md',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono tracking-tight transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
