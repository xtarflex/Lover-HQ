/**
 * @file PinnedMessageBanner.jsx
 * @description Telegram/WhatsApp-style pinned message banner for the Lover-HQ chat.
 * Displays the pinned message content and allows scrolling to it or unpinning.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { Pin, X } from 'lucide-react';

/**
 * Pinned message banner shown below the chat header.
 *
 * @param {{ pinnedMessage: object|null, handleScrollToMessage: Function, handleUnpinMessage: Function }} props
 * @returns {React.ReactElement|null}
 */
export function PinnedMessageBanner({ pinnedMessage, handleScrollToMessage, handleUnpinMessage }) {
  if (!pinnedMessage) return null;

  return (
    <div
      onClick={() => handleScrollToMessage(pinnedMessage.id)}
      className="bg-slate-900/95 backdrop-blur border-b border-slate-800/40 px-4 py-2 flex items-center justify-between z-10 shrink-0 select-none animate-slide-down cursor-pointer"
    >
      <div className="flex items-center space-x-2.5 min-w-0 border-l-2 border-primary pl-2.5">
        <Pin className="w-3.5 h-3.5 text-primary shrink-0 rotate-45" />
        <div className="min-w-0 flex flex-col">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider leading-none">
            Pinned Message
          </span>
          <span className="text-xs text-text-muted truncate mt-0.5 max-w-md">
            {pinnedMessage.media_url
              ? pinnedMessage.media_type === 'voice'
                ? '🎙️ Voice Note'
                : '🖼️ Photo'
              : pinnedMessage.content}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleUnpinMessage();
        }}
        className="p-1 rounded-full text-text-muted hover:text-text-main hover:bg-slate-800 transition-colors"
        aria-label="Unpin message"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
