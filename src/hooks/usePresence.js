import { useEffect, useRef } from 'react';
import { useSupabase } from './useSupabase';
import { useAppDispatch, useAppContext } from '../contexts/AppContext';
import { triggerBuzz, triggerPush } from '../utils/notification';

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
  const channelRef = useRef(null);

  // Effect 1: Long-lived subscription to the presence channel
  useEffect(() => {
    if (!user || !user.id || !user.partner_id) return;

    const sortedIds = [user.id, user.partner_id].sort();
    const channelName = `presence:pair:${sortedIds.join('_')}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

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
      .on('broadcast', { event: 'game_invite' }, ({ payload }) => {
        if (payload.senderId === user.id) return;
        const autoJoin = localStorage.getItem('preferences_auto_join_games') === 'true';
        if (autoJoin) {
          dispatch({ type: 'SET_AUTO_JOIN', payload: payload.gameId });
          triggerBuzz();
        } else {
          dispatch({ type: 'SET_INVITATION', payload });
          triggerBuzz();
          triggerPush('Game Invitation 🎮', `${payload.hostName} invited you to play ${payload.gameName}!`);
        }
      })
      .on('broadcast', { event: 'game_invite_decline' }, ({ payload }) => {
        dispatch({
          type: 'SET_GLOBAL_NOTIFICATION',
          payload: { message: `${payload.partnerName} declined your invite.`, type: 'info' }
        });
        window.dispatchEvent(new CustomEvent('game-invite-declined'));
      })
      .on('broadcast', { event: 'reveal_nudge' }, ({ payload }) => {
        const allowNudges = localStorage.getItem('reveal_allow_nudges') !== 'false';
        if (!allowNudges) return;

        triggerBuzz();

        // Send nudge indicator if currently in Reveal room
        if (window.location.pathname.includes('/reveal')) {
          const event = new CustomEvent('partner-nudge-shake');
          window.dispatchEvent(event);
        } else {
          dispatch({
            type: 'SET_GLOBAL_NOTIFICATION',
            payload: { message: `${payload.hostName} is waiting for your Reveal answer! ⏳`, type: 'info' }
          });
          triggerPush('Reveal Q&A Nudge ⏳', `${payload.hostName} is waiting for your answer!`);
        }
      })
      .subscribe();

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, supabase, dispatch]);

  // Effect 2: Short-lived track updates when the roomName changes
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !user || !user.id || !roomName) return;

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

    const trackPresence = async () => {
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
    };

    trackPresence();

    // Cleanup when roomName changes or component unmounts
    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      // Set presence to offline in the database
      updateDbPresence(false, null);
    };
  }, [roomName, user, supabase]);
}
