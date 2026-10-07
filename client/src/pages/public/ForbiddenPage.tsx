import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="py-20 max-w-md mx-auto px-4 text-center animate-fade-in">
      <div className="bg-surface-900 border border-surface-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-surface-100">403: Access Denied</h1>
          <p className="text-xs text-surface-400 leading-relaxed">
            You do not possess the required administrative permissions to access this control interface.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to={ROUTES.DASHBOARD} className="w-full sm:w-auto">
            <Button className="w-full flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              <span>Student Dashboard</span>
            </Button>
          </Link>
          <Link to={ROUTES.HOME} className="w-full sm:w-auto">
            <Button variant="ghost" className="w-full flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
