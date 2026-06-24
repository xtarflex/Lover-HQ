import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage the music queue database CRUD operations and realtime sync.
 *
 * @param {Object} params
 * @param {Object|null} params.user - The current user object.
 * @param {Object} params.supabase - The Supabase client instance.
 * @param {React.MutableRefObject<Object|null>} params.currentTrackRef - Ref to the currently active track.
 * @param {React.MutableRefObject<boolean>} params.isCrossfadingRef - Ref tracking whether a crossfade is in progress.
 * @param {Function} params.playTrackById - Callback function to play a track by ID.
 * @param {Function} params.pauseLocalPlayback - Callback function to pause local playback.
 * @param {Function} params.handleTrackEnded - Callback function to transition to the next track when ended.
 * @returns {{
 *   queue: Array<Object>,
 *   setQueue: React.Dispatch<React.SetStateAction<Array<Object>>>,
 *   queueRef: React.MutableRefObject<Array<Object>>,
 *   fetchQueue: () => Promise<void>,
 *   addToQueue: (title: string, artist: string, source: 'upload'|'youtube', url: string, durationSeconds: number, artworkUrl?: string|null) => Promise<void>,
 *   removeFromQueue: (trackId: string) => Promise<void>,
 *   reorderQueue: (reorderedTracks: Array<Object>) => Promise<void>
 * }} Decomposed queue methods and state.
 */
export function useQueueDb({
  user,
  supabase,
  currentTrackRef,
  isCrossfadingRef,
  playTrackById,
  pauseLocalPlayback,
  handleTrackEnded,
}) {
  const [queue, setQueue] = useState([]);
  const queueRef = useRef(queue);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  /**
   * Fetches the current music queue from the database.
   */
  const fetchQueue = useCallback(async () => {
    if (!user?.id || !user?.partner_id) return;
    try {
      const { data, error } = await supabase
        .from('music_queue')
        .select('*')
        .or(`added_by.eq.${user.id},added_by.eq.${user.partner_id}`)
        .order('position_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching queue:', error);
        return;
      }
      const tracks = data || [];
      setQueue(tracks);

      // Autoplay the first track if nothing is playing
      if (!currentTrackRef.current && !isCrossfadingRef.current && tracks.length > 0) {
        playTrackById(tracks[0].id, 0);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  }, [user, supabase, playTrackById, currentTrackRef, isCrossfadingRef]);

  // Queue subscription with debounce
  useEffect(() => {
    if (!user?.id || !user?.partner_id) return;

    fetchQueue();

    let debounceTimer = null;
    const channel = supabase
      .channel('music_queue_db_sync')
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

  /**
   * Inserts a new track into the shared queue.
   */
  const addToQueue = useCallback(
    async (title, artist, source, url, durationSeconds, artworkUrl = null) => {
      if (!user) return;
      try {
        const maxPos = queueRef.current.reduce(
          (max, track) => Math.max(max, track.position_index || 0),
          0
        );

        const { data, error } = await supabase
          .from('music_queue')
          .insert({
            added_by: user.id,
            title,
            artist,
            source,
            url,
            duration_seconds: durationSeconds,
            position_index: maxPos + 1,
            artwork_url: artworkUrl,
          })
          .select();

        if (error) {
          console.error('Error adding to queue:', error);
          return;
        }

        const newTrack = data[0];
        setQueue((prev) => [...prev, newTrack]);

        if (!currentTrackRef.current && !isCrossfadingRef.current && newTrack) {
          playTrackById(newTrack.id, 0);
        }
      } catch (err) {
        console.error('Failed to add to queue:', err);
      }
    },
    [user, supabase, playTrackById, currentTrackRef, isCrossfadingRef]
  );

  /**
   * Removes a track from the queue.
   */
  const removeFromQueue = useCallback(
    async (trackId) => {
      try {
        const isCurrentlyPlaying = currentTrackRef.current?.id === trackId;

        setQueue((prev) => prev.filter((t) => t.id !== trackId));

        if (isCurrentlyPlaying) {
          pauseLocalPlayback(false);
        }

        const { error } = await supabase.from('music_queue').delete().eq('id', trackId);
        if (error) {
          console.error('Error deleting track:', error);
          fetchQueue();
          return;
        }

        if (isCurrentlyPlaying) {
          handleTrackEnded();
        }
      } catch (err) {
        console.error('Failed to delete track:', err);
        fetchQueue();
      }
    },
    [pauseLocalPlayback, supabase, fetchQueue, currentTrackRef, handleTrackEnded]
  );

  /**
   * Reorders the queue with rollback on failure.
   */
  const reorderQueue = useCallback(
    async (reorderedTracks) => {
      const previousQueue = [...queueRef.current];
      setQueue(reorderedTracks);

      try {
        await Promise.all(
          reorderedTracks.map((track, index) =>
            supabase.from('music_queue').update({ position_index: index }).eq('id', track.id)
          )
        );
      } catch (err) {
        console.error('Failed to reorder queue, rolling back:', err);
        setQueue(previousQueue);
      }
    },
    [supabase]
  );

  return {
    queue,
    setQueue,
    queueRef,
    fetchQueue,
    addToQueue,
    removeFromQueue,
    reorderQueue,
  };
}
