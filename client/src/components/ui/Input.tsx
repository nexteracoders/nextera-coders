import React, { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, leftIcon, rightIcon, rightElement, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
              'dark:bg-dark-900 dark:text-slate-100 dark:placeholder:text-slate-500',
              error
                ? 'border-rose-500 focus:ring-rose-500 dark:border-rose-500'
                : 'border-slate-300 dark:border-dark-800 hover:border-slate-400 dark:hover:border-slate-700',
              leftIcon ? 'pl-10' : '',
              (rightIcon || rightElement) ? 'pr-10' : '',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />
          {rightIcon && !rightElement && (
            <div className="absolute right-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
          {rightElement && (
            <div className="absolute right-2.5 flex items-center z-10">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
