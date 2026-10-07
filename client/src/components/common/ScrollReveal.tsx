import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  delay = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If browser doesn't support IntersectionObserver or user prefers reduced motion, show immediately
    if (
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) observer.unobserve(domRef.current);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const currentElem = domRef.current;
    if (currentElem) observer.observe(currentElem);

    return () => {
      if (currentElem) observer.unobserve(currentElem);
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={cn(
        'transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu',
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-7 scale-[0.99] pointer-events-none',
        className
      )}
    >
      {children}
    </div>
  );
};
