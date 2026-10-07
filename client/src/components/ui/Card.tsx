import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive';
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default:
      'bg-white border border-slate-200/80 shadow-sm dark:bg-dark-900 dark:border-dark-800',
    elevated:
      'bg-white border border-slate-200 shadow-md dark:bg-dark-900 dark:border-dark-800 dark:shadow-dark-950/50',
    glass:
      'bg-white/80 backdrop-blur-md border border-slate-200/50 dark:bg-dark-900/80 dark:border-dark-800/80',
    interactive:
      'bg-white border border-slate-200/80 shadow-sm hover:border-brand-500/50 hover:shadow-md transition-all duration-200 dark:bg-dark-900 dark:border-dark-800 dark:hover:border-brand-500/50 dark:hover:shadow-glow-brand cursor-pointer',
  };

  return (
    <div
      className={cn('rounded-xl overflow-hidden', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-6 pb-3 flex flex-col gap-1.5', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3
    className={cn('text-lg font-semibold text-slate-900 dark:text-white', className)}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p
    className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
    {...props}
  >
    {children}
  </p>
);

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-6 pt-3', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('p-6 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-dark-800 mt-3 pt-4', className)}
    {...props}
  >
    {children}
  </div>
);
