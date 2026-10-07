import React from 'react';

interface AdminStatusBadgeProps {
  status: string | boolean;
  className?: string;
}

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({ status, className = '' }) => {
  let label = '';
  let colorStyles = '';

  if (typeof status === 'boolean') {
    label = status ? 'Published' : 'Draft';
    colorStyles = status
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
  } else {
    const s = String(status).toUpperCase();
    label = s;

    switch (s) {
      case 'PUBLISHED':
      case 'ACTIVE':
      case 'ACCEPTED':
      case 'PASSED':
        colorStyles = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
        break;
      case 'DRAFT':
      case 'PENDING':
      case 'GENERAL':
        colorStyles = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
        break;
      case 'UNPUBLISHED':
      case 'INACTIVE':
      case 'FAILED':
      case 'DEACTIVATED':
        colorStyles = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
        break;
      case 'IMPORTANT':
      case 'MAINTENANCE':
        colorStyles = 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30';
        break;
      case 'COURSE':
      case 'EVENT':
        colorStyles = 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30';
        break;
      default:
        colorStyles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyles} ${className}`}
    >
      {label}
    </span>
  );
};
