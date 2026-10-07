import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  Shield,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Trophy,
  Crown,
  Coins,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { openCoinPassbook } from './CoinPassbookModal';

export const UserMenu: React.FC = () => {
  const { user, logout, isAdmin, isSubAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isProMember = Boolean(
    user &&
    user.isPro &&
    user.subscription?.plan &&
    user.subscription?.status === 'active' &&
    (!user.subscription.endDate || new Date(user.subscription.endDate) > new Date())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate(ROUTES.HOME);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Sleek Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-2xl border transition-all duration-200 cursor-pointer',
          'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-800 shadow-xs',
          'dark:border-dark-800 dark:bg-dark-900 dark:hover:bg-dark-850 dark:text-slate-100',
          isOpen && 'ring-2 ring-brand-500/20 border-brand-500 dark:border-brand-500'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar with Status Ring */}
        <div className="relative shrink-0">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className={cn(
                'w-8 h-8 rounded-xl object-cover ring-1',
                isSubAdmin ? 'ring-emerald-500 ring-2' : 'ring-slate-200 dark:ring-dark-700'
              )}
            />
          ) : (
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold font-mono shadow-xs',
              isSubAdmin
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                : 'bg-gradient-to-tr from-brand-600 to-indigo-600'
            )}>
              {getInitials(user.name)}
            </div>
          )}

          {/* Role Satellite Dot */}
          {isAdmin ? (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shadow-xs ring-1 ring-white dark:ring-dark-900" title="Admin">
              <Shield className="w-2.5 h-2.5 text-white" />
            </div>
          ) : isSubAdmin ? (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-xs ring-1 ring-white dark:ring-dark-900" title="Sub Admin">
              <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </div>
          ) : isProMember ? (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-xs ring-1 ring-white dark:ring-dark-900" title="Pro">
              <Crown className="w-2.5 h-2.5 text-slate-950" />
            </div>
          ) : null}
        </div>

        {/* User Info Labels */}
        <div className="hidden sm:flex flex-col items-start text-left leading-tight">
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
            {user.name}
          </span>
          <span className="text-[10px] font-medium font-mono text-slate-500 dark:text-slate-400">
            {isAdmin ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                Admin
              </span>
            ) : isSubAdmin ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                Sub Admin
              </span>
            ) : isProMember ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                Pro Student
              </span>
            ) : (
              'Student'
            )}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 hidden sm:block',
            isOpen && 'rotate-180 text-brand-500'
          )}
        />
      </button>

      {/* Ultra-Professional Profile Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2.5 w-72 sm:w-80 rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100 dark:divide-dark-800">
          
          {/* Header Card with Gradient Accent */}
          <div className="p-3.5 bg-gradient-to-br from-slate-50 via-white to-brand-50/40 dark:from-dark-900 dark:via-dark-900 dark:to-dark-850 relative">
            <div className="flex items-center gap-3">
              
              {/* Large Avatar */}
              <div className="relative shrink-0">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className={cn(
                      'w-12 h-12 rounded-2xl object-cover ring-2',
                      isSubAdmin ? 'ring-emerald-500' : 'ring-brand-500/30'
                    )}
                  />
                ) : (
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold font-mono text-base shadow-md',
                    isSubAdmin
                      ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-500/20'
                      : 'bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 shadow-brand-500/20'
                  )}>
                    {getInitials(user.name)}
                  </div>
                )}
                {/* Role Icon Satellite Badge (Icon only, no text covering avatar) */}
                {isAdmin ? (
                  <span
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-xs ring-2 ring-white dark:ring-dark-900"
                    title="System Administrator"
                  >
                    <Shield className="w-3 h-3 text-white" />
                  </span>
                ) : isSubAdmin ? (
                  <span
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs ring-2 ring-white dark:ring-dark-900"
                    title="Sub-Administrator"
                  >
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </span>
                ) : isProMember ? (
                  <span
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 shadow-xs ring-2 ring-white dark:ring-dark-900"
                    title="Pro Member"
                  >
                    <Crown className="w-3 h-3 text-slate-950" />
                  </span>
                ) : null}
              </div>

              {/* User Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-2 space-y-1">
            <Link
              to={ROUTES.DASHBOARD}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-850 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span>Student Dashboard</span>
              </div>
            </Link>

            <Link
              to={ROUTES.MY_LEARNING}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-850 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span>My Learning Tracks</span>
              </div>
            </Link>

            <Link
              to={ROUTES.ACHIEVEMENTS}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-850 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span>Rewards & Merch Store</span>
              </div>
            </Link>

            {/* Coins Passbook Interactive Trigger */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openCoinPassbook();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group text-left cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 group-hover:scale-110 transition-transform">
                <Coins className="w-4 h-4" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span>Coins Passbook</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-full">
                  {(user.points ?? 0).toLocaleString()} 🪙
                </span>
              </div>
            </button>

            {/* 🛡️ Sub-Admin Studio Link — Placed RIGHT ABOVE Profile & Account Settings */}
            {isSubAdmin && (
              <Link
                to={ROUTES.ADMIN_COURSES}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 transition-all group shadow-2xs"
              >
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold group-hover:scale-110 transition-transform shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span>Sub Admin Studio</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-black uppercase">
                    Admin
                  </span>
                </div>
              </Link>
            )}

            {/* 👑 Master Super Admin Control Center Link — Placed RIGHT ABOVE Profile & Account Settings */}
            {isAdmin && (
              <Link
                to={ROUTES.ADMIN}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 transition-colors group shadow-2xs"
              >
                <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold group-hover:scale-110 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span>Admin Control Center</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-black uppercase">
                    Owner
                  </span>
                </div>
              </Link>
            )}

            <Link
              to={ROUTES.PROFILE}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-850 hover:text-slate-900 dark:hover:text-white transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                <Settings className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span>Profile & Account Settings</span>
              </div>
            </Link>
          </div>

          {/* Footer Action: Sign Out */}
          <div className="p-2 border-t border-slate-100 dark:border-dark-800 bg-slate-50/60 dark:bg-dark-900/60">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 border border-transparent hover:border-rose-200/80 dark:hover:border-rose-900/50 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all duration-200">
                  <LogOut className="w-4 h-4" />
                </div>
                <span>Sign out</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
