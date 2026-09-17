import { useEffect, useRef, useCallback } from 'react';
import { getProxiedUrl } from '../lib/musicUtils';

/**
 * Custom hook to manage the audio crossfading between HTML5 and YouTube tracks.
 *
 * @param {Object} params
 * @param {React.MutableRefObject<boolean>} params.isCrossfadingRef - Ref tracking whether a crossfade is active.
 * @param {React.MutableRefObject<number>} params.crossfadeDurationRef - Ref to the crossfade transition duration in seconds.
 * @param {React.MutableRefObject<number>} params.volumeRef - Ref to the global volume setting (0 to 1).
 * @param {React.MutableRefObject<string>} params.activePlayerRef - Ref to the currently active player type ('html5'|'youtube'|'none').
 * @param {Function} params.setActivePlayer - Setter for the active player type state.
 * @param {React.MutableRefObject<HTMLAudioElement|null>} params.audioRef - Ref to primary HTML5 audio element.
 * @param {React.MutableRefObject<HTMLAudioElement|null>} params.standbyAudioRef - Ref to standby HTML5 audio element.
 * @param {React.MutableRefObject<Array<Object|null>>} params.ytPlayers - Ref to YouTube player instances.
 * @param {React.MutableRefObject<Array<boolean>>} params.ytReady - Ref to YouTube player ready states.
 * @param {React.MutableRefObject<number>} params.activeYtIndex - Ref to the active YouTube player index (0 or 1).
 * @param {Function} params.setCurrentTrack - Setter for current track state.
 * @param {Function} params.setCurrentTime - Setter for current time state.
 * @param {Function} params.setDuration - Setter for duration state.
 * @param {Function} params.setIsPlaying - Setter for playing state.
 * @param {React.MutableRefObject<boolean>} params.isRemoteActionRef - Ref to prevent feedback loops.
 * @param {Function} params.broadcastPlay - Function to broadcast play sync events.
 * @param {Function} [params.preparePlayer] - Helper to prepare HTML5 audio element.
 * @param {Function} [params.swapAudioPlayers] - Function to atomically swap HTML5 audio instances and listeners.
 * @param {Function} [params.initAudioContext] - Helper to lazily initialize Web Audio API AudioContext.
 * @param {React.MutableRefObject<AudioContext|null>} [params.audioCtxRef] - Ref to Web Audio API AudioContext.
 * @param {Function} [params.connectElementToContext] - Helper to connect HTML5 element to AudioContext analyser.
 * @returns {{
 *   startCrossfade: (nextTrack: Object) => void,
 *   cancelCrossfade: () => void,
 *   finalizeCrossfadeImmediately: () => void,
 *   isCrossfadingRef: React.MutableRefObject<boolean>
 * }} Crossfade controls.
 */
