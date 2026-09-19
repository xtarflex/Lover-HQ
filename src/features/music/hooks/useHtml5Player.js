import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook to manage the HTML5 audio players and Web Audio API initialization.
 * Supports self-healing fallback when CORS is not configured on the remote server.
 *
 * @param {Object} params
 * @param {number} params.volume - Initial volume level (0 to 1).
 * @param {boolean} [params.isActivePlayer=true] - Whether HTML5 is the currently active player.
 * @param {React.MutableRefObject<boolean>} params.isCrossfadingRef - Ref tracking state.
 * @param {Function} params.setCurrentTime - Callback to update current playback time.
 * @param {Function} params.setDuration - Callback to update current track duration.
 * @param {Function} [params.setIsPlaying] - Callback to update playing state.
 * @param {Function} params.handleTrackEnded - Callback when track ends.
 * @returns {{
 *   audioRef: React.MutableRefObject<HTMLAudioElement|null>,
 *   standbyAudioRef: React.MutableRefObject<HTMLAudioElement|null>,
 *   analyserNode: AnalyserNode|null,
 *   initAudioContext: () => void,
 *   audioCtxRef: React.MutableRefObject<AudioContext|null>,
 *   preparePlayer: (isPrimary: boolean, useCors: boolean) => HTMLAudioElement,
 *   swapAudioPlayers: () => void,
 *   connectElementToContext: (el: HTMLAudioElement) => void
 * }} HTML5 player state and controls.
 */
