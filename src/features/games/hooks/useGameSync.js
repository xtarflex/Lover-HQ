/**
 * @file useGameSync.js
 * @description Supabase Realtime broadcast hook for syncing game moves
 * between two players without needing DB writes for each move.
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Subscribes to a game-specific broadcast channel and returns a function
 * to broadcast move payloads to the other player.
 *
 * @param {string} gameType - The game type ID (e.g., 'tic-tac-toe').
 * @param {string} sessionId - Unique session identifier shared by both players.
 * @param {Function} onRemoteMove - Callback invoked when the opponent broadcasts a move.
 * @returns {Function} broadcastMove - Call this with a move payload to send to opponent.
 */
export function useGameSync(gameType, sessionId, onRemoteMove) {
  const channelRef = useRef(null);
  const onRemoteMoveRef = useRef(onRemoteMove);

  // Keep refs up to date without re-subscribing
  useEffect(() => {
    onRemoteMoveRef.current = onRemoteMove;
  }, [onRemoteMove]);

  useEffect(() => {
    if (!gameType || !sessionId) return;

    const channelName = `game:${gameType}:${sessionId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        onRemoteMoveRef.current?.(payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Automatically request game state synchronization from partner upon channel connection
          channel.send({
            type: 'broadcast',
            event: 'move',
            payload: { type: 'sync_request', ts: Date.now() },
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [gameType, sessionId]);

  /**
   * Broadcasts a move to the opponent.
   *
   * @param {object} moveData - Arbitrary move payload (game-specific).
   */
  const broadcastMove = useCallback((moveData) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'move',
      payload: { ...moveData, ts: Date.now() },
    });
  }, []);

  return broadcastMove;
}
