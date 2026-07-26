/**
 * @file EmojiStickerDrawer.jsx
 * @description Premium Emoji & Custom Sticker picker drawer component.
 * Features:
 * - Full categorized Emoji collections with Framer Motion expanding category pills.
 * - Multi-pack custom Sticker Magnets drawer with type filter pills (All, Animated, Static).
 * - Direct sticker selection send callback.
 */

import React, { useState } from 'react';
import { Smile, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { STICKER_PACKS } from '../../fridge/components/stickerData';

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
      '👀',
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
      '🤳',
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
  {
    id: 'food',
    name: 'Food',
    icon: '🍕',
    emojis: [
      '🍏',
      '🍎',
      '🍐',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🫐',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🥑',
      '🥦',
      '🌽',
      '🌶️',
      '🍞',
      '🥐',
      '🥨',
      '🧀',
      '🍳',
      '🥞',
      '🧇',
      '🥓',
      '🥩',
      '🍗',
      '🍖',
      '🌭',
      '🍔',
      '🍟',
      '🍕',
      '🫓',
      '🥪',
      '🥙',
      '🧆',
      '🌮',
      '🌯',
      '🫔',
      '🥗',
      '🥘',
      '🫕',
      '🍝',
      '🍜',
      '🍲',
      '🍛',
      '🍣',
      '🍱',
      '🥟',
      '🦪',
      '🍤',
      '🍙',
      '🍚',
      '🍘',
      '🍥',
      '🥠',
      '🥮',
      '🍢',
      '🍡',
    ],
  },
];

/**
 * EmojiStickerDrawer component.
 *
 * @param {{
 *   showEmojiPicker: boolean,
 *   setShowEmojiPicker: Function,
 *   onSelectEmoji: Function,
 *   onSelectSticker?: Function
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
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [activeStickerFilter, setActiveStickerFilter] = useState('all');
  const [activePackId, setActivePackId] = useState('love_magnets');

  if (!showEmojiPicker) return null;

  const currentCategoryData =
    EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];
  const currentPackData = STICKER_PACKS.find((p) => p.id === activePackId) || STICKER_PACKS[0];

  const filteredStickers = currentPackData
    ? currentPackData.stickers.filter((st) => {
        if (activeStickerFilter === 'animated') return st.type === 'animated';
        if (activeStickerFilter === 'static') return st.type === 'static';
        return true;
      })
    : [];

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

      {/* Category Pills (Emojis Tab) */}
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

      {/* Sticker Filter & Pack Selector (Stickers Tab) */}
      {activeTab === 'stickers' && STICKER_PACKS.length > 0 && (
        <div className="flex items-center justify-between space-x-2 mb-2 pb-1 border-b border-slate-800/60">
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar">
            {STICKER_PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setActivePackId(pack.id)}
                className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                  activePackId === pack.id
                    ? 'bg-slate-800 text-primary border border-primary/30'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <span>{pack.icon}</span>
                <span>{pack.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 shrink-0 bg-slate-950/80 p-0.5 rounded-full border border-slate-800">
            {['all', 'animated', 'static'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveStickerFilter(type)}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize transition-all ${
                  activeStickerFilter === type
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
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
        ) : filteredStickers.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {filteredStickers.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                onClick={() => {
                  if (onSelectSticker) onSelectSticker(sticker);
                  setShowEmojiPicker(false);
                }}
                className="aspect-square bg-slate-950/60 rounded-2xl border border-slate-800 p-2 hover:bg-slate-800/80 hover:border-primary/50 flex flex-col items-center justify-center transition-all group shrink-0 relative"
              >
                <img
                  src={sticker.url}
                  alt={sticker.label}
                  className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                />
                <span className="text-[8px] font-bold text-text-muted mt-1 truncate max-w-full">
                  {sticker.label}
                </span>
                {sticker.type === 'animated' && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-pink-500 shadow-sm" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3 shadow-inner text-primary">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-xs font-extrabold text-white tracking-wide uppercase mb-1">
              Sticker Packs Coming Soon
            </h4>
            <p className="text-[10px] text-text-muted max-w-[200px]">
              Custom animated &amp; static sticker magnet packs will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmojiStickerDrawer;
