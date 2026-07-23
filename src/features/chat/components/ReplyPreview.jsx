/**
 * @file ReplyPreview.jsx
 * @description Strip shown above the chat input when the user is composing a reply.
 * Displays the original message content and a dismiss button.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { X } from 'lucide-react';

/**
 * Active quoted reply bar shown above the message input field.
 *
 * @param {{
 *   replyMessage: object,
 *   userId: string|null,
 *   partner: object|null,
 *   onDismiss: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export function ReplyPreview({ replyMessage, userId, partner, onDismiss }) {
  if (!replyMessage) return null;

  return (
    <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between text-xs animate-slide-up">
      <div className="truncate flex-1">
        <span className="text-primary font-bold block text-[10px] uppercase tracking-wider">
          Replying to {replyMessage.user_id === userId ? 'yourself' : partner?.name || 'Partner'}
        </span>
        <p className="truncate text-text-muted mt-0.5 font-medium">{replyMessage.content}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-text-muted hover:text-text-main p-1 shrink-0 ml-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
