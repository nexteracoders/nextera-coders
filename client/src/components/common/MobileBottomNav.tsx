import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { pwaService } from '../../services/pwa.service';
import {
  Home,
  BookOpen,
  Terminal,
  Trophy,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isStandalone, setIsStandalone] = useState(false);

  // Detect whether running in installed PWA standalone mode
  useEffect(() => {
    setIsStandalone(pwaService.isInstalled());

    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
      }
    };

    const mql = window.matchMedia('(display-mode: standalone)');
    if (mql?.addEventListener) {
      mql.addEventListener('change', handleDisplayModeChange);
      return () => mql.removeEventListener('change', handleDisplayModeChange);
    }
  }, []);

  // Subtle haptic vibration for authentic native app feel
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Silently skip if vibration is blocked or unsupported
      }
    }
  };

  const navItems = [
    {
      label: 'Home',
      to: ROUTES.HOME,
      icon: Home,
      isActive: (pathname: string) => pathname === ROUTES.HOME,
    },
    {
      label: 'Courses',
      to: ROUTES.COURSES,
      icon: BookOpen,
      isActive: (pathname: string) => pathname.startsWith(ROUTES.COURSES),
    },
    {
      label: 'Compiler',
      to: ROUTES.COMPILER,
      icon: Terminal,
      highlight: true,
      isActive: (pathname: string) => pathname.startsWith(ROUTES.COMPILER),
    },
    {
      label: 'Practice',
      to: ROUTES.PRACTICE,
      icon: Trophy,
      isActive: (pathname: string) =>
        pathname.startsWith(ROUTES.PRACTICE) ||
        pathname.startsWith(ROUTES.DSA) ||
        pathname.startsWith(ROUTES.DAILY_STREAK) ||
        pathname.startsWith(ROUTES.TOP_INTERVIEW_150) ||
        pathname.startsWith(ROUTES.CONTESTS_HUB) ||
        pathname.startsWith(ROUTES.DUELS) ||
        pathname.startsWith(ROUTES.PRIME_DUELS),
    },
    {
      label: 'Profile',
      to: isAuthenticated ? ROUTES.PROFILE : ROUTES.LOGIN,
      icon: UserIcon,
      isProfile: true,
      isActive: (pathname: string) =>
        pathname.startsWith(ROUTES.PROFILE) ||
        pathname.startsWith(ROUTES.DASHBOARD) ||
        pathname.startsWith(ROUTES.MY_LEARNING) ||
        pathname === ROUTES.LOGIN ||
        pathname === ROUTES.REGISTER,
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom App Navigation"
      className={cn(
        // Hide completely on Desktop/Laptop (Website experience on large screens)
        'lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 select-none',
        // Glassmorphism and app-like elevation
        'bg-white/92 dark:bg-dark-950/92 backdrop-blur-2xl border-t border-slate-200/80 dark:border-dark-800/90',
        'shadow-[0_-8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_-12px_40px_rgba(0,0,0,0.6)]',
        isStandalone ? 'pt-1.5' : 'pt-1'
      )}
      style={{
        // Safe area for iPhone home indicator and Android gesture navigation bar
        paddingBottom: isStandalone
          ? 'max(env(safe-area-inset-bottom, 12px), 12px)'
          : 'max(env(safe-area-inset-bottom, 6px), 6px)',
      }}
    >
      <div className="max-w-md mx-auto px-3 sm:px-6 flex items-center justify-around relative">
        {navItems.map((item) => {
          const active = item.isActive(location.pathname);
          const Icon = item.icon;

          // Special Center Elevated Action Button (Compiler >_)
          if (item.highlight) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  triggerHaptic();
                  if (active) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="relative -top-2 flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md',
                    active
                      ? 'bg-gradient-to-tr from-brand-600 via-indigo-600 to-emerald-500 text-white shadow-brand-500/40 scale-105 ring-2 ring-white dark:ring-dark-900'
                      : 'bg-gradient-to-tr from-slate-900 to-slate-800 dark:from-dark-850 dark:to-dark-800 text-slate-100 hover:scale-105 border border-slate-700/50'
                  )}
                >
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold tracking-tight mt-0.5 transition-colors',
                    active
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          }

          // Regular App Tab (Home, Courses, Practice, Profile)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                triggerHaptic();
                if (active) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={cn(
                'relative flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-2xl transition-all duration-200 cursor-pointer',
                'active:scale-90 focus:outline-none'
              )}
            >
              <div
                className={cn(
                  'relative flex items-center justify-center w-9 h-7 rounded-full transition-all duration-200',
                  active && 'bg-brand-50 dark:bg-brand-950/60'
                )}
              >
                {/* Profile Avatar if logged in and profile image exists */}
                {item.isProfile && isAuthenticated && (user?.profileImage || (user as any)?.avatar) ? (
                  <div className="relative">
                    <img
                      src={user?.profileImage || (user as any)?.avatar}
                      alt={user?.name || 'Profile'}
                      className={cn(
                        'w-5 h-5 rounded-full object-cover transition-all',
                        active
                          ? 'ring-2 ring-brand-500 scale-105'
                          : 'ring-1 ring-slate-300 dark:ring-dark-700 opacity-85'
                      )}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white dark:border-dark-950" />
                  </div>
                ) : (
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-all duration-200',
                      active
                        ? 'text-brand-600 dark:text-brand-400 scale-110 stroke-[2.4]'
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 stroke-[1.8]'
                    )}
                  />
                )}

                {/* Active Indicator Glow Dot */}
                {active && (
                  <span className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 dark:bg-brand-400 shadow-[0_0_8px_rgba(99,102,241,0.9)] animate-pulse" />
                )}
              </div>

              <span
                className={cn(
                  'text-[10px] tracking-tight mt-1 transition-all',
                  active
                    ? 'font-bold text-brand-600 dark:text-brand-400 scale-105'
                    : 'font-medium text-slate-500 dark:text-slate-400'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
