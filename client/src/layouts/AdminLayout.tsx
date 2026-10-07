import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopbar } from '../components/admin/AdminTopbar';

import { RouteAwareErrorBoundary } from '../components/common/ErrorBoundary';

export const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 transition-colors">
      <AdminSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex-1 flex flex-col h-screen min-w-0 overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'lg:pl-18' : 'lg:pl-64'
        }`}
      >
        <div className="shrink-0 z-30 sticky top-0">
          <AdminTopbar onOpenMobileSidebar={() => setMobileOpen(true)} />
        </div>

        <main className="flex-1 overflow-y-auto w-full">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
            <RouteAwareErrorBoundary inline>
              <Outlet />
            </RouteAwareErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};
