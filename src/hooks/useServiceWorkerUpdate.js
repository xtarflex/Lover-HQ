/**
 * @file useServiceWorkerUpdate.js
 * @description Hook that manages PWA service worker background updates,
 * foreground visibility checks, and exposes update availability status.
 */

import { useState, useEffect } from 'react';
import {
  initServiceWorkerUpdateListener,
  checkForUpdates,
  clearAppCacheAndReload,
} from '../services/serviceWorkerManager';

/**
 * Custom hook to monitor and trigger application updates.
 *
 * @returns {{
 *   isUpdateAvailable: boolean,
 *   isChecking: boolean,
 *   updateStatus: string|null,
 *   handleCheckUpdates: () => Promise<void>,
 *   handleApplyUpdate: () => void,
 *   handleClearCacheAndReload: () => Promise<void>,
 *   dismissUpdateBanner: () => void,
 * }}
 */
export function useServiceWorkerUpdate() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);

  useEffect(() => {
    const cleanup = initServiceWorkerUpdateListener({
      onUpdateAvailable: () => {
        setIsUpdateAvailable(true);
      },
    });

    return cleanup;
  }, []);

  /**
   * Triggers an explicit network update check.
   */
  const handleCheckUpdates = async () => {
    setIsChecking(true);
    setUpdateStatus(null);
    try {
      const result = await checkForUpdates();
      setUpdateStatus(result.message);
      if (result.hasUpdate) {
        setIsUpdateAvailable(true);
      }
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Applies the pending update by cleanly reloading the page.
   */
  const handleApplyUpdate = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  /**
   * Dismisses the update banner for the current session.
   */
  const dismissUpdateBanner = () => {
    setIsUpdateAvailable(false);
  };

  return {
    isUpdateAvailable,
    isChecking,
    updateStatus,
    handleCheckUpdates,
    handleApplyUpdate,
    handleClearCacheAndReload: clearAppCacheAndReload,
    dismissUpdateBanner,
  };
}

export default useServiceWorkerUpdate;
