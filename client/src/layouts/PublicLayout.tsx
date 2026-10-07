import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { FestivalBanner } from '../components/common/FestivalBanner';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { PwaInstallPrompt } from '../components/common/PwaInstallPrompt';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 transition-colors pb-20 lg:pb-0">
      <FestivalBanner />
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <PwaInstallPrompt />
    </div>
  );
};

