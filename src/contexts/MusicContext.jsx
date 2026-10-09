/* eslint-disable react-hooks/immutability */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { useAppContext, useAppDispatch } from './AppContext';
import { useMusicSync } from '../features/music/hooks/useMusicSync';
import { useLibraryDb } from '../features/music/hooks/useLibraryDb';
import { useActiveQueueDb } from '../features/music/hooks/useActiveQueueDb';
import { useHtml5Player } from '../features/music/hooks/useHtml5Player';
import { useYoutubePlayer } from '../features/music/hooks/useYoutubePlayer';
import { useCrossfade } from '../features/music/hooks/useCrossfade';
import { useColorExtractor } from '../features/music/hooks/useColorExtractor';
import {
  getTrackArtwork,
  getProxiedUrl,
  findQueueTrackIndex,
  fetchTrackMetadataArtwork,
  resolveYouTubeThumbnail,
} from '../features/music/lib/musicUtils';

const MusicContext = createContext(null);

/**
 * @description Global Music Player Context Provider.
 * Orchestrates decomposed hooks for queue database sync, HTML5 media elements,
 * YouTube player instances, crossfading transitions, and real-time partner sync.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child nodes to be wrapped by the provider.
 * @returns {React.ReactElement} The Context Provider element.
 */
export function MusicProvider({ children }) {
  const supabase = useSupabase();
  const { user } = useAppContext();
  const appDispatch = useAppDispatch();

  // ─── Orchestrated Playback States ──────────────────────────────────────────
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [crossfadeDuration, setCrossfadeDurationState] = useState(() => {
    if (typeof window === 'undefined') return 3;
    const saved = localStorage.getItem('music_crossfade_duration');
    return saved !== null ? parseInt(saved, 10) : 3;
  });

  // ─── Issue #61 & #268 Preferences ──────────────────────────────────────────
  const [libraryTapMode, setLibraryTapModeState] = useState(() => {
    if (typeof window === 'undefined') return 'append';
    return localStorage.getItem('music_library_tap_mode') || 'append';
  });

  const setLibraryTapMode = useCallback((mode) => {
    setLibraryTapModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('music_library_tap_mode', mode);
      window.dispatchEvent(
        new CustomEvent('preference_change', {
          detail: { key: 'music_library_tap_mode', value: mode },
        })
      );
    }
  }, []);

  const [queueLoopMode, setQueueLoopModeState] = useState(() => {
    if (typeof window === 'undefined') return 'off';
    return localStorage.getItem('music_queue_loop_mode') || 'off';
  });

  const setQueueLoopMode = useCallback((mode) => {
    setQueueLoopModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('music_queue_loop_mode', mode);
      window.dispatchEvent(
        new CustomEvent('preference_change', {
          detail: { key: 'music_queue_loop_mode', value: mode },
        })
      );
    }
  }, []);

  const [backgroundKeepAlive, setBackgroundKeepAliveState] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('music_background_keepalive') !== 'false';
  });

  const setBackgroundKeepAlive = useCallback((enabled) => {
    setBackgroundKeepAliveState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('music_background_keepalive', enabled ? 'true' : 'false');
      window.dispatchEvent(
        new CustomEvent('preference_change', {
          detail: { key: 'music_background_keepalive', value: enabled },
        })
      );
    }
  }, []);

  const [streamErrorAction, setStreamErrorActionState] = useState(() => {
    if (typeof window === 'undefined') return 'auto_skip';
    return localStorage.getItem('music_stream_error_action') || 'auto_skip';
  });

  const setStreamErrorAction = useCallback((action) => {
    setStreamErrorActionState(action);
    if (typeof window !== 'undefined') {
      localStorage.setItem('music_stream_error_action', action);
      window.dispatchEvent(
        new CustomEvent('preference_change', {
          detail: { key: 'music_stream_error_action', value: action },
        })
      );
    }
  }, []);

  // ─── New UI State (Issue #61) ──────────────────────────────────────────────
  /** @type {'liquid'|'wave'|'vinyl'|'ring'} */
  const [visualizerMode, setVisualizerModeState] = useState(() => {
    if (typeof window === 'undefined') return 'liquid';
    return localStorage.getItem('music_visualizer_mode') || 'liquid';
  });

  const [fallbackBackdrop, setFallbackBackdropState] = useState(() => {
    if (typeof window === 'undefined') return '/backdrops/backdrop-1.png';
    return localStorage.getItem('music_fallback_backdrop') || '/backdrops/backdrop-1.png';
  });

  /**
   * Updates and persists the fallback backdrop wallpaper preference.
   *
   * @param {string} path - The path to the backdrop image.
   */
  const setFallbackBackdrop = useCallback((path) => {
    setFallbackBackdropState(path);
    if (typeof window !== 'undefined') {
      localStorage.setItem('music_fallback_backdrop', path);
      window.dispatchEvent(
        new CustomEvent('preference_change', {
          detail: { key: 'music_fallback_backdrop', value: path },
        })
      );
    }
  }, []);

  /**
   * Updates and persists the visualizer mode preference.
   *
   * @param {'liquid'|'wave'|'vinyl'} mode - The visualizer type to activate.
   */
  const setVisualizerMode = useCallback((mode) => {
    setVisualizerModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('music_visualizer_mode', mode);
    }
  }, []);

  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const setCrossfadeDuration = useCallback((val) => {
    const numVal = typeof val === 'function' ? val(crossfadeDurationRef.current) : val;
    setCrossfadeDurationState(numVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('music_crossfade_duration', numVal.toString());
      window.dispatchEvent(
        new CustomEvent('preference_change', {
          detail: { key: 'music_crossfade_duration', value: numVal.toString() },
        })
      );
    }
  }, []);
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

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);
  useEffect(() => {
    crossfadeDurationRef.current = crossfadeDuration;
  }, [crossfadeDuration]);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);
  useEffect(() => {
    activePlayerRef.current = activePlayer;
  }, [activePlayer]);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const ytContainerRef = useRef(null);

  // ─── Hook 1: HTML5 Audio Player & AudioContext ──────────────────────────────
  const {
    audioRef,
    standbyAudioRef,
    analyserNode,
    workletNode,
    initAudioContext,
    audioCtxRef,
    preparePlayer,
    swapAudioPlayers,
    connectElementToContext,
  } = useHtml5Player({
    volume,
    isActivePlayer: activePlayer === 'html5',
    isCrossfadingRef: isCrossfading,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    handleTrackEnded: () => handleTrackEndedRef.current?.(),
  });

  const handlePlayerErrorRef = useRef(null);
  const queueLoopModeRef = useRef(queueLoopMode);
  const streamErrorActionRef = useRef(streamErrorAction);

  useEffect(() => {
    queueLoopModeRef.current = queueLoopMode;
  }, [queueLoopMode]);
  useEffect(() => {
    streamErrorActionRef.current = streamErrorAction;
  }, [streamErrorAction]);

  // ─── Hook 2: YouTube API Players ────────────────────────────────────────────
  const { ytPlayers, ytReady, pendingYtAction, activeYtIndex } = useYoutubePlayer({
    user,
    isPlaying,
    isActivePlayer: activePlayer === 'youtube',
    isCrossfadingRef: isCrossfading,
    volumeRef,
    setDuration,
    setCurrentTime,
    setIsPlaying,
    handleTrackEnded: () => handleTrackEndedRef.current?.(),
    onPlayerError: (code, idx) => handlePlayerErrorRef.current?.(code, idx),
    playTrackByIdRef,
    ytContainerRef,
  });

  // ─── Hook 3: Crossfade Transition Manager ────────────────────────────────────
  const { startCrossfade, cancelCrossfade, finalizeCrossfadeImmediately } = useCrossfade({
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
    preparePlayer,
    swapAudioPlayers,
    initAudioContext,
    audioCtxRef,
    connectElementToContext,
  });

  // ─── Playback Controls (Orchestrated Wrapper Calls) ──────────────────────────

  /**
   * Pauses the currently active player (local only or broadcast).
   *
   * @param {boolean} [shouldBroadcast=true] - Whether to sync-broadcast pause.
   * @returns {void}
   */
  // pendingYtAction is a mutable ref object passed into hook orchestrators.

  const pauseLocalPlayback = useCallback(
    (shouldBroadcast = true) => {
      if (isCrossfading.current) {
        finalizeCrossfadeImmediately();
      }
      setIsPlaying(false);
      if (pendingYtAction.current) {
        pendingYtAction.current.startPaused = true;
      }
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
    },
    [finalizeCrossfadeImmediately, audioRef, ytPlayers, ytReady, activeYtIndex, pendingYtAction]
  );

  const handlePlayerError = useCallback(
    (errorCode, _playerIndex) => {
      let userReason = 'Unable to stream this YouTube track.';
      if (errorCode === 100) {
        userReason = 'This track is no longer available on YouTube.';
      } else if (errorCode === 101 || errorCode === 150) {
        userReason = 'The owner of this track restricts embedded playback.';
      } else if (errorCode === 2) {
        userReason = 'Invalid YouTube track parameters.';
      }

      const shouldAutoSkip = streamErrorActionRef.current === 'auto_skip';
      const notice = shouldAutoSkip
        ? `${userReason} Skipping to next track...`
        : `${userReason} Playback paused.`;

      appDispatch?.({
        type: 'SET_GLOBAL_NOTIFICATION',
        payload: { message: notice, type: 'warning' },
      });

      if (shouldAutoSkip) {
        setTimeout(() => {
          handleTrackEndedRef.current?.();
        }, 800);
      } else {
        pauseLocalPlayback(false);
      }
    },
    [appDispatch, pauseLocalPlayback]
  );

  useEffect(() => {
    handlePlayerErrorRef.current = handlePlayerError;
  }, [handlePlayerError]);

  /**
   * Plays a track by its queue database ID, setting up HTML5 or YouTube resources.
   *
   * @param {string} trackId - The queue ID of the track to play.
   * @param {number} [startTime=0] - Playback offset in seconds.
   * @param {boolean} [startPaused=false] - Whether to load without playing immediately.
   * @returns {Promise<void>}
   */
  // pendingYtAction is a mutable ref; broadcastPlay and queueRef are forward references.

  const playTrackById = useCallback(
    async (trackId, startTime = 0, startPaused = false) => {
      cancelCrossfade();
      const track =
        queueRef.current.find((t) => t.queue_row_id && t.queue_row_id === trackId) ||
        queueRef.current.find((t) => t.id === trackId);
      if (!track) return;

      let isAutoplayBlocked = false;
      pauseLocalPlayback(false);

      setCurrentTrack(track);
      setCurrentTime(startTime);
      setDuration(track.duration_seconds || 0);

      if (track.source === 'upload') {
        setActivePlayer('html5');
        const player = preparePlayer(true, true);
        if (player) {
          initAudioContext();
          if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
          }

          player.src = getProxiedUrl(track.url);
          player.currentTime = startTime;
          player.volume = volumeRef.current;
          if (!startPaused) {
            try {
              await player.play();
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
          } else {
            setIsPlaying(false);
          }
        }
      } else if (track.source === 'youtube') {
        setActivePlayer('youtube');
        const ytPlayer = ytPlayers.current[activeYtIndex.current];
        const isReady = ytReady.current[activeYtIndex.current];

        if (isReady && ytPlayer?.cueVideoById) {
          try {
            if (startPaused) {
              ytPlayer.cueVideoById({ videoId: track.url, startSeconds: startTime });
              ytPlayer.setVolume(volumeRef.current * 100);
              setIsPlaying(false);
            } else {
              ytPlayer.loadVideoById({ videoId: track.url, startSeconds: startTime });
              ytPlayer.setVolume(volumeRef.current * 100);
              ytPlayer.playVideo();
              setIsPlaying(true);
            }
            setIsListenAlongBlocked(false);
          } catch (err) {
            console.warn('YouTube play failed:', err);
            isAutoplayBlocked = true;
            setIsPlaying(false);
            setIsListenAlongBlocked(true);
          }
        } else {
          console.log(`YouTube player ${activeYtIndex.current} not ready. Queuing play action.`);
          pendingYtAction.current = { trackId, startTime, startPaused };
        }
      }

      if ('mediaSession' in navigator) {
        const resolvedArtwork = getTrackArtwork(track);
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist ?? 'Unknown Artist',
          artwork: resolvedArtwork
            ? [{ src: resolvedArtwork, sizes: '512x512', type: 'image/jpeg' }]
            : [],
        });
      }

      if (!isRemoteAction.current && !isAutoplayBlocked && !startPaused) {
        broadcastPlay(trackId, startTime);
      }
    },
    [
      cancelCrossfade,
      pauseLocalPlayback,
      initAudioContext,
      audioCtxRef,
      audioRef,
      ytPlayers,
      ytReady,
      activeYtIndex,
      pendingYtAction,
    ]
  );

  useEffect(() => {
    playTrackByIdRef.current = playTrackById;
  }, [playTrackById]);

  /**
   * Resumes local playback from the current track position.
   *
   * @returns {Promise<void>}
   */
  // pendingYtAction is a mutable ref; broadcastPlay is a lazy-captured forward reference.

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
          pendingYtAction.current = {
            trackId: currentTrackRef.current.id,
            startTime: currentTimeRef.current,
          };
        }
      }
    }

    if (!isRemoteAction.current && !isAutoplayBlocked && currentTrackRef.current) {
      broadcastPlay(
        currentTrackRef.current.queue_row_id || currentTrackRef.current.id,
        currentTimeRef.current
      );
    }
  }, [initAudioContext, audioCtxRef, audioRef, ytPlayers, ytReady, activeYtIndex, pendingYtAction]);

  /**
   * Seeks the active player to a specific timestamp and syncs.
   *
   * @param {number} timestamp - Playback seek target in seconds.
   * @returns {void}
   */
  // pendingYtAction is a mutable ref object used to queue seek target offsets.

  const seekLocalPlayback = useCallback(
    (timestamp) => {
      if (isCrossfading.current) {
        finalizeCrossfadeImmediately();
      }
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
    },
    [finalizeCrossfadeImmediately, audioRef, ytPlayers, ytReady, activeYtIndex, pendingYtAction]
  );

  /**
   * Changes the output volume of the active player.
   *
   * @param {number} newVolume - Volume level from 0 to 1.
   * @returns {void}
   */
  const changeVolume = useCallback(
    (newVolume) => {
      setVolumeState(newVolume);
      if (activePlayerRef.current === 'html5' && audioRef.current) {
        audioRef.current.volume = newVolume;
      } else if (activePlayerRef.current === 'youtube') {
        const isReady = ytReady.current[activeYtIndex.current];
        if (isReady) {
          ytPlayers.current[activeYtIndex.current]?.setVolume?.(newVolume * 100);
        }
      }
    },
    [audioRef, ytPlayers, ytReady, activeYtIndex]
  );

  /**
   * Transitions playback to the next track in the queue once current track ends.
   *
   * @returns {void}
   */
  // queueRef is a stable mutable ref; playTrackById indirectly touches pendingYtAction.

  const handleTrackEnded = useCallback(() => {
    const q = queueRef.current;
    const ct = currentTrackRef.current;
    if (!q.length || !ct) return;

    const loopMode = queueLoopModeRef.current;
    if (loopMode === 'one') {
      playTrackById(ct.queue_row_id || ct.id, 0);
      return;
    }

    const idx = findQueueTrackIndex(q, ct);
    if (idx !== -1 && idx < q.length - 1) {
      const nextTrack = q[idx + 1];
      playTrackById(nextTrack.queue_row_id || nextTrack.id, 0);
    } else if (loopMode === 'all' && q.length > 0) {
      const firstTrack = q[0];
      playTrackById(firstTrack.queue_row_id || firstTrack.id, 0);
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

  // ─── Hook 4a: Library Database CRUD ─────────────────────────────────────
  const { library, addToLibrary, removeFromLibrary, updateTrackArtwork } = useLibraryDb();

  // ─── Hook 4b: Active Queue Session CRUD & Subscriptions ─────────────────
  const {
    queue,
    queueRef,
    playlists,
    injectTrackIntoQueue,
    removeFromActiveQueue,
    reorderQueue,
    clearQueue,
    saveQueueAsPlaylist,
    loadPlaylist,
  } = useActiveQueueDb({
    supabase,
    currentTrackRef,
    isCrossfadingRef: isCrossfading,
    playTrackById,
    pauseLocalPlayback,
    handleTrackEnded: () => handleTrackEndedRef.current?.(),
  });

  // Backwards-compat alias so playTrackById can still look up tracks in queue
  const addToQueue = addToLibrary;

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

  // ─── Accent Color Extraction ───────────────────────────────────────────
  // Tier 2: Now Playing face accent color is derived from the active visual backdrop
  // (the track's artwork, or the user's chosen fallback wallpaper when artwork is absent).
  const artworkUrl = currentTrack ? getTrackArtwork(currentTrack) : null;
  const activeVisualImage = artworkUrl || fallbackBackdrop || '/backdrops/backdrop-1.png';
  const { accentColor: extractedAccent } = useColorExtractor(activeVisualImage);

  // If extraction fails entirely, fall back to global theme primary token
  const accentColor = extractedAccent || 'rgb(var(--primary))';

  // ─── Lazy Artwork Resolution for Legacy / Unresolved Tracks ────────────────
  useEffect(() => {
    if (!currentTrack || currentTrack.artwork_url || currentTrack.source !== 'youtube') return;
    let isCancelled = false;

    async function enhanceArtwork() {
      try {
        const squareArtwork = await fetchTrackMetadataArtwork(
          currentTrack.title,
          currentTrack.artist
        );
        if (isCancelled) return;
        const targetArtwork =
          squareArtwork ||
          (await resolveYouTubeThumbnail(currentTrack.youtube_id || currentTrack.url));

        if (targetArtwork && !isCancelled && currentTrack.id && updateTrackArtwork) {
          updateTrackArtwork(currentTrack.id, targetArtwork);
        }
      } catch (err) {
        console.warn('[MusicContext] Lazy artwork enhancement error:', err);
      }
    }

    enhanceArtwork();
    return () => {
      isCancelled = true;
    };
  }, [
    currentTrack?.id,
    currentTrack?.artwork_url,
    currentTrack?.source,
    currentTrack?.title,
    currentTrack?.artist,
    currentTrack?.youtube_id,
    currentTrack?.url,
    updateTrackArtwork,
  ]);

  // ─── Heartbeat Coordination ────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    const interval = setInterval(() => {
      if (isCrossfading.current) return;
      broadcastHeartbeat(currentTimeRef.current, true);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, broadcastHeartbeat]);

  // ─── OS Media Session Listeners & Synchronization (Issue #268) ────────────
  // Handlers read live values via currentTrackRef/queueRef; adding queueRef causes unnecessary re-registration.

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    navigator.mediaSession.setActionHandler('play', resumeLocalPlayback);
    navigator.mediaSession.setActionHandler('pause', () => pauseLocalPlayback());
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      const q = queueRef.current;
      const ct = currentTrackRef.current;
      const idx = findQueueTrackIndex(q, ct);
      if (idx !== -1 && idx < q.length - 1) {
        const nextTrack = q[idx + 1];
        playTrackById(nextTrack.queue_row_id || nextTrack.id, 0);
      } else if (queueLoopModeRef.current === 'all' && q.length > 0) {
        const firstTrack = q[0];
        playTrackById(firstTrack.queue_row_id || firstTrack.id, 0);
      }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const q = queueRef.current;
      const ct = currentTrackRef.current;
      if (!ct || !q.length) return;
      if (currentTimeRef.current > 3) {
        seekLocalPlayback(0);
        return;
      }
      const idx = findQueueTrackIndex(q, ct);
      if (idx > 0) {
        const prevTrack = q[idx - 1];
        playTrackById(prevTrack.queue_row_id || prevTrack.id, 0);
      } else {
        seekLocalPlayback(0);
      }
    });
  }, [currentTrack, resumeLocalPlayback, pauseLocalPlayback, playTrackById, seekLocalPlayback]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // ─── Reactive MediaSession Metadata Sync (Issue #268) ──────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    const resolvedArtwork = getTrackArtwork(currentTrack);
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist || 'Unknown Artist',
        artwork: resolvedArtwork
          ? [{ src: resolvedArtwork, sizes: '512x512', type: 'image/jpeg' }]
          : [],
      });
    } catch (e) {
      console.warn('[MusicContext] Failed to update mediaSession metadata:', e);
    }
  }, [currentTrack]);

  // ─── Reactive MediaSession Position State Sync (Issue #268) ───────────────
  const lastPositionSyncRef = useRef(0);
  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
    if (!currentTrack || duration <= 0) return;
    const now = Date.now();
    if (now - lastPositionSyncRef.current < 1000) return;
    lastPositionSyncRef.current = now;
    try {
      const pos = Math.min(Math.max(0, currentTime), duration);
      navigator.mediaSession.setPositionState({
        duration: Math.max(1, duration),
        playbackRate: isPlaying ? 1 : 0,
        position: pos,
      });
    } catch {
      // Safe fallback if duration or position values are momentarily indeterminate
    }
  }, [currentTime, duration, isPlaying, currentTrack]);

  // ─── Background Playback Keep-Alive & Screen WakeLock (Issue #268) ────────
  useEffect(() => {
    if (!backgroundKeepAlive || !isPlaying) return;
    let wakeLockSentinel = null;

    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator && navigator.wakeLock.request) {
          wakeLockSentinel = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Safe fallback if WakeLock request is disallowed or unsupported
      }
    }

    requestWakeLock();

    return () => {
      if (wakeLockSentinel && !wakeLockSentinel.released) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [backgroundKeepAlive, isPlaying]);

  // ─── Crossfade Monitor Loop ────────────────────────────────────────────────
  // Reads live values via queueRef/crossfadeDurationRef; adding queueRef causes infinite loops or stale closures.

  useEffect(() => {
    if (!isPlaying || isCrossfading.current || !currentTrack || duration <= 0) return;
    const remainingTime = duration - currentTime;
    const thresh = crossfadeDurationRef.current;
    if (remainingTime <= thresh && thresh > 0 && queueRef.current.length > 0) {
      const currentIndex = findQueueTrackIndex(queueRef.current, currentTrack);
      if (currentIndex !== -1 && currentIndex < queueRef.current.length - 1) {
        startCrossfade(queueRef.current[currentIndex + 1]);
      }
    }
  }, [currentTime, duration, isPlaying, currentTrack, startCrossfade]);

  const handleListenAlong = useCallback(() => {
    setIsListenAlongBlocked(false);
    resumeLocalPlayback();
  }, [resumeLocalPlayback]);

  const value = useMemo(
    () => ({
      // Library
      library,
      addToLibrary,
      removeFromLibrary,
      // Active queue
      queue,
      injectTrackIntoQueue,
      removeFromActiveQueue,
      reorderQueue,
      clearQueue,
      // Backwards compat alias for AddTrackModal which calls addToQueue
      addToQueue,
      // Playlists
      playlists,
      saveQueueAsPlaylist,
      loadPlaylist,
      // Playback
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      crossfadeDuration,
      activePlayer,
      isListenAlongBlocked,
      analyserNode,
      workletNode,
      // New Issue #61 state
      visualizerMode,
      setVisualizerMode,
      fallbackBackdrop,
      setFallbackBackdrop,
      accentColor,
      isCardFlipped,
      setIsCardFlipped,
      // Preferences (Issues #61 & #268)
      libraryTapMode,
      setLibraryTapMode,
      queueLoopMode,
      setQueueLoopMode,
      backgroundKeepAlive,
      setBackgroundKeepAlive,
      streamErrorAction,
      setStreamErrorAction,
      // Controls
      setCrossfadeDuration,
      cancelCrossfade,
      finalizeCrossfadeImmediately,
      playTrackById,
      pauseLocalPlayback,
      resumeLocalPlayback,
      seekLocalPlayback,
      changeVolume,
      handleListenAlong,
      ytReady,
      ytPlayers,
      preparePlayer,
      updateTrackArtwork,
    }),
    [
      library,
      addToLibrary,
      removeFromLibrary,
      updateTrackArtwork,
      queue,
      injectTrackIntoQueue,
      removeFromActiveQueue,
      reorderQueue,
      clearQueue,
      addToQueue,
      playlists,
      saveQueueAsPlaylist,
      loadPlaylist,
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      crossfadeDuration,
      activePlayer,
      isListenAlongBlocked,
      analyserNode,
      workletNode,
      visualizerMode,
      setVisualizerMode,
      fallbackBackdrop,
      setFallbackBackdrop,
      accentColor,
      isCardFlipped,
      setIsCardFlipped,
      libraryTapMode,
      setLibraryTapMode,
      queueLoopMode,
      setQueueLoopMode,
      backgroundKeepAlive,
      setBackgroundKeepAlive,
      streamErrorAction,
      setStreamErrorAction,
      setCrossfadeDuration,
      cancelCrossfade,
      finalizeCrossfadeImmediately,
      playTrackById,
      pauseLocalPlayback,
      resumeLocalPlayback,
      seekLocalPlayback,
      changeVolume,
      handleListenAlong,
      ytReady,
      ytPlayers,
      preparePlayer,
    ]
  );

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

