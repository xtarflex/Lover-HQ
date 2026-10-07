/**
 * @file DataManagementPanel.jsx
 * @description Settings panel for application versioning, update inspection,
 * offline cache purging, and data management.
 */

import React, { useState } from 'react';
import { Database, RefreshCw, Sparkles, Trash2, CheckCircle2 } from 'lucide-react';
import { APP_VERSION } from '../../../constants/version';
import { checkForUpdates, clearAppCacheAndReload } from '../../../services/serviceWorkerManager';

/**
 * Settings panel that displays the active application version,
 * enables manual update checks, and provides an offline cache purge option.
 *
 * @param {{ onLogout?: () => void }} [props={}]
 * @returns {React.ReactElement}
 */
export default function DataManagementPanel({ onLogout: _onLogout } = {}) {
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [hasUpdateReady, setHasUpdateReady] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  /**
   * Queries the service worker registration for available updates.
   */
  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    setUpdateMessage(null);
    try {
      const result = await checkForUpdates();
      setUpdateMessage(result.message);
      setHasUpdateReady(result.hasUpdate);
    } catch {
      setUpdateMessage('Unable to check for updates right now.');
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  /**
   * Purges offline caches and reloads the browser tab.
   */
  const handlePurgeCache = async () => {
    setIsClearingCache(true);
    await clearAppCacheAndReload();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto py-2">
      <div>
        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Data & System Settings
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Review application version details, trigger updates, and manage stored offline data.
        </p>
      </div>

      {/* Version & Update Card */}
      <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-text-main">Lover-HQ Version</span>
              <span className="block text-xs text-text-muted mt-0.5">
                Installed release:{' '}
                <strong className="text-primary font-semibold">v{APP_VERSION}</strong>
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
            v{APP_VERSION}
          </span>
        </div>

        {/* Update Status Feedback */}
        {updateMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              hasUpdateReady
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}
          >
            {hasUpdateReady ? (
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{updateMessage}</span>
          </div>
        )}

        {/* Update Trigger Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {hasUpdateReady ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-background font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload to Install Update</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isCheckingUpdates}
              onClick={handleCheckForUpdates}
              className="flex items-center gap-2 px-4 py-2 bg-surface-border/50 hover:bg-surface-border text-text-main font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
              <span>{isCheckingUpdates ? 'Checking for updates...' : 'Check for Updates'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Cache & Offline Data Card */}
      <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-sm font-bold text-text-main">Offline Cache & Storage</span>
            <p className="text-xs text-text-muted mt-0.5">
              Purges all cached assets and resets the service worker to ensure a clean refresh.
            </p>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            disabled={isClearingCache}
            onClick={handlePurgeCache}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isClearingCache ? 'animate-spin' : ''}`} />
            <span>
              {isClearingCache ? 'Clearing and refreshing...' : 'Clear Cache & Refresh App'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
