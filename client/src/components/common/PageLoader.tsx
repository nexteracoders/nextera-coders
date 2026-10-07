import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Loading platform workspace...',
}) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary animate-spin">
          <Loader2 className="w-6 h-6" />
        </div>
      </div>
      <p className="text-xs font-semibold text-surface-400 font-mono tracking-wide">
        {message}
      </p>
    </div>
  );
};
