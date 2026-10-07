import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { ToastProvider } from './components/ui/Toast';
import { useTheme } from './hooks/useTheme';
import { useAppDispatch } from './store/hooks';
import { checkAuth } from './store/slices/authSlice';

export const App: React.FC = () => {
  useTheme();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
