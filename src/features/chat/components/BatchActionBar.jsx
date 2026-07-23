/**
 * @file BatchActionBar.jsx
 * @description Action bar shown in place of the chat input when selection mode is active.
 * Displays the count of selected messages and provides Delete, Pin, and Forward actions.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { Trash2, Pin, ArrowRight } from 'lucide-react';

/**
 * Batch message action bar (shown in selection mode).
 *
 * @param {{
 *   selectedMessageIds: Set<string>,
 *   onCancel: Function,
 *   onDelete: Function,
 *   onPin: Function,
 *   onForward: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export function BatchActionBar({ selectedMessageIds, onCancel, onDelete, onPin, onForward }) {
  return (
    <div className="p-4 bg-slate-900 border-t border-slate-800/60 shrink-0 z-20 flex items-center justify-between animate-slide-up">
      <div className="flex items-center space-x-3">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold transition-all"
        >
          Cancel
        </button>
        <span className="text-xs font-extrabold text-white">
          {selectedMessageIds.size} Selected
        </span>
      </div>

      <div className="flex items-center space-x-2">
        {/* Delete Selected */}
        <button
          onClick={onDelete}
          disabled={selectedMessageIds.size === 0}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Delete</span>
        </button>

        {/* Pin Selected */}
        <button
          onClick={onPin}
          disabled={selectedMessageIds.size !== 1}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-850 hover:bg-slate-800 disabled:opacity-50 text-gray-300 rounded-xl text-xs font-bold transition-all border border-slate-700"
        >
          <Pin className="w-4.5 h-4.5" />
          <span className="hidden sm:inline">Pin</span>
        </button>

        {/* Forward Selected */}
        <button
          onClick={onForward}
          disabled={selectedMessageIds.size === 0}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <ArrowRight className="w-4.5 h-4.5" />
          <span className="hidden sm:inline">Forward</span>
        </button>
      </div>
    </div>
  );
}
