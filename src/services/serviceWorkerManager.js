/**
 * @file serviceWorkerManager.js
 * @description Manages Progressive Web App (PWA) service worker lifecycles,
 * background update polling, foreground visibility checks, and cache clearing.
 */

/**
 * Checks for available service worker updates against the server.
 *
 * @returns {Promise<{ hasUpdate: boolean, message: string }>} Result of the update check.
 */
export async function checkForUpdates() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { hasUpdate: false, message: 'Service workers are not supported on this device.' };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { hasUpdate: false, message: 'App is running in online browser mode.' };
    }

    // Force network check for new service worker script
    await registration.update();

    if (registration.waiting) {
      return { hasUpdate: true, message: 'A new version of Lover-HQ is ready to install.' };
    }

    if (registration.installing) {
      return { hasUpdate: true, message: 'An update is currently downloading.' };
    }

    return { hasUpdate: false, message: 'You are on the latest version of Lover-HQ.' };
  } catch (error) {
    console.warn('[ServiceWorker] Update check failed:', error);
    return { hasUpdate: false, message: 'Could not reach server to check for updates.' };
  }
}

/**
 * Purges all Cache Storage entries, unregisters service workers,
 * and performs a clean reload of the application.
 *
 * @returns {Promise<void>}
 */
export async function clearAppCacheAndReload() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Purge all Cache API stores
    if ('caches' in window) {
      const cacheKeys = await window.caches.keys();
      await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
    }

    // 2. Unregister active service worker registrations
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to purge cache storage:', error);
  } finally {
    // 3. Force reload the window
    window.location.reload();
  }
}

/**
 * Initializes automatic background and foreground service worker listeners.
 * Recovers automatically from Vite dynamic import chunk failures.
 *
 * @param {{
 *   onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void,
 * }} [options={}]
 * @returns {() => void} Teardown function to remove all registered listeners.
 */
export function initServiceWorkerUpdateListener(options = {}) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  const { onUpdateAvailable } = options;

  /**
   * Proactively queries for updates when the app returns to foreground.
   */
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {});
      });
    }
  };

  /**
   * Catches Vite chunk load errors when deployed chunks change.
   * Prevents blank screens by reloading the latest build assets.
   */
  const handlePreloadError = () => {
    console.info('[ServiceWorker] Vite chunk outdated after deploy. Reloading...');
    window.location.reload();
  };

  /**
   * Inspects a registration for waiting/installing workers.
   *
   * @param {ServiceWorkerRegistration} reg
   */
  const inspectRegistration = (reg) => {
    if (!reg) return;

    if (reg.waiting && onUpdateAvailable) {
      onUpdateAvailable(reg);
      return;
    }

    reg.addEventListener('updatefound', () => {
      const installingWorker = reg.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (
          installingWorker.state === 'installed' &&
          navigator.serviceWorker.controller &&
          onUpdateAvailable
        ) {
          onUpdateAvailable(reg);
        }
      });
    });
  };

  // Inspect existing registration
  navigator.serviceWorker.getRegistration().then(inspectRegistration);

  // Foreground resumption listener
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Vite dynamic chunk failure listener
  window.addEventListener('vite:preloadError', handlePreloadError);

  // Periodic polling every 30 minutes
  const intervalId = setInterval(
    () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {});
      });
    },
    30 * 60 * 1000
  );

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('vite:preloadError', handlePreloadError);
    clearInterval(intervalId);
  };
}
