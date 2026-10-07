import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  breadcrumbs = [],
  action,
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1.5" aria-label="Breadcrumb">
            <Link to="/admin" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
              Admin
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                {crumb.path ? (
                  <Link to={crumb.path} className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
        {description && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
      </div>

      {action && <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">{action}</div>}
    </div>
  );
};
