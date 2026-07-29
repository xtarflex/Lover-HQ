import { useState, useRef, useCallback, useEffect } from 'react';
import { useSupabase } from '../../../hooks/useSupabase';
import { useAppContext } from '../../../contexts/AppContext';

/**
 * @file useLibraryDb.js
 * @description Hook for managing the permanent `music_library` table.
 * Handles fetching, inserting, and deleting library tracks, plus real-time
 * Supabase subscriptions with a 150ms debounce to prevent over-fetching.
 *
 * @module useLibraryDb
 */

/**
 * @typedef {Object} LibraryTrack
 * @property {string}      id               - UUID of the library record.
 * @property {string}      added_by         - User ID who added the track.
 * @property {string}      title            - Track title.
 * @property {string}      artist           - Artist name.
 * @property {'upload'|'youtube'} source    - Media source type.
 * @property {string}      url              - Playback URL or YouTube video ID.
 * @property {number}      duration_seconds - Track duration in seconds.
 * @property {string|null} artwork_url      - Artwork image URL.
 * @property {string}      created_at       - ISO timestamp of creation.
 * @property {number}      position_index   - Library sort index.
 * @property {boolean}     cached_by_partner- Whether the partner has cached it.
 * @property {string|null} cached_at        - ISO timestamp when cached.
 */

/**
 * @typedef {Object} UseLibraryDbReturn
 * @property {LibraryTrack[]} library          - Current library track array.
 * @property {Function}       fetchLibrary      - Fetches all library tracks.
 * @property {Function}       addToLibrary      - Adds a track to library & queue.
 * @property {Function}       removeFromLibrary - Deletes a track from the library.
 */

/**
 * Custom hook for interacting with the `music_library` Supabase table.
 * Provides CRUD operations and a real-time subscription with debounce.
 * Inserts into `music_library` also simultaneously add a session row
 * to the active `music_queue`.
 *
 * @returns {UseLibraryDbReturn} Library state and operations.
 */
export function useLibraryDb() {
  const supabase = useSupabase();
  const { user } = useAppContext();

  const [library, setLibrary] = useState([]);
  const libraryRef = useRef(library);

  useEffect(() => {
    libraryRef.current = library;
  }, [library]);

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  /**
   * Fetches all tracks from `music_library` for the current couple,
   * ordered by `created_at` ascending.
   *
   * @returns {Promise<void>}
   */
  const fetchLibrary = useCallback(async () => {
    if (!user?.id || !user?.partner_id) return;
    try {
      const { data, error } = await supabase
        .from('music_library')
        .select('*')
        .or(`added_by.eq.${user.id},added_by.eq.${user.partner_id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useLibraryDb] Error fetching library:', error);
        return;
      }

      const tracks = data || [];
      setLibrary(tracks);
      libraryRef.current = tracks;
    } catch (err) {
      console.error('[useLibraryDb] Failed to load library:', err);
    }
  }, [user, supabase]);

  // ─── Add ───────────────────────────────────────────────────────────────────

  /**
   * Inserts a new track into `music_library` and simultaneously appends
   * a corresponding session row into the active `music_queue`.
   *
   * @param {string}      title           - Track title.
   * @param {string}      artist          - Artist name.
   * @param {'upload'|'youtube'} source   - Media source type.
   * @param {string}      url             - Playback URL or YouTube video ID.
   * @param {number}      durationSeconds - Duration of the track in seconds.
   * @param {string|null} [artworkUrl=null] - Optional artwork image URL.
   * @returns {Promise<LibraryTrack|null>} The newly created library track, or null on failure.
   */
  const addToLibrary = useCallback(
    async (title, artist, source, url, durationSeconds, artworkUrl = null) => {
      if (!user?.id) return null;
      try {
        const maxPos = libraryRef.current.reduce(
          (max, track) => Math.max(max, track.position_index || 0),
          -1
        );

        const { data: libraryData, error: libraryError } = await supabase
          .from('music_library')
          .insert({
            added_by: user.id,
            title,
            artist,
            source,
            url,
            duration_seconds: durationSeconds,
            artwork_url: artworkUrl,
            position_index: maxPos + 1,
          })
          .select()
          .single();

        if (libraryError) {
          console.error('[useLibraryDb] Error inserting into library:', libraryError);
          return null;
        }

        // Simultaneously enqueue the new library track into the active session.
        const { error: queueError } = await supabase.from('music_queue').insert({
          library_track_id: libraryData.id,
          added_by: user.id,
          position_index: maxPos + 1,
        });

        if (queueError) {
          console.error('[useLibraryDb] Error enqueuing new library track:', queueError);
          // Library row still succeeded; non-fatal for the library itself.
        }

        const nextLibrary = [...libraryRef.current, libraryData];
        setLibrary(nextLibrary);
        libraryRef.current = nextLibrary;

        return libraryData;
      } catch (err) {
        console.error('[useLibraryDb] Failed to add track to library:', err);
        return null;
      }
    },
    [user, supabase]
  );

  // ─── Remove ────────────────────────────────────────────────────────────────

  /**
   * Deletes a track from `music_library` by its ID. The FK constraint with
   * ON DELETE CASCADE automatically removes associated `music_queue` rows.
   *
   * @param {string} libraryTrackId - UUID of the library track to remove.
   * @returns {Promise<void>}
   */
  const removeFromLibrary = useCallback(
    async (libraryTrackId) => {
      try {
        // Optimistic update.
        const nextLibrary = libraryRef.current.filter((t) => t.id !== libraryTrackId);
        setLibrary(nextLibrary);
        libraryRef.current = nextLibrary;

        const { error } = await supabase.from('music_library').delete().eq('id', libraryTrackId);

        if (error) {
          console.error('[useLibraryDb] Error deleting library track:', error);
          // Roll back optimistic update on failure.
          fetchLibrary();
        }
      } catch (err) {
        console.error('[useLibraryDb] Failed to remove library track:', err);
        fetchLibrary();
      }
    },
    [supabase, fetchLibrary]
  );

  // ─── Real-Time Subscription ────────────────────────────────────────────────

  /* eslint-disable react-hooks/set-state-in-effect -- Intentional: initial fetch + live updates */
  useEffect(() => {
    if (!user?.id || !user?.partner_id) return;

    fetchLibrary();

    let debounceTimer = null;

    const channel = supabase
      .channel('music_library_db_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'music_library',
        },
        (payload) => {
          const addedBy = payload.new?.added_by || payload.old?.added_by;
          if (!addedBy || addedBy === user.id || addedBy === user.partner_id) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchLibrary, 150);
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchLibrary]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    library,
    fetchLibrary,
    addToLibrary,
    removeFromLibrary,
  };
}
