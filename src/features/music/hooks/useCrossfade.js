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
 * @returns {{
 *   startCrossfade: (nextTrack: Object) => void,
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
  activeYtIndex,
  setCurrentTrack,
  setCurrentTime,
  setDuration,
  setIsPlaying,
  isRemoteActionRef,
  broadcastPlay,
  preparePlayer,
}) {
  const crossfadeIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (crossfadeIntervalRef.current) {
        clearInterval(crossfadeIntervalRef.current);
      }
    };
  }, []);

  const startCrossfade = useCallback(
    (nextTrack) => {
      if (isCrossfadingRef.current) return;
      isCrossfadingRef.current = true;

      const durationMs = crossfadeDurationRef.current * 1000;
      const intervalTime = 100;
      const steps = Math.max(1, durationMs / intervalTime);
      let step = 0;
      const targetVol = volumeRef.current;

      const standbyYtIdx = 1 - activeYtIndex.current;

      // 1. Prepare standby player
      if (nextTrack.source === 'upload' && preparePlayer) {
        const standbyPlayer = preparePlayer(false, true);
        if (standbyPlayer) {
          standbyPlayer.src = getProxiedUrl(nextTrack.url);
          standbyPlayer.currentTime = 0;
          standbyPlayer.volume = 0;
          standbyPlayer.play().catch((err) => {
            console.warn('Standby HTML5 play failed during crossfade:', err);
          });
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

      // 2. Start crossfade volume interval
      crossfadeIntervalRef.current = setInterval(() => {
        step++;
        const ratio = step / steps;
        const ap = activePlayerRef.current;

        // Fade out active player
        if (ap === 'html5' && audioRef.current) {
          audioRef.current.volume = targetVol * (1 - ratio);
        } else if (ap === 'youtube') {
          const activeYt = ytPlayers.current[activeYtIndex.current];
          if (ytReady.current[activeYtIndex.current] && activeYt?.setVolume) {
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
        }

        // 3. Complete crossfade transition
        if (step >= steps) {
          clearInterval(crossfadeIntervalRef.current);

          // Stop and reset the outgoing player regardless of type (fixes trailing mixed-source sound)
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
          }
          const activeYt = ytPlayers.current[activeYtIndex.current];
          if (ytReady.current[activeYtIndex.current] && activeYt?.stopVideo) {
            activeYt.stopVideo();
          }

          // Swap references and set active player type
          if (nextTrack.source === 'upload') {
            const temp = audioRef.current;
            audioRef.current = standbyAudioRef.current;
            standbyAudioRef.current = temp;
            setActivePlayer('html5');
          } else if (nextTrack.source === 'youtube') {
            activeYtIndex.current = standbyYtIdx;
            setActivePlayer('youtube');
          }

          setCurrentTrack(nextTrack);
          setCurrentTime(0);
          setDuration(nextTrack.duration_seconds || 0);
          setIsPlaying(true);
          isCrossfadingRef.current = false;

          if (!isRemoteActionRef.current) {
            broadcastPlay(nextTrack.id, 0);
          }
        }
      }, intervalTime);
    },
    [
      isCrossfadingRef,
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
      isRemoteActionRef,
      broadcastPlay,
      preparePlayer,
    ]
  );

  return {
    startCrossfade,
    isCrossfadingRef,
  };
}
