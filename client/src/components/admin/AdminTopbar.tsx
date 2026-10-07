import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  ShieldCheck,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
  ExternalLink,
  LayoutDashboard,
  Trophy,
  BookOpen,
  Users,
  CreditCard,
  BarChart3,
  RefreshCw,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';
import { ThemeToggle } from '../common/ThemeToggle';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { AdminGlobalSearchModal } from './AdminGlobalSearchModal';
import { ROUTES } from '../../constants/routes';

interface AdminTopbarProps {
  onOpenMobileSidebar: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({ onOpenMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const handleFlushCache = () => {
    setIsRefreshingCache(true);
    setTimeout(() => {
      setIsRefreshingCache(false);
      success('System cache & MongoDB session refreshed successfully!', 'System Synced ⚡');
    }, 800);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="h-16 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl flex items-center justify-between sticky top-0 z-50 transition-colors shadow-xs">
        {/* Left Side: Mobile Menu + Search Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden transition-colors cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Trigger */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-3 px-3.5 py-2 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-sm group cursor-pointer"
          >
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors" />
            <span className="hidden sm:inline font-medium">Search platform resources...</span>
            <span className="sm:hidden font-medium">Search...</span>
            <kbd className="hidden sm:inline-block text-[10px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-md font-mono font-bold group-hover:border-amber-500/40">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Side: Student Hub Link, Root Admin Badge, Theme, Notifications, User Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Switch to Student View */}
          <Link
            to={ROUTES.DASHBOARD}
            target="_blank"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-semibold font-mono transition-all shadow-xs group"
            title="Open Student Dashboard in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
            <span>Student Hub</span>
          </Link>

          {/* Root Admin Mode Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-mono font-bold shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
            <span>Root Admin</span>
          </div>

          <ThemeToggle compact />

          <NotificationDropdown />

          {/* Master Admin User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer group"
              aria-label="Admin account menu"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-xs shadow-md group-hover:scale-105 transition-transform overflow-hidden">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user?.name)
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-start text-left leading-tight">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors max-w-[120px] truncate">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                  <Crown className="w-2.5 h-2.5 fill-amber-500" /> Root Admin
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 hidden sm:block ${
                  userMenuOpen ? 'rotate-180 text-amber-500' : ''
                }`}
              />
            </button>

            {/* Redesigned High-Impact Master Admin Dropdown Console */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-3 z-50 ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100 dark:divide-slate-800">
                
                {/* 1. Header Profile Banner */}
                <div className="p-3 bg-gradient-to-br from-amber-500/10 via-slate-50 to-amber-500/5 dark:from-amber-500/15 dark:via-slate-850 dark:to-slate-900 rounded-2xl border border-amber-500/20 mb-2">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 overflow-hidden ring-2 ring-amber-400/40">
                        {user?.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(user?.name)
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-md bg-amber-500 text-[9px] font-black text-slate-950 shadow-xs">
                        ROOT
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {user?.name || 'NextEra Coders Administrator'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                        {user?.email || 'admin@nexteracoders.com'}
                      </p>
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                          <Crown className="w-2.5 h-2.5" /> Full Root Access
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Instant Switchers (Student View vs Public Site) */}
                <div className="py-2 grid grid-cols-2 gap-1.5">
                  <Link
                    to={ROUTES.DASHBOARD}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                  >
                    <div className="p-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">Student Hub</span>
                  </Link>

                  <Link
                    to={ROUTES.HOME}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-all group"
                  >
                    <div className="p-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">Public Website</span>
                  </Link>
                </div>

                {/* 3. Quick Command Matrix (2-Column Grid of Core Admin Modules) */}
                <div className="py-2.5 space-y-1">
                  <div className="px-1 pb-1 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Administrative Command Center
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1">
                    <Link
                      to={ROUTES.ADMIN}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <LayoutDashboard className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">Dashboard</span>
                    </Link>

                    <Link
                      to={ROUTES.ADMIN_CONTEST}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <Trophy className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">Contests & Coins</span>
                    </Link>

                    <Link
                      to={ROUTES.ADMIN_COURSES}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">Courses CMS</span>
                    </Link>

                    <Link
                      to={ROUTES.ADMIN_STUDENTS}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <Users className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">Students</span>
                    </Link>

                    <Link
                      to={ROUTES.ADMIN_PAYMENTS}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <CreditCard className="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">Payments</span>
                    </Link>

                    <Link
                      to={ROUTES.ADMIN_ANALYTICS}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <BarChart3 className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">Analytics</span>
                    </Link>

                    <Link
                      to={ROUTES.PROFILE}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <User className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">My Profile</span>
                    </Link>

                    <Link
                      to={ROUTES.ADMIN_SETTINGS}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <Settings className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">Settings</span>
                    </Link>
                  </div>
                </div>

                {/* 4. Live Diagnostic & System Cache Sync Action */}
                <div className="py-2">
                  <button
                    onClick={handleFlushCache}
                    disabled={isRefreshingCache}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700/60 group"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-emerald-500 ${
                          isRefreshingCache ? 'animate-spin text-emerald-500' : 'group-hover:rotate-180 transition-transform duration-500'
                        }`}
                      />
                      <span>Sync MongoDB & Cache</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">LIVE</span>
                  </button>
                </div>

                {/* 5. Master Sign Out Action */}
                <div className="pt-2 border-t border-slate-100 dark:border-dark-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200/80 dark:border-rose-500/30 transition-all cursor-pointer shadow-2xs group"
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
        </div>
      </header>

      {/* Global Search Modal */}
      <AdminGlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
};

