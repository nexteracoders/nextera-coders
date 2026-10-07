import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../utils/cn';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  className,
  iconOnly = false,
}) => {
  const heightClasses = {
    sm: 'h-5 sm:h-6',
    md: 'h-6 sm:h-[26px]',
    lg: 'h-7 sm:h-8',
  };

  const iconSizes = {
    sm: 'w-[52px] h-8',
    md: 'w-[58px] sm:w-[65px] h-9 sm:h-10',
    lg: 'w-[72px] sm:w-[78px] h-11 sm:h-12',
  };

  if (iconOnly) {
    return (
      <Link to={ROUTES.HOME} className={cn('inline-flex items-center group focus:outline-none shrink-0', className)}>
        <div className={cn('rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 border border-brand-500/30', iconSizes[size])}>
          <video
            src="/favicon-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </Link>
    );
  }

  return (
    <Link to={ROUTES.HOME} className={cn('inline-flex items-center group focus:outline-none shrink-0', className)}>
      {/* Dark Theme: Official White-Text Transparent Logo */}
      <img
        src="/images/nec-navbar-logo.png"
        alt="NextEra Coders"
        className={cn(
          'w-auto object-contain transition-transform duration-200 group-hover:scale-105 hidden dark:block',
          heightClasses[size]
        )}
      />
      {/* Light Theme: Dark-Slate Text Transparent Logo for Crystal Clear Contrast */}
      <img
        src="/images/nec-navbar-logo-light.png"
        alt="NextEra Coders"
        className={cn(
          'w-auto object-contain transition-transform duration-200 group-hover:scale-105 block dark:hidden drop-shadow-xs',
          heightClasses[size]
        )}
      />
    </Link>
  );
};

