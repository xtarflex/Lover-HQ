/* eslint-disable */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { useAppContext } from './AppContext';
import { useMusicSync } from '../features/music/hooks/useMusicSync';
import { useQueueDb } from '../features/music/hooks/useQueueDb';
import { useHtml5Player } from '../features/music/hooks/useHtml5Player';
import { useYoutubePlayer } from '../features/music/hooks/useYoutubePlayer';
import { useCrossfade } from '../features/music/hooks/useCrossfade';

const MusicContext = createContext(null);

/**
 * Global Music Player Context Provider.
 * Orchestrates decomposed hooks for queue database sync, HTML5 media elements,
 * YouTube player instances, crossfading transitions, and real-time partner sync.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {React.ReactElement} The Context Provider.
 */
export function MusicProvider({ children }) {
  const supabase = useSupabase();
  const { user } = useAppContext();

  // ─── Orchestrated Playback States ──────────────────────────────────────────
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [crossfadeDuration, setCrossfadeDuration] = useState(3);
  const [activePlayer, setActivePlayer] = useState('none'); // 'html5' | 'youtube' | 'none'
  const [isListenAlongBlocked, setIsListenAlongBlocked] = useState(false);

  // ─── Derivation & Coordination Refs ────────────────────────────────────────
  const volumeRef = useRef(volume);
  const crossfadeDurationRef = useRef(crossfadeDuration);
  const currentTrackRef = useRef(currentTrack);
  const activePlayerRef = useRef(activePlayer);
  const currentTimeRef = useRef(currentTime);

  const isRemoteAction = useRef(false);
  const isCrossfading = useRef(false);
  const playTrackByIdRef = useRef(null);
  const handleTrackEndedRef = useRef(null);

  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { crossfadeDurationRef.current = crossfadeDuration; }, [crossfadeDuration]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { activePlayerRef.current = activePlayer; }, [activePlayer]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  const ytContainerRef = useRef(null);

  // ─── Hook 1: HTML5 Audio Player & AudioContext ──────────────────────────────
  const {
    audioRef,
    standbyAudioRef,
    analyserNode,
    initAudioContext,
    audioCtxRef,
  } = useHtml5Player({
    volume,
    isCrossfadingRef: isCrossfading,
    setCurrentTime,
    setDuration,
    handleTrackEnded: () => handleTrackEndedRef.current?.(),
  });

  // ─── Hook 2: YouTube API Players ────────────────────────────────────────────
  const {
    ytPlayers,
    ytReady,
    pendingYtAction,
    activeYtIndex,
    playVideo,
    pauseVideo,
    loadVideo,
    seekVideo,
    setVolume: setYtVolume,
  } = useYoutubePlayer({
    user,
    isPlaying,
    isActivePlayer: activePlayer === 'youtube',
    isCrossfadingRef: isCrossfading,
    volumeRef,
    setDuration,
    setCurrentTime,
    handleTrackEnded: () => handleTrackEndedRef.current?.(),
    playTrackByIdRef,
    ytContainerRef,
  });

  // ─── Hook 3: Crossfade Transition Manager ────────────────────────────────────
  const { startCrossfade } = useCrossfade({
    isCrossfadingRef: isCrossfading,
    crossfadeDurationRef,
    volumeRef,
    activePlayerRef,
    setActivePlayer,
    audioRef,
    standbyAudioRef,
    ytPlayers,
    ytReady,
    activeYtIndex,
    setCurrentTrack,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    isRemoteActionRef: isRemoteAction,
    broadcastPlay: (trackId, startTime) => broadcastPlay(trackId, startTime),
  });

  // ─── Playback Controls (Orchestrated Wrapper Calls) ──────────────────────────

  /**
   * Pauses the currently active player (local only or broadcast).
   *
   * @param {boolean} [shouldBroadcast=true] - Whether to sync-broadcast pause.
   */
  const pauseLocalPlayback = useCallback((shouldBroadcast = true) => {
    setIsPlaying(false);
    const ap = activePlayerRef.current;
    if (ap === 'html5' && audioRef.current) {
      audioRef.current.pause();
    } else if (ap === 'youtube') {
      const activeYt = ytPlayers.current[activeYtIndex.current];
      if (ytReady.current[activeYtIndex.current] && activeYt?.pauseVideo) {
        activeYt.pauseVideo();
      }
    }
    if (shouldBroadcast && !isRemoteAction.current) {
      broadcastPause();
    }
  }, [audioRef, ytPlayers, ytReady, activeYtIndex]);

  /**
   * Plays a track by its queue database ID, setting up HTML5 or YouTube resources.
   *
   * @param {string} trackId - The queue ID of the track to play.
   * @param {number} [startTime=0] - Playback offset in seconds.
   */
  const playTrackById = useCallback(
    async (trackId, startTime = 0) => {
      const track = queueRef.current.find((t) => t.id === trackId);
      if (!track) return;

      let isAutoplayBlocked = false;
      pauseLocalPlayback(false);

      setCurrentTrack(track);
      setCurrentTime(startTime);
      setDuration(track.duration_seconds || 0);

      if (track.source === 'upload') {
        setActivePlayer('html5');
        if (audioRef.current) {
          initAudioContext();
          if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
          }

          audioRef.current.src = track.url;
          audioRef.current.currentTime = startTime;
          audioRef.current.volume = volumeRef.current;
          try {
            await audioRef.current.play();
            setIsPlaying(true);
            setIsListenAlongBlocked(false);
          } catch (err) {
            if (err.name === 'NotAllowedError') {
              console.warn('Autoplay blocked by browser policy (NotAllowedError).');
            } else {
              console.warn('HTML5 play() failed:', err);
            }
            isAutoplayBlocked = true;
            setIsPlaying(false);
            setIsListenAlongBlocked(true);
          }
        }
      } else if (track.source === 'youtube') {
        setActivePlayer('youtube');
        const ytPlayer = ytPlayers.current[activeYtIndex.current];
        const isReady = ytReady.current[activeYtIndex.current];

        if (isReady && ytPlayer?.loadVideoById) {
          try {
            ytPlayer.loadVideoById({ videoId: track.url, startSeconds: startTime });
            ytPlayer.setVolume(volumeRef.current * 100);
            ytPlayer.playVideo();
            setIsPlaying(true);
            setIsListenAlongBlocked(false);
          } catch (err) {
            console.warn('YouTube play failed:', err);
            isAutoplayBlocked = true;
            setIsPlaying(false);
            setIsListenAlongBlocked(true);
          }
        } else {
          console.log(`YouTube player ${activeYtIndex.current} not ready. Queuing play action.`);
          pendingYtAction.current = { trackId, startTime };
        }
      }

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist ?? 'Unknown Artist',
          artwork: track.artwork_url
            ? [{ src: track.artwork_url, sizes: '512x512', type: 'image/jpeg' }]
            : [],
        });
      }

      if (!isRemoteAction.current && !isAutoplayBlocked) {
        broadcastPlay(trackId, startTime);
      }
    },
    [initAudioContext, audioCtxRef, audioRef, ytPlayers, ytReady, activeYtIndex, pendingYtAction]
  );

  useEffect(() => {
    playTrackByIdRef.current = playTrackById;
  }, [playTrackById]);

  /**
   * Resumes local playback from the current track position.
   */
  const resumeLocalPlayback = useCallback(async () => {
    if (!currentTrackRef.current) return;

    let isAutoplayBlocked = false;
    const ap = activePlayerRef.current;

    if (ap === 'html5' && audioRef.current) {
      initAudioContext();
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsListenAlongBlocked(false);
      } catch (err) {
        console.warn('Resume play() failed:', err);
        isAutoplayBlocked = true;
        setIsListenAlongBlocked(true);
      }
    } else if (ap === 'youtube') {
      const isReady = ytReady.current[activeYtIndex.current];
      if (isReady) {
        try {
          ytPlayers.current[activeYtIndex.current]?.playVideo?.();
          setIsPlaying(true);
          setIsListenAlongBlocked(false);
        } catch (err) {
          console.warn('YouTube resume failed:', err);
          isAutoplayBlocked = true;
          setIsListenAlongBlocked(true);
        }
      } else {
        console.log(`YouTube player not ready for resume. Queuing play action.`);
        if (currentTrackRef.current) {
          pendingYtAction.current = { trackId: currentTrackRef.current.id, startTime: currentTimeRef.current };
        }
      }
    }

    if (!isRemoteAction.current && !isAutoplayBlocked && currentTrackRef.current) {
      broadcastPlay(currentTrackRef.current.id, currentTimeRef.current);
    }
  }, [initAudioContext, audioCtxRef, audioRef, ytPlayers, ytReady, activeYtIndex, pendingYtAction]);

  /**
   * Seeks the active player to a specific timestamp and syncs.
   *
   * @param {number} timestamp - Playback seek target in seconds.
   */
  const seekLocalPlayback = useCallback((timestamp) => {
    setCurrentTime(timestamp);
    const ap = activePlayerRef.current;
    if (ap === 'html5' && audioRef.current) {
      audioRef.current.currentTime = timestamp;
    } else if (ap === 'youtube') {
      const isReady = ytReady.current[activeYtIndex.current];
      if (isReady) {
        ytPlayers.current[activeYtIndex.current]?.seekTo?.(timestamp, true);
      } else if (pendingYtAction.current) {
        pendingYtAction.current.startTime = timestamp;
      }
    }
    if (!isRemoteAction.current) {
      broadcastSeek(timestamp);
    }
  }, [audioRef, ytPlayers, ytReady, activeYtIndex, pendingYtAction]);

  /**
   * Changes the output volume of the active player.
   *
   * @param {number} newVolume - Volume level from 0 to 1.
   */
  const changeVolume = useCallback((newVolume) => {
    setVolumeState(newVolume);
    if (activePlayerRef.current === 'html5' && audioRef.current) {
      audioRef.current.volume = newVolume;
    } else if (activePlayerRef.current === 'youtube') {
      const isReady = ytReady.current[activeYtIndex.current];
      if (isReady) {
        ytPlayers.current[activeYtIndex.current]?.setVolume?.(newVolume * 100);
      }
    }
  }, [audioRef, ytPlayers, ytReady, activeYtIndex]);

  /**
   * Transitions playback to the next track in the queue once current track ends.
   */
  const handleTrackEnded = useCallback(() => {
    const q = queueRef.current;
    const ct = currentTrackRef.current;
    if (!q.length || !ct) return;
    const idx = q.findIndex((t) => t.id === ct.id);
    if (idx !== -1 && idx < q.length - 1) {
      playTrackById(q[idx + 1].id, 0);
    } else {
      setIsPlaying(false);
      setCurrentTrack(null);
      setCurrentTime(0);
      setDuration(0);
      setActivePlayer('none');
    }
  }, [playTrackById]);

  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  }, [handleTrackEnded]);

  // ─── Hook 4: Database Queue CRUD & Subscriptions ───────────────────────────
  const {
    queue,
    setQueue,
    queueRef,
    fetchQueue,
    addToQueue,
    removeFromQueue,
    reorderQueue,
  } = useQueueDb({
    user,
    supabase,
    currentTrackRef,
    isCrossfadingRef: isCrossfading,
    playTrackById,
    pauseLocalPlayback,
    handleTrackEnded: () => handleTrackEndedRef.current?.(),
  });

  // ─── Hook 5: Real-Time Sync Event Handler ───────────────────────────────────

  const onRemotePlay = useCallback(
    async (trackId, timestamp) => {
      isRemoteAction.current = true;
      try {
        await playTrackById(trackId, timestamp);
      } finally {
        isRemoteAction.current = false;
      }
    },
    [playTrackById]
  );

  const onRemotePause = useCallback(() => {
    isRemoteAction.current = true;
    try {
      pauseLocalPlayback(false);
    } finally {
      isRemoteAction.current = false;
    }
  }, [pauseLocalPlayback]);

  const onRemoteSeek = useCallback(
    (timestamp) => {
      isRemoteAction.current = true;
      try {
        seekLocalPlayback(timestamp);
      } finally {
        isRemoteAction.current = false;
      }
    },
    [seekLocalPlayback]
  );

  const getCurrentTimeHelper = useCallback(() => {
    const ap = activePlayerRef.current;
    if (ap === 'html5' && audioRef.current) return audioRef.current.currentTime;
    if (ap === 'youtube') {
      const activeYt = ytPlayers.current[activeYtIndex.current];
      if (ytReady.current[activeYtIndex.current] && activeYt?.getCurrentTime) {
        return activeYt.getCurrentTime();
      }
      return currentTimeRef.current;
    }
    return currentTimeRef.current;
  }, [audioRef, ytPlayers, ytReady, activeYtIndex]);

  const { broadcastPlay, broadcastPause, broadcastSeek, broadcastHeartbeat } = useMusicSync({
    currentTrackId: currentTrack?.id || null,
    isPlaying,
    onRemotePlay,
    onRemotePause,
    onRemoteSeek,
    getCurrentTime: getCurrentTimeHelper,
  });

  // ─── Heartbeat Coordination ────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    const interval = setInterval(() => {
      if (isCrossfading.current) return;
      broadcastHeartbeat(currentTimeRef.current, true);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, broadcastHeartbeat]);

  // ─── OS Media Session Listeners ────────────────────────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    navigator.mediaSession.setActionHandler('play', resumeLocalPlayback);
    navigator.mediaSession.setActionHandler('pause', () => pauseLocalPlayback());
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      const q = queueRef.current;
      const idx = q.findIndex((t) => t.id === currentTrackRef.current?.id);
      if (idx !== -1 && idx < q.length - 1) playTrackById(q[idx + 1].id, 0);
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => seekLocalPlayback(0));
  }, [currentTrack, resumeLocalPlayback, pauseLocalPlayback, playTrackById, seekLocalPlayback]);

  // ─── Crossfade Monitor Loop ────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || isCrossfading.current || !currentTrack || duration <= 0) return;
    const remainingTime = duration - currentTime;
    const thresh = crossfadeDurationRef.current;
    if (remainingTime <= thresh && thresh > 0 && queueRef.current.length > 0) {
      const currentIndex = queueRef.current.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex !== -1 && currentIndex < queueRef.current.length - 1) {
        startCrossfade(queueRef.current[currentIndex + 1]);
      }
    }
  }, [currentTime, duration, isPlaying, currentTrack, startCrossfade]);

  const handleListenAlong = useCallback(() => {
    setIsListenAlongBlocked(false);
    resumeLocalPlayback();
  }, [resumeLocalPlayback]);

  const value = {
    queue,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    crossfadeDuration,
    activePlayer,
    isListenAlongBlocked,
    analyserNode,
    setCrossfadeDuration,
    playTrackById,
    pauseLocalPlayback,
    resumeLocalPlayback,
    seekLocalPlayback,
    changeVolume,
    handleListenAlong,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    ytReady,
    ytPlayers,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
      <div
        ref={ytContainerRef}
        aria-hidden="true"
        style={{
          visibility: 'hidden',
          width: 0,
          height: 0,
          overflow: 'hidden',
          position: 'absolute',
        }}
      >
        <div id="yt-player-0" />
        <div id="yt-player-1" />
      </div>
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within a MusicProvider');
  return context;
};
