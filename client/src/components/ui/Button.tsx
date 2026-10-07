import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] select-none';

    const variants = {
      primary:
        'bg-brand-600 hover:bg-brand-500 text-white shadow-sm hover:shadow-md hover:shadow-brand-500/20 focus:ring-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400',
      secondary:
        'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200/80 focus:ring-slate-400 dark:bg-dark-800 dark:hover:bg-dark-750 dark:text-slate-100 dark:border-dark-700',
      outline:
        'border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 focus:ring-brand-500 dark:border-dark-700 dark:text-slate-200 dark:hover:bg-dark-800 dark:hover:border-slate-600',
      ghost:
        'text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400 dark:text-slate-300 dark:hover:bg-dark-800 dark:hover:text-white',
      danger:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-sm hover:shadow-md hover:shadow-rose-500/20 focus:ring-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400',
      link:
        'text-brand-600 hover:text-brand-500 underline-offset-4 hover:underline p-0 h-auto focus:ring-0 dark:text-brand-400',
    };

    const sizes = {
      sm: 'text-xs px-4 py-1.5 gap-2 min-h-[34px] rounded-lg',
      md: 'text-sm px-5 py-2.5 gap-2.5 min-h-[42px] rounded-xl',
      lg: 'text-base px-6 py-3 gap-3 min-h-[48px] rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0 mr-1.5" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0 items-center mr-1.5">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0 items-center ml-1.5">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
