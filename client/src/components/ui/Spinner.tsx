import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, label }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className="inline-flex flex-col items-center justify-center gap-2">
      <Loader2 className={cn('animate-spin text-brand-500', sizes[size], className)} />
      {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
    </div>
  );
};
