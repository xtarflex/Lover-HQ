/**
 * @file AttachmentBottomSheet.jsx
 * @description Smart interactive attachment bottom sheet menu with pinned drag handle,
 * smooth Framer Motion gesture drag-to-dismiss, actions grid, and fridge item list.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image,
  Camera,
  FileText,
  MapPin,
  User as UserIcon,
  BarChart3,
  Mic,
  Settings,
} from 'lucide-react';
import { FridgeItemList } from './FridgeItemList';
import { ANIMATED_EMOJIS_BY_ID, getEmojiCdnUrl } from '../../fridge/components/emojiData';

/**
 * AttachmentBottomSheet Component.
 *
 * @param {{
 *   showItemSelector: boolean,
 *   setShowItemSelector: Function,
 *   triggerImageSelect: Function,
 *   fridgeItems: object[],
 *   setReferencedItem: Function,
 *   dispatch: Function,
 *   simulateSendDocument: Function,
 *   simulateSendLocation: Function
 * }} props
 * @returns {React.ReactElement}
 */
export function AttachmentBottomSheet({
  showItemSelector,
  setShowItemSelector,
  triggerImageSelect,
  fridgeItems,
  setReferencedItem,
  dispatch,
  simulateSendDocument,
  simulateSendLocation,
}) {
  const [showDragHint, setShowDragHint] = useState(() => {
    if (typeof window === 'undefined') return false;
    const count = parseInt(localStorage.getItem('drawer_interaction_count') || '0', 10);
    return count < 3;
  });

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      const count = parseInt(localStorage.getItem('drawer_interaction_count') || '0', 10);
      localStorage.setItem('drawer_interaction_count', (count + 1).toString());
      if (count + 1 >= 3) setShowDragHint(false);
    }
    setShowItemSelector(false);
  };

  return (
    <AnimatePresence>
      {showItemSelector && (
        <div className="fixed inset-0 z-[120] flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Smart Drag-to-Dismiss Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 250) {
                handleDismiss();
              }
            }}
            className="relative w-full max-w-[480px] mx-auto bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-2xl z-[130] max-h-[80vh] flex flex-col overflow-hidden"
          >
            {/* PINNED STICKY DRAG HANDLE HEADER */}
            <div
              className="sticky top-0 bg-slate-900/95 backdrop-blur-md pt-3 pb-2 z-20 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing border-b border-slate-800/40 shrink-0"
              onClick={handleDismiss}
            >
              <div className="w-12 h-1.5 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors" />
              {showDragHint && (
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1.5 opacity-60 transition-opacity">
                  Drag down to close
                </span>
              )}
            </div>

            {/* SCROLLABLE DRAWER CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-6">
              {/* 3x3 Grid: Gallery Trigger + 8 Most Recent Fridge Items */}
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2.5">
                  Recent Fridge Items
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {/* Slot 1: Gallery Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerImageSelect();
                      setShowItemSelector(false);
                    }}
                    className="aspect-square bg-slate-800/80 rounded-xl hover:bg-slate-700 transition-colors flex flex-col items-center justify-center text-text-muted hover:text-text-main gap-1.5"
                  >
                    <Image className="w-5 h-5 text-emerald-500" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Gallery</span>
                  </button>

                  {/* Slots 2-9: First 8 Fridge Items */}
                  {fridgeItems.slice(0, 8).map((item) => {
                    let textPreview = '';
                    let noteColor = 'yellow';

                    if (item.type === 'note') {
                      try {
                        const parsed = JSON.parse(item.content);
                        textPreview = parsed.text || '';
                        noteColor = parsed.color || 'yellow';
                      } catch {
                        textPreview = item.content;
                      }
                    } else if (item.type === 'photo') {
                      textPreview = 'Photo';
                    } else if (item.type === 'voice') {
                      textPreview = 'Voice';
                    } else if (item.type === 'emoji') {
                      textPreview = 'Sticker';
                    }

                    const colorBg =
                      item.type === 'note'
                        ? noteColor === 'yellow'
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                          : noteColor === 'blue'
                            ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                            : noteColor === 'pink'
                              ? 'bg-pink-500/20 border-pink-500/30 text-pink-300'
                              : noteColor === 'green'
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                        : '';

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setReferencedItem(item);
                          setShowItemSelector(false);
                        }}
                        className={`aspect-square rounded-xl overflow-hidden border flex flex-col justify-between p-2 text-left relative group hover:scale-[1.03] transition-transform duration-200 ${
                          item.type === 'photo'
                            ? 'bg-slate-900 border-slate-800'
                            : item.type === 'note'
                              ? colorBg
                              : item.type === 'voice'
                                ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300'
                                : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        {item.type === 'photo' ? (
                          <img
                            src={item.content}
                            alt="Fridge thumb"
                            className="absolute inset-0 w-full h-full object-cover rounded-xl"
                          />
                        ) : item.type === 'emoji' ? (
                          (() => {
                            const emojiDef = ANIMATED_EMOJIS_BY_ID.get(item.content);
                            const imageUrl = emojiDef ? getEmojiCdnUrl(emojiDef.code) : '';
                            return (
                              <div className="absolute inset-0 flex items-center justify-center p-2">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt="Sticker"
                                    className="w-8 h-8 object-contain"
                                  />
                                ) : (
                                  <span className="text-lg">✨</span>
                                )}
                              </div>
                            );
                          })()
                        ) : item.type === 'voice' ? (
                          <>
                            <div className="flex-grow flex items-center justify-center">
                              <Mic className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-[7px] font-bold opacity-60 uppercase self-end">
                              Voice
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[8px] leading-tight font-medium overflow-hidden line-clamp-3 break-words font-rounded">
                              {textPreview}
                            </span>
                            <span className="text-[7px] font-bold opacity-60 uppercase self-end">
                              Note
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Grid */}
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2.5">
                  Actions
                </span>
                <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowItemSelector(false);
                      dispatch({
                        type: 'SET_GLOBAL_NOTIFICATION',
                        payload: {
                          message: 'Camera access not supported on desktop.',
                          type: 'info',
                        },
                      });
                    }}
                    className="flex flex-col items-center gap-1.5 focus:outline-none group"
                  >
                    <div className="w-12 h-12 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 hover:scale-105 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-300">Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowItemSelector(false);
                      simulateSendDocument();
                    }}
                    className="flex flex-col items-center gap-1.5 focus:outline-none group"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-300">Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowItemSelector(false);
                      simulateSendLocation();
                    }}
                    className="flex flex-col items-center gap-1.5 focus:outline-none group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:scale-105 transition-transform">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-300">Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowItemSelector(false);
                      dispatch({
                        type: 'SET_GLOBAL_NOTIFICATION',
                        payload: { message: 'Contacts integration coming soon!', type: 'info' },
                      });
                    }}
                    className="flex flex-col items-center gap-1.5 focus:outline-none group"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 hover:scale-105 transition-transform">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-300">Contact</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowItemSelector(false);
                      dispatch({
                        type: 'SET_GLOBAL_NOTIFICATION',
                        payload: { message: 'Polls coming soon!', type: 'info' },
                      });
                    }}
                    className="flex flex-col items-center gap-1.5 focus:outline-none group"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:scale-105 transition-transform">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-300">Poll</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowItemSelector(false);
                      if (typeof window !== 'undefined') {
                        window.location.href = '/settings?tab=chat';
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 focus:outline-none group"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 hover:scale-105 transition-transform">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-300">Chat Settings</span>
                  </button>
                </div>
              </div>

              {/* Tag Fridge Item Section */}
              <FridgeItemList
                fridgeItems={fridgeItems}
                onSelect={(item) => {
                  setReferencedItem(item);
                  setShowItemSelector(false);
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default AttachmentBottomSheet;
