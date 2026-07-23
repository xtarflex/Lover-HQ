/**
 * @file useChatMessages.js
 * @description Custom hook that manages the core chat message state for the Lover-HQ chat feature.
 * Responsibilities:
 * - Fetches the initial chat history from Supabase on mount.
 * - Subscribes to realtime INSERT / UPDATE / DELETE events on the `messages` table.
 * - Mirrors the last 150 messages to localStorage for offline support.
 * - Exposes `messages`, `setMessages`, and `loading` to the parent component.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Manages chat message state: initial load, realtime sync, and localStorage caching.
 *
 * @param {string|null} coupleKey - Sorted, joined user+partner ID key (e.g. "uuid1_uuid2").
 * @param {Function} scrollToBottom - Callback to scroll the message list to the bottom.
 * @returns {{ messages: Array, setMessages: Function, loading: boolean }}
 */
export function useChatMessages(coupleKey, scrollToBottom) {
  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined' || !coupleKey) return [];
    try {
      const cached = localStorage.getItem(`chat_history_${coupleKey}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch initial chat history from Supabase
  const fetchChatHistory = useCallback(async () => {
    if (!coupleKey) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*, fridge_items(*)')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
      setTimeout(() => scrollToBottom('instant'), 100);
    } catch (e) {
      console.error('Failed to load chat history:', e);
    } finally {
      setLoading(false);
    }
  }, [coupleKey, scrollToBottom]);

  // Sync messages to localStorage for offline support (limit to last 150 messages)
  useEffect(() => {
    if (coupleKey && messages.length > 0) {
      try {
        localStorage.setItem(`chat_history_${coupleKey}`, JSON.stringify(messages.slice(-150)));
      } catch (e) {
        console.error('Failed to cache chat history:', e);
      }
    }
  }, [messages, coupleKey]);

  // Subscribe to Supabase realtime message channel (INSERT / UPDATE / DELETE)
  /* eslint-disable react-hooks/set-state-in-effect -- Intentional: realtime handler updates message state from Supabase events */
  useEffect(() => {
    if (!coupleKey) return;

    fetchChatHistory();

    const messageChannel = supabase
      .channel(`chat_messages:${coupleKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            let newMessage = payload.new;
            if (newMessage.fridge_item_id) {
              const { data: fridgeItem } = await supabase
                .from('fridge_items')
                .select('*')
                .eq('id', newMessage.fridge_item_id)
                .single();
              newMessage.fridge_items = fridgeItem;
            }
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            setTimeout(() => scrollToBottom('smooth'), 100);
          } else if (payload.eventType === 'UPDATE') {
            let updatedMessage = payload.new;
            if (updatedMessage.fridge_item_id) {
              const { data: fridgeItem } = await supabase
                .from('fridge_items')
                .select('*')
                .eq('id', updatedMessage.fridge_item_id)
                .single();
              updatedMessage.fridge_items = fridgeItem;
            }
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m))
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [coupleKey, fetchChatHistory, scrollToBottom]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { messages, setMessages, loading };
}
