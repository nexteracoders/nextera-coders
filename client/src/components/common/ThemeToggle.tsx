import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ThemeToggle: React.FC<{ className?: string; compact?: boolean }> = ({
  className,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center',
        'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 shadow-xs',
        'dark:border-dark-800 dark:bg-dark-900 dark:hover:bg-dark-850 dark:text-slate-200',
        className
      )}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle light or dark theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-brand-600 dark:text-brand-400 hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
};
