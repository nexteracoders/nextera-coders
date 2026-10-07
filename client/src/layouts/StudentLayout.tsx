import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StudentSidebar } from '../components/common/StudentSidebar';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { NotificationDropdown } from '../components/common/NotificationDropdown';
import { UserMenu } from '../components/common/UserMenu';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { PwaInstallPrompt } from '../components/common/PwaInstallPrompt';
import { Menu } from 'lucide-react';

import { RouteAwareErrorBoundary } from '../components/common/ErrorBoundary';

export const StudentLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 transition-colors">
      <StudentSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-dark-800 bg-white/80 dark:bg-dark-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-dark-850 cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-dark-850 px-2.5 py-1 rounded-md">
              Student Environment
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle compact />
            <NotificationDropdown />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto pb-20 md:pb-6">
          <RouteAwareErrorBoundary inline>
            <Outlet />
          </RouteAwareErrorBoundary>
        </main>
      </div>

      <MobileBottomNav />
      <PwaInstallPrompt />
    </div>
  );
};

