/**
 * @file useSpeculativePreload.js
 * @description Custom hook that speculatively pre-loads all lazy route chunks in
 * the background, 2 seconds after initial render, so subsequent route transitions
 * feel instant.
 */

import { useEffect } from 'react';

/**
 * Triggers background import() calls for every lazy-loaded page component after
 * a short delay, warming the module cache without blocking the initial render.
 *
 * @returns {void}
 */
export function useSpeculativePreload() {
  useEffect(() => {
    /**
     * Fires a dynamic import and silently swallows any errors so a single failed
     * prefetch never surfaces to the user.
     *
     * @param {Function} importFn - A zero-argument function that returns a dynamic import promise.
     * @returns {void}
     */
    const preloadComponent = (importFn) => {
      importFn().catch((err) => console.warn('Preload failed:', err));
    };

    const timer = setTimeout(() => {
      preloadComponent(() => import('../features/home/Home'));
      preloadComponent(() => import('../features/fridge/Fridge'));
      preloadComponent(() => import('../features/music/Music'));
      preloadComponent(() => import('../features/games/Games'));
      preloadComponent(() => import('../features/reveal/Reveal'));
      preloadComponent(() => import('../features/board/Board'));
      preloadComponent(() => import('../features/profile/Profile'));
      preloadComponent(() => import('../features/settings/Settings'));
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
}
