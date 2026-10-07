import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn('p-12 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/30 max-w-lg mx-auto', className)}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-dark-850 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-3.5">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
