import { useEffect, useRef } from 'react';
import { useSupabase } from '../../../hooks/useSupabase';
import { useAppContext } from '../../../contexts/AppContext';

/**
 * Hook to coordinate real-time music actions (play, pause, seek) between partners.
 * Uses Supabase Broadcast channel and applies Last-Write-Wins (LWW) conflict resolution.
 *
 * @param {Object} params
 * @param {string|null} params.currentTrackId - Active track ID.
 * @param {boolean} params.isPlaying - Current local playback playing status.
 * @param {Function} params.onRemotePlay - Callback when partner plays.
 * @param {Function} params.onRemotePause - Callback when partner pauses.
 * @param {Function} params.onRemoteSeek - Callback when partner seeks.
 * @param {Function} params.getCurrentTime - Function to get current local time.
 * @returns {{
 *   broadcastPlay: (trackId: string, timestamp: number) => void,
 *   broadcastPause: () => void,
 *   broadcastSeek: (timestamp: number) => void,
 *   broadcastHeartbeat: (timestamp: number, isPlaying: boolean) => void
 * }} Methods to broadcast local actions.
 */
export function useMusicSync({
  currentTrackId,
  isPlaying,
  onRemotePlay,
  onRemotePause,
  onRemoteSeek,
  getCurrentTime,
}) {
  const supabase = useSupabase();
  const { user } = useAppContext();
  const channelRef = useRef(null);

  // Track the timestamp of the last local user interaction to prevent race conditions
  const lastLocalActionAt = useRef(0);

  useEffect(() => {
    if (!user || !user.id || !user.partner_id) return;

    const sortedIds = [user.id, user.partner_id].sort();
    const channelName = `music:pair:${sortedIds.join('_')}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'play' }, ({ payload }) => {
        // Enforce LWW: Discard if older than our latest local interaction
        if (payload.senderId !== user.id && payload.eventSentAt > lastLocalActionAt.current) {
          onRemotePlay(payload.trackId, payload.timestamp);
        }
      })
      .on('broadcast', { event: 'pause' }, ({ payload }) => {
        // Enforce LWW: Discard if older than our latest local interaction
        if (payload.senderId !== user.id && payload.eventSentAt > lastLocalActionAt.current) {
          onRemotePause();
        }
      })
      .on('broadcast', { event: 'seek' }, ({ payload }) => {
        // Enforce LWW: Discard if older than our latest local interaction
        if (payload.senderId !== user.id && payload.eventSentAt > lastLocalActionAt.current) {
          onRemoteSeek(payload.timestamp);
        }
      })
      .on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
        if (payload.senderId === user.id) return;

        // Passive sync correction logic:
        // Only run heartbeat sync if we are playing the same track
        if (payload.trackId === currentTrackId && payload.isPlaying && isPlaying) {
          const localTime = getCurrentTime();

          // If the partner's timestamp is ahead of ours by more than 1.5 seconds,
          // seek silently to catch up. We do not seek backward for heartbeats to prevent
          // a trailing/stuck partner from pulling us back.
          if (
            payload.timestamp > localTime + 1.5 &&
            payload.eventSentAt > lastLocalActionAt.current
          ) {
            console.debug(
              `Sync drift detected: partner is ahead. Correcting time to match partner.`
            );
            onRemoteSeek(payload.timestamp);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug(`Music sync channel subscribed: ${channelName}`);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [
    user,
    currentTrackId,
    isPlaying,
    onRemotePlay,
    onRemotePause,
    onRemoteSeek,
    getCurrentTime,
    supabase,
  ]);

  /**
   * Broadcast a play action to the partner.
   *
   * @param {string} trackId - The track ID to play.
   * @param {number} timestamp - The current playback offset.
   */
  const broadcastPlay = (trackId, timestamp) => {
    if (!channelRef.current || !user) return;
    const now = Date.now();
    lastLocalActionAt.current = now;

    channelRef.current.send({
      type: 'broadcast',
      event: 'play',
      payload: {
        trackId,
        timestamp,
        senderId: user.id,
        eventSentAt: now,
      },
    });
  };

  /**
   * Broadcast a pause action to the partner.
   */
  const broadcastPause = () => {
    if (!channelRef.current || !user) return;
    const now = Date.now();
    lastLocalActionAt.current = now;

    channelRef.current.send({
      type: 'broadcast',
      event: 'pause',
      payload: {
        senderId: user.id,
        eventSentAt: now,
      },
    });
  };

  /**
   * Broadcast a seek action to the partner.
   *
   * @param {number} timestamp - The new playback timestamp in seconds.
   */
  const broadcastSeek = (timestamp) => {
    if (!channelRef.current || !user) return;
    const now = Date.now();
    lastLocalActionAt.current = now;

    channelRef.current.send({
      type: 'broadcast',
      event: 'seek',
      payload: {
        timestamp,
        senderId: user.id,
        eventSentAt: now,
      },
    });
  };

  /**
   * Passive periodic heartbeat broadcast.
   *
   * @param {number} timestamp - Current local track seek timestamp.
   * @param {boolean} currentIsPlaying - Local playing state.
   */
  const broadcastHeartbeat = (timestamp, currentIsPlaying) => {
    if (!channelRef.current || !user || !currentTrackId) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'heartbeat',
      payload: {
        trackId: currentTrackId,
        timestamp,
        isPlaying: currentIsPlaying,
        senderId: user.id,
        eventSentAt: Date.now(),
      },
    });
  };

  return {
    broadcastPlay,
    broadcastPause,
    broadcastSeek,
    broadcastHeartbeat,
  };
}
