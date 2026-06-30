/**
 * @file useMagnetComments.js
 * @description Custom hook that manages all data operations for a magnet's comment
 * thread. Handles loading (with localStorage cache fallback), offline queuing,
 * optimistic comment submission, real-time Supabase channel subscriptions for
 * INSERT/DELETE events and partner typing indicators, and online-sync flushing.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  getFridgeComments,
  createFridgeComment,
  createFridgeComments,
} from '../../../services/fridge';

/**
 * Manages the comments state, real-time subscription, and offline-queue logic
 * for a single fridge magnet item.
 *
 * @param {object|null} item - The currently selected magnet item (or null when closed).
 * @param {string} userId - The logged-in user's ID.
 * @returns {{
 *   comments: Array<object>,
 *   isLoading: boolean,
 *   isPartnerTyping: boolean,
 *   inputText: string,
 *   setInputText: Function,
 *   handleInputChange: Function,
 *   handleSendComment: Function,
 * }}
 */
export function useMagnetComments(item, userId) {
  const [comments, setComments] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const typingTimeoutRef = useRef(null);
  const channelRef = useRef(null);

  /**
   * Loads comments for the active item from the DB (with localStorage cache fallback)
   * and merges any pending offline-queue entries.
   *
   * @returns {Promise<void>}
   */
  const loadComments = useCallback(async () => {
    if (!item?.id) return;
    setIsLoading(true);

    const cacheKey = `fridge_comments_cache_${item.id}`;
    const queueKey = `fridge_comments_offline_queue`;

    // 1. Show cached comments immediately for snappy UX
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setComments(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Error loading cached comments:', e);
    }

    try {
      let freshComments = [];
      if (navigator.onLine) {
        freshComments = await getFridgeComments(item.id);
        localStorage.setItem(cacheKey, JSON.stringify(freshComments));
      }

      // Merge with any pending offline comments for this item
      const queued = JSON.parse(localStorage.getItem(queueKey) || '[]');
      const itemQueued = queued.filter((c) => c.item_id === item.id);
      setComments([...freshComments, ...itemQueued]);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [item]);

  // Load comments whenever the selected item changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (item?.id) {
        loadComments();
      } else {
        setComments([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [item, loadComments]);

  // Subscribe to real-time comment changes and partner typing indicators
  useEffect(() => {
    if (!item?.id) return;

    const channel = supabase
      .channel(`item_comments_${item.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fridge_comments',
          filter: `item_id=eq.${item.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComment = payload.new;
            setComments((prev) => {
              if (prev.some((c) => c.id === newComment.id)) return prev;
              return [...prev, newComment];
            });
            setIsPartnerTyping(false);
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setComments((prev) => prev.filter((c) => c.id !== deletedId));
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setIsPartnerTyping(payload.isTyping);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [item?.id, userId]);

  /**
   * Flushes the offline comment queue to the server when the connection is restored.
   *
   * @returns {Promise<void>}
   */
  const syncOfflineComments = useCallback(async () => {
    if (!navigator.onLine) return;
    const queueKey = `fridge_comments_offline_queue`;
    let queue = [];
    try {
      queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
    } catch {
      return;
    }

    if (queue.length === 0) return;

    let remaining = [];
    try {
      // 1. Attempt the optimized bulk insert for the 99% happy path
      const commentsToInsert = queue.map((comment) => ({
        item_id: comment.item_id,
        user_id: comment.user_id,
        content: comment.content,
      }));
      await createFridgeComments(commentsToInsert);
    } catch (bulkErr) {
      console.warn(
        'Bulk offline sync failed, falling back to sequential inserts to isolate bad data:',
        bulkErr
      );

      // 2. If the entire batch was rejected (e.g., one bad comment constraint violation),
      //    fall back to sequential so we don't drop the valid comments.
      for (const comment of queue) {
        try {
          await createFridgeComment({
            item_id: comment.item_id,
            user_id: comment.user_id,
            content: comment.content,
          });
        } catch (err) {
          console.error('Failed to sync offline comment during fallback:', err);
          remaining.push(comment);
        }
      }
    }

    localStorage.setItem(queueKey, JSON.stringify(remaining));

    if (remaining.length < queue.length && item?.id) {
      loadComments();
    }
  }, [item?.id, loadComments]);

  // Flush offline queue when connection is restored
  useEffect(() => {
    window.addEventListener('online', syncOfflineComments);
    return () => {
      window.removeEventListener('online', syncOfflineComments);
    };
  }, [syncOfflineComments]);

  /**
   * Handles input field changes and broadcasts a typing indicator to the partner.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   * @returns {void}
   */
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping: true },
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId, isTyping: false },
        });
      }
    }, 3000);
  };

  /**
   * Submits a comment optimistically and persists it to the DB (or the offline queue
   * when disconnected).
   *
   * @param {React.FormEvent} e - Form submit event.
   * @param {Function} [onPlaySound] - Optional callback to play a UI sound effect.
   * @returns {Promise<void>}
   */
  const handleSendComment = async (e, onPlaySound) => {
    e.preventDefault();
    if (!inputText.trim() || !item?.id) return;

    if (onPlaySound) onPlaySound('rustle');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping: false },
      });
    }

    const textToSend = inputText.trim();
    setInputText('');

    const timestamp = new Date().toISOString();
    const tempId = `offline-comment-${Date.now()}`;
    const newComment = {
      id: tempId,
      item_id: item.id,
      user_id: userId,
      content: textToSend,
      created_at: timestamp,
      isPending: true,
    };

    // Optimistic update
    setComments((prev) => [...prev, newComment]);

    const queueKey = `fridge_comments_offline_queue`;

    if (!navigator.onLine) {
      try {
        const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
        queue.push(newComment);
        localStorage.setItem(queueKey, JSON.stringify(queue));
      } catch (err) {
        console.error('Failed to queue offline comment:', err);
      }
      return;
    }

    try {
      const savedComment = await createFridgeComment({
        item_id: item.id,
        user_id: userId,
        content: textToSend,
      });

      setComments((prev) => prev.map((c) => (c.id === tempId ? savedComment : c)));

      const cacheKey = `fridge_comments_cache_${item.id}`;
      const fresh = await getFridgeComments(item.id);
      localStorage.setItem(cacheKey, JSON.stringify(fresh));
    } catch (err) {
      console.error('Failed to save comment:', err);
      try {
        const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
        queue.push(newComment);
        localStorage.setItem(queueKey, JSON.stringify(queue));
      } catch (queueErr) {
        console.error('Failed to queue offline comment on error:', queueErr);
      }
    }
  };

  return {
    comments,
    isLoading,
    isPartnerTyping,
    inputText,
    setInputText,
    handleInputChange,
    handleSendComment,
  };
}
