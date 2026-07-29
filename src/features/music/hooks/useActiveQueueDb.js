import { useState, useRef, useCallback, useEffect } from 'react';
import { useSupabase } from '../../../hooks/useSupabase';
import { useAppContext } from '../../../contexts/AppContext';

/**
 * @file useActiveQueueDb.js
 * @description Hook for managing the active `music_queue` session table.
 * The queue state returned contains FULL track objects sourced from a JOIN
 * with `music_library`, preserving compatibility with MusicContext which
 * resolves tracks by `library id` (`t.id`). The session-row identity is
 * preserved as `queue_row_id` for reorder and remove operations.
 *
 * @module useActiveQueueDb
 */

/**
 * @typedef {Object} ActiveQueueTrack
 * @property {string}             id             - Library track UUID (used by MusicContext).
 * @property {string}             queue_row_id   - Session queue row UUID (for mutations).
 * @property {number}             position_index - Playback order index.
 * @property {string}             added_by       - User ID who enqueued this track.
 * @property {string}             title          - Track title.
 * @property {string}             artist         - Artist name.
 * @property {'upload'|'youtube'} source         - Media source type.
 * @property {string}             url            - Playback URL or YouTube video ID.
 * @property {number}             duration_seconds - Duration in seconds.
 * @property {string|null}        artwork_url    - Artwork image URL.
 * @property {string}             created_at     - Library row creation timestamp.
 */

/**
 * @typedef {Object} UseActiveQueueDbReturn
 * @property {ActiveQueueTrack[]}                          queue                - Ordered full-track queue.
 * @property {React.Dispatch<React.SetStateAction<ActiveQueueTrack[]>>} setQueue - Queue state setter.
 * @property {React.MutableRefObject<ActiveQueueTrack[]>}  queueRef             - Stable ref to queue.
 * @property {Function}                                    fetchQueue           - Re-fetches and syncs queue.
 * @property {Function}                                    injectTrackIntoQueue - Adds/replaces queue entry.
 * @property {Function}                                    removeFromActiveQueue- Removes single session row.
 * @property {Function}                                    reorderQueue         - Persists new playback order.
 * @property {Function}                                    clearQueue           - Removes all session rows.
 * @property {Function}                                    saveQueueAsPlaylist  - Saves queue as a playlist.
 */

/**
 * Maps a raw `music_queue` JOIN row to a flat `ActiveQueueTrack` object.
 * The top-level `id` is taken from `music_library.id` to maintain
 * identity compatibility with MusicContext's `playTrackById` resolver.
 *
 * @param {Object} row - A raw Supabase JOIN result row.
 * @returns {ActiveQueueTrack} Flattened track object.
 */
function mapQueueRowToTrack(row) {
  return {
    ...row.music_library,
    queue_row_id: row.id,
    position_index: row.position_index,
    added_by: row.added_by,
  };
}

/**
 * Custom hook for managing the active `music_queue` session table.
 * Performs a JOIN with `music_library` so returned queue items are full
 * track objects, not lightweight reference stubs. Provides real-time
 * subscription with a 150ms debounce and full cleanup on unmount.
 *
 * @param {Object}                                        params
 * @param {React.MutableRefObject<ActiveQueueTrack|null>} params.currentTrackRef  - Ref to the currently playing track.
 * @param {React.MutableRefObject<boolean>}               params.isCrossfadingRef - Ref indicating active crossfade.
 * @param {Function}                                      params.playTrackById    - MusicContext playback initiator.
 * @param {Function}                                      params.pauseLocalPlayback - MusicContext pause handler.
 * @param {Function}                                      params.handleTrackEnded - MusicContext end-of-track handler.
 * @returns {UseActiveQueueDbReturn}
 */
