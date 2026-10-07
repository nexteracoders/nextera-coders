/**
 * NextEra Coders - Progressive Web App (PWA) Service
 * Manages native app installation, standalone detection, and background updates
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Global variable to capture prompt even before components mount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    window.__pwaDeferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
  });

  window.addEventListener('appinstalled', () => {
    window.__pwaDeferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed-success'));
    console.log('✓ NextEra Coders PWA installed successfully!');
  });
}

export const pwaService = {
  /**
   * Check if app is running in standalone PWA mode (already installed)
   */
  isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  },

  /**
   * Check if running on iOS (iPhone, iPad, iPod)
   */
  isIos(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  },

  /**
   * Check if running on a mobile or tablet device
   */
  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /android|iphone|ipad|ipod|mobile|tablet/.test(ua);
  },

  /**
   * Check if deferred install prompt is ready to be shown
   */
  hasInstallPrompt(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.__pwaDeferredPrompt);
  },

  /**
   * Trigger the native installation prompt
   */
  async triggerInstall(): Promise<'accepted' | 'dismissed' | 'manual' | 'already-installed'> {
    if (this.isInstalled()) {
      return 'already-installed';
    }

    if (window.__pwaDeferredPrompt) {
      const promptEvent = window.__pwaDeferredPrompt;
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        window.__pwaDeferredPrompt = null;
      }
      return choiceResult.outcome;
    }

    // Fallback: Notify UI to show manual guidance modal (for iOS or Desktop address bar install)
    window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
    return 'manual';
  },

  /**
   * Dispatches event to open the PWA install modal from anywhere in the app
   */
  openInstallModal() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
    }
  },

  /**
   * Force update and reload the application with latest Service Worker assets
   */
  reloadForUpdate() {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.update();
          }
        });
      }
      window.location.reload();
    }
  }
};
