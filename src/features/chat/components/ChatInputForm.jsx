/**
 * @file ChatInputForm.jsx
 * @description Premium revamped chat input capsule with stateful morphing Mic/Send button,
 * auto-expanding textarea, attachment trigger, and integrated emoji/sticker drawer.
 */

import React, { useRef, useEffect } from 'react';
import { Plus, Smile, Mic, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmojiStickerDrawer } from './EmojiStickerDrawer';

/**
 * ChatInputForm component.
 *
 * @param {{
 *   handleSendMessage: Function,
 *   imageInputRef: React.RefObject,
 *   handleImageSelected: Function,
 *   showItemSelector: boolean,
 *   setShowItemSelector: Function,
 *   newMessageText: string,
 *   setNewMessageText: Function,
 *   handleInputChange: Function,
 *   startRecording: Function,
 *   referencedItem: object|null,
 *   showEmojiPicker: boolean,
 *   setShowEmojiPicker: Function,
 *   onSelectSticker: Function
 * }} props
 * @returns {React.ReactElement}
 */
export function ChatInputForm({
  handleSendMessage,
  imageInputRef,
  handleImageSelected,
  showItemSelector,
  setShowItemSelector,
  newMessageText,
  setNewMessageText,
  handleInputChange,
  startRecording,
  referencedItem,
  showEmojiPicker,
  setShowEmojiPicker,
  onSelectSticker,
}) {
  const textareaRef = useRef(null);
  const hasContent = !!(newMessageText.trim() || referencedItem);

  // Auto-expand textarea height up to 100px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [newMessageText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasContent) {
        handleSendMessage(e);
      }
    }
  };

  const handleSelectEmoji = (emojiChar) => {
    if (setNewMessageText) {
      setNewMessageText((prev) => prev + emojiChar);
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="relative w-full">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageSelected}
        accept="image/*,video/*"
        multiple
        className="hidden"
      />

      {/* Floating Emoji & Sticker Drawer Overlay */}
      <EmojiStickerDrawer
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        onSelectEmoji={handleSelectEmoji}
        onSelectSticker={onSelectSticker}
      />

      {/* Floating Glassmorphic Capsule Container */}
      <div className="relative flex items-center bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 shadow-2xl rounded-3xl px-3 py-1.5 space-x-2 transition-all duration-200 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/40">
        {/* Left Action 1: Attachment Trigger */}
        <button
          type="button"
          onClick={() => {
            setShowItemSelector(!showItemSelector);
            if (setShowEmojiPicker) setShowEmojiPicker(false);
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            showItemSelector
              ? 'bg-primary text-white shadow-md scale-105'
              : 'text-text-muted hover:text-white hover:bg-slate-800/80'
          }`}
          aria-label="Add attachment"
        >
          <Plus
            className={`w-5 h-5 transition-transform duration-300 ${showItemSelector ? 'rotate-45' : 'rotate-0'}`}
          />
        </button>

        {/* Left Action 2: Emoji & Sticker Trigger */}
        <button
          type="button"
          onClick={() => {
            if (setShowEmojiPicker) setShowEmojiPicker(!showEmojiPicker);
            if (setShowItemSelector) setShowItemSelector(false);
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            showEmojiPicker
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 scale-105'
              : 'text-text-muted hover:text-white hover:bg-slate-800/80'
          }`}
          aria-label="Emoji & Stickers"
        >
          <Smile
            className={`w-4.5 h-4.5 transition-transform duration-300 ${showEmojiPicker ? 'scale-110 -rotate-12' : 'rotate-0'}`}
          />
        </button>

        {/* Center: Auto-expanding Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={newMessageText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Message your partner..."
          className="flex-1 bg-transparent text-xs text-white placeholder-text-muted focus:outline-none resize-none py-2 px-1 max-h-[100px] leading-relaxed custom-scrollbar font-medium"
        />

        {/* Right Action: Stateful Morphing Button (🎙️ ⟷ 🚀) */}
        <div className="shrink-0 relative w-9 h-9 flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {!hasContent ? (
              <motion.button
                key="mic-btn"
                type="button"
                onClick={startRecording}
                initial={{ scale: 0.6, opacity: 0, rotate: -45 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.6, opacity: 0, rotate: 45 }}
                transition={{ duration: 0.15 }}
                className="w-9 h-9 rounded-full bg-slate-800/90 border border-slate-700/60 hover:bg-slate-700 text-text-muted hover:text-white flex items-center justify-center transition-colors shadow-md"
                aria-label="Record voice note"
              >
                <Mic className="w-4.5 h-4.5" />
              </motion.button>
            ) : (
              <motion.button
                key="send-btn"
                type="submit"
                initial={{ scale: 0.6, opacity: 0, rotate: 45 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.6, opacity: 0, rotate: -45 }}
                transition={{ duration: 0.15 }}
                className="w-9 h-9 rounded-full bg-primary hover:bg-primary-hover text-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </form>
  );
}
