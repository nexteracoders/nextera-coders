import { useEffect, useRef } from 'react';

export interface UseAntiCheatOptions {
  enabled?: boolean;
  onTabSwitch?: (count: number) => void;
  onWindowBlur?: () => void;
  onPaste?: (event: ClipboardEvent, count: number) => void;
  throttleMs?: number;
}

/**
 * Reusable proctoring and anti-cheat event listener hook.
 * Detects tab switching, window blurring, and clipboard pasting with debounce/throttle.
 */
export function useAntiCheat({
  enabled = true,
  onTabSwitch,
  onWindowBlur,
  onPaste,
  throttleMs = 500,
}: UseAntiCheatOptions) {
  const tabSwitchesRef = useRef<number>(0);
  const pasteCountRef = useRef<number>(0);
  const lastSwitchTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastSwitchTimeRef.current < throttleMs) return;
        lastSwitchTimeRef.current = now;
        tabSwitchesRef.current += 1;
        onTabSwitch?.(tabSwitchesRef.current);
      }
    };

    const handleBlur = () => {
      const now = Date.now();
      if (now - lastSwitchTimeRef.current < throttleMs) return;
      lastSwitchTimeRef.current = now;
      tabSwitchesRef.current += 1;
      onTabSwitch?.(tabSwitchesRef.current);
      onWindowBlur?.();
    };

    const handlePaste = (e: ClipboardEvent) => {
      pasteCountRef.current += 1;
      onPaste?.(e, pasteCountRef.current);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    if (onPaste) {
      window.addEventListener('paste', handlePaste);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      if (onPaste) {
        window.removeEventListener('paste', handlePaste);
      }
    };
  }, [enabled, onTabSwitch, onWindowBlur, onPaste, throttleMs]);

  return {
    tabSwitchesRef,
    pasteCountRef,
  };
}
