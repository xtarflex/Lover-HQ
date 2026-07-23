/**
 * @file usePartnerPresence.js
 * @description Thin chat-scoped hook that tracks the partner's `last_seen` timestamp.
 * Reads the initial value from localStorage (seeded by the global usePresence heartbeat),
 * fetches the live value from the Supabase `presence` table on mount, and subscribes to
 * realtime postgres_changes on that row for instant updates.
 *
 * This hook does NOT open a duplicate pair-presence channel — it targets only the
 * partner's individual presence row via a separate lightweight subscription.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Tracks the partner's last_seen timestamp via Supabase presence table.
 *
 * @param {string|null} partnerId - The partner's user ID.
 * @param {string|null} partnerLastSeenFallback - Initial last_seen value from partner context object.
 * @returns {{ partnerLastSeen: string|null }}
 */
export function usePartnerPresence(partnerId, partnerLastSeenFallback) {
  const [partnerLastSeen, setPartnerLastSeen] = useState(() => {
    if (typeof window === 'undefined' || !partnerId) return partnerLastSeenFallback;
    return localStorage.getItem(`partner_last_seen_${partnerId}`) || partnerLastSeenFallback;
  });

  // Persist latest value to localStorage for offline support
  useEffect(() => {
    if (partnerId && partnerLastSeen) {
      localStorage.setItem(`partner_last_seen_${partnerId}`, partnerLastSeen);
    }
  }, [partnerLastSeen, partnerId]);

  useEffect(() => {
    if (!partnerId) return;

    // Fetch initial partner last_seen value from presence table
    const fetchPartnerLastSeen = async () => {
      try {
        const { data } = await supabase
          .from('presence')
          .select('last_seen')
          .eq('user_id', partnerId)
          .single();
        if (data) {
          setPartnerLastSeen(data.last_seen);
        }
      } catch (err) {
        console.error('Failed to fetch partner last seen:', err);
      }
    };
    fetchPartnerLastSeen();

    // Subscribe to partner presence record changes for real-time last_seen updates
    const partnerPresenceChannel = supabase
      .channel(`partner_user_presence:${partnerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presence', filter: `user_id=eq.${partnerId}` },
        (payload) => {
          if (payload.new) {
            setPartnerLastSeen(payload.new.last_seen);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(partnerPresenceChannel);
    };
  }, [partnerId]);

  return { partnerLastSeen };
}
