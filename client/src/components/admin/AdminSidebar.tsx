import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Layers,
  Video,
  FileText,
  FolderGit2,
  HelpCircle,
  Code2,
  Users,
  Award,
  Trophy,
  Megaphone,
  Bell,
  MessageSquareQuote,
  GraduationCap,
  Settings,
  ShieldCheck,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Gift,
  ShoppingBag,
  Flame,
  Swords,
  Crown,
  Coins,
  Footprints,
  Target,
  X,
} from 'lucide-react';
import { getAdminNavGroups } from '../../constants/navigation';
import { useAuth } from '../../hooks/useAuth';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Layers,
  Video,
  FileText,
  FolderGit2,
  Footprints,
  HelpCircle,
  Code2,
  Users,
  Award,
  Trophy,
  Swords,
  Crown,
  Coins,
  Flame,
  Target,
  Megaphone,
  Bell,
  MessageSquareQuote,
  GraduationCap,
  Briefcase,
  Gift,
  ShoppingBag,
  Settings,
  ShieldCheck,
  CreditCard,
};

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const isSubAdmin = user?.role === 'sub_admin';
  const navGroups = getAdminNavGroups(user?.role);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link
          to={isSubAdmin ? '/admin/courses' : '/admin'}
          className="flex items-center gap-3 group overflow-hidden"
          onClick={onCloseMobile}
        >
          <div className="w-[52px] h-8 rounded-lg bg-slate-950 border border-amber-500/30 flex items-center justify-center overflow-hidden shadow-lg shadow-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
            <video
              src="/favicon-video.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 truncate">
                NextEra{' '}
                <span className="text-amber-600 dark:text-amber-400 font-bold text-xs px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                  {isSubAdmin ? 'Studio' : 'CMS'}
                </span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                {isSubAdmin ? 'Content Management' : 'Platform Governance'}
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {group.name}
              </div>
            )}
            {group.items.map((item, iIdx) => {
              const Icon = item.icon ? iconMap[item.icon] || LayoutDashboard : LayoutDashboard;
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={iIdx}
                  to={item.path}
                  onClick={onCloseMobile}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative border ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-xs'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-amber-300'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
                  {item.badge && !isCollapsed && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                      {item.badge}
                    </span>
                  )}
                  {isActive && !isCollapsed && !item.badge && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Desktop Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 hidden lg:block">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed/Persistent Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
