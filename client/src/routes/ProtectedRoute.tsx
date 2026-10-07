import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { ROUTES } from '../constants/routes';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-950">
        <Spinner size="lg" label="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login preserving the attempted destination
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
};
