import { useEffect, useRef, useCallback } from 'react';
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
  const roomNameRef = useRef(roomName);
  const writeSeqRef = useRef(0);

  const userId = user?.id;
  const partnerId = user?.partner_id;

  /**
   * Updates the user's presence record in the database with monotonic sequence tracking.
   *
   * @param {boolean} isOnline - Whether the user is currently online.
   * @param {string|null} currentRoom - The room the user is currently in, or null.
   * @returns {Promise<void>}
   */
  const updateDbPresence = useCallback(
    async (isOnline, currentRoom) => {
      if (!userId) return;
      const seq = ++writeSeqRef.current;
      try {
        const { error } = await supabase.from('presence').upsert(
          {
            user_id: userId,
            is_online: isOnline,
            current_room: currentRoom,
            last_seen: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (error && seq === writeSeqRef.current) {
          console.error('Error updating presence in DB:', error);
        }
      } catch (err) {
        if (seq === writeSeqRef.current) {
          console.error('Failed to update presence in DB:', err);
        }
      }
    },
    [userId, supabase]
  );

  // Synchronize room transitions without tearing down the Realtime channel
  useEffect(() => {
    roomNameRef.current = roomName;
    const channel = channelRef.current;
    if (channel && channel.state === 'joined' && userId) {
      channel.track({
        user_id: userId,
        current_room: roomName,
        is_online: true,
        last_seen: new Date().toISOString(),
      });
      updateDbPresence(true, roomName);
    }
  }, [roomName, userId, updateDbPresence]);

  // Manage Realtime channel lifecycle bound to the user pair session
  useEffect(() => {
    if (!userId || !partnerId) return;

    const sortedIds = [userId, partnerId].sort();
    const channelName = `presence:pair:${sortedIds.join('_')}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    let heartbeatInterval = null;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presences = Object.values(state).flat();

        // Find partner's presence
        const partnerPresence = presences.find((p) => p.user_id === partnerId);
        // Find own presence
        const ownPresence = presences.find((p) => p.user_id === userId);

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
        if (!payload || typeof payload !== 'object' || payload.senderId === userId) return;
        const autoJoin = localStorage.getItem('preferences_auto_join_games') === 'true';
        if (autoJoin) {
          dispatch({ type: 'SET_AUTO_JOIN', payload: payload.gameId });
          triggerBuzz();
        } else {
          dispatch({ type: 'SET_INVITATION', payload });
          triggerBuzz();
          triggerPush(
            'Game Invitation 🎮',
            `${payload.hostName} invited you to play ${payload.gameName}!`
          );
        }
      })
      .on('broadcast', { event: 'game_invite_cancel' }, () => {
        dispatch({ type: 'SET_INVITATION', payload: null });
      })
      .on('broadcast', { event: 'game_invite_decline' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return;
        dispatch({
          type: 'SET_GLOBAL_NOTIFICATION',
          payload: { message: `${payload.partnerName} declined your invite.`, type: 'info' },
        });
        window.dispatchEvent(new CustomEvent('game-invite-declined'));
      })
      .on('broadcast', { event: 'reveal_nudge' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return;
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
            payload: {
              message: `${payload.hostName} is waiting for your Reveal answer! ⏳`,
              type: 'info',
            },
          });
          triggerPush('Reveal Q&A Nudge ⏳', `${payload.hostName} is waiting for your answer!`);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({
            user_id: userId,
            current_room: roomNameRef.current,
            is_online: true,
            last_seen: new Date().toISOString(),
          });
          updateDbPresence(true, roomNameRef.current);
        }
      });

    // Keep DB last_seen heartbeat updated every 10 seconds while active
    heartbeatInterval = setInterval(() => {
      if (channel.state === 'joined') {
        channel.track({
          user_id: userId,
          current_room: roomNameRef.current,
          is_online: true,
          last_seen: new Date().toISOString(),
        });
      }
      updateDbPresence(true, roomNameRef.current);
    }, 10000);

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
      updateDbPresence(false, null);
    };
  }, [userId, partnerId, supabase, dispatch, updateDbPresence]);
}