export function useCrossfade({
  isCrossfadingRef,
  crossfadeDurationRef,
  volumeRef,
  activePlayerRef,
  setActivePlayer,
  audioRef,
  standbyAudioRef,
  ytPlayers,
  ytReady,
  activeYtIndex: activeYtIndexRef,
  setCurrentTrack,
  setCurrentTime,
  setDuration,
  setIsPlaying,
  isRemoteActionRef,
  broadcastPlay,
  preparePlayer,
  swapAudioPlayers,
  initAudioContext,
  audioCtxRef,
  connectElementToContext,
}) {
  const crossfadeIntervalRef = useRef(null);
  const incomingTrackRef = useRef(null);

  /**
   * Immediately finalizes any in-flight crossfade, promoting the incoming track
   * to active status and tearing down the outgoing track.
   *
   * @returns {void}
   */
  const finalizeCrossfadeImmediately = useCallback(() => {
    if (crossfadeIntervalRef.current) {
      clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }

    if (!isCrossfadingRef.current && !incomingTrackRef.current) {
      return;
    }

    const nextTrack = incomingTrackRef.current;
    const standbyYtIdx = 1 - activeYtIndexRef.current;

    // Stop and reset outgoing active player
    if (activePlayerRef.current === 'html5' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    } else if (activePlayerRef.current === 'youtube') {
      const activeYt = ytPlayers.current[activeYtIndexRef.current];
      if (ytReady.current[activeYtIndexRef.current] && activeYt?.stopVideo) {
        activeYt.stopVideo();
      }
    }

    if (nextTrack) {
      let finalDuration = nextTrack.duration_seconds || 0;

      // Swap references and set active player type, restoring volume to target
      if (nextTrack.source === 'upload') {
        if (standbyAudioRef.current) {
          standbyAudioRef.current.volume = volumeRef.current;
        }
        if (swapAudioPlayers) {
          swapAudioPlayers();
        } else {
          const temp = audioRef.current;
          audioRef.current = standbyAudioRef.current;
          standbyAudioRef.current = temp;
        }
        setActivePlayer('html5');
        if (initAudioContext) {
          initAudioContext();
        }
        if (audioCtxRef?.current?.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
        if (audioRef.current) {
          audioRef.current.volume = volumeRef.current;
          if (connectElementToContext && audioRef.current.crossOrigin === 'anonymous') {
            connectElementToContext(audioRef.current);
          }
          if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
            finalDuration = audioRef.current.duration;
          }
        }
      } else if (nextTrack.source === 'youtube') {
        const standbyYt = ytPlayers.current[standbyYtIdx];
        if (ytReady.current[standbyYtIdx] && standbyYt?.setVolume) {
          standbyYt.setVolume(volumeRef.current * 100);
        }
        activeYtIndexRef.current = standbyYtIdx;
        setActivePlayer('youtube');
        const ytDur = ytPlayers.current[standbyYtIdx]?.getDuration?.();
        if (ytDur && ytDur > 0) {
          finalDuration = ytDur;
        }
      }

      if (finalDuration > 0) {
        setDuration(finalDuration);
      }

      if (!isRemoteActionRef.current) {
        broadcastPlay(nextTrack.queue_row_id || nextTrack.id, 0);
      }
    }

    isCrossfadingRef.current = false;
    incomingTrackRef.current = null;
  }, [
    isCrossfadingRef,
    activeYtIndexRef,
    activePlayerRef,
    audioRef,
    ytPlayers,
    ytReady,
    volumeRef,
    standbyAudioRef,
    swapAudioPlayers,
    setActivePlayer,
    connectElementToContext,
    setDuration,
    isRemoteActionRef,
    broadcastPlay,
    initAudioContext,
    audioCtxRef,
  ]);

  /**
   * Aborts an active crossfade immediately, stopping standby playback,
   * clearing transition timers, and restoring full volume on the active player.
   *
   * @returns {void}
   */
  const cancelCrossfade = useCallback(() => {
    if (crossfadeIntervalRef.current) {
      clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }
    isCrossfadingRef.current = false;
    incomingTrackRef.current = null;

    // Reset standby player
    if (standbyAudioRef.current) {
      standbyAudioRef.current.pause();
      standbyAudioRef.current.removeAttribute('src');
      standbyAudioRef.current.load();
      standbyAudioRef.current.volume = 0;
    }
    const standbyYtIdx = 1 - activeYtIndexRef.current;
    const standbyYt = ytPlayers.current[standbyYtIdx];
    if (ytReady.current[standbyYtIdx] && standbyYt?.stopVideo) {
      try {
        standbyYt.stopVideo();
        standbyYt.setVolume(0);
      } catch (err) {
        console.warn('Failed to stop standby YouTube player on cancel crossfade:', err);
      }
    }

    // Restore active player volume
    const ap = activePlayerRef.current;
    const fullVol = volumeRef.current;
    if (ap === 'html5' && audioRef.current) {
      audioRef.current.volume = fullVol;
    } else if (ap === 'youtube') {
      const activeYt = ytPlayers.current[activeYtIndexRef.current];
      if (ytReady.current[activeYtIndexRef.current] && activeYt?.setVolume) {
        activeYt.setVolume(fullVol * 100);
      }
    }
  }, [
    isCrossfadingRef,
    standbyAudioRef,
    activeYtIndexRef,
    ytPlayers,
    ytReady,
    activePlayerRef,
    volumeRef,
    audioRef,
  ]);

  useEffect(() => {
    return () => {
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
      }
    };
  }, []);

  const startCrossfade = useCallback(
    (nextTrack) => {
      if (!nextTrack) return;
      if (isCrossfadingRef.current || crossfadeIntervalRef.current) {
        finalizeCrossfadeImmediately();
      }
      isCrossfadingRef.current = true;
      incomingTrackRef.current = nextTrack;

      const durationMs = crossfadeDurationRef.current * 1000;
      const intervalTime = 100;
      const steps = Math.max(1, durationMs / intervalTime);
      let step = 0;
      const targetVol = volumeRef.current;

      const standbyYtIdx = 1 - activeYtIndexRef.current;

      // 1. Prepare standby player
      if (nextTrack.source === 'upload') {
        if (initAudioContext) {
          initAudioContext();
        }
        if (audioCtxRef?.current?.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        if (preparePlayer) {
          const standbyPlayer = preparePlayer(false, true);
          if (standbyPlayer) {
            standbyPlayer.src = getProxiedUrl(nextTrack.url);
            standbyPlayer.currentTime = 0;
            standbyPlayer.volume = 0;
            standbyPlayer.play().catch((err) => {
              console.warn('Standby HTML5 play failed during crossfade:', err);
            });
          }
        }
      } else if (nextTrack.source === 'youtube') {
        const standbyYt = ytPlayers.current[standbyYtIdx];
        const isReady = ytReady.current[standbyYtIdx];
        if (isReady && standbyYt?.loadVideoById) {
          standbyYt.loadVideoById({ videoId: nextTrack.url, startSeconds: 0 });
          standbyYt.setVolume(0);
          standbyYt.playVideo();
        }
      }

      // 2. Immediately switch UI metadata to incoming track (Spotify approach)
      setCurrentTrack(nextTrack);
      setCurrentTime(0);
      const initialDur =
        nextTrack.duration_seconds ||
        (nextTrack.source === 'youtube'
          ? ytPlayers.current[standbyYtIdx]?.getDuration?.() || 0
          : 0);
      if (initialDur > 0) {
        setDuration(initialDur);
      }
      setIsPlaying(true);

      // 3. Start crossfade volume interval
      crossfadeIntervalRef.current = setInterval(() => {
        step++;
        const ratio = step / steps;
        const ap = activePlayerRef.current;

        // Advance seeker smoothly tracking the incoming track's first seconds
        const elapsedSec = (step * intervalTime) / 1000;
        setCurrentTime(elapsedSec);

        // Fade out active player
        if (ap === 'html5' && audioRef.current) {
          audioRef.current.volume = targetVol * (1 - ratio);
        } else if (ap === 'youtube') {
          const activeYt = ytPlayers.current[activeYtIndexRef.current];
          if (ytReady.current[activeYtIndexRef.current] && activeYt?.setVolume) {
            activeYt.setVolume(targetVol * (1 - ratio) * 100);
          }
        }

        // Fade in standby player
        if (nextTrack.source === 'upload' && standbyAudioRef.current) {
          standbyAudioRef.current.volume = targetVol * ratio;
        } else if (nextTrack.source === 'youtube') {
          const standbyYt = ytPlayers.current[standbyYtIdx];
          if (ytReady.current[standbyYtIdx] && standbyYt?.setVolume) {
            standbyYt.setVolume(targetVol * ratio * 100);
          }
          const ytDur = standbyYt?.getDuration?.();
          if (ytDur && ytDur > 0) {
            setDuration((prev) => (prev > 0 ? prev : ytDur));
          }
        }

        // 4. Complete crossfade transition
        if (step >= steps) {
          finalizeCrossfadeImmediately();
        }
      }, intervalTime);
    },
    [
      isCrossfadingRef,
      crossfadeDurationRef,
      volumeRef,
      activePlayerRef,
      audioRef,
      standbyAudioRef,
      ytPlayers,
      ytReady,
      activeYtIndexRef,
      setCurrentTrack,
      setCurrentTime,
      setDuration,
      setIsPlaying,
      preparePlayer,
      initAudioContext,
      audioCtxRef,
      finalizeCrossfadeImmediately,
    ]
  );

  return {
    startCrossfade,
    cancelCrossfade,
    finalizeCrossfadeImmediately,
    isCrossfadingRef,
  };
}
