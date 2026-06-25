/**
 * @file useFridgeSync.js
 * @description Hook that manages all Supabase data fetching, real-time
 * subscriptions, local caching, and auto-compaction for the Fridge board.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  getFridgeItems,
  getFridgeItemsBeforeCutoff,
  deleteFridgeItemsBeforeCutoff,
  deleteFridgeMedia,
} from '../../../services/fridge';

/**
 * Helper – extracts the Supabase Storage object path from a public URL.
 *
 * @param {string | null} url - Full public URL.
 * @returns {string | null} Storage path after `/fridge-media/`, or null.
 */
function getStoragePathFromUrl(url) {
  if (!url) return null;
  const parts = url.split('/fridge-media/');
  return parts.length > 1 ? decodeURIComponent(parts[1]) : null;
}

/**
 * Manages all Supabase data-fetching, real-time subscriptions, local caching,
 * and auto-compaction for the Fridge board.
 *
 * @param {{ userId: string, partnerId: string, pairingStatus: string, isPartnerInFridge: boolean }} params
 * @returns {{
 *   items: Array,
 *   setItems: Function,
 *   isLoading: boolean,
 *   error: string | null,
 *   setError: Function,
 *   commentsCount: Object,
 *   partnerLastSeen: string | null,
 *   fetchCommentCounts: Function
 * }}
 */
