/**
 * @file FridgeSpeedDial.jsx
 * @description Animated floating speed dial FAB for the Fridge board.
 * Opens/closes mini action buttons for adding notes, photos, voice memos, emoji, and chat access.
 */

import React from 'react';
import { Plus, FileText, Camera, Mic, Smile, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Animated floating-action-button speed dial for the Fridge board.
 *
 * When `isSpeedDialOpen` is true, mini-buttons slide in with a staggered
 * spring animation (framer-motion). Each mini-button calls the corresponding
 * `onAdd*` or `onOpen*` callback and closes the dial.
 *
 * @param {{
 *   isSpeedDialOpen: boolean,
 *   setIsSpeedDialOpen: Function,
 *   onAddNote: Function,
 *   onAddPhoto: Function,
 *   onAddVoice: Function,
 *   onAddEmoji: Function,
 *   onOpenChat: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function FridgeSpeedDial({
  isSpeedDialOpen,
  setIsSpeedDialOpen,
  onAddNote,
  onAddPhoto,
  onAddVoice,
  onAddEmoji,
  onOpenChat,
}) {
  return (
    <div className="absolute bottom-6 right-6 z-35 flex flex-col items-end gap-3">
      {/* Mini-speed dial buttons */}
      <AnimatePresence>
        {isSpeedDialOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.06,
                },
              },
              exit: {
                transition: {
                  staggerChildren: 0.04,
                  staggerDirection: -1,
                },
              },
            }}
            className="flex flex-col gap-2 items-end z-40"
          >
            {/* Open Chat Button */}
            <motion.button
              variants={{
                hidden: { opacity: 0, x: 50, scale: 0.8 },
                visible: { opacity: 1, x: 0, scale: 1 },
                exit: { opacity: 0, x: 50, scale: 0.8 },
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              onClick={() => {
                onOpenChat();
                setIsSpeedDialOpen(false);
              }}
              className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold px-3 py-2 rounded-xl shadow-lg border border-pink-400 text-xs transition-transform active:scale-95 animate-pulse"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              Chat
            </motion.button>
            {/* Add Note Button */}
            <motion.button
              variants={{
                hidden: { opacity: 0, x: 50, scale: 0.8 },
                visible: { opacity: 1, x: 0, scale: 1 },
                exit: { opacity: 0, x: 50, scale: 0.8 },
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              onClick={() => {
                onAddNote();
                setIsSpeedDialOpen(false);
              }}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-3 py-2 rounded-xl shadow-lg border border-yellow-300 text-xs transition-transform active:scale-95"
            >
              <FileText className="w-4 h-4" />
              Add Note
            </motion.button>

            {/* Add Photo Button */}
            <motion.button
              variants={{
                hidden: { opacity: 0, x: 50, scale: 0.8 },
                visible: { opacity: 1, x: 0, scale: 1 },
                exit: { opacity: 0, x: 50, scale: 0.8 },
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              onClick={() => {
                onAddPhoto();
                setIsSpeedDialOpen(false);
              }}
              className="flex items-center gap-2 bg-blue-400 hover:bg-blue-500 text-gray-900 font-bold px-3 py-2 rounded-xl shadow-lg border border-blue-300 text-xs transition-transform active:scale-95"
            >
              <Camera className="w-4 h-4" />
              Add Photo
            </motion.button>

            {/* Add Voice Memo Button */}
            <motion.button
              variants={{
                hidden: { opacity: 0, x: 50, scale: 0.8 },
                visible: { opacity: 1, x: 0, scale: 1 },
                exit: { opacity: 0, x: 50, scale: 0.8 },
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              onClick={() => {
                onAddVoice();
                setIsSpeedDialOpen(false);
              }}
              className="flex items-center gap-2 bg-green-400 hover:bg-green-500 text-gray-900 font-bold px-3 py-2 rounded-xl shadow-lg border border-green-300 text-xs transition-transform active:scale-95"
            >
              <Mic className="w-4 h-4" />
              Add Voice Memo
            </motion.button>

            {/* Add Emoji Button */}
            <motion.button
              variants={{
                hidden: { opacity: 0, x: 50, scale: 0.8 },
                visible: { opacity: 1, x: 0, scale: 1 },
                exit: { opacity: 0, x: 50, scale: 0.8 },
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              onClick={() => {
                onAddEmoji();
                setIsSpeedDialOpen(false);
              }}
              className="flex items-center gap-2 bg-purple-400 hover:bg-purple-500 text-gray-900 font-bold px-3 py-2 rounded-xl shadow-lg border border-purple-300 text-xs transition-transform active:scale-95"
            >
              <Smile className="w-4 h-4" />
              Add Emoji
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Core FAB Plus Button */}
      <button
        onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
        className={`w-12 h-12 bg-primary hover:bg-primary-hover text-brand-surface rounded-full flex items-center justify-center shadow-2xl border-2 border-background/25 transition-transform duration-300 ${
          isSpeedDialOpen ? 'rotate-45 bg-amber-600 hover:bg-amber-700' : 'hover:scale-105'
        }`}
      >
        <Plus className="w-6 h-6 text-brand-surface" />
      </button>
    </div>
  );
}
