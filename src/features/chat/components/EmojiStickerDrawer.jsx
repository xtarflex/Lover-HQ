/**
 * @file EmojiStickerDrawer.jsx
 * @description Premium Emoji & Sticker picker drawer component.
 * Features:
 * - Categorized Emoji collections (Smileys, Love, Gestures, Sparks).
 * - Animated category pills: Shows compact emoji icons normally, expands to reveal category title when active.
 * - Dedicated Stickers tab reserved for future custom animated sticker packs.
 */

import React, { useState } from 'react';
import { Smile, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '😂',
      '🤣',
      '🥲',
      '🥹',
      '☺️',
      '😊',
      '😇',
      '🙂',
      '🙃',
      '😉',
      '😌',
      '😍',
      '🥰',
      '😘',
      '😗',
      '😙',
      '😚',
      '😋',
      '😛',
      '😝',
      '😜',
      '🤪',
      '🤨',
      '🧐',
      '🤓',
      '😎',
      '🥸',
      '🤩',
      '🥳',
      '😏',
      '😒',
      '😞',
      '😔',
      '😟',
      '😕',
      '🙁',
      '☹️',
      '😣',
      '😖',
      '😫',
      '😩',
      '🥺',
      '😢',
      '😭',
      '😤',
      '😠',
      '😡',
      '🤬',
      '🤯',
      '😳',
      '🥵',
      '🥶',
      '😱',
      '😨',
      '😰',
      '😥',
      '😓',
      '🫣',
      '🤗',
      '🫡',
      '🤫',
      '🫠',
      '🤥',
      '😶',
      '🫥',
      '😐',
      '😑',
      '😬',
      '🫨',
      '🙄',
      '😯',
      '😦',
      '😧',
      '😮',
      '😲',
      '🥱',
      '😴',
      '🤤',
      '😪',
      '😵',
      '😵‍💫',
      '🤐',
      '🥴',
      '🤢',
      '🤮',
      '🤧',
      '😷',
      '🤒',
      '🤕',
      '🤑',
      '🤠',
      '😈',
      '👿',
      '👹',
      '👺',
      '🤡',
      '💩',
      '👻',
      '💀',
      '☠️',
      '👽',
      '👾',
      '🤖',
      '🎃',
      '😺',
      '😸',
    ],
  },
  {
    id: 'love',
    name: 'Love',
    icon: '❤️',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '🫀',
      '🫁',
      '💌',
      '💋',
      '💍',
      '💎',
      '💐',
      '🌹',
      '🥀',
      '🌺',
      '🌸',
      '🌷',
      '🌻',
      '🥀',
      '🪴',
      '🌲',
      '🌳',
      '🌴',
      '🍀',
      '🍁',
      '🍂',
      '🍃',
      '🍄',
    ],
  },
  {
    id: 'gestures',
    name: 'Hands',
    icon: '👍',
    emojis: [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🫰',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '🫵',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '🫶',
      '👐',
      '🤲',
      '🤝',
      '🙏',
      '✍️',
      '💅',
      '<ctrl42>',
      '💪',
    ],
  },
  {
    id: 'sparks',
    name: 'Sparks',
    icon: '🔥',
    emojis: [
      '✨',
      '🌟',
      '💫',
      '⭐',
      '💥',
      '🔥',
      '💣',
      '💯',
      '💢',
      '💨',
      '💦',
      '💤',
      '🕳️',
      '🎉',
      '🎊',
      '🎈',
      '🎂',
      '🥂',
      '🍷',
      '☕',
      '🍧',
      '🍕',
      '🍔',
      '🌮',
      '🍩',
      '🍦',
      '🎵',
      '🎶',
      '🍿',
      '🏆',
      '🥇',
      '🎁',
      '🚀',
      '👑',
    ],
  },
];

/**
 * EmojiStickerDrawer component.
 *
 * @param {{
 *   showEmojiPicker: boolean,
 *   setShowEmojiPicker: Function,
 *   onSelectEmoji: Function
 * }} props
 * @returns {React.ReactElement|null}
 */
export function EmojiStickerDrawer({ showEmojiPicker, setShowEmojiPicker, onSelectEmoji }) {
  const [activeTab, setActiveTab] = useState('emojis');
  const [activeCategory, setActiveCategory] = useState('smileys');

  if (!showEmojiPicker) return null;

  const currentCategoryData =
    EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-2.5 shadow-2xl animate-scale-up select-none">
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

      {/* Category Pills (Only shown when Emojis tab is active) */}
      {activeTab === 'emojis' && (
        <div className="flex items-center space-x-1.5 mb-2 overflow-x-auto custom-scrollbar pb-1">
          {EMOJI_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                layout
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-primary border border-primary/40 shadow-sm'
                    : 'text-text-muted hover:text-white hover:bg-slate-800/40 opacity-75'
                }`}
              >
                <span className="text-xs">{cat.icon}</span>
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="text-[9px] font-extrabold tracking-wider uppercase ml-1 whitespace-nowrap overflow-hidden inline-block"
                    >
                      {cat.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Grid Content */}
      <div className="max-h-[190px] overflow-y-auto custom-scrollbar p-1">
        {activeTab === 'emojis' ? (
          <div className="grid grid-cols-8 gap-0.5 text-center">
            {currentCategoryData.emojis.map((emoji, idx) => (
              <button
                key={`emoji-${idx}`}
                type="button"
                onClick={() => {
                  onSelectEmoji(emoji);
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-800/80 flex items-center justify-center text-base hover:scale-115 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center text-primary shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xs font-extrabold text-white">Animated Sticker Magnet Packs</span>
            <span className="text-[10px] font-medium text-text-muted max-w-[220px]">
              Custom animated sticker packs are coming soon! 🎨
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmojiStickerDrawer;
