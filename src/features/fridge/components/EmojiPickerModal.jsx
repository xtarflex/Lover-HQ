import React from 'react';
import { X, Smile } from 'lucide-react';
import { ModalOverlay } from '../../../components/ModalOverlay';
import { ANIMATED_EMOJIS, getEmojiCdnUrl } from './emojiData';

/**
 * @file EmojiPickerModal.jsx
 * @description Modal component displaying a grid of Noto animated emojis that can be selected and pinned on the Fridge board.
 */

/**
 * Emoji Picker Modal Component
 *
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Controls visibility of the modal
 * @param {Function} props.onClose - Callback function to close the modal
 * @param {Function} props.onSelect - Callback when an emoji is selected: (emojiId) => void
 * @returns {React.ReactElement} The EmojiPickerModal component
 */
export default function EmojiPickerModal({ isOpen, onClose, onSelect }) {
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="p-5 flex flex-col h-full max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-bold text-text-main flex items-center gap-2">
            <Smile className="w-5 h-5 text-primary" />
            Pick an Animated Emoji
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors p-1 rounded-lg hover:bg-white/5"
            title="Close picker"
            aria-label="Close picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-text-muted mb-4">
          Select an emoji to pin as a loop-animated magnet on your shared board.
        </p>

        {/* Emojis Grid */}
        <div className="flex-grow overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-surface-border">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-1">
            {ANIMATED_EMOJIS.map((emoji) => {
              const imageUrl = getEmojiCdnUrl(emoji.code);
              return (
                <button
                  key={emoji.id}
                  onClick={() => {
                    onSelect(emoji.id);
                    onClose();
                  }}
                  className="aspect-square bg-surface/40 hover:bg-surface/80 border border-surface-border/40 hover:border-primary/50 rounded-2xl p-2.5 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md relative group"
                  title={emoji.label}
                >
                  <img
                    src={imageUrl}
                    alt={emoji.label}
                    loading="lazy"
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {/* Tooltip on Hover */}
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[9px] px-2 py-0.5 rounded border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
                    {emoji.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}
