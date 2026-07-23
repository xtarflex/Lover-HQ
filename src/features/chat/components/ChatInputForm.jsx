/**
 * @file ChatInputForm.jsx
 * @description Standard chat input bar with media input, text area, recorder trigger, and send button.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { Paperclip, Mic, Send } from 'lucide-react';

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
 *   handleInputChange: Function,
 *   startRecording: Function,
 *   referencedItem: object|null
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
  handleInputChange,
  startRecording,
  referencedItem,
}) {
  return (
    <form onSubmit={handleSendMessage} className="flex items-center space-x-2 relative">
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageSelected}
        accept="image/*,video/*"
        multiple
        className="hidden"
      />

      {/* Attachment options trigger button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowItemSelector(!showItemSelector)}
          className={`w-10 h-10 rounded-full border border-slate-700/60 flex items-center justify-center text-text-muted hover:text-text-main transition-colors ${
            showItemSelector ? 'bg-slate-800 text-text-main' : ''
          }`}
          aria-label="Add attachment"
        >
          <Paperclip className="w-5 h-5" />
        </button>
      </div>

      {/* Text message Input field */}
      <input
        type="text"
        value={newMessageText}
        onChange={handleInputChange}
        placeholder="Message your partner..."
        className="flex-1 bg-slate-950 border border-slate-800 rounded-full h-10 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-white font-medium"
      />

      {/* Microphone VN recording toggle button */}
      <button
        type="button"
        onClick={startRecording}
        className="w-10 h-10 rounded-full border border-slate-700/60 flex items-center justify-center transition-colors text-text-muted hover:text-text-main shrink-0"
        aria-label="Record voice note"
      >
        <Mic className="w-5 h-5" />
      </button>

      {/* Send text button */}
      <button
        type="submit"
        disabled={!newMessageText.trim() && !referencedItem}
        className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary flex items-center justify-center text-white shadow-lg transition-all shrink-0 hover:scale-105"
        aria-label="Send message"
      >
        <Send className="w-4.5 h-4.5" />
      </button>
    </form>
  );
}
