import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { UserRole } from '../types';
import { ROUTES } from '../constants/routes';

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-950">
        <Spinner size="lg" label="Checking permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    if (user?.role === 'sub_admin') {
      return <Navigate to={ROUTES.ADMIN_COURSES} replace />;
    }
    // Non-admin attempting to access admin route is redirected to dashboard
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};
