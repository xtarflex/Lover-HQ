import { useEffect, useRef } from 'react';
import { useSupabase } from './useSupabase';
import { useAppDispatch, useAppContext } from '../contexts/AppContext';

/**
 * Hook to manage and sync presence status for the current user and their partner.
 *
 * @param {string} roomName
 */
export function usePresence(roomName) {
  const supabase = useSupabase();
  const dispatch = useAppDispatch();
  const { user } = useAppContext();
  const channelRef = useRef(null);

  useEffect(() => {
    if (!user || !user.id || !roomName) return;

    const channel = supabase.channel(`presence:${roomName}`);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Extract presence state and update global context
        // This is a simplified implementation; adjust based on actual state structure
        const hasPartner = Object.values(state).some((presences) =>
          presences.some((p) => p.user_id !== user.id)
        );

        dispatch({
          type: 'SET_PRESENCE',
          payload: {
            user: 'online',
            partner: hasPartner ? 'online' : 'offline',
          },
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.debug('join', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.debug('leave', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, roomName, supabase, dispatch]);
}
