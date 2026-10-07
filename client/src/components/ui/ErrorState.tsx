import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}) => {
  return (
    <div className={cn('p-8 text-center flex flex-col items-center justify-center rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 max-w-lg mx-auto', className)}>
      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">{title}</h4>
      <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="mt-4 border-rose-300 dark:border-rose-800"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
