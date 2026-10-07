import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { STUDENT_NAV_ITEMS } from '../../constants/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Code2,
  FolderGit2,
  User,
  ArrowLeft,
  HelpCircle,
  FileText,
  Award,
  Trophy,
  Swords,
  Bell,
  ShoppingBag,
  Gift,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  ShoppingBag: <ShoppingBag className="w-4 h-4" />,
  Gift: <Gift className="w-4 h-4" />,
  Award: <Award className="w-4 h-4" />,
  Trophy: <Trophy className="w-4 h-4" />,
  Swords: <Swords className="w-4 h-4" />,
  Code2: <Code2 className="w-4 h-4" />,
  HelpCircle: <HelpCircle className="w-4 h-4" />,
  FolderGit2: <FolderGit2 className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  Bell: <Bell className="w-4 h-4" />,
  User: <User className="w-4 h-4" />,
};

interface StudentSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  mobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Header with Link to Main Landing Page */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 dark:border-dark-800">
          <Link
            to={ROUTES.HOME}
            onClick={() => onCloseMobile?.()}
            title="NextEra Coders — Go to Home"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-[52px] h-8 rounded-lg overflow-hidden bg-slate-950 border border-brand-500/30 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <video
                src="/favicon-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                NextEra Coders
              </span>
              <span className="block text-[10px] font-mono text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                Student Workspace
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {STUDENT_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onCloseMobile?.()}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-dark-850'
                )}
              >
                {item.icon && iconMap[item.icon]}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-dark-800 space-y-2">
        <Link
          to={ROUTES.HOME}
          onClick={() => onCloseMobile?.()}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-dark-850 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Public Portal</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 flex-col shrink-0 h-screen sticky top-0 transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-dark-900 h-full shadow-2xl z-10 flex flex-col border-r border-slate-200 dark:border-dark-800 animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
