import { useState, useEffect, useCallback } from 'react';

export interface UseAutoLandscapeOptions {
  enabled?: boolean;
  onRotate?: (isLandscape: boolean) => void;
}

export function useAutoLandscape(options: UseAutoLandscapeOptions = {}) {
  const { enabled = true } = options;
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  // Check whether device is mobile & whether viewport is currently in portrait
  const checkOrientation = useCallback(() => {
    if (typeof window === 'undefined') return;

    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isSmallScreen = Math.min(width, height) <= 850;
    const portrait = height > width;

    // Trigger on touch devices or screens with width <= 768 in portrait
    const mobile = (isTouch && isSmallScreen) || (width <= 768 && portrait);

    setIsMobile(mobile);
    setIsPortrait(portrait);
  }, []);

  // Request fullscreen and lock orientation to landscape
  const lockLandscape = useCallback(async () => {
    try {
      // 1. Enter fullscreen if available (enables orientation lock on Chrome/Android)
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {
          // Ignore rejection if user denies fullscreen
        }
      }

      // 2. Lock screen orientation
      if (window.screen?.orientation && 'lock' in window.screen.orientation) {
        await (window.screen.orientation as any).lock('landscape');
        checkOrientation();
        return true;
      }
    } catch (err) {
      console.warn('Screen orientation lock could not be applied automatically:', err);
    }
    return false;
  }, [checkOrientation]);

  // Unlock orientation when exiting code editor
  const unlockOrientation = useCallback(() => {
    try {
      if (window.screen?.orientation && 'unlock' in window.screen.orientation) {
        window.screen.orientation.unlock();
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    checkOrientation();

    const handleResizeOrRotate = () => {
      checkOrientation();
    };

    window.addEventListener('resize', handleResizeOrRotate);
    window.addEventListener('orientationchange', handleResizeOrRotate);

    if (window.screen?.orientation?.addEventListener) {
      window.screen.orientation.addEventListener('change', handleResizeOrRotate);
    }

    return () => {
      window.removeEventListener('resize', handleResizeOrRotate);
      window.removeEventListener('orientationchange', handleResizeOrRotate);
      if (window.screen?.orientation?.removeEventListener) {
        window.screen.orientation.removeEventListener('change', handleResizeOrRotate);
      }
      unlockOrientation();
    };
  }, [enabled, checkOrientation, lockLandscape, unlockOrientation]);

  return {
    isMobile,
    isPortrait,
    showPrompt: enabled && isMobile && isPortrait && !dismissed,
    dismissPrompt: () => setDismissed(true),
    reopenPrompt: () => setDismissed(false),
    lockLandscape,
    unlockOrientation,
  };
}
