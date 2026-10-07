import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../../types';
import { cn } from '../../utils/cn';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastContextType {
  toast: (options: Omit<ToastMessage, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration || 4000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = (message: string, title?: string) => addToast({ type: 'success', message, title });
  const error = (message: string, title?: string) => addToast({ type: 'error', message, title });
  const warning = (message: string, title?: string) => addToast({ type: 'warning', message, title });
  const info = (message: string, title?: string) => addToast({ type: 'info', message, title });

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white dark:bg-dark-900 transition-all duration-200 transform translate-y-0',
              t.type === 'success' && 'border-emerald-500/30 text-slate-900 dark:text-white',
              t.type === 'error' && 'border-rose-500/30 text-slate-900 dark:text-white',
              t.type === 'warning' && 'border-amber-500/30 text-slate-900 dark:text-white',
              t.type === 'info' && 'border-brand-500/30 text-slate-900 dark:text-white'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-brand-500" />}
            </div>
            <div className="flex-1">
              {t.title && <h4 className="text-sm font-semibold">{t.title}</h4>}
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
