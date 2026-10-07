/**
 * @file UpdateNotificationBanner.jsx
 * @description Floating in-app prompt notifying users when a newer PWA build is available.
 */

import React from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

/**
 * @param {{
 *   onApplyUpdate: () => void,
 *   onDismiss: () => void,
 * }} props
 * @returns {React.ReactElement}
 */
export function UpdateNotificationBanner({ onApplyUpdate, onDismiss }) {
  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-fade-in"
    >
      <div className="bg-surface/95 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/10 rounded-2xl p-4 flex items-center justify-between gap-3 text-text-main">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-text-main truncate">Fresh Update Available</p>
            <p className="text-[11px] text-text-muted truncate">
              A newer version of Lover-HQ is ready.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onApplyUpdate}
            aria-label="Apply update"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-background font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Update</span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss update banner"
            className="p-1.5 text-text-muted hover:text-text-main rounded-lg transition-colors hover:bg-surface-border/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default UpdateNotificationBanner;
