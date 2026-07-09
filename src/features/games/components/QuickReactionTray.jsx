/**
 * @file QuickReactionTray.jsx
 * @description Interactive bottom tray for active game components, allowing players
 * to quickly send live emoji reactions and preset chat messages.
 */

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

const EMOJIS = ['❤️', '😂', '🔥', '😮', '🎉'];
const CHAT_PRESETS = [
  'Good game! 🤝',
  'Your turn! ⏰',
  'Oops! 😅',
  'Nice move! 👏',
  "I'm thinking... 🤔",
];

/**
 * QuickReactionTray component.
 *
 * @param {Object} props
 * @param {Function} props.onSendReaction - Callback when an emoji is tapped.
 * @param {Function} props.onSendChat - Callback when a text preset is tapped.
 * @returns {React.ReactElement}
 */
export default function QuickReactionTray({ onSendReaction, onSendChat }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-[380px] mx-auto px-4 mt-auto mb-2 relative z-30">
      {/* Expanded Presets Container */}
      {isOpen && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-brand-surface/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-3 shadow-2xl animate-slide-up-fade grid grid-cols-2 gap-2">
          {CHAT_PRESETS.map((txt) => (
            <button
              key={txt}
              onClick={() => {
                onSendChat(txt);
                setIsOpen(false);
              }}
              className="py-2 px-3 text-left text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-primary/10 hover:border-primary/20 rounded-xl border border-transparent transition-all truncate"
            >
              {txt}
            </button>
          ))}
        </div>
      )}

      {/* Main Tray Bar */}
      <div className="bg-brand-surface/75 backdrop-blur-md border border-gray-800/80 rounded-2xl p-2 shadow-lg flex items-center justify-between gap-2">
        {/* Emoji List */}
        <div className="flex items-center gap-1.5 flex-1 justify-around">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="w-10 h-10 flex items-center justify-center text-xl hover:scale-125 transition-transform active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Separator line */}
        <div className="w-px h-6 bg-gray-800" />

        {/* Chat presets trigger button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2.5 rounded-xl transition-all ${
            isOpen
              ? 'bg-primary text-brand-surface font-extrabold'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          aria-label="Toggle quick chat presets"
        >
          <MessageCircle className="w-5 h-5 fill-none stroke-current" />
        </button>
      </div>
    </div>
  );
}