/**
 * @description Consumes the MusicContext. Must be used inside a {@link MusicProvider}.
 * Throws an error if called outside the provider tree.
 *
 * @returns {{
 *   queue: Array<object>,
 *   currentTrack: object|null,
 *   isPlaying: boolean,
 *   currentTime: number,
 *   duration: number,
 *   volume: number,
 *   crossfadeDuration: number,
 *   activePlayer: 'html5'|'youtube'|'none',
 *   isListenAlongBlocked: boolean,
 *   analyserNode: AnalyserNode|null,
 *   visualizerMode: 'liquid'|'wave'|'vinyl'|'ring',
 *   setVisualizerMode: (mode: 'liquid'|'wave'|'vinyl'|'ring') => void,
 *   fallbackBackdrop: string,
 *   setFallbackBackdrop: (path: string) => void,
 *   isCardFlipped: boolean,
 *   setIsCardFlipped: React.Dispatch<React.SetStateAction<boolean>>,
 *   libraryTapMode: 'append'|'override',
 *   setLibraryTapMode: (mode: 'append'|'override') => void,
 *   queueLoopMode: 'off'|'all'|'one',
 *   setQueueLoopMode: (mode: 'off'|'all'|'one') => void,
 *   backgroundKeepAlive: boolean,
 *   setBackgroundKeepAlive: (enabled: boolean) => void,
 *   streamErrorAction: 'auto_skip'|'pause',
 *   setStreamErrorAction: (action: 'auto_skip'|'pause') => void,
 *   setCrossfadeDuration: React.Dispatch<React.SetStateAction<number>>,
 *   cancelCrossfade: () => void,
 *   finalizeCrossfadeImmediately: () => void,
 *   playTrackById: (trackId: string, startTime?: number, startPaused?: boolean) => Promise<void>,
 *   pauseLocalPlayback: (shouldBroadcast?: boolean) => void,
 *   resumeLocalPlayback: () => Promise<void>,
 *   seekLocalPlayback: (timestamp: number) => void,
 *   changeVolume: (newVolume: number) => void,
 *   handleListenAlong: () => void,
 *   addToQueue: Function,
 *   removeFromQueue: Function,
 *   reorderQueue: Function,
 *   ytReady: React.MutableRefObject<boolean[]>,
 *   ytPlayers: React.MutableRefObject<object[]>,
 *   preparePlayer: Function,
 * }} The full music player context value.
 */
export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within a MusicProvider');
  return context;
};
