import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Share,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { pwaService, BeforeInstallPromptEvent } from '../../services/pwa.service';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [showAlreadyInstalledToast, setShowAlreadyInstalledToast] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // 1. Standalone check
    const isStandalone = pwaService.isInstalled();
    if (isStandalone) {
      setInstalled(true);
    }

    // 2. Device checks
    setIsIos(pwaService.isIos());
    setIsMobile(pwaService.isMobile());

    // 3. Check if deferredPrompt is already captured globally
    if (typeof window !== 'undefined' && window.__pwaDeferredPrompt) {
      setDeferredPrompt(window.__pwaDeferredPrompt);
    }

    // 4. Listen for prompt ready from service
    const onPromptReady = () => {
      if (window.__pwaDeferredPrompt) {
        setDeferredPrompt(window.__pwaDeferredPrompt);
      }
    };
    window.addEventListener('pwa-prompt-ready', onPromptReady);

    // 5. Standard beforeinstallprompt for floating banner
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);

      // Check if user dismissed floating banner recently (3 days limit)
      const dismissedAt = localStorage.getItem('nec_pwa_dismissed_at');
      if (dismissedAt) {
        const daysSinceDismissed =
          (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 3) return;
      }

      // Smooth delay before showing automatic floating pill
      setTimeout(() => {
        if (!pwaService.isInstalled()) {
          setShowPrompt(true);
        }
      }, 4000);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 6. Listen for app installed
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setShowIosGuide(false);
      setShowDesktopGuide(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed-success', handleAppInstalled);

    // 7. Manual trigger handler (from Footer or other buttons)
    const handleManualTrigger = async () => {
      if (pwaService.isInstalled()) {
        setShowAlreadyInstalledToast(true);
        setTimeout(() => setShowAlreadyInstalledToast(false), 4500);
        return;
      }

      if (pwaService.isIos()) {
        setShowIosGuide(true);
        return;
      }

      const activePrompt = deferredPrompt || window.__pwaDeferredPrompt;
      if (activePrompt) {
        try {
          await activePrompt.prompt();
          const choice = await activePrompt.userChoice;
          if (choice.outcome === 'accepted') {
            setInstalled(true);
            setShowPrompt(false);
          }
          setDeferredPrompt(null);
          window.__pwaDeferredPrompt = null;
        } catch (err) {
          console.error('PWA install prompt error', err);
          setShowDesktopGuide(true);
        }
      } else {
        // Prompt not ready or browser requires clicking address bar install icon
        setShowDesktopGuide(true);
      }
    };
    window.addEventListener('trigger-pwa-install', handleManualTrigger);

    // 8. Update available listener
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };
    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('pwa-prompt-ready', onPromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed-success', handleAppInstalled);
      window.removeEventListener('trigger-pwa-install', handleManualTrigger);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    const activePrompt = deferredPrompt || (typeof window !== 'undefined' ? window.__pwaDeferredPrompt : null);
    if (!activePrompt) {
      setShowDesktopGuide(true);
      return;
    }

    try {
      await activePrompt.prompt();
      const choiceResult = await activePrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') window.__pwaDeferredPrompt = null;
    } catch (err) {
      console.error('Error triggering PWA install prompt', err);
      setShowDesktopGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    setShowDesktopGuide(false);
    localStorage.setItem('nec_pwa_dismissed_at', Date.now().toString());
  };

  return (
    <>
      {/* 1. App Update Banner (When new version is available) */}
      {updateAvailable && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-3.5 shadow-2xl shadow-emerald-500/25 border border-emerald-400/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">
                  ⚡ Update Available!
                </p>
                <p className="text-[11px] text-white/90 leading-tight truncate">
                  A new version of NextEra Coders is ready.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => pwaService.reloadForUpdate()}
                className="px-3 py-1.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-bold shadow transition-transform active:scale-95 cursor-pointer"
              >
                Update Now
              </button>
              <button
                onClick={() => setUpdateAvailable(false)}
                className="p-1 rounded-full text-white/70 hover:text-white"
                aria-label="Dismiss update"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Already Installed Toast */}
      {showAlreadyInstalledToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="rounded-2xl bg-slate-900/95 dark:bg-dark-900/95 text-white px-4 py-3 shadow-2xl border border-emerald-500/30 flex items-center gap-2.5 backdrop-blur-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">
              NextEra Coders is already installed and ready on your device!
            </span>
          </div>
        </div>
      )}

      {/* 3. Floating Bottom Install Pill (Only for uninstalled visitors) */}
      {!installed && showPrompt && (
        <div className="fixed bottom-20 lg:bottom-6 right-3 left-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="relative rounded-2xl bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl border border-brand-500/30 dark:border-brand-500/20 shadow-2xl p-4 ring-1 ring-black/5 dark:ring-white/10">
            {/* Top Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2.5 right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors cursor-pointer"
              aria-label="Dismiss install banner"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              {/* App Icon */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 p-0.5 shrink-0 shadow-md shadow-brand-500/20 flex items-center justify-center">
                <img
                  src="/icon-192.png"
                  alt="NextEra Coders App"
                  className="w-full h-full object-cover rounded-[14px]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {isMobile ? (
                  <Smartphone className="w-6 h-6 text-white" />
                ) : (
                  <Laptop className="w-6 h-6 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    NextEra Coders
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/80 dark:text-brand-400 border border-brand-500/20">
                    PWA App
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  {isMobile
                    ? 'Install on your phone for full-screen coding, offline reading & instant access!'
                    : 'Install as a lightweight desktop app for distraction-free coding & fast IDE!'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-dark-800/80 flex items-center gap-2 justify-end">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Maybe later
              </button>
              <button
                onClick={handleInstallClick}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install {isMobile ? 'Mobile' : 'Desktop'} App</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Desktop / Universal Manual Install Guide Modal */}
      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-dark-900 p-6 shadow-2xl border border-slate-200 dark:border-dark-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  {isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Install NextEra Coders
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Standalone app for Desktop & Mobile
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-dark-800/60 p-4 border border-slate-200/80 dark:border-dark-700/60 space-y-2.5">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-brand-500 shrink-0" />
                <span>How to install in 1 click:</span>
              </p>
              
              {!isMobile ? (
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 pl-2">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">1.</span>
                    <span>Look at your browser's address bar (URL bar) at the top right.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">2.</span>
                    <span>Click the <strong>Install icon (⊕ or computer screen)</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">3.</span>
                    <span>Click <strong>Install</strong> to add NextEra Coders to your Desktop & Start Menu.</span>
                  </li>
                </ul>
              ) : (
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 pl-2">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">1.</span>
                    <span>Tap the <strong>three dots (⋮)</strong> menu in the top or bottom corner.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">2.</span>
                    <span>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
                  </li>
                </ul>
              )}
            </div>

            <button
              onClick={() => setShowDesktopGuide(false)}
              className="w-full py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md transition-all cursor-pointer"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      {/* 5. iOS Safari Step-by-Step Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-dark-900 p-5 shadow-2xl border border-slate-200 dark:border-dark-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add to iPhone Home Screen
                </h4>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              To install NextEra Coders as a native mobile app on your iPhone or iPad:
            </p>

            <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>
                  Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-brand-500" />{' '}
                  <strong>Share</strong> button in Safari's bottom toolbar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top-right corner.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-2xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md transition-all cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
