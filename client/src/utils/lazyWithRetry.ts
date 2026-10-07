import React, { lazy, ComponentType } from 'react';

/**
 * lazyWithRetry
 * Resilient wrapper around React.lazy() that automatically retries failed dynamic imports
 * and gracefully reloads when a Vite chunk mismatch or stale service worker asset occurs.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  maxRetries = 2
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        return await factory();
      } catch (err: any) {
        attempts++;
        const errorMessage = String(err?.message || '');
        const isChunkOrFetchError =
          errorMessage.includes('Failed to fetch dynamically imported module') ||
          errorMessage.includes('Importing a module script failed') ||
          errorMessage.includes('error loading dynamically imported module') ||
          err?.name === 'ChunkLoadError' ||
          err?.name === 'TypeError';

        if (attempts <= maxRetries && isChunkOrFetchError) {
          // Exponential backoff before next retry (200ms, 400ms)
          await new Promise((res) => setTimeout(res, attempts * 200));
          continue;
        }

        // If retries exhausted and it is a chunk mismatch, auto-reload once to fetch fresh assets
        if (isChunkOrFetchError) {
          const sessionKey = `nextera_chunk_retry_${window.location.pathname}`;
          const hasReloaded = sessionStorage.getItem(sessionKey);

          if (!hasReloaded) {
            sessionStorage.setItem(sessionKey, 'true');
            window.location.reload();
            // Return unresolved promise while window is reloading to prevent flashing ErrorBoundary
            return new Promise<{ default: T }>(() => {});
          } else {
            sessionStorage.removeItem(sessionKey);
          }
        }

        console.error('lazyWithRetry failed to load module component:', err);
        throw err;
      }
    }

    throw new Error('Component failed to load dynamically after retries.');
  });
}
