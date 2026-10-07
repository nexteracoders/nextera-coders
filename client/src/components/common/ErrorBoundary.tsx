import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  resetKey?: string;
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  prevResetKey?: string;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    prevResetKey: this.props.resetKey,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    // If resetKey changed (e.g. location.pathname changed), immediately clear error
    if (props.resetKey !== undefined && props.resetKey !== state.prevResetKey) {
      return {
        hasError: false,
        error: null,
        errorInfo: null,
        prevResetKey: props.resetKey,
        showDetails: false,
      };
    }
    return null;
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
    this.setState({ errorInfo });

    // Vite Stale Chunk Auto-Recovery
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.name === 'ChunkLoadError';

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('nextera:chunk_reload_ts');
      const now = Date.now();
      // Auto-reload once within 12 seconds to seamlessly fetch latest chunk
      if (!lastReload || now - parseInt(lastReload, 10) > 12000) {
        sessionStorage.setItem('nextera:chunk_reload_ts', String(now));
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  private handleCopyError = () => {
    const errorText = `${this.state.error?.name || 'Error'}: ${this.state.error?.message || 'Unknown error'}\n\nStack:\n${this.state.error?.stack || ''}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isInline = this.props.inline;

      return (
        <div
          className={
            isInline
              ? 'p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 my-4 shadow-xl text-center space-y-4'
              : 'min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-200'
          }
        >
          {/* Ambient Decorative Background Lights */}
          {!isInline && (
            <>
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-br from-indigo-500/10 dark:from-brand-600/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-tl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            </>
          )}

          <div
            className={
              isInline
                ? 'w-full space-y-4'
                : 'max-w-xl w-full text-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-500/10 dark:shadow-black/80 space-y-6 relative z-10 animate-fade-in'
            }
          >
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500/15 via-amber-500/10 to-transparent border border-rose-500/30 text-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 inline-block">
                Render Protection Guard
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Something Went Wrong
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                An unexpected component rendering issue occurred on this view. You can reload the page to refresh assets, go back, or return directly to home.
              </p>
            </div>

            {/* Action Buttons with High-Contrast Gradient & Sleek Styling */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer border border-white/20 group"
              >
                <RefreshCw className="w-4 h-4 text-white group-hover:rotate-180 transition-transform duration-500" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoBack}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Go Back</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <Home className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Return Home</span>
              </button>
            </div>

            {/* Collapsible Technical Details for Debugging */}
            {this.state.error && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 text-left">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center justify-between w-full text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
                >
                  <span>Technical Diagnostics</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-2 relative">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pb-1 border-b border-slate-200 dark:border-slate-850">
                      <span className="text-rose-500 font-bold truncate">
                        {this.state.error.name}: {this.state.error.message}
                      </span>
                      <button
                        type="button"
                        onClick={this.handleCopyError}
                        className="p-1 hover:text-slate-900 dark:hover:text-white rounded transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                        title="Copy error details"
                      >
                        {this.state.copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    {this.state.error.stack && (
                      <pre className="max-h-36 overflow-y-auto text-slate-600 dark:text-slate-500 text-[10px] whitespace-pre-wrap scrollbar-thin">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * RouteAwareErrorBoundary
 * Automatically clears errors whenever location changes so user is never trapped.
 */
export const RouteAwareErrorBoundary: React.FC<{ children: ReactNode; inline?: boolean }> = ({
  children,
  inline,
}) => {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname + location.search + location.key} inline={inline}>
      {children}
    </ErrorBoundary>
  );
};