export function useActiveQueueDb({
  currentTrackRef,
  isCrossfadingRef,
  playTrackById,
  pauseLocalPlayback,
  handleTrackEnded,
}) {
  const supabase = useSupabase();
  const { user } = useAppContext();

  const [queue, setQueue] = useState([]);
  const queueRef = useRef(queue);
  const hasFetchedInitiallyRef = useRef(false);
  const hasCuedInitialTrackRef = useRef(false);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  /**
   * Fetches the active queue by JOINing `music_queue` with `music_library`.
   * Maps results into full `ActiveQueueTrack` objects ordered by position_index.
   * Triggers auto-cue of the first track when no track is currently active.
   *
   * @returns {Promise<void>}
   */
  const fetchQueue = useCallback(async () => {
    if (!user?.id || !user?.partner_id) return;
    try {
      const { data, error } = await supabase
        .from('music_queue')
        .select(
          'id, position_index, added_at, added_by, music_library:library_track_id(id, title, artist, source, url, duration_seconds, artwork_url, added_by, created_at)'
        )
        .or(`added_by.eq.${user.id},added_by.eq.${user.partner_id}`)
        .order('position_index', { ascending: true });

      if (error) {
        console.error('[useActiveQueueDb] Error fetching queue:', error);
        return;
      }

      const tracks = (data || []).map(mapQueueRowToTrack);
      setQueue(tracks);
      queueRef.current = tracks;

      if (tracks.length === 0) {
        hasCuedInitialTrackRef.current = false;
      }

      // Auto-cue the first track if nothing is playing yet.
      if (
        !currentTrackRef.current &&
        !isCrossfadingRef.current &&
        tracks.length > 0 &&
        !hasCuedInitialTrackRef.current
      ) {
        const shouldStartPaused = !hasFetchedInitiallyRef.current;
        playTrackById(tracks[0].id, 0, shouldStartPaused);
        hasCuedInitialTrackRef.current = true;
      }

      hasFetchedInitiallyRef.current = true;
    } catch (err) {
      console.error('[useActiveQueueDb] Failed to load queue:', err);
    }
  }, [user, supabase, playTrackById, currentTrackRef, isCrossfadingRef]);

  // ─── Inject ────────────────────────────────────────────────────────────────

  /**
   * Appends or replaces the active queue with the specified library track.
   * - `'append'`: Adds the track at position_index = max + 1.
   * - `'replace'`: Clears all existing queue rows, then inserts the track at index 0.
   *
   * @param {string}           libraryTrackId          - UUID from `music_library.id`.
   * @param {'append'|'replace'} [insertMode='append'] - Queue injection strategy.
   * @returns {Promise<void>}
   */
  const injectTrackIntoQueue = useCallback(
    async (libraryTrackId, insertMode = 'append') => {
      if (!user?.id) return;
      try {
        if (insertMode === 'replace') {
          const { error: deleteError } = await supabase
            .from('music_queue')
            .delete()
            .or(`added_by.eq.${user.id},added_by.eq.${user.partner_id}`);

          if (deleteError) {
            console.error('[useActiveQueueDb] Error clearing queue for replace:', deleteError);
            return;
          }

          await supabase.from('music_queue').insert({
            library_track_id: libraryTrackId,
            added_by: user.id,
            position_index: 0,
          });
        } else {
          const maxPos = queueRef.current.reduce(
            (max, track) => Math.max(max, track.position_index || 0),
            -1
          );

          await supabase.from('music_queue').insert({
            library_track_id: libraryTrackId,
            added_by: user.id,
            position_index: maxPos + 1,
          });
        }
        // Real-time subscription triggers a re-fetch automatically.
      } catch (err) {
        console.error('[useActiveQueueDb] Failed to inject track into queue:', err);
      }
    },
    [user, supabase]
  );

  // ─── Remove ────────────────────────────────────────────────────────────────

  /**
   * Removes a single row from the active `music_queue` by its session row ID.
   * If the removed track is currently playing, pauses playback and advances.
   *
   * @param {string} queueRowId - UUID of the `music_queue` session row to delete.
   * @returns {Promise<void>}
   */
  const removeFromActiveQueue = useCallback(
    async (queueRowId) => {
      try {
        const targetTrack = queueRef.current.find((t) => t.queue_row_id === queueRowId);
        const isCurrentlyPlaying = currentTrackRef.current?.id === targetTrack?.id;

        // Optimistic update.
        const nextQueue = queueRef.current.filter((t) => t.queue_row_id !== queueRowId);
        setQueue(nextQueue);
        queueRef.current = nextQueue;

        if (isCurrentlyPlaying) {
          pauseLocalPlayback(false);
        }

        const { error } = await supabase.from('music_queue').delete().eq('id', queueRowId);

        if (error) {
          console.error('[useActiveQueueDb] Error removing queue row:', error);
          fetchQueue();
          return;
        }

        if (isCurrentlyPlaying) {
          handleTrackEnded();
        }
      } catch (err) {
        console.error('[useActiveQueueDb] Failed to remove queue row:', err);
        fetchQueue();
      }
    },
    [supabase, fetchQueue, currentTrackRef, pauseLocalPlayback, handleTrackEnded]
  );

  // ─── Reorder ───────────────────────────────────────────────────────────────

  /**
   * Persists a new track order by calling the `update_queue_positions` RPC.
   * Applies an optimistic update locally and rolls back if the RPC fails.
   * Uses `queue_row_id` (not `id`) as the session row identifier.
   *
   * @param {ActiveQueueTrack[]} reorderedTracks - New ordered array of queue tracks.
   * @returns {Promise<void>}
   */
  const reorderQueue = useCallback(
    async (reorderedTracks) => {
      const previousQueue = [...queueRef.current];
      setQueue(reorderedTracks);
      queueRef.current = reorderedTracks;

      try {
        const payload = reorderedTracks.map((track, index) => ({
          id: track.queue_row_id,
          position_index: index,
        }));

        const { error } = await supabase.rpc('update_queue_positions', { payload });

        if (error) throw error;
      } catch (err) {
        console.error('[useActiveQueueDb] Failed to reorder queue, rolling back:', err);
        setQueue(previousQueue);
        queueRef.current = previousQueue;
      }
    },
    [supabase]
  );

  // ─── Clear ─────────────────────────────────────────────────────────────────

  /**
   * Deletes all `music_queue` session rows belonging to the current couple.
   *
   * @returns {Promise<void>}
   */
  const clearQueue = useCallback(async () => {
    if (!user?.id || !user?.partner_id) return;
    try {
      const { error } = await supabase
        .from('music_queue')
        .delete()
        .or(`added_by.eq.${user.id},added_by.eq.${user.partner_id}`);

      if (error) {
        console.error('[useActiveQueueDb] Error clearing queue:', error);
        return;
      }

      setQueue([]);
      queueRef.current = [];
      hasCuedInitialTrackRef.current = false;
    } catch (err) {
      console.error('[useActiveQueueDb] Failed to clear queue:', err);
    }
  }, [user, supabase]);

  // ─── Save as Playlist ──────────────────────────────────────────────────────

  /**
   * Saves the current active queue's library track IDs as a named playlist
   * in the `music_playlists` table.
   *
   * @param {string} name - Human-readable name for the playlist.
   * @returns {Promise<Object|null>} The created playlist record, or null on failure.
   */
  const saveQueueAsPlaylist = useCallback(
    async (name) => {
      if (!user?.id || queueRef.current.length === 0) return null;
      try {
        const trackIds = queueRef.current.map((t) => t.id);

        const { data, error } = await supabase
          .from('music_playlists')
          .insert({
            name,
            created_by: user.id,
            track_ids: trackIds,
          })
          .select()
          .single();

        if (error) {
          console.error('[useActiveQueueDb] Error saving playlist:', error);
          return null;
        }

        return data;
      } catch (err) {
        console.error('[useActiveQueueDb] Failed to save queue as playlist:', err);
        return null;
      }
    },
    [user, supabase]
  );

  // ─── Real-Time Subscription ────────────────────────────────────────────────

  /* eslint-disable react-hooks/set-state-in-effect -- Intentional: initial fetch + live updates */
  useEffect(() => {
    if (!user?.id || !user?.partner_id) return;

    fetchQueue();

    let debounceTimer = null;

    const channel = supabase
      .channel('music_active_queue_db_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'music_queue',
        },
        (payload) => {
          const addedBy = payload.new?.added_by || payload.old?.added_by;
          if (!addedBy || addedBy === user.id || addedBy === user.partner_id) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchQueue, 150);
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchQueue]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    queue,
    setQueue,
    queueRef,
    fetchQueue,
    injectTrackIntoQueue,
    removeFromActiveQueue,
    reorderQueue,
    clearQueue,
    saveQueueAsPlaylist,
  };
}
