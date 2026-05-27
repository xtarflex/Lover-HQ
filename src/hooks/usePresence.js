import { useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { useAppDispatch, useAppContext } from '../contexts/AppContext';

/**
 * Hook to manage and sync presence status for the current user and their partner.
 * Generates an alphabetical pair-specific channel, tracks active room,
 * and synchronizes the online/offline status and current room in the database.
 *
 * @param {string} roomName - The name of the room/page the user is currently in.
 * @returns {void}
 */
export function usePresence(roomName) {
  const supabase = useSupabase();
  const dispatch = useAppDispatch();
  const { user } = useAppContext();

  useEffect(() => {
    if (!user || !user.id || !user.partner_id || !roomName) return;

    // Create a pair-specific presence channel name sorted alphabetically by user IDs
    const sortedIds = [user.id, user.partner_id].sort();
    const channelName = `presence:pair:${sortedIds.join('_')}`;
    const channel = supabase.channel(channelName);

    /**
     * Updates the user's presence record in the database.
     *
     * @param {boolean} isOnline - Whether the user is currently online.
     * @param {string|null} currentRoom - The room the user is currently in, or null.
     * @returns {Promise<void>}
     */
    const updateDbPresence = async (isOnline, currentRoom) => {
      try {
        const { error } = await supabase.from('presence').upsert(
          {
            user_id: user.id,
            is_online: isOnline,
            current_room: currentRoom,
            last_seen: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (error) {
          console.error('Error updating presence in DB:', error);
        }
      } catch (err) {
        console.error('Failed to update presence in DB:', err);
      }
    };

    let heartbeatInterval = null;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presences = Object.values(state).flat();

        // Find partner's presence
        const partnerPresence = presences.find((p) => p.user_id === user.partner_id);
        // Find own presence
        const ownPresence = presences.find((p) => p.user_id === user.id);

        dispatch({
          type: 'SET_PRESENCE',
          payload: {
            user: ownPresence ? 'online' : 'offline',
            partner: partnerPresence ? 'online' : 'offline',
            partnerRoom: partnerPresence ? partnerPresence.current_room : null,
          },
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence status on the channel
          await channel.track({
            user_id: user.id,
            current_room: roomName,
            is_online: true,
            last_seen: new Date().toISOString(),
          });
          // Update database presence as online
          await updateDbPresence(true, roomName);

          // Keep DB last_seen heartbeat updated every 10 seconds while active
          heartbeatInterval = setInterval(() => {
            updateDbPresence(true, roomName);
          }, 10000);
        }
      });

    // Cleanup when roomName changes or component unmounts
    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      // Set presence to offline in the database
      updateDbPresence(false, null);
      // Untrack and remove channel subscription
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user, roomName, supabase, dispatch]);
}
