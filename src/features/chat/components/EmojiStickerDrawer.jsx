/**
 * @file EmojiStickerDrawer.jsx
 * @description WhatsApp-style Bottom Sheet Sticker & Emoji Picker component.
 * Features:
 * - Draggable/Resizable drawer height (min 320px to max 600px/75vh).
 * - Continuous vertical scroll view with section headers for all sticker packs.
 * - IntersectionObserver to dynamically highlight active bottom dock tab as user scrolls.
 * - Fixed left Recent & Favorites dock buttons with conditional overflow fade mask on installed pack thumbnails.
 * - Top Segmented Tab Switcher (Search, Emojis, Stickers).
 * - Emotion Reaction Filter Chips (Hi, Haha, Love, Sad, Wow, Yay).
 * - High-density 6-column sticker grid with "Create Sticker" action tile.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
      '🫤',
      '😑',
      '😬',
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
      '😮‍💨',
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
    ],
  },
  {
    id: 'love',
    name: 'Love & Hearts',
    icon: '💖',
    emojis: [
      '❤️',
      '🩷',
      '🧡',
      '💛',
      '💚',
      '💙',
      '🩵',
      '💜',
      '🤎',
      '🖤',
      '🩶',
      '🤍',
      '💔',
      '❤️‍🔥',
      '❤️‍🩹',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '💌',
      '💋',
      '👥',
      '👤',
      '🫂',
      '👩‍❤️‍👨',
      '👩‍❤️‍👩',
      '👨‍❤️‍👨',
      '👩‍❤️‍💋‍👨',
      '👩‍❤️‍💋‍👩',
      '👨‍❤️‍💋‍👨',
    ],
  },
  {
    id: 'hands',
    name: 'Gestures',
    icon: '👋',
    emojis: [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '🫲',
      '🫱',
      '🫴',
      '🫳',
      '🫵',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🫰',
      '🤟',
      '🤘',
      '🤙',
      '🫵',
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
    ],
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: '🐶',
    emojis: [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐻‍❄️',
      'koala',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐸',
      '🐵',
      '🙈',
      '🙉',
      '🙊',
      '🐒',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🐣',
      '🐥',
      '🦆',
      '🦅',
      '🦉',
      '🦇',
      '🐺',
      '🐗',
      '🐴',
      '🦄',
      '🐝',
      '🪱',
      '🐛',
      '🦋',
      '🐌',
      '🐞',
      '🐜',
      '🪰',
      '🪲',
      '🪳',
      '🦟',
      '🦗',
      '🕷️',
      '🕸️',
      '🦂',
      '🐢',
      '🐍',
      '🦎',
      '🦖',
      '🦕',
      '🐙',
      '🦑',
      '🦐',
      '🦞',
      '🦀',
      '🐡',
      '🐠',
      '🐟',
      '🐬',
      '🐳',
      '🐋',
      '🦈',
      '🦭',
      '🐊',
      '🐅',
      '🐆',
      '🦓',
      'gorilla',
      '🦧',
      '🦣',
      '🐘',
      '🦛',
      '🦏',
      '🐪',
      '🐫',
      '🦒',
      '🦘',
      '🦬',
      '🐃',
      '🐂',
      '🐄',
      '🐎',
      '🐖',
      '🐏',
      '🐑',
      '🦙',
      '🐐',
      '🦌',
      '🐕',
      '🐩',
      '🦮',
      '🐕‍🦺',
      '🐈',
      '🐈‍⬛',
      '🪶',
      'rooster',
      '🦃',
      '🦤',
      '🦚',
      '🦜',
      'swan',
      '🦩',
      '🕊️',
      '🐇',
      '🦝',
      '🦨',
      '🦡',
      '🦫',
      '🦦',
      '🦥',
      '🦔',
      '🐾',
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
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
      '🍆',
      '🥑',
      '🥦',
      '🥬',
      '🥒',
      '🌶️',
      '🫑',
      '🌽',
      '🥕',
      '🫒',
      '🧄',
      '🧅',
      '🥔',
      '🍠',
      '🫘',
      '🥐',
      '🥯',
      '🍞',
      '🥖',
      '🥨',
      '🧀',
      '🥚',
      '🍳',
      '🧈',
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
      '🥫',
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
      '🍧',
      '🍨',
      '🍦',
      '🥧',
      '🧁',
      '🍰',
      '🎂',
      '🍮',
      '🍭',
      '🍬',
      '🍫',
      '🍿',
      '🍩',
      '🍪',
      '🌰',
      '🥜',
      '🍯',
      '🥛',
      '☕',
      '🫖',
      '🍵',
      '🍶',
      '🍾',
      '🍷',
      '🍸',
      '🍹',
      '🍺',
      '🍻',
      '🥂',
      '🥃',
      '🫗',
      '🥤',
      '🧋',
      '🧃',
      '🧉',
      '🧊',
    ],
  },
  {
    id: 'activities',
    name: 'Activities & Celebration',
    icon: '🎉',
    emojis: [
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🪀',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '🪃',
      '🥅',
      '⛳',
      '🪁',
      '🏹',
      '🎣',
      '🤿',
      '🥊',
      '🥋',
      '🎽',
      '🛹',
      '🛼',
      '🛷',
      '⛸️',
      '🥌',
      '🎿',
      '⛷️',
      '🏂',
      '🪂',
      '🏋️',
      '🤼',
      '🤸',
      '⛹️',
      '🤺',
      '🤾',
      '🏌️',
      '🏇',
      '🧘',
      '🏄',
      '🏊',
      '🤽',
      '🚣',
      '🧗',
      '🚵',
      '🚴',
      '🏆',
      '🥇',
      '🥈',
      '🥉',
      '🏅',
      '🎖️',
      '🏵️',
      '🎗️',
      '🎫',
      '🎟️',
      '🎪',
      '🤹',
      '🎭',
      '🩰',
      '🎨',
      '🎬',
      '🎤',
      '🎧',
      '🎼',
      '🎵',
      '🎶',
      '🥁',
      '🎷',
      '🎺',
      '🎸',
      '🪕',
      '🎻',
      '🪗',
      '🎲',
      '♟️',
      '🎯',
      'Bowling',
      '🎮',
      '🎰',
      '🧩',
      '🎉',
      '🎊',
      '🎈',
      '🎂',
      '🎁',
      '🎀',
      '✨',
      '🎆',
      '🎇',
      '🧨',
      '🧧',
    ],
  },
];

/**
 * Sentiment reaction chips for quick filtering.
 */
