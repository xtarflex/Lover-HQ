/**
 * @file ReconnectInvitesPanel.jsx
 * @description Displays incoming and outgoing reconnect request items
 * with accept, decline, and cancel actions.
 */

import React from 'react';
import { Heart, Check, X } from 'lucide-react';
import Avatar from '../../../components/Avatar';

/**
 * Panel showing lists of incoming and outgoing reconnect requests.
 *
 * @param {{
 *   incomingRequests: Array,
 *   outgoingRequests: Array,
 *   onAccept: Function,
 *   onDecline: Function,
 *   onCancel: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function ReconnectInvitesPanel({
  incomingRequests,
  outgoingRequests,
  onAccept,
  onDecline,
  onCancel,
}) {
  return (
    <>
      {/* Incoming Requests */}
      {incomingRequests.length > 0 && (
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-6 rounded-3xl shadow-xl space-y-4">
          <h3 className="font-bold text-text-main text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
            Incoming Reconnect Invites
          </h3>
          <div className="space-y-3">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-surface/80 border border-surface-border/50 p-3 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={req.sender?.avatar_url} size="sm" fallback="👤" />
                  <span className="text-sm font-semibold text-text-main">{req.sender?.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(req)}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDecline(req.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors flex items-center justify-center"
                    title="Decline"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Requests */}
      {outgoingRequests.length > 0 && (
        <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <h3 className="font-bold text-text-main text-base">Sent Reconnect Invites</h3>
          <div className="space-y-3">
            {outgoingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-white/5 border border-surface-border/50 p-3 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={req.receiver?.avatar_url} size="sm" fallback="👤" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-main">
                      {req.receiver?.name}
                    </span>
                    <span className="text-[10px] text-primary animate-pulse">
                      Waiting for partner...
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onCancel(req.id)}
                  className="text-xs text-text-muted hover:text-red-500 font-bold px-3 py-1.5 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
