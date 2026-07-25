/**
 * @file EmojiStickerDrawer.jsx
 * @description Premium Emoji & Animated Sticker picker drawer component.
 * Allows users to insert standard emojis into text or select animated sticker magnets.
 */

import React, { useState } from 'react';
import { Smile, Sparkles } from 'lucide-react';
import { ANIMATED_EMOJIS, getEmojiCdnUrl } from '../../fridge/components/emojiData';

const POPULAR_EMOJIS = [
  '❤️',
  '💖',
  '💕',
  '🥰',
  '😘',
  '😍',
  '✨',
  '🔥',
  '🥳',
  '😂',
  '😭',
  '🥺',
  '🌹',
  '💍',
  '💌',
  '👑',
  '🤗',
  '🙈',
  '🌺',
  '🍷',
  '🎶',
  '🎉',
  '😴',
  '🌙',
  '⭐',
  '🤤',
  '😜',
  '💯',
  '🙏',
  '👫',
];

/**
 * EmojiStickerDrawer component.
 *
 * @param {{
 *   showEmojiPicker: boolean,
 *   setShowEmojiPicker: Function,
 *   onSelectEmoji: Function,
 *   onSelectSticker: Function
 * }} props
 * @returns {React.ReactElement|null}
 */
export function EmojiStickerDrawer({
  showEmojiPicker,
  setShowEmojiPicker,
  onSelectEmoji,
  onSelectSticker,
}) {
  const [activeTab, setActiveTab] = useState('emojis');

  if (!showEmojiPicker) return null;

  return (
    <div className="absolute bottom-full mb-3 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-3 shadow-2xl animate-scale-up">
      {/* Header Tabs & Close */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-full border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('emojis')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === 'emojis'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emojis</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === 'stickers'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stickers</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(false)}
          className="text-text-muted hover:text-white text-xs px-2.5 py-1 rounded-full hover:bg-slate-800 transition-colors font-bold"
        >
          ✕
        </button>
      </div>

      {/* Grid Content */}
      <div className="max-h-[180px] overflow-y-auto custom-scrollbar p-1">
        {activeTab === 'emojis' ? (
          <div className="grid grid-cols-6 gap-2 text-center">
            {POPULAR_EMOJIS.map((emoji, idx) => (
              <button
                key={`emoji-${idx}`}
                type="button"
                onClick={() => {
                  onSelectEmoji(emoji);
                }}
                className="w-10 h-10 rounded-xl hover:bg-slate-800/80 flex items-center justify-center text-xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {ANIMATED_EMOJIS.map((sticker) => {
              const url = getEmojiCdnUrl(sticker.code);
              return (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => {
                    if (onSelectSticker) onSelectSticker(sticker);
                    setShowEmojiPicker(false);
                  }}
                  className="aspect-square bg-slate-950/60 rounded-xl border border-slate-800 p-1.5 hover:bg-slate-800/80 hover:border-primary/50 flex flex-col items-center justify-center transition-all group shrink-0"
                >
                  <img
                    src={url}
                    alt={sticker.label}
                    className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                  />
                  <span className="text-[8px] font-bold text-text-muted mt-1 truncate max-w-full">
                    {sticker.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
