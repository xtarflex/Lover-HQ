/**
 * @file TypingIndicator.jsx
 * @description Pulsing typing bubble shown inside the message list when the partner is typing.
 * Uses CSS coin-flip animation classes defined in the global stylesheet.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';

/**
 * Animated typing indicator bubble for the chat message list.
 *
 * @param {{ partner: object|null }} props - partner object with optional avatar_url.
 * @returns {React.ReactElement}
 */
export function TypingIndicator({ partner }) {
  return (
    <div className="flex items-end space-x-2 mt-4 ml-2 select-none">
      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold font-rounded overflow-hidden">
        {partner?.avatar_url ? (
          <img src={partner.avatar_url} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          'P'
        )}
      </div>
      <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl rounded-tl-none typing-coin-container">
        <div className="typing-coin-wrapper">
          <div className="typing-coin-front" />
          <div className="typing-coin-back">
            <div className="css-heart-glyph" />
          </div>
        </div>
        <div className="typing-coin-wrapper">
          <div className="typing-coin-front" />
          <div className="typing-coin-back">
            <div className="css-heart-glyph" />
          </div>
        </div>
        <div className="typing-coin-wrapper">
          <div className="typing-coin-front" />
          <div className="typing-coin-back">
            <div className="css-heart-glyph" />
          </div>
        </div>
      </div>
    </div>
  );
}
