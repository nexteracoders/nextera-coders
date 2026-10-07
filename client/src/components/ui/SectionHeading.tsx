import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Badge } from './Badge';

export interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'info' | 'outline';
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  highlightText?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  badgeVariant = 'default',
  title,
  subtitle,
  align = 'center',
  highlightText,
  className,
  ...props
}) => {
  const alignments = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto',
  };

  const renderTitle = () => {
    if (!highlightText || !title.includes(highlightText)) {
      return title;
    }

    const parts = title.split(highlightText);
    return (
      <>
        {parts[0]}
        <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
          {highlightText}
        </span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className={cn('flex flex-col gap-3 max-w-3xl mb-12 sm:mb-16', alignments[align], className)} {...props}>
      {badge && (
        <Badge variant={badgeVariant} size="md" className="mb-1">
          {badge}
        </Badge>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
        {renderTitle()}
      </h2>
      {subtitle && (
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
