import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook to manage the HTML5 audio players and Web Audio API initialization.
 *
 * @param {Object} params
 * @param {number} params.volume - Initial volume level (0 to 1).
 * @param {React.MutableRefObject<boolean>} params.isCrossfadingRef - Ref tracking crossfade state.
 * @param {Function} params.setCurrentTime - Callback to update current playback time.
 * @param {Function} params.setDuration - Callback to update current track duration.
 * @param {Function} params.handleTrackEnded - Callback when track ends.
 * @returns {{
 *   audioRef: React.MutableRefObject<HTMLAudioElement|null>,
 *   standbyAudioRef: React.MutableRefObject<HTMLAudioElement|null>,
 *   analyserNode: AnalyserNode|null,
 *   initAudioContext: () => void,
 *   audioCtxRef: React.MutableRefObject<AudioContext|null>
 * }} HTML5 player state and controls.
 */
export function useHtml5Player({
  volume,
  isCrossfadingRef,
  setCurrentTime,
  setDuration,
  handleTrackEnded,
}) {
  const audioRef = useRef(null);
  const standbyAudioRef = useRef(null);

  // Web Audio API refs & state
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const standbySourceNodeRef = useRef(null);
  const [analyserNode, setAnalyserNode] = useState(null);

  // Store callbacks in stable refs to prevent re-running the Audio creation effect
  const handleTrackEndedRef = useRef(handleTrackEnded);
  const setCurrentTimeRef = useRef(setCurrentTime);
  const setDurationRef = useRef(setDuration);

  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  }, [handleTrackEnded]);

  useEffect(() => {
    setCurrentTimeRef.current = setCurrentTime;
  }, [setCurrentTime]);

  useEffect(() => {
    setDurationRef.current = setDuration;
  }, [setDuration]);

  // Create the Audio elements exactly once on mount
  useEffect(() => {
    const audio = new Audio();
    // NOTE: We do not set audio.crossOrigin = 'anonymous' because Supabase Storage CORS configurations
    // can fail on HTTP 206 range requests in Chromium, causing MEDIA_ELEMENT_ERROR (code 4).
    // Playing without crossOrigin enables clean and immediate playback of uploaded tracks.
    audio.volume = volume;
    audioRef.current = audio;

    const standbyAudio = new Audio();
    standbyAudio.volume = 0;
    standbyAudioRef.current = standbyAudio;

    const createListeners = (el) => {
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
        if (el === audioRef.current) {
          handleTrackEndedRef.current();
        }
      };
      const handleError = (e) => {
        console.error('HTML5 audio element error:', e);
      };

      el.addEventListener('timeupdate', handleTimeUpdate);
      el.addEventListener('durationchange', handleDurationChange);
      el.addEventListener('ended', handleEnded);
      el.addEventListener('error', handleError);

      return () => {
        el.removeEventListener('timeupdate', handleTimeUpdate);
        el.removeEventListener('durationchange', handleDurationChange);
        el.removeEventListener('ended', handleEnded);
        el.removeEventListener('error', handleError);
      };
    };

    const cleanupAudio = createListeners(audio);
    const cleanupStandby = createListeners(standbyAudio);

    return () => {
      audio.pause();
      standbyAudio.pause();
      cleanupAudio();
      cleanupStandby();
      audioRef.current = null;
      standbyAudioRef.current = null;
    };
  }, [isCrossfadingRef]); // Depends only on stable refs to prevent recreation

  /**
   * Lazily initializes the Web Audio API AudioContext.
   * NOTE: We do NOT connect the primary and standby Audio elements to the AudioContext via
   * createMediaElementSource because uploaded tracks are stored on Supabase Storage without CORS headers.
   * If we connect them, browser security policies will force the MediaElementAudioSourceNode to output
   * zeroes (silence). Bypassing this connection allows the audio to play directly to the speakers,
   * while the music visualizer automatically falls back to a beautiful breathing animation.
   */
  const initAudioContext = useCallback(() => {
    if (audioCtxRef.current) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
    } catch (e) {
      console.warn('Web Audio API context initialization failed:', e);
    }
  }, []);

  return {
    audioRef,
    standbyAudioRef,
    analyserNode,
    initAudioContext,
    audioCtxRef,
  };
}
