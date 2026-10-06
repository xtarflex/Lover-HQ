/**
 * @file useUnreadChatSync.js
 * @description Custom hook providing real-time synchronization for unread chat messages.
 * Listens to Supabase `messages` table changes and syncs unread message counts
 * to the global AppContext store and localStorage.
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext, useAppDispatch } from '../contexts/AppContext';

/**
 * Synchronizes unread chat message counts in real-time.
 *
 * @param {string} currentPathname - Active route pathname (e.g. location.pathname).
 */
export function useUnreadChatSync(currentPathname) {
  const { user, partner } = useAppContext();
  const dispatch = useAppDispatch();

  const userId = user?.id;
  const partnerId = partner?.id;
  const coupleKey = [userId, partnerId].filter(Boolean).sort().join('_');
  const isChatRoute = currentPathname === '/chat';

  // Mark all chat messages as read
  const markChatAsRead = useCallback(() => {
    if (!coupleKey) return;
    try {
      const currentIsoTime = new Date().toISOString();
      localStorage.setItem(`last_read_chat_${coupleKey}`, currentIsoTime);
      dispatch({ type: 'SET_UNREAD_CHAT_COUNT', payload: 0 });
      window.dispatchEvent(
        new CustomEvent('chat_read_updated', { detail: { timestamp: currentIsoTime } })
      );
    } catch (err) {
      console.error('Failed to update last read timestamp:', err);
    }
  }, [coupleKey, dispatch]);

  // Fetch current unread count from Supabase
  const refreshUnreadCount = useCallback(async () => {
    if (!userId || !partnerId || !coupleKey) return;
    if (isChatRoute) {
      markChatAsRead();
      return;
    }

    try {
      let lastReadTimestamp = localStorage.getItem(`last_read_chat_${coupleKey}`);
      if (!lastReadTimestamp) {
        // Default to current time on first setup to prevent historical backfill
        const currentIsoTime = new Date().toISOString();
        localStorage.setItem(`last_read_chat_${coupleKey}`, currentIsoTime);
        lastReadTimestamp = currentIsoTime;
      }

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .neq('user_id', userId)
        .gt('created_at', lastReadTimestamp);

      if (!error && typeof count === 'number') {
        dispatch({ type: 'SET_UNREAD_CHAT_COUNT', payload: count });
      }
    } catch (err) {
      console.error('Failed to fetch unread chat count:', err);
    }
  }, [userId, partnerId, coupleKey, isChatRoute, dispatch, markChatAsRead]);

  // Handle route transitions into and out of /chat
  useEffect(() => {
    if (isChatRoute) {
      markChatAsRead();
    } else {
      refreshUnreadCount();
    }
  }, [isChatRoute, markChatAsRead, refreshUnreadCount]);

  // Real-time Supabase postgres_changes subscription
  useEffect(() => {
    if (!coupleKey || !userId) return;

    // Initial sync when active outside of chat
    if (!isChatRoute) {
      refreshUnreadCount();
    }

    const channel = supabase
      .channel(`chat_unread_tracker:${coupleKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incomingMsg = payload.new;
            // Only count incoming messages from partner
            if (incomingMsg && incomingMsg.user_id !== userId) {
              if (isChatRoute) {
                markChatAsRead();
              } else {
                refreshUnreadCount();
              }
            }
          } else if (payload.eventType === 'DELETE') {
            if (!isChatRoute) {
              refreshUnreadCount();
            }
          }
        }
      )
      .subscribe();

    const handleExternalChatRead = () => {
      dispatch({ type: 'SET_UNREAD_CHAT_COUNT', payload: 0 });
    };

    window.addEventListener('chat_read_updated', handleExternalChatRead);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('chat_read_updated', handleExternalChatRead);
    };
  }, [coupleKey, userId, isChatRoute, refreshUnreadCount, markChatAsRead, dispatch]);
}
