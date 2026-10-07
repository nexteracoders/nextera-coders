import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from './Badge';
import { ROUTES } from '../../constants/routes';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PageHeaderProps {
  badge?: string;
  title: string;
  description: string;
  breadcrumbs?: { label: string; path?: string }[];
  actionSlot?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  title,
  description,
  breadcrumbs,
  actionSlot,
  className,
}) => {
  return (
    <div className={cn('py-8 sm:py-12 border-b border-slate-200 dark:border-dark-800 bg-white/40 dark:bg-dark-900/40 backdrop-blur-sm transition-colors mb-8', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Breadcrumbs */}
        {breadcrumbs && (
          <nav className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
            <Link to={ROUTES.HOME} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Home
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                {crumb.path ? (
                  <Link to={crumb.path} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            {badge && <Badge variant="info" size="sm">{badge}</Badge>}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>

          {actionSlot && <div className="shrink-0">{actionSlot}</div>}
        </div>
      </div>
    </div>
  );
};
