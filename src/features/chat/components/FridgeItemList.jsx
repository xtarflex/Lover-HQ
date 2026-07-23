/**
 * @file FridgeItemList.jsx
 * @description Scrollable list of fridge items shown inside the attachment bottom sheet,
 * allowing the user to tag a fridge item as a message reference.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { formatChatDate } from '../../../utils/time';

/**
 * Scrollable fridge item picker list within the attachment bottom sheet.
 *
 * @param {{
 *   fridgeItems: Array,
 *   onSelect: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export function FridgeItemList({ fridgeItems, onSelect }) {
  return (
    <div className="border-t border-slate-800/80 pt-4">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2.5">
        Link Fridge Items
      </span>
      <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-[11px]">
        {fridgeItems.length === 0 ? (
          <p className="text-center text-[10px] text-text-muted py-2">
            No fridge items found to tag.
          </p>
        ) : (
          fridgeItems.map((item) => {
            let textPreview = '';
            let itemEmoji = '📌';
            let noteColor = 'yellow';
            let subtext = '';

            if (item.type === 'note') {
              itemEmoji = '📝';
              try {
                const parsed = JSON.parse(item.content);
                textPreview = parsed.text || '';
                noteColor = parsed.color || 'yellow';
              } catch {
                textPreview = item.content;
              }
              subtext = `Sticky Note • ${formatChatDate(item.created_at)}`;
            } else if (item.type === 'photo') {
              itemEmoji = '🖼️';
              textPreview = 'Polaroid Photo';
              subtext = `Photo magnet • ${formatChatDate(item.created_at)}`;
            } else if (item.type === 'voice') {
              itemEmoji = '🎙️';
              textPreview = 'Voice Memo';
              let voiceDur = '';
              try {
                const parsed = JSON.parse(item.content);
                if (parsed.duration) {
                  voiceDur = `(${Math.round(parsed.duration)}s)`;
                }
              } catch {
                // ignore parsing error
              }
              subtext = `Voice magnet ${voiceDur} • ${formatChatDate(item.created_at)}`;
            } else if (item.type === 'emoji') {
              itemEmoji = '✨';
              textPreview = `Emoji sticker`;
              subtext = `sticker • ${formatChatDate(item.created_at)}`;
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className={`flex items-center space-x-2.5 w-full text-left p-2 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-850 text-gray-300 truncate ${
                  item.type === 'note' ? `fridge-accent-card fridge-accent-${noteColor}` : ''
                }`}
              >
                {item.type === 'photo' ? (
                  <div className="w-8 h-8 rounded overflow-hidden bg-slate-950 shrink-0 border border-slate-800/80">
                    <img
                      src={item.content}
                      alt="Fridge thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <span className="text-sm shrink-0">{itemEmoji}</span>
                )}
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="truncate font-semibold text-gray-200 text-xs">
                    {textPreview}
                  </span>
                  <span className="truncate text-gray-400 text-[9px] mt-0.5">{subtext}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