const EMOTION_CHIPS = [
  { id: 'all', label: 'All', icon: '✨', keywords: [] },
  { id: 'hi', label: 'Hi', icon: '👋', keywords: ['hi', 'wave', 'hello', 'bird'] },
  { id: 'haha', label: 'Haha', icon: '😂', keywords: ['haha', 'lol', 'laugh', 'funny', 'cat'] },
  {
    id: 'love',
    label: 'Love',
    icon: '❤️',
    keywords: ['love', 'heart', 'hug', 'kiss', 'couple', 'romantic', 'forever', 'sweet'],
  },
  { id: 'sad', label: 'Sad', icon: '😢', keywords: ['sad', 'cry', 'tear', 'pout'] },
  { id: 'wow', label: 'Wow', icon: '😯', keywords: ['wow', 'surprise', 'gift', 'gasp'] },
  {
    id: 'yay',
    label: 'Yay',
    icon: '🎉',
    keywords: ['yay', 'celebrate', 'party', 'happy', 'valentine'],
  },
];

/**
 * EmojiStickerDrawer Component.
 *
 * @param {{
 *   showEmojiPicker: boolean,
 *   setShowEmojiPicker: Function,
 *   onSelectEmoji?: Function,
 *   onSelectSticker?: Function
 * }} props
 * @returns {React.ReactElement}
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

  // Dynamic Draggable Height (min: 320px, default: 360px, max: 600px / 75vh)
  const [drawerHeight, setDrawerHeight] = useState(360);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(360);

  // Horizontal Dock Overflow State for Dynamic Masking
  const packDockRef = useRef(null);
  const [hasDockOverflow, setHasDockOverflow] = useState(false);

  // Persistence in localStorage
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

  // Broadcast drawer height change so Chat.jsx pushes message view up
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('drawer_height_change', {
          detail: { height: drawerHeight, isOpen: showEmojiPicker },
        })
      );
    }
  }, [drawerHeight, showEmojiPicker]);

  // Check horizontal dock overflow dynamically
  const checkDockOverflow = useCallback(() => {
    const el = packDockRef.current;
    if (el) {
      setHasDockOverflow(el.scrollWidth > el.clientWidth);
    }
  }, []);

  useEffect(() => {
    checkDockOverflow();
    window.addEventListener('resize', checkDockOverflow);
    return () => window.removeEventListener('resize', checkDockOverflow);
  }, [checkDockOverflow, showEmojiPicker]);

  // Draggable Height Touch/Mouse Event Handlers
  const handleDragStart = (clientY) => {
    isDraggingRef.current = true;
    startYRef.current = clientY;
    startHeightRef.current = drawerHeight;
    document.body.style.userSelect = 'none';
  };

  const handleDragMove = useCallback((clientY) => {
    if (!isDraggingRef.current) return;
    const deltaY = startYRef.current - clientY;
    const maxHeight = Math.min(600, window.innerHeight * 0.75);
    const newHeight = Math.max(320, Math.min(maxHeight, startHeightRef.current + deltaY));
    setDrawerHeight(newHeight);
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => handleDragMove(e.clientY);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e) => {
      if (e.touches[0]) handleDragMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  // Scroll into view helper when clicking bottom dock icons
  const scrollToPackSection = (packId) => {
    setActiveTab('stickers');
    setActivePackId(packId);
    const sectionEl = document.getElementById(`pack-section-${packId}`);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter helper for stickers by emotion chip and search query
  const filterStickerList = useCallback(
    (list) => {
      return list.filter((st) => {
        if (activeEmotion !== 'all') {
          const chip = EMOTION_CHIPS.find((c) => c.id === activeEmotion);
          if (chip && chip.keywords) {
            const labelLower = (st.label || '').toLowerCase();
            const tagsList = st.tags || [];
            const matchesEmotion =
              chip.keywords.some((kw) => labelLower.includes(kw)) ||
              tagsList.some(
                (t) => chip.keywords.includes(t.toLowerCase()) || t.toLowerCase() === chip.id
              );
            if (!matchesEmotion) return false;
          }
        }
        if (searchQuery.trim()) {
          const queryLower = searchQuery.toLowerCase().trim();
          const labelMatch = (st.label || '').toLowerCase().includes(queryLower);
          const tagMatch = (st.tags || []).some((t) => t.toLowerCase().includes(queryLower));
          return labelMatch || tagMatch;
        }
        return true;
      });
    },
    [activeEmotion, searchQuery]
  );

  // IntersectionObserver to auto-update active pack in bottom dock as user scrolls vertically
  const scrollContainerRef = useRef(null);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || activeTab !== 'stickers') return;

    const sections = container.querySelectorAll('.pack-section-block');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const packId = entry.target.getAttribute('data-pack-id');
            if (packId) setActivePackId(packId);
          }
        });
      },
      { root: container, threshold: 0.3 }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, [activeTab]);

  if (!showEmojiPicker) return null;

  const currentCategoryData =
    EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 bottom-0 z-[120] flex flex-col justify-end pointer-events-none">
        {/* Semi-transparent Backdrop overlay (click to dismiss) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowEmojiPicker(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-auto z-[-1]"
        />

        {/* Anchored Bottom Sheet Container with Dynamic Resizable Height */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          style={{ height: `${drawerHeight}px` }}
          className="w-full bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 shadow-2xl rounded-t-3xl flex flex-col overflow-hidden pointer-events-auto relative"
        >
          {/* Top Interactive Drag Handle Bar */}
          <div
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={(e) => e.touches[0] && handleDragStart(e.touches[0].clientY)}
            className="w-full py-2 flex flex-col items-center justify-center cursor-ns-resize select-none shrink-0 group hover:bg-slate-800/30 transition-colors"
            title="Drag to resize height"
          >
            <div className="w-12 h-1.5 rounded-full bg-slate-700/80 group-hover:bg-primary/80 transition-colors" />
          </div>

          {/* Drawer Header Controls */}
          <div className="px-3 pb-2 flex flex-col gap-2 shrink-0 border-b border-slate-800/60">
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

              {/* Close Drawer Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="p-1.5 rounded-full text-text-muted hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Bar (Expandable) */}
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'emojis' ? 'Search emojis...' : 'Search all stickers...'
                  }
                  className="w-full bg-slate-950/90 text-xs text-white placeholder-text-muted px-3 py-1.5 pl-8 rounded-xl border border-slate-800 focus:outline-none focus:border-primary transition-colors"
                  autoFocus
                />
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-text-muted hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            )}

            {/* Sentiment Reaction Chips (Stickers Mode) */}
            {activeTab === 'stickers' && (
              <div className="filter-scroll-container mask-fade-edges flex items-center space-x-1 py-0.5">
                {EMOTION_CHIPS.map((chip) => {
                  const isSelected = activeEmotion === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setActiveEmotion(chip.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1 whitespace-nowrap transition-all shrink-0 ${
                        isSelected
                          ? 'bg-slate-800 text-primary border border-primary/40 shadow-sm'
                          : 'bg-slate-950/40 text-text-muted hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Emoji Category Tabs (Emojis Mode) */}
            {activeTab === 'emojis' && (
              <div className="filter-scroll-container mask-fade-edges flex items-center space-x-1 py-0.5">
                {EMOJI_CATEGORIES.map((cat) => {
                  const isSelected = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1 whitespace-nowrap transition-all shrink-0 ${
                        isSelected
                          ? 'bg-slate-800 text-primary border border-primary/40 shadow-sm'
                          : 'bg-slate-950/40 text-text-muted hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main Body Viewport */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-slate-700"
          >
            {/* EMOJIS MODE */}
            {activeTab === 'emojis' && (
              <div className="grid grid-cols-7 gap-1">
                {currentCategoryData.emojis
                  .filter((emoji) => (searchQuery ? emoji.includes(searchQuery.trim()) : true))
                  .map((emoji, idx) => (
                    <button
                      key={`${emoji}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (onSelectEmoji) onSelectEmoji(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="aspect-square text-2xl flex items-center justify-center rounded-xl hover:bg-slate-800/80 active:scale-95 transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
              </div>
            )}

            {/* STICKERS MODE: WhatsApp Continuous Vertical Scroll View */}
            {activeTab === 'stickers' && (
              <div className="flex flex-col space-y-4">
                {/* 1. Recent Stickers Section */}
                {recentStickers.length > 0 && (
                  <div
                    id="pack-section-recent"
                    data-pack-id="recent"
                    className="pack-section-block flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-xs font-bold text-primary/90 sticky top-0 bg-slate-900/90 py-1 backdrop-blur-md z-10">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Recently Sent</span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {filterStickerList(recentStickers).map((sticker) => (
                        <button
                          key={`recent-${sticker.id}`}
                          type="button"
                          onClick={() => handleStickerClick(sticker)}
                          className="aspect-square rounded-2xl hover:bg-slate-800/60 p-1 flex items-center justify-center transition-all group shrink-0 relative hover:scale-110 active:scale-95"
                        >
                          <StickerPlayer
                            src={sticker.url}
                            alt={sticker.label}
                            className="w-11 h-11 object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Favorite Stickers Section */}
                {favoriteStickers.length > 0 && (
                  <div
                    id="pack-section-favorites"
                    data-pack-id="favorites"
                    className="pack-section-block flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-xs font-bold text-amber-400/90 sticky top-0 bg-slate-900/90 py-1 backdrop-blur-md z-10">
                      <Star className="w-3.5 h-3.5" />
                      <span>Favorites</span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {filterStickerList(favoriteStickers).map((sticker) => (
                        <button
                          key={`fav-${sticker.id}`}
                          type="button"
                          onClick={() => handleStickerClick(sticker)}
                          className="aspect-square rounded-2xl hover:bg-slate-800/60 p-1 flex items-center justify-center transition-all group shrink-0 relative hover:scale-110 active:scale-95"
                        >
                          <StickerPlayer
                            src={sticker.url}
                            alt={sticker.label}
                            className="w-11 h-11 object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Installed Sticker Packs Continuous Scroll Sections */}
                {STICKER_PACKS.map((pack) => {
                  const filteredPackStickers = filterStickerList(pack.stickers || []);
                  if (filteredPackStickers.length === 0) return null;

                  return (
                    <div
                      key={pack.id}
                      id={`pack-section-${pack.id}`}
                      data-pack-id={pack.id}
                      className="pack-section-block flex flex-col space-y-2 pt-1"
                    >
                      {/* Pack Section Header */}
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 sticky top-0 bg-slate-900/90 py-1 backdrop-blur-md z-10 border-b border-slate-800/50">
                        {pack.coverUrl ? (
                          <img
                            src={pack.coverUrl}
                            alt={pack.name}
                            className="w-4 h-4 object-contain rounded"
                          />
                        ) : (
                          <span>{pack.icon}</span>
                        )}
                        <span>{pack.name}</span>
                        <span className="text-[10px] text-text-muted font-normal">
                          ({filteredPackStickers.length})
                        </span>
                      </div>

                      {/* 6-Column Pack Grid */}
                      <div className="grid grid-cols-6 gap-2">
                        {/* Slot 1 for first pack: "Create Sticker" Action Tile */}
                        {pack.id === STICKER_PACKS[0]?.id && (
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
                        )}

                        {filteredPackStickers.map((sticker) => (
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fixed Bottom Sticker Pack Dock Bar */}
          <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 border-t border-slate-800/80 flex items-center justify-between shrink-0">
            {/* Fixed Left Actions: Recent & Favorites (Never Scroll) */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                onClick={() => scrollToPackSection('recent')}
                title="Recently Sent"
                className={`p-1.5 rounded-xl transition-all ${
                  activePackId === 'recent' && activeTab === 'stickers'
                    ? 'bg-slate-800 text-primary border border-primary/30'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollToPackSection('favorites')}
                title="Favorite Stickers"
                className={`p-1.5 rounded-xl transition-all ${
                  activePackId === 'favorites' && activeTab === 'stickers'
                    ? 'bg-slate-800 text-amber-400 border border-amber-400/30'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <Star className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-4 bg-slate-800 mx-1 shrink-0" />

            {/* Scrollable Installed Sticker Pack Buttons (Dynamic Fade Mask only when overflowed) */}
            <div
              ref={packDockRef}
              className={`filter-scroll-container flex items-center space-x-1 py-0.5 flex-1 ${
                hasDockOverflow ? 'mask-fade-edges' : ''
              }`}
            >
              {STICKER_PACKS.map((pack) => {
                const isSelected = activePackId === pack.id && activeTab === 'stickers';
                const packCover = pack.coverUrl || pack.packImage || pack.coverImage;
                const fallbackStickerUrl = pack.stickers?.[0]?.url;

                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => scrollToPackSection(pack.id)}
                    title={pack.name}
                    className={`p-1.5 rounded-xl text-xs transition-all shrink-0 flex items-center justify-center ${
                      isSelected
                        ? 'bg-slate-800 text-primary border border-primary/30 scale-105 shadow-sm'
                        : 'text-text-muted hover:text-white opacity-70 hover:opacity-100'
                    }`}
                  >
                    {packCover && !packCover.toLowerCase().endsWith('.lottie') ? (
                      <img
                        src={packCover}
                        alt={pack.name}
                        className="w-4 h-4 object-contain rounded"
                      />
                    ) : packCover || fallbackStickerUrl ? (
                      <StickerPlayer
                        src={packCover || fallbackStickerUrl}
                        alt={pack.name}
                        className="w-4 h-4 object-contain pointer-events-none"
                      />
                    ) : pack.icon ? (
                      <span>{pack.icon}</span>
                    ) : (
                      <span>🏷️</span>
                    )}
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
              className="p-1.5 rounded-xl text-text-muted hover:text-white hover:bg-slate-800/80 transition-colors shrink-0 ml-1"
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
