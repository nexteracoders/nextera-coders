import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Container } from './Container';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'subtle' | 'muted' | 'brand' | 'dark';
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noPadding?: boolean;
}

export const Section: React.FC<SectionProps> = ({
  className,
  variant = 'default',
  containerSize = 'lg',
  noPadding = false,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-transparent',
    subtle: 'bg-slate-100/60 dark:bg-dark-900/40 border-y border-slate-200/60 dark:border-dark-800/60',
    muted: 'bg-slate-100 dark:bg-dark-900 border-y border-slate-200 dark:border-dark-800',
    brand: 'bg-brand-50/60 dark:bg-brand-950/20 border-y border-brand-100 dark:border-brand-900/40',
    dark: 'bg-dark-950 text-white border-y border-dark-800',
  };

  const padding = noPadding ? '' : 'py-16 sm:py-24';

  return (
    <section className={cn(variants[variant], padding, 'transition-colors relative overflow-hidden', className)} {...props}>
      <Container size={containerSize}>{children}</Container>
    </section>
  );
};
