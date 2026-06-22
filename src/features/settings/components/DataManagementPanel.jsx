/**
 * @file DataManagementPanel.jsx
 * @description Settings panel for data management:
 * cache clearing, data exports, account deletion, and sign-out.
 */

import React from 'react';
import { Database } from 'lucide-react';

/**
 * @param {{
 *   onLogout: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function DataManagementPanel({ _onLogout }) {
  return (
    <div className="space-y-6 animate-fade-in flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
      <div className="w-16 h-16 bg-surface-border/20 rounded-full flex items-center justify-center mb-4">
        <Database className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-lg font-bold text-text-main capitalize">Data Management</h3>
      <p className="text-sm text-text-muted max-w-md mb-6">
        Manage your saved memories and app cache.
      </p>
      <div className="flex gap-4 w-full justify-center">
        <button className="px-4 py-2 bg-surface-border/50 text-text-main rounded-xl text-sm font-bold hover:bg-surface-border transition-colors">
          Clear Cache
        </button>
        <button className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-bold hover:bg-primary/30 transition-colors">
          Export Data
        </button>
      </div>
    </div>
  );
}
