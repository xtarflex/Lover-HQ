/**
 * @file TypingIndicator.jsx
 * @description Pulsing typing bubble & audio recording indicator shown inside the message list.
 */

import React from 'react';
import { Mic } from 'lucide-react';

/**
 * Animated typing indicator bubble for the chat message list.
 * Clean, minimal layout without redundant duplicate avatar.
 *
 * @returns {React.ReactElement}
 */
export function TypingIndicator() {
  return (
    <div className="flex items-end space-x-2 mt-4 mb-4 pb-2 ml-2 select-none">
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800/80 p-3 rounded-2xl rounded-tl-none typing-coin-container shadow-md">
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

/**
 * In-stream audio recording indicator bubble shown when partner is recording a voice note.
 *
 * @returns {React.ReactElement}
 */
export function RecordingIndicator() {
  return (
    <div className="flex items-center space-x-2 mt-4 mb-4 pb-2 ml-2 select-none animate-slide-up">
      <div className="bg-slate-900/95 backdrop-blur border border-pink-500/30 px-3.5 py-2.5 rounded-2xl rounded-tl-none shadow-lg flex items-center space-x-2.5">
        <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping shrink-0" />
        <Mic className="w-4 h-4 text-pink-400 shrink-0" />
        <span className="text-xs font-bold text-gray-200 font-rounded">
          Recording voice note...
        </span>
        <div className="flex items-center space-x-1 shrink-0 pl-1">
          <span
            className="w-1 h-3 bg-pink-500 rounded-full animate-pulse"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-1 h-4 bg-pink-500 rounded-full animate-pulse"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-1 h-2 bg-pink-500 rounded-full animate-pulse"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
