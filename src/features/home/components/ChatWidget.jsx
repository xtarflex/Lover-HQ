/**
 * @file ChatWidget.jsx
 * @description Row 2 Left Column tall card for live chat & interaction hub.
 * Displays partner avatar, live presence status, latest snippet preview,
 * and quick contextual conversation starters.
 *
 * Implements:
 * - High-legibility typography and accessible touch targets (min-h-[38px]).
 * - Contextual quick sparks for one-tap conversation kickoff.
 */

import React, { useState, useEffect } from 'react';
import { MessageCircle, Sparkles, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../contexts/AppContext';
import Avatar from '../../../components/Avatar';
import { supabase } from '../../../lib/supabase';

const ICEBREAKERS = [
  'Thinking of you ✨',
  'What made you smile today?',
  'Craving your warm hugs 🤗',
];

/**
 * ChatWidget component for the Bento Grid.
 *
 * @returns {React.ReactElement}
 */
export function ChatWidget() {
  const { user, partner, presence, unreadChatCount = 0 } = useAppContext();
  const navigate = useNavigate();

  const [lastMessage, setLastMessage] = useState(null);

  // Fetch latest snippet from messages table
  useEffect(() => {
    if (!user) return;
    const fetchLatest = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('content, created_at, user_id, media_url, media_type')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setLastMessage(data);
        }
      } catch (err) {
        console.error('Failed to fetch latest snippet:', err);
      }
    };

    fetchLatest();
  }, [user, unreadChatCount]);

  const handleOpenChatWithPrompt = (e, text) => {
    e.stopPropagation();
    // Navigate with pre-filled state
    navigate('/chat', { state: { prefilledText: text } });
  };

  return (
    <div
      onClick={() => navigate('/chat')}
      className="relative rounded-3xl p-3.5 sm:p-5 bg-surface/75 border border-surface-border shadow-xl backdrop-blur-xl flex flex-col justify-between h-full min-h-[300px] sm:min-h-[320px] cursor-pointer select-none group hover:border-primary/40 transition-colors"
    >
      {/* Card Header: Partner Presence */}
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-surface-border/60">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Avatar
              src={partner?.avatar_url?.startsWith('http') ? partner.avatar_url : null}
              fallback={!partner?.avatar_url?.startsWith('http') ? partner?.avatar_url : '👤'}
              isOnline={presence.partner === 'online'}
              size="sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-text-main leading-tight truncate">
                  {partner?.name || 'Partner'}
                </h3>
                {unreadChatCount > 0 && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 leading-none">
                    {unreadChatCount > 99 ? '99+' : unreadChatCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1.5 truncate">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    presence.partner === 'online' ? 'bg-emerald-400' : 'bg-gray-500'
                  }`}
                />
                <span className="truncate">
                  {presence.partner === 'online' ? 'Active' : 'Offline'}
                </span>
              </p>
            </div>
          </div>

          <div className="relative p-1.5 sm:p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
            {unreadChatCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md leading-none"
                aria-label={`${unreadChatCount} unread messages`}
              >
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </div>
        </div>

        {/* Message Snippet Bubble */}
        <div
          className={`mt-3 p-3 rounded-2xl border text-xs transition-colors ${
            unreadChatCount > 0
              ? 'bg-primary/10 border-primary/40 shadow-sm'
              : 'bg-surface-border/30 border-surface-border/50'
          }`}
        >
          {lastMessage ? (
            <div>
              <p className="text-[10px] sm:text-[11px] text-text-muted uppercase font-bold tracking-wider mb-1 truncate flex items-center justify-between">
                <span>
                  {lastMessage.user_id === user?.id
                    ? 'You said'
                    : `${partner?.name || 'Partner'} said`}
                </span>
                {unreadChatCount > 0 && lastMessage.user_id !== user?.id && (
                  <span className="text-[9px] font-bold text-rose-400 lowercase">unread</span>
                )}
              </p>
              <p className="text-text-main font-medium line-clamp-2 text-xs leading-relaxed">
                {lastMessage.media_type === 'image'
                  ? '📷 Sent a photo'
                  : lastMessage.media_type === 'video'
                    ? '🎥 Sent a video'
                    : lastMessage.media_type === 'audio'
                      ? '🎙️ Sent a voice note'
                      : lastMessage.media_type === 'sticker'
                        ? '✨ Sent a sticker'
                        : lastMessage.content
                          ? `“${lastMessage.content}”`
                          : 'Sent a shared item'}
              </p>
            </div>
          ) : (
            <p className="text-text-muted italic text-[11px] sm:text-xs line-clamp-2 leading-relaxed">
              Send a spark to start chatting!
            </p>
          )}
        </div>
      </div>

      {/* Quick Contextual Icebreakers / Conversation Starters */}
      <div className="mt-3">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Quick Sparks</span>
        </p>

        <div className="space-y-1.5">
          {ICEBREAKERS.map((starter) => (
            <button
              key={starter}
              onClick={(e) => handleOpenChatWithPrompt(e, starter)}
              className="w-full text-left px-3 py-2 min-h-[38px] rounded-xl bg-surface-border/20 hover:bg-primary/10 border border-surface-border/40 hover:border-primary/30 text-xs text-text-main hover:text-primary font-medium transition-all duration-150 flex items-center justify-between group/item cursor-pointer"
            >
              <span className="truncate pr-1.5">{starter}</span>
              <Send className="w-3 h-3 text-text-muted group-hover/item:text-primary shrink-0 opacity-60 group-hover/item:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChatWidget;
