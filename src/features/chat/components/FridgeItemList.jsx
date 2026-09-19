/**
 * @file FridgeItemList.jsx
 * @description Premium revamped scrollable list of fridge items shown inside the attachment bottom sheet,
 * allowing the user to tag a fridge item as a message reference with rich badges and thumbnails.
 */

import React from 'react';
import { Link2, Mic, FileText, Sparkles, Image as ImageIcon } from 'lucide-react';
import { formatChatDate } from '../../../utils/time';
import { ANIMATED_EMOJIS_BY_ID, getEmojiCdnUrl } from '../../fridge/components/emojiData';

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
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
          Link Fridge Items
        </span>
        <span className="text-[9px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
          {fridgeItems.length} available
        </span>
      </div>

      <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1 custom-scrollbar text-[11px]">
        {fridgeItems.length === 0 ? (
          <p className="text-center text-[10px] text-text-muted py-4 bg-slate-950/40 rounded-2xl border border-slate-800/60">
            No fridge items found to tag.
          </p>
        ) : (
          fridgeItems.map((item) => {
            let textPreview = '';
            let noteColor = 'yellow';
            let subtext = '';
            let badgeIcon = <FileText className="w-4 h-4 text-amber-400" />;
            let badgeBg = 'bg-amber-500/10 border-amber-500/30';
            let stickerUrl = null;

            if (item.type === 'note') {
              try {
                const parsed = JSON.parse(item.content);
                textPreview = parsed.text || 'Sticky Note';
                noteColor = parsed.color || 'yellow';
              } catch {
                textPreview = item.content || 'Sticky Note';
              }
              subtext = `Sticky Note • ${formatChatDate(item.created_at)}`;

              const colorMap = {
                yellow: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
                blue: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
                pink: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
                green: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
                purple: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
              };
              badgeBg = colorMap[noteColor] || colorMap.yellow;
              badgeIcon = <FileText className="w-4 h-4" />;
            } else if (item.type === 'photo') {
              textPreview = 'Polaroid Photo';
              subtext = `Photo Magnet • ${formatChatDate(item.created_at)}`;
              badgeIcon = <ImageIcon className="w-4 h-4 text-emerald-400" />;
              badgeBg = 'bg-emerald-500/15 border-emerald-500/30';
            } else if (item.type === 'voice') {
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
              subtext = `Voice Magnet ${voiceDur} • ${formatChatDate(item.created_at)}`;
              badgeIcon = <Mic className="w-4 h-4 text-indigo-400" />;
              badgeBg = 'bg-indigo-500/15 border-indigo-500/30';
            } else if (item.type === 'emoji') {
              textPreview = 'Emoji Sticker';
              const emojiDef = ANIMATED_EMOJIS_BY_ID.get(item.content);
              stickerUrl = emojiDef ? getEmojiCdnUrl(emojiDef.code) : null;
              subtext = `Animated Sticker • ${formatChatDate(item.created_at)}`;
              badgeIcon = <Sparkles className="w-4 h-4 text-amber-400" />;
              badgeBg = 'bg-amber-500/15 border-amber-500/30';
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className="flex items-center space-x-3 w-full text-left p-2.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/90 border border-slate-800/80 hover:border-primary/40 text-gray-300 transition-all duration-200 group hover:shadow-lg"
              >
                {/* Left Thumbnail or Badge Avatar */}
                <div className="shrink-0">
                  {item.type === 'photo' ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-md group-hover:scale-105 transition-transform">
                      <img
                        src={item.content}
                        alt="Fridge photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : item.type === 'emoji' && stickerUrl ? (
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                      <img src={stickerUrl} alt="Sticker" className="w-7 h-7 object-contain" />
                    </div>
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-md group-hover:scale-105 transition-transform ${badgeBg}`}
                    >
                      {badgeIcon}
                    </div>
                  )}
                </div>

                {/* Center Item Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="truncate font-bold text-gray-100 text-xs group-hover:text-primary transition-colors">
                    {textPreview}
                  </span>
                  <span className="truncate text-text-muted text-[10px] mt-0.5">{subtext}</span>
                </div>

                {/* Right Link Trigger Action */}
                <div className="shrink-0 text-text-muted group-hover:text-primary p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                  <Link2 className="w-4 h-4" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
