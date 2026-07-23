/**
 * @file AttachmentBottomSheet.jsx
 * @description Attachment bottom sheet menu showing gallery triggers, actions grid, and fridge item link list.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { Image, Camera, FileText, MapPin, User as UserIcon, BarChart3 } from 'lucide-react';
import { FridgeItemList } from './FridgeItemList';
import { ANIMATED_EMOJIS, getEmojiCdnUrl } from '../../fridge/components/emojiData';
import { Mic } from 'lucide-react';

/**
 * AttachmentBottomSheet Component.
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
  if (!showItemSelector) return null;

  return (
    <div className="bottom-sheet-container">
      <div className="bottom-sheet-backdrop" onClick={() => setShowItemSelector(false)} />
      <div className="bottom-sheet-panel max-w-[460px] max-h-[70vh] overflow-y-auto">
        <div className="bottom-sheet-drag-handle" onClick={() => setShowItemSelector(false)} />

        {/* 3x3 Grid: Gallery Trigger + 8 Most Recent Fridge Items */}
        <div className="mb-6">
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
                      const emojiDef = ANIMATED_EMOJIS.find((e) => e.id === item.content);
                      const imageUrl = emojiDef ? getEmojiCdnUrl(emojiDef.code) : '';
                      return (
                        <div className="absolute inset-0 flex items-center justify-center p-2">
                          {imageUrl ? (
                            <img src={imageUrl} alt="Sticker" className="w-8 h-8 object-contain" />
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
        <div className="mb-6">
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
                  payload: { message: 'Camera access not supported on desktop.', type: 'info' },
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
    </div>
  );
}
