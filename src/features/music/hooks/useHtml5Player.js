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

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.volume = volume;
    audioRef.current = audio;

    const standbyAudio = new Audio();
    standbyAudio.crossOrigin = 'anonymous';
    standbyAudio.volume = 0;
    standbyAudioRef.current = standbyAudio;

    const createListeners = (el) => {
      const handleTimeUpdate = () => {
        if (isCrossfadingRef.current) return;
        if (el === audioRef.current) {
          setCurrentTime(el.currentTime);
        }
      };
      const handleDurationChange = () => {
        if (el === audioRef.current) {
          setDuration(el.duration || 0);
        }
      };
      const handleEnded = () => {
        if (isCrossfadingRef.current) return;
        if (el === audioRef.current) {
          handleTrackEnded();
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
    };
  }, [handleTrackEnded, isCrossfadingRef, setCurrentTime, setDuration]);

  /**
   * Lazily initializes the Web Audio API AudioContext and connects BOTH
   * primary and standby audio elements to the AnalyserNode.
   */
  const initAudioContext = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current || !standbyAudioRef.current) return;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    // Connect both primary and standby players to the AnalyserNode
    const source1 = ctx.createMediaElementSource(audioRef.current);
    const source2 = ctx.createMediaElementSource(standbyAudioRef.current);

    source1.connect(analyser);
    source2.connect(analyser);
    analyser.connect(ctx.destination);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    sourceNodeRef.current = source1;
    standbySourceNodeRef.current = source2;
    setAnalyserNode(analyser);
  }, []);

  return {
    audioRef,
    standbyAudioRef,
    analyserNode,
    initAudioContext,
    audioCtxRef,
  };
}
