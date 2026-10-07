import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="py-20 max-w-md mx-auto px-4 text-center animate-fade-in">
      <div className="bg-surface-900 border border-surface-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-surface-100">401: Authentication Required</h1>
          <p className="text-xs text-surface-400 leading-relaxed">
            You must be signed in to access this section of NextEra Coders Learning.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to={ROUTES.LOGIN} className="w-full sm:w-auto">
            <Button className="w-full flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
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