export function useFridgeSync({ userId, partnerId, pairingStatus, isPartnerInFridge }) {
  const [items, setItems] = useState(() => {
    try {
      const cached = localStorage.getItem('fridge_items_cache');
      const queue = localStorage.getItem('fridge_offline_queue');
      const parsedCached = cached ? JSON.parse(cached) : [];
      const parsedQueue = queue ? JSON.parse(queue) : [];
      return [...parsedCached, ...parsedQueue];
    } catch (e) {
      console.error('Error initializing fridge items from cache:', e);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentsCount, setCommentsCount] = useState({});
  const [partnerLastSeen, setPartnerLastSeen] = useState(null);

  // ---------------------------------------------------------------------------
  // Comment counts
  // ---------------------------------------------------------------------------

  /**
   * Fetches the comment count for every fridge item from Supabase and updates
   * the `commentsCount` map in state.
   *
   * @returns {Promise<void>}
   */
  const fetchCommentCounts = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase.from('fridge_comments').select('item_id');

      if (!fetchError && data) {
        const counts = {};
        data.forEach((row) => {
          counts[row.item_id] = (counts[row.item_id] || 0) + 1;
        });
        setCommentsCount(counts);
      }
    } catch (err) {
      console.error('Error fetching comment counts:', err);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Initial fetch with offline caching
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const fetchItems = async () => {
      if (!userId) return;

      // If user is paired but partner is not yet loaded, wait for partnerId
      if (pairingStatus === 'paired' && !partnerId) return;

      setIsLoading(true);
      setError(null);

      // Pre-load from local storage cache for instant render / offline stability
      const cachedItems = localStorage.getItem('fridge_items_cache');
      let localQueue = [];
      try {
        localQueue = JSON.parse(localStorage.getItem('fridge_offline_queue') || '[]');
      } catch (e) {
        console.error('Error parsing offline queue:', e);
      }
      if (cachedItems) {
        try {
          setItems([...JSON.parse(cachedItems), ...localQueue]);
        } catch (e) {
          console.error('Error parsing cached items:', e);
        }
      }

      try {
        if (!navigator.onLine) {
          setIsLoading(false);
          return;
        }

        const data = await getFridgeItems(userId, partnerId);

        // Cache the fresh online items
        localStorage.setItem('fridge_items_cache', JSON.stringify(data || []));

        // Re-read local queue to merge with fresh data
        let freshLocalQueue = [];
        try {
          freshLocalQueue = JSON.parse(localStorage.getItem('fridge_offline_queue') || '[]');
        } catch (e) {
          console.error(e);
        }

        setItems([...(data || []), ...freshLocalQueue]);
        await fetchCommentCounts();
      } catch (err) {
        console.error('Fetch fridge items failed:', err);
        setError('Could not load fresh fridge items. Using cached data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [userId, partnerId, pairingStatus, fetchCommentCounts]);

  // ---------------------------------------------------------------------------
  // Keep local cache in sync with item changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isLoading) {
      const syncedItems = items.filter(
        (item) => item.id && !item.id.toString().startsWith('offline-')
      );
      localStorage.setItem('fridge_items_cache', JSON.stringify(syncedItems));
    }
  }, [items, isLoading]);

  // ---------------------------------------------------------------------------
  // partnerLastSeen – interval updater while partner is active in Fridge
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isPartnerInFridge) {
      const timer = setTimeout(() => {
        setPartnerLastSeen(new Date().toISOString());
      }, 0);

      const interval = setInterval(() => {
        setPartnerLastSeen(new Date().toISOString());
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isPartnerInFridge]);

  // ---------------------------------------------------------------------------
  // partnerLastSeen – initial DB fetch from presence table
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const fetchPartnerLastSeen = async () => {
      if (!partnerId) return;
      try {
        const { data, error: fetchError } = await supabase
          .from('presence')
          .select('last_seen')
          .eq('user_id', partnerId)
          .single();
        if (!fetchError && data) {
          setPartnerLastSeen(data.last_seen);
        }
      } catch (err) {
        console.error('Error fetching partner last seen:', err);
      }
    };
    fetchPartnerLastSeen();
  }, [partnerId]);

  // ---------------------------------------------------------------------------
  // partnerLastSeen – real-time presence subscription
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!partnerId) return;
    const channel = supabase
      .channel('partner_presence_last_seen')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
        },
        (payload) => {
          if (payload.new && payload.new.user_id === partnerId) {
            setPartnerLastSeen(payload.new.last_seen);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId]);

  // ---------------------------------------------------------------------------
  // Fridge items – real-time subscription
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('fridge_items_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fridge_items',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new;
            if (newItem.user_id === userId || newItem.user_id === partnerId) {
              setItems((prev) => {
                if (prev.some((item) => item.id === newItem.id)) return prev;
                return [...prev, newItem];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new;
            if (updatedItem.user_id === userId || updatedItem.user_id === partnerId) {
              setItems((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setItems((prev) => prev.filter((item) => item.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, partnerId]);

  // ---------------------------------------------------------------------------
  // Fridge comments – real-time subscription (badge counts)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('fridge_comments_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fridge_comments',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComment = payload.new;
            setCommentsCount((prev) => ({
              ...prev,
              [newComment.item_id]: (prev[newComment.item_id] || 0) + 1,
            }));
          } else if (payload.eventType === 'DELETE') {
            // Re-fetch counts because DELETE old payload only has id (no item_id)
            fetchCommentCounts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCommentCounts]);

  // ---------------------------------------------------------------------------
  // Auto-compaction on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const runCompaction = async () => {
      if (!userId) return;
      const storedDays = localStorage.getItem('fridge_auto_compact_days') || '90';
      if (storedDays === 'off') return;

      const days = parseInt(storedDays, 10);
      if (isNaN(days)) return;

      const cutOffDate = new Date();
      cutOffDate.setDate(cutOffDate.getDate() - days);
      const cutOffIso = cutOffDate.toISOString();

      try {
        const userIds = partnerId ? [userId, partnerId] : [userId];

        const itemsToDelete = await getFridgeItemsBeforeCutoff(userIds, cutOffIso);
        if (!itemsToDelete || itemsToDelete.length === 0) return;

        // Delete associated files from storage
        const filePathsToDelete = [];
        for (const item of itemsToDelete) {
          let fileUrl = null;
          if (item.type === 'photo') {
            fileUrl = item.content;
          } else if (item.type === 'voice') {
            try {
              const parsed = JSON.parse(item.content);
              fileUrl = parsed.url;
            } catch {
              // Ignore invalid JSON
            }
          }

          if (fileUrl) {
            const filePath = getStoragePathFromUrl(fileUrl);
            if (filePath) {
              filePathsToDelete.push(filePath);
            }
          }
        }

        if (filePathsToDelete.length > 0) {
          try {
            await deleteFridgeMedia(filePathsToDelete);
          } catch (storageError) {
            console.error('Storage deletion warning:', storageError);
          }
        }

        await deleteFridgeItemsBeforeCutoff(userIds, cutOffIso);

        setItems((prev) => prev.filter((item) => new Date(item.created_at) >= cutOffDate));
      } catch (err) {
        console.error('Auto compaction error:', err);
      }
    };

    if (!isLoading) {
      runCompaction();
    }
  }, [userId, partnerId, isLoading]);

  return {
    items,
    setItems,
    isLoading,
    error,
    setError,
    commentsCount,
    partnerLastSeen,
    fetchCommentCounts,
  };
}
