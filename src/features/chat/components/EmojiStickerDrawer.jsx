/**
 * @file EmojiStickerDrawer.jsx
 * @description WhatsApp-inspired Bottom Sheet Sticker & Emoji Picker component.
 * Features:
 * - Anchored bottom sheet overlay with backdrop-blur and swipe/click dismiss.
 * - Stable min/max height bounds (min 340px, max 420px).
 * - Top Segmented Tab Switcher (Search, Emojis, Stickers).
 * - Emotion Reaction Filter Chips (Hi, Haha, Love, Sad, Wow, Yay).
 * - High-density 6-column sticker grid with "Create Sticker" action tile.
 * - Persistent Recent & Favorites sticker tracking in localStorage.
 * - Fixed bottom Sticker Pack Dock with Settings shortcut.
 */

import React, { useState, useMemo } from 'react';
import { Smile, Sparkles, Settings, Search, Clock, Star, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { STICKER_PACKS } from '../../fridge/components/stickerData';
import { StickerPlayer } from './StickerPlayer';

/**
 * Categorized Emoji collections.
 */
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
 * Emotion Reaction Filter Chips.
 */
const EMOTION_CHIPS = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'hi', label: 'Hi', icon: '👏', keywords: ['bird', 'flying', 'hello', 'plane', 'hand'] },
  { id: 'haha', label: 'Haha', icon: '😂', keywords: ['laughing', 'hahahahlol', 'joke', 'funny'] },
  {
    id: 'love',
    label: 'Love',
    icon: '❤️',
    keywords: ['love', 'heart', 'romantic', 'valentine', 'couple'],
  },
  { id: 'sad', label: 'Sad', icon: '😢', keywords: ['crying', 'sad', 'cry', 'tears'] },
  { id: 'wow', label: 'Wow', icon: '😯', keywords: ['popup', 'gift', 'box', 'surprise'] },
  { id: 'yay', label: 'Yay', icon: '🎉', keywords: ['wreath', 'christmas', 'like', 'celebration'] },
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
  const [activeTab, setActiveTab] = useState('stickers');
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [activeEmotion, setActiveEmotion] = useState('all');
  const [activePackId, setActivePackId] = useState('love_pack');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Recent & Favorite Sticker state persisted in localStorage
  const [recentStickers, setRecentStickers] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('recent_stickers') || '[]');
    } catch {
      return [];
    }
  });

  const [favoriteStickers] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('favorite_stickers') || '[]');
    } catch {
      return [];
    }
  });

  // Track recent sticker selection
  const handleStickerClick = (sticker) => {
    if (!sticker) return;
    const updated = [sticker, ...recentStickers.filter((s) => s.id !== sticker.id)].slice(0, 18);
    setRecentStickers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recent_stickers', JSON.stringify(updated));
    }
    if (onSelectSticker) onSelectSticker(sticker);
    setShowEmojiPicker(false);
  };

  // Flattened sticker list across all available packs
  const allStickersList = useMemo(() => {
    return STICKER_PACKS.flatMap((pack) => pack.stickers || []);
  }, []);

  // Filtered sticker list based on active pack, emotion chip, and search query
  const displayedStickers = useMemo(() => {
    let baseList = [];
    if (activePackId === 'recent') {
      baseList = recentStickers;
    } else if (activePackId === 'favorites') {
      baseList = favoriteStickers.length > 0 ? favoriteStickers : allStickersList.slice(0, 6);
    } else {
      const pack = STICKER_PACKS.find((p) => p.id === activePackId);
      baseList = pack ? pack.stickers : allStickersList;
    }

    return baseList.filter((st) => {
      // Filter by emotion chip
      if (activeEmotion !== 'all') {
        const chip = EMOTION_CHIPS.find((c) => c.id === activeEmotion);
        if (chip && chip.keywords) {
          const labelLower = (st.label || '').toLowerCase();
          const matchesEmotion = chip.keywords.some((kw) => labelLower.includes(kw));
          if (!matchesEmotion) return false;
        }
      }
      // Filter by text search query
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase().trim();
        return (st.label || '').toLowerCase().includes(queryLower);
      }
      return true;
    });
  }, [activePackId, activeEmotion, searchQuery, recentStickers, favoriteStickers, allStickersList]);

  if (!showEmojiPicker) return null;

  const currentCategoryData =
    EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex flex-col justify-end">
        {/* Glassmorphic Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowEmojiPicker(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[115]"
        />

        {/* Anchored Bottom Sheet Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-[500px] mx-auto bg-slate-900/98 backdrop-blur-2xl border-t border-slate-800 rounded-t-3xl shadow-2xl z-[120] flex flex-col overflow-hidden min-h-[340px] max-h-[420px] select-none"
        >
          {/* Top Sticky Drag Handle & Segmented Bar */}
          <div className="bg-slate-900/90 backdrop-blur-md pt-2.5 pb-2 px-3 flex flex-col border-b border-slate-800/60 shrink-0 space-y-2">
            {/* Drag Handle Bar */}
            <div
              onClick={() => setShowEmojiPicker(false)}
              className="w-10 h-1 bg-slate-700 hover:bg-slate-600 rounded-full mx-auto transition-colors cursor-pointer"
            />

            {/* Top Segmented Control Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-full border border-slate-800 flex-1">
                {/* Search Toggle Pill */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen((prev) => !prev)}
                  className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                    isSearchOpen
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Search Stickers & Emojis"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>

                {/* Emojis Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('emojis');
                    setIsSearchOpen(false);
                  }}
                  className={`flex-1 flex items-center justify-center space-x-1 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'emojis'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Emojis</span>
                </button>

                {/* Stickers Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('stickers');
                    setIsSearchOpen(false);
                  }}
                  className={`flex-1 flex items-center justify-center space-x-1 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'stickers'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Stickers</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="w-7 h-7 rounded-full bg-slate-800/60 hover:bg-slate-700 text-text-muted hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Expandable Search Bar */}
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-1"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder={activeTab === 'emojis' ? 'Search emojis...' : 'Search stickers...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </motion.div>
            )}

            {/* Emotion Quick Reaction Chips (Stickers Tab) */}
            {activeTab === 'stickers' && (
              <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pt-1 pb-0.5">
                {EMOTION_CHIPS.map((chip) => {
                  const isSelected = activeEmotion === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setActiveEmotion(chip.id)}
                      className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-all ${
                        isSelected
                          ? 'bg-primary/20 text-primary border border-primary/40 shadow-sm scale-[1.02]'
                          : 'bg-slate-950/60 text-text-muted border border-slate-800 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="text-xs">{chip.icon}</span>
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Category Pills (Emojis Tab) */}
            {activeTab === 'emojis' && (
              <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pt-1 pb-0.5">
                {EMOJI_CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-all ${
                        isActive
                          ? 'bg-slate-800 text-primary border border-primary/40 shadow-sm'
                          : 'text-text-muted hover:text-white hover:bg-slate-800/40 opacity-75'
                      }`}
                    >
                      <span className="text-xs">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main Scrollable Grid Content */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {activeTab === 'emojis' ? (
              <div className="grid grid-cols-8 gap-1.5 text-center">
                {currentCategoryData.emojis
                  .filter((e) => (searchQuery ? e.includes(searchQuery) : true))
                  .map((emoji, idx) => (
                    <button
                      key={`emoji-${idx}`}
                      type="button"
                      onClick={() => onSelectEmoji(emoji)}
                      className="w-9 h-9 rounded-xl hover:bg-slate-800/80 flex items-center justify-center text-lg hover:scale-125 active:scale-95 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
              </div>
            ) : (
              /* High-Density 6-Column Sticker Grid */
              <div className="grid grid-cols-6 gap-2">
                {/* Slot 1: "Create Sticker" Action Tile */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(
                        new CustomEvent('global_notification', {
                          detail: {
                            message: 'Custom Sticker Creator coming soon! 🎨',
                            type: 'info',
                          },
                        })
                      );
                    }
                  }}
                  className="aspect-square bg-slate-950/40 rounded-2xl border border-dashed border-primary/40 p-1 hover:bg-primary/10 hover:border-primary flex flex-col items-center justify-center transition-all group shrink-0"
                  title="Create custom sticker"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-0.5 group-hover:scale-110 transition-transform">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[8px] font-bold text-primary truncate max-w-full">
                    Create
                  </span>
                </button>

                {/* Sticker Items */}
                {displayedStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => handleStickerClick(sticker)}
                    className="aspect-square rounded-2xl hover:bg-slate-800/60 p-1 flex items-center justify-center transition-all group shrink-0 relative hover:scale-110 active:scale-95"
                  >
                    <StickerPlayer
                      src={sticker.url}
                      alt={sticker.label}
                      className="w-11 h-11 object-contain"
                    />
                    {sticker.type === 'animated' && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-pink-500 shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fixed Bottom Sticker Pack Dock Bar */}
          <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 border-t border-slate-800/80 flex items-center justify-between shrink-0">
            {/* Dock Pack Icons */}
            <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar py-0.5">
              {/* Recent Pack Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('stickers');
                  setActivePackId('recent');
                }}
                title="Recently Sent"
                className={`p-1.5 rounded-xl transition-all ${
                  activePackId === 'recent' && activeTab === 'stickers'
                    ? 'bg-slate-800 text-primary border border-primary/30'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
              </button>

              {/* Favorites Pack Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('stickers');
                  setActivePackId('favorites');
                }}
                title="Favorite Stickers"
                className={`p-1.5 rounded-xl transition-all ${
                  activePackId === 'favorites' && activeTab === 'stickers'
                    ? 'bg-slate-800 text-amber-400 border border-amber-400/30'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <Star className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-slate-800 mx-1" />

              {/* Individual Installed Sticker Pack Buttons */}
              {STICKER_PACKS.map((pack) => {
                const isSelected = activePackId === pack.id && activeTab === 'stickers';
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      setActiveTab('stickers');
                      setActivePackId(pack.id);
                    }}
                    title={pack.name}
                    className={`p-1.5 rounded-xl text-xs transition-all shrink-0 ${
                      isSelected
                        ? 'bg-slate-800 text-primary border border-primary/30 scale-105'
                        : 'text-text-muted hover:text-white opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span>{pack.icon}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Settings Shortcut Icon */}
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(false);
                if (typeof window !== 'undefined') {
                  window.location.href = '/settings?tab=chat';
                }
              }}
              title="Chat Settings"
              className="p-1.5 rounded-xl text-text-muted hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default EmojiStickerDrawer;