export function useHtml5Player({
  volume,
  isActivePlayer = true,
  isCrossfadingRef,
  setCurrentTime,
  setDuration,
  setIsPlaying,
  handleTrackEnded,
}) {
  const audioRef = useRef(null);
  const standbyAudioRef = useRef(null);

  // Web Audio API refs & state
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const workletNodeRef = useRef(null);
  const [analyserNode, setAnalyserNode] = useState(null);
  const [workletNode, setWorkletNode] = useState(null);

  // Store callbacks and settings in stable refs to prevent re-running effects
  const volumeRef = useRef(volume);
  const isActivePlayerRef = useRef(isActivePlayer);
  const handleTrackEndedRef = useRef(handleTrackEnded);
  const setCurrentTimeRef = useRef(setCurrentTime);
  const setDurationRef = useRef(setDuration);
  const setIsPlayingRef = useRef(setIsPlaying);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);
  useEffect(() => {
    isActivePlayerRef.current = isActivePlayer;
  }, [isActivePlayer]);
  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  }, [handleTrackEnded]);
  useEffect(() => {
    setCurrentTimeRef.current = setCurrentTime;
  }, [setCurrentTime]);
  useEffect(() => {
    setDurationRef.current = setDuration;
  }, [setDuration]);
  useEffect(() => {
    setIsPlayingRef.current = setIsPlaying;
  }, [setIsPlaying]);

  // Keep track of event listener cleanups
  const cleanupsRef = useRef({ primary: null, standby: null });

  // Stable ref for the recreate function so it can be called from callbacks
  const recreateAudioElementRef = useRef(null);

  /**
   * Helper to connect an audio element to the AudioContext dynamically.
   */
  const connectElementToContext = useCallback((el) => {
    if (!el) return;
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch((err) => {
        console.warn('Failed to resume AudioContext:', err);
      });
    }
    if (!audioCtxRef.current || el.__connectedToCtx) return;
    try {
      const source = audioCtxRef.current.createMediaElementSource(el);
      if (workletNodeRef.current) {
        source.connect(workletNodeRef.current);
        if (analyserRef.current) {
          workletNodeRef.current.connect(analyserRef.current);
        }
      } else if (analyserRef.current) {
        source.connect(analyserRef.current);
      }
      el.__connectedToCtx = true;
      if (analyserRef.current) setAnalyserNode(analyserRef.current);
      if (workletNodeRef.current) setWorkletNode(workletNodeRef.current);
    } catch (err) {
      console.warn('Failed to connect media element to AudioContext:', err);
    }
  }, []);

  // Sync volume changes directly to active elements
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // When active player transitions to html5, ensure AudioContext is active and connected
  useEffect(() => {
    if (isActivePlayer) {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (audioRef.current && audioRef.current.crossOrigin === 'anonymous') {
        connectElementToContext(audioRef.current);
      }
    }
  }, [isActivePlayer, connectElementToContext]);

  // Initialize and manage audio players on mount
  useEffect(() => {
    const connectElementToContextRef = { current: connectElementToContext };
    connectElementToContextRef.current = connectElementToContext;

    const setupListeners = (el) => {
      const handleTimeUpdate = () => {
        if (isCrossfadingRef.current) return;
        if (el === audioRef.current) {
          setCurrentTimeRef.current(el.currentTime);
        }
      };
      const handleDurationChange = () => {
        if (el === audioRef.current) {
          setDurationRef.current(el.duration || 0);
        }
      };
      const handleEnded = () => {
        if (isCrossfadingRef.current) return;
        if (el === audioRef.current && isActivePlayerRef.current) {
          handleTrackEndedRef.current();
        }
      };
      const handlePlaying = () => {
        if (el.crossOrigin === 'anonymous') {
          connectElementToContextRef.current(el);
        } else {
          setAnalyserNode(null);
        }
        if (el === audioRef.current && isActivePlayerRef.current) {
          setIsPlayingRef.current?.(true);
        }
      };
      const handlePause = () => {
        if (isCrossfadingRef.current) return;
        if (el === audioRef.current && isActivePlayerRef.current) {
          setIsPlayingRef.current?.(false);
        }
      };
      const handlePlay = () => {
        if (isCrossfadingRef.current) return;
        if (el === audioRef.current && isActivePlayerRef.current) {
          setIsPlayingRef.current?.(true);
        }
      };
      const handleError = (e) => {
        // Discard aborted / torn down elements without source
        if (!el.getAttribute('src') || !el.src || el.src === window.location.href || !el.currentSrc)
          return;
        if (el.crossOrigin === 'anonymous') {
          console.warn('CORS request failed for HTML5 audio. Re-trying without CORS...');
          const currentSrc = el.src;
          const currentTime = el.currentTime;
          const wasPlaying = !el.paused;
          const isPrimary = el === audioRef.current;

          // Recreate without CORS
          const newEl = recreateAudioElement(isPrimary, false);
          newEl.src = currentSrc;
          newEl.currentTime = currentTime;

          if (wasPlaying) {
            newEl.play().catch((err) => console.warn('Fallback playback failed:', err));
          }
        } else {
          console.error('HTML5 audio element error:', e);
        }
      };

      el.addEventListener('timeupdate', handleTimeUpdate);
      el.addEventListener('durationchange', handleDurationChange);
      el.addEventListener('ended', handleEnded);
      el.addEventListener('playing', handlePlaying);
      el.addEventListener('pause', handlePause);
      el.addEventListener('play', handlePlay);
      el.addEventListener('error', handleError);

      return () => {
        el.removeEventListener('timeupdate', handleTimeUpdate);
        el.removeEventListener('durationchange', handleDurationChange);
        el.removeEventListener('ended', handleEnded);
        el.removeEventListener('playing', handlePlaying);
        el.removeEventListener('pause', handlePause);
        el.removeEventListener('play', handlePlay);
        el.removeEventListener('error', handleError);
      };
    };

    const recreateAudioElement = (isPrimary, useCors) => {
      const oldEl = isPrimary ? audioRef.current : standbyAudioRef.current;
      if (oldEl) {
        oldEl.pause();
        if (isPrimary && cleanupsRef.current.primary) {
          cleanupsRef.current.primary();
          cleanupsRef.current.primary = null;
        } else if (!isPrimary && cleanupsRef.current.standby) {
          cleanupsRef.current.standby();
          cleanupsRef.current.standby = null;
        }
      }

      const el = new Audio();
      el.volume = isPrimary ? volumeRef.current : 0;
      if (useCors) {
        el.crossOrigin = 'anonymous';
      }

      const cleanup = setupListeners(el);
      if (isPrimary) {
        audioRef.current = el;
        cleanupsRef.current.primary = cleanup;
      } else {
        standbyAudioRef.current = el;
        cleanupsRef.current.standby = cleanup;
      }

      return el;
    };

    recreateAudioElementRef.current = recreateAudioElement;

    // Initial creation (with CORS enabled by default)
    recreateAudioElement(true, true);
    recreateAudioElement(false, true);

    const currentCleanups = cleanupsRef.current;

    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (standbyAudioRef.current) standbyAudioRef.current.pause();
      if (currentCleanups.primary) currentCleanups.primary();
      if (currentCleanups.standby) currentCleanups.standby();
      audioRef.current = null;
      standbyAudioRef.current = null;
    };
  }, [isCrossfadingRef, connectElementToContext]);

  /**
   * External helper to recreate/prepare an audio element slot.
   */
  const preparePlayer = useCallback((isPrimary, useCors) => {
    if (recreateAudioElementRef.current) {
      return recreateAudioElementRef.current(isPrimary, useCors);
    }
    return null;
  }, []);

  /**
   * Lazily initializes the Web Audio API AudioContext and registers AudioWorklet.
   */
  const initAudioContext = useCallback(async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return;
    }

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      // Attempt to load AudioWorkletProcessor module if supported
      if (ctx.audioWorklet && typeof ctx.audioWorklet.addModule === 'function') {
        try {
          await ctx.audioWorklet.addModule('/audio-processors/dsp-audio-processor.js');
          const worklet = new AudioWorkletNode(ctx, 'dsp-audio-processor');
          workletNodeRef.current = worklet;
          setWorkletNode(worklet);
          worklet.connect(analyser);
        } catch (workletErr) {
          console.warn(
            'AudioWorklet registration bypassed, using main-thread fallback:',
            workletErr
          );
        }
      }

      // If the primary element is already playing with CORS, connect it now
      if (
        audioRef.current &&
        audioRef.current.crossOrigin === 'anonymous' &&
        !audioRef.current.paused
      ) {
        connectElementToContext(audioRef.current);
      }
    } catch (e) {
      console.warn('Web Audio API context initialization failed:', e);
    }
  }, [connectElementToContext]);

  /**
   * Atomically swaps the primary and standby audio elements along with their
   * respective event listener cleanup callbacks.
   */
  const swapAudioPlayers = useCallback(() => {
    const tempAudio = audioRef.current;
    audioRef.current = standbyAudioRef.current;
    standbyAudioRef.current = tempAudio;

    const tempCleanup = cleanupsRef.current.primary;
    cleanupsRef.current.primary = cleanupsRef.current.standby;
    cleanupsRef.current.standby = tempCleanup;
  }, []);

  return {
    audioRef,
    standbyAudioRef,
    analyserNode,
    workletNode,
    initAudioContext,
    audioCtxRef,
    preparePlayer,
    swapAudioPlayers,
    connectElementToContext,
  };
}
