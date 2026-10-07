import React from 'react';
import { Smartphone, RotateCw, X, Code2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface MobileLandscapePromptProps {
  isOpen: boolean;
  onRotateLandscape?: () => void;
  onRotate?: () => void;
  onDismiss: () => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const MobileLandscapePrompt: React.FC<MobileLandscapePromptProps> = ({
  isOpen,
  onRotateLandscape,
  onRotate,
  onDismiss,
  title = 'Rotate to Landscape Mode',
  subtitle = 'Coding, debugging, and viewing test cases is cramped in portrait. Rotate your device horizontally for the full IDE workspace.',
  className,
}) => {
  if (!isOpen) return null;
  const handleRotate = onRotate || onRotateLandscape;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="landscape-prompt-title"
      className={cn(
        'fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200',
        className
      )}
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#131622] border border-brand-500/30 dark:border-brand-500/30 p-6 shadow-2xl text-center space-y-5 overflow-hidden ring-1 ring-white/10">
        {/* Glow ambient backdrops */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-brand-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
          title="Dismiss"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Phone Rotation Visual */}
        <div className="pt-2 flex justify-center items-center">
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-500/15 via-indigo-500/10 to-cyan-500/15 border border-brand-500/30 flex items-center justify-center shadow-inner">
            <div className="animate-phone-rotate text-brand-600 dark:text-brand-400">
              <Smartphone className="w-10 h-10 stroke-[1.8]" />
            </div>
            <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-slate-950 shadow-sm">
              <RotateCw className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-[10px] font-mono font-bold text-brand-700 dark:text-brand-300">
            <Code2 className="w-3 h-3" />
            <span>IDE Experience</span>
          </div>

          <h3
            id="landscape-prompt-title"
            className="text-lg font-black text-slate-900 dark:text-white tracking-tight"
          >
            {title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            {subtitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleRotate}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs font-mono shadow-lg shadow-brand-500/25 active:scale-98 transition-all cursor-pointer"
          >
            <RotateCw className="w-4 h-4 text-cyan-200" />
            <span>Switch to Landscape 🔄</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline transition-colors cursor-pointer"
          >
            Continue in Portrait anyway
          </button>
        </div>
      </div>
    </div>
  );
};
