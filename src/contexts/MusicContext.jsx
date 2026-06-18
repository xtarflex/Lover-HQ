import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { useAppContext } from './AppContext';
import { useMusicSync } from '../features/music/hooks/useMusicSync';

const MusicContext = createContext(null);

/**
 * Loads the YouTube IFrame API script exactly once per page session.
 * Guards against duplicate script injection during Vite HMR reloads.
 *
 * @returns {Promise<typeof window.YT>} Resolves with the YT namespace when ready.
 */
let ytApiPromise = null;
const loadYoutubeApi = () => {
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      resolve(window.YT);
    };

    // HMR guard: only inject if the script isn't already present
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  });

  return ytApiPromise;
};

/**
 * Global Music Player Context Provider.
 * Manages the shared playback state, playlist queue, HTML5/YouTube players,
 * real-time synchronization, Web Audio API analysis, and track crossfading.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {React.ReactElement} The Context Provider.
 */
export function MusicProvider({ children }) {
  const supabase = useSupabase();
  const { user } = useAppContext();

  // ─── Core playback state ────────────────────────────────────────────────────
  const [queue, setQueue] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [crossfadeDuration, setCrossfadeDuration] = useState(3);
  const [activePlayer, setActivePlayer] = useState('none'); // 'html5' | 'youtube' | 'none'
  const [isListenAlongBlocked, setIsListenAlongBlocked] = useState(false);

  // ─── Audio element refs ─────────────────────────────────────────────────────
  const audioRef = useRef(null);
  const standbyAudioRef = useRef(null);

  // ─── YouTube player refs (fixed indices — never swapped) ────────────────────
  const ytPlayers = useRef([null, null]); // [primary, standby]
  const activeYtIndex = useRef(0); // which index is the "active" player
  // JSX-rendered hidden container ref (avoids direct DOM mutation anti-pattern)
  const ytContainerRef = useRef(null);

  // ─── Web Audio API refs ─────────────────────────────────────────────────────
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const [analyserNode, setAnalyserNode] = useState(null);

  // ─── Sync / guard refs ──────────────────────────────────────────────────────
  const isRemoteAction = useRef(false);
  const isCrossfading = useRef(false);
  const crossfadeIntervalRef = useRef(null);

  // ─── Derived refs (always current, avoid stale closures) ───────────────────
  const volumeRef = useRef(volume);
  const crossfadeDurationRef = useRef(crossfadeDuration);
  const queueRef = useRef(queue);
  const currentTrackRef = useRef(currentTrack);
  const activePlayerRef = useRef(activePlayer); // fix #2/#3: read in intervals
  const currentTimeRef = useRef(currentTime); // fix #9: heartbeat ref

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);
  useEffect(() => {
    crossfadeDurationRef.current = crossfadeDuration;
  }, [crossfadeDuration]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);
  useEffect(() => {
    activePlayerRef.current = activePlayer;
  }, [activePlayer]);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // ─── Initialise HTML5 audio elements ───────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const standbyAudio = new Audio();
    standbyAudio.volume = 0;
    standbyAudioRef.current = standbyAudio;

    const handleTimeUpdate = () => {
      if (isCrossfading.current) return;
      setCurrentTime(audio.currentTime);
    };
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      if (isCrossfading.current) return;
      handleTrackEnded();
    };
    const handleError = (e) => {
      console.error('HTML5 audio element error:', e);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      standbyAudio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Cleanup crossfade interval on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
      }
    };
  }, []);

  // ─── Lazy-init Web Audio API on first HTML5 play ────────────────────────────
  /**
   * Initialises or resumes the AudioContext and connects the primary HTML5
   * audio element to an AnalyserNode for real-time frequency visualisation.
   * Must be called inside a user-gesture handler to satisfy browser autoplay policy.
   */
  const initAudioContext = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    const source = ctx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    sourceNodeRef.current = source;
    setAnalyserNode(analyser);
  }, []);

  // ─── Initialise YouTube players (via JSX-rendered container ref) ─────────────
  useEffect(() => {
    if (!user || !user.partner_id) return;

    loadYoutubeApi().then((YT) => {
      const container = ytContainerRef.current;
      if (!container) return;

      const makePlayer = (divId, indexRef) => {
        const idx = indexRef;
        return new YT.Player(divId, {
          height: '1',
          width: '1',
          videoId: '',
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onStateChange: (event) => {
              // Only respond to events from the currently-active player index
              if (idx !== activeYtIndex.current) return;
              if (event.data === 1) {
                setDuration(ytPlayers.current[activeYtIndex.current]?.getDuration() || 0);
              } else if (event.data === 0) {
                if (!isCrossfading.current) handleTrackEnded();
              }
            },
          },
        });
      };

      ytPlayers.current[0] = makePlayer('yt-player-0', 0);
      ytPlayers.current[1] = makePlayer('yt-player-1', 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── YouTube time polling ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || activePlayer !== 'youtube') return;
    const interval = setInterval(() => {
      if (isCrossfading.current) return;
      const ytPlayer = ytPlayers.current[activeYtIndex.current];
      if (ytPlayer?.getPlayerState && ytPlayer.getPlayerState() === 3) return; // buffering
      const time = ytPlayer?.getCurrentTime?.() ?? 0;
      setCurrentTime(time);
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, activePlayer]);

  // ─── Core playback helpers ──────────────────────────────────────────────────

  /**
   * Pauses the currently-active player. Reads activePlayerRef to avoid stale
   * closure issues inside crossfade setInterval callbacks (fix #2/#3).
   *
   * @param {boolean} [shouldBroadcast=true] - Whether to broadcast the pause event.
   */
  const pauseLocalPlayback = useCallback((shouldBroadcast = true) => {
    setIsPlaying(false);
    const ap = activePlayerRef.current;
    if (ap === 'html5' && audioRef.current) {
      audioRef.current.pause();
    } else if (ap === 'youtube') {
      ytPlayers.current[activeYtIndex.current]?.pauseVideo?.();
    }
    if (shouldBroadcast && !isRemoteAction.current) {
      broadcastPause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Plays a track by its queue ID, setting up the appropriate player source.
   * Lazy-inits the Web Audio API AnalyserNode on the first HTML5 play.
   *
   * @param {string} trackId - The queue item ID to play.
   * @param {number} [startTime=0] - Position in seconds to start from.
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
          // Lazy-init Web Audio API on first user-gesture-triggered play
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
        if (ytPlayer?.loadVideoById) {
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
        }
      }

      // Update Media Session API (fix #31)
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
    [initAudioContext, pauseLocalPlayback]
  );

  /**
   * Resumes local playback from the current position.
   */
  const resumeLocalPlayback = useCallback(async () => {
    if (!currentTrackRef.current) return;

    let isAutoplayBlocked = false;
    const ap = activePlayerRef.current;

    if (ap === 'html5' && audioRef.current) {
      initAudioContext();
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
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
      try {
        ytPlayers.current[activeYtIndex.current]?.playVideo?.();
        setIsPlaying(true);
        setIsListenAlongBlocked(false);
      } catch (err) {
        console.warn('YouTube resume failed:', err);
        isAutoplayBlocked = true;
        setIsListenAlongBlocked(true);
      }
    }

    if (!isRemoteAction.current && !isAutoplayBlocked && currentTrackRef.current) {
      broadcastPlay(currentTrackRef.current.id, currentTimeRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initAudioContext]);

  /**
   * Seeks both the local player and broadcasts the timestamp.
   *
   * @param {number} timestamp - The target position in seconds.
   */
  const seekLocalPlayback = useCallback((timestamp) => {
    setCurrentTime(timestamp);
    const ap = activePlayerRef.current;
    if (ap === 'html5' && audioRef.current) {
      audioRef.current.currentTime = timestamp;
    } else if (ap === 'youtube') {
      ytPlayers.current[activeYtIndex.current]?.seekTo?.(timestamp, true);
    }
    if (!isRemoteAction.current) broadcastSeek(timestamp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Queue CRUD & subscription ──────────────────────────────────────────────

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
      if (!currentTrackRef.current && !isCrossfading.current && tracks.length > 0) {
        playTrackById(tracks[0].id, 0);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  }, [user, supabase, playTrackById]);

  // ─── Queue subscription with debounce ──────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !user?.partner_id) return;

    fetchQueue();

    // fix #14: debounce realtime events to avoid parallel fetches on bulk reorders
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
          // If addedBy is missing (e.g. DELETE payload with DEFAULT replica identity), we trigger sync.
          // If addedBy is present, only trigger if it belongs to this couple.
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

  // ─── Remote sync callbacks (stable via useCallback — fix #10) ───────────────

  /** @type {(trackId: string, timestamp: number) => Promise<void>} */
  const onRemotePlay = useCallback(
    async (trackId, timestamp) => {
      // fix #1: await the async play before resetting the flag to prevent broadcast loops
      isRemoteAction.current = true;
      try {
        await playTrackById(trackId, timestamp);
      } finally {
        isRemoteAction.current = false;
      }
    },
    [playTrackById]
  );

  /** @type {() => void} */
  const onRemotePause = useCallback(() => {
    isRemoteAction.current = true;
    try {
      pauseLocalPlayback(false);
    } finally {
      isRemoteAction.current = false;
    }
  }, [pauseLocalPlayback]);

  /** @type {(timestamp: number) => void} */
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

  /**
   * Returns the live playback position directly from the media element,
   * avoiding stale React state closures (fix #21).
   *
   * @returns {number} Current playback position in seconds.
   */
  const getCurrentTimeHelper = useCallback(() => {
    const ap = activePlayerRef.current;
    if (ap === 'html5' && audioRef.current) return audioRef.current.currentTime;
    if (ap === 'youtube') {
      return ytPlayers.current[activeYtIndex.current]?.getCurrentTime?.() ?? currentTimeRef.current;
    }
    return currentTimeRef.current;
  }, []);

  // ─── Wire up broadcast sync hook ───────────────────────────────────────────
  const { broadcastPlay, broadcastPause, broadcastSeek, broadcastHeartbeat } = useMusicSync({
    currentTrackId: currentTrack?.id || null,
    isPlaying,
    onRemotePlay,
    onRemotePause,
    onRemoteSeek,
    getCurrentTime: getCurrentTimeHelper,
  });

  // ─── Heartbeat (fix #9: currentTime in deps removed, use ref instead) ───────
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    const interval = setInterval(() => {
      if (isCrossfading.current) return;
      broadcastHeartbeat(currentTimeRef.current, true);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, broadcastHeartbeat]);

  // ─── Media Session action handlers ─────────────────────────────────────────
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

  // ─── Crossfade monitor ─────────────────────────────────────────────────────
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration, isPlaying, currentTrack]);

  // ─── Track ended handler ────────────────────────────────────────────────────
  function handleTrackEnded() {
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
  }

  // ─── Crossfade implementation ───────────────────────────────────────────────
  function startCrossfade(nextTrack) {
    if (isCrossfading.current) return;
    isCrossfading.current = true;

    const durationMs = crossfadeDurationRef.current * 1000;
    const intervalTime = 100;
    const steps = durationMs / intervalTime;
    let step = 0;
    const targetVol = volumeRef.current;

    // Load next track in standby slot
    const standbyYtIdx = 1 - activeYtIndex.current;
    if (nextTrack.source === 'upload' && standbyAudioRef.current) {
      standbyAudioRef.current.src = nextTrack.url;
      standbyAudioRef.current.currentTime = 0;
      standbyAudioRef.current.volume = 0;
      standbyAudioRef.current.play().catch(() => {});
    } else if (nextTrack.source === 'youtube') {
      const standbyYt = ytPlayers.current[standbyYtIdx];
      standbyYt?.loadVideoById?.({ videoId: nextTrack.url, startSeconds: 0 });
      standbyYt?.setVolume?.(0);
      standbyYt?.playVideo?.();
    }

    // fix #12: store in ref so it can be cleared on unmount
    crossfadeIntervalRef.current = setInterval(() => {
      step++;
      const ratio = step / steps;
      // Use activePlayerRef.current to read always-fresh value (fix #2/#3)
      const ap = activePlayerRef.current;

      if (ap === 'html5' && audioRef.current) {
        audioRef.current.volume = targetVol * (1 - ratio);
      } else if (ap === 'youtube') {
        ytPlayers.current[activeYtIndex.current]?.setVolume?.(targetVol * (1 - ratio) * 100);
      }

      if (nextTrack.source === 'upload' && standbyAudioRef.current) {
        standbyAudioRef.current.volume = targetVol * ratio;
      } else if (nextTrack.source === 'youtube') {
        ytPlayers.current[standbyYtIdx]?.setVolume?.(targetVol * ratio * 100);
      }

      if (step >= steps) {
        clearInterval(crossfadeIntervalRef.current);

        // fix #24: explicitly stop the outgoing player regardless of type (mixed-source)
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        ytPlayers.current[activeYtIndex.current]?.stopVideo?.();

        // Promote standby: swap HTML5 refs OR update active YT index (no ref mutation)
        if (nextTrack.source === 'upload') {
          const temp = audioRef.current;
          audioRef.current = standbyAudioRef.current;
          standbyAudioRef.current = temp;
          setActivePlayer('html5');
        } else if (nextTrack.source === 'youtube') {
          activeYtIndex.current = standbyYtIdx; // fix #5/#18: index swap, not ref swap
          setActivePlayer('youtube');
        }

        setCurrentTrack(nextTrack);
        setCurrentTime(0);
        setDuration(nextTrack.duration_seconds || 0);
        setIsPlaying(true);
        isCrossfading.current = false;

        if (!isRemoteAction.current) broadcastPlay(nextTrack.id, 0);
      }
    }, intervalTime);
  }

  // ─── Volume control ─────────────────────────────────────────────────────────
  const changeVolume = useCallback((newVolume) => {
    setVolume(newVolume);
    if (activePlayerRef.current === 'html5' && audioRef.current) {
      audioRef.current.volume = newVolume;
    } else if (activePlayerRef.current === 'youtube') {
      ytPlayers.current[activeYtIndex.current]?.setVolume?.(newVolume * 100);
    }
  }, []);

  // ─── Listen-along unblock ───────────────────────────────────────────────────
  const handleListenAlong = useCallback(() => {
    setIsListenAlongBlocked(false);
    resumeLocalPlayback();
  }, [resumeLocalPlayback]);

  // ─── Queue CRUD ─────────────────────────────────────────────────────────────

  /**
   * Inserts a new track into the shared queue. Optimistically updates local
   * state so autoplay fires immediately without waiting for the realtime event (fix #4).
   *
   * @param {string} title
   * @param {string} artist
   * @param {'upload'|'youtube'} source
   * @param {string} url
   * @param {number} durationSeconds
   * @param {string|null} [artworkUrl]
   */
  const addToQueue = useCallback(
    async (title, artist, source, url, durationSeconds, artworkUrl = null) => {
      if (!user) return;
      try {
        // fix #13: use queueRef to get current max position (avoids stale closure race)
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
        // fix #4: optimistic update so playTrackById can find the track immediately
        setQueue((prev) => [...prev, newTrack]);

        // fix #26: guard against crossfade edge cases
        if (!currentTrackRef.current && !isCrossfading.current && newTrack) {
          playTrackById(newTrack.id, 0);
        }
      } catch (err) {
        console.error('Failed to add to queue:', err);
      }
    },
    [user, supabase, playTrackById]
  );

  /**
   * Removes a track from the queue. Pauses playback and awaits DB deletion
   * before advancing the queue (fix #6/#25).
   *
   * @param {string} trackId
   */
  const removeFromQueue = useCallback(
    async (trackId) => {
      try {
        const isCurrentlyPlaying = currentTrackRef.current?.id === trackId;

        // Optimistic update: remove track from UI state immediately
        setQueue((prev) => prev.filter((t) => t.id !== trackId));

        // fix #25: pause before any transition
        if (isCurrentlyPlaying) pauseLocalPlayback(false);

        // fix #6: delete from DB first, then advance
        const { error } = await supabase.from('music_queue').delete().eq('id', trackId);
        if (error) {
          console.error('Error deleting track:', error);
          // Rollback state by re-fetching
          fetchQueue();
          return;
        }

        if (isCurrentlyPlaying) handleTrackEnded();
      } catch (err) {
        console.error('Failed to delete track:', err);
        fetchQueue();
      }
    },
    [pauseLocalPlayback, supabase, fetchQueue]
  );

  /**
   * Reorders the queue with an optimistic update and DB rollback on failure (fix #7).
   *
   * @param {Array} reorderedTracks - The full queue array in its new order.
   */
  const reorderQueue = useCallback(
    async (reorderedTracks) => {
      const previousQueue = [...queueRef.current];
      setQueue(reorderedTracks); // optimistic

      try {
        await Promise.all(
          reorderedTracks.map((track, index) =>
            supabase.from('music_queue').update({ position_index: index }).eq('id', track.id)
          )
        );
      } catch (err) {
        console.error('Failed to reorder queue, rolling back:', err);
        setQueue(previousQueue); // fix #7: rollback on failure
      }
    },
    [supabase]
  );

  // ─── Context value ──────────────────────────────────────────────────────────
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
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
      {/* Hidden YouTube player container — rendered in JSX (fix #17) */}
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
