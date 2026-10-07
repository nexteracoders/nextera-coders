import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export const GitHubCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error_description') || searchParams.get('error');

    if (window.opener) {
      // Post authorization code back to parent opener window
      window.opener.postMessage(
        {
          type: 'GITHUB_OAUTH_CODE',
          code,
          error,
        },
        window.location.origin
      );
      window.close();
    } else {
      // Direct redirect fallback (when opened in same window)
      if (code) {
        navigate(`${ROUTES.LOGIN}?github_code=${code}`, { replace: true });
      } else {
        navigate(ROUTES.LOGIN, { replace: true });
      }
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-950 font-mono text-xs text-slate-500">
      <div className="text-center space-y-3 p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-xl max-w-sm">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-bold text-slate-800 dark:text-slate-100">Connecting GitHub Account...</p>
        <p className="text-[11px] text-slate-400">Verifying authorization. Please wait a moment.</p>
      </div>
    </div>
  );
};
