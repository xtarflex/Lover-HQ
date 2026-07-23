/**
 * @file DeleteMessageModal.jsx
 * @description Modal prompt for confirming message deletion.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Custom Delete Confirmation Modal component.
 *
 * @param {{
 *   messageToDelete: string|null,
 *   setMessageToDelete: Function
 * }} props
 * @returns {React.ReactElement|null}
 */
export function DeleteMessageModal({ messageToDelete, setMessageToDelete }) {
  if (!messageToDelete) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-scale-up">
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-white">Delete Message?</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Are you sure you want to delete this message? This action will delete the message for
            everyone and cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => setMessageToDelete(null)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-text-main hover:bg-slate-800/60 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              const mId = messageToDelete;
              setMessageToDelete(null);
              try {
                const { error } = await supabase.from('messages').delete().eq('id', mId);
                if (error) throw error;
              } catch (err) {
                console.error('Failed to delete message:', err);
              }
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
