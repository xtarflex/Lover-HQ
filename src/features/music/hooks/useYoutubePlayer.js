import { useEffect, useRef, useCallback } from 'react';

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
 * Custom hook to manage the YouTube IFrame player instances and queue actions.
 *
 * @param {Object} params
 * @param {Object|null} params.user - The current user object.
 * @param {boolean} params.isPlaying - Current playing state.
 * @param {boolean} params.isActivePlayer - Whether the YouTube player is currently active.
 * @param {React.MutableRefObject<boolean>} params.isCrossfadingRef - Ref tracking crossfade state.
 * @param {React.MutableRefObject<number>} params.volumeRef - Ref to the current volume level.
 * @param {Function} params.setDuration - Callback to update current track duration.
 * @param {Function} params.setCurrentTime - Callback to update current playback time.
 * @param {Function} params.handleTrackEnded - Callback when track ends.
 * @param {React.MutableRefObject<Function|null>} params.playTrackByIdRef - Ref to playTrackById.
 * @param {React.RefObject<HTMLDivElement>} params.ytContainerRef - Ref to YouTube players div container.
 * @returns {{
 *   ytPlayers: React.MutableRefObject<Array<Object|null>>,
 *   ytReady: React.MutableRefObject<Array<boolean>>,
 *   pendingYtAction: React.MutableRefObject<Object|null>,
 *   activeYtIndex: React.MutableRefObject<number>,
 *   playVideo: (index: number) => void,
 *   pauseVideo: (index: number) => void,
 *   loadVideo: (index: number, videoId: string, startSeconds: number) => void,
 *   seekVideo: (index: number, seconds: number, allowSeekAhead: boolean) => void,
 *   setVolume: (index: number, volume: number) => void,
 * }} YouTube player controls.
 */
export function useYoutubePlayer({
  user,
  isPlaying,
  isActivePlayer,
  isCrossfadingRef,
  volumeRef,
  setDuration,
  setCurrentTime,
  handleTrackEnded,
  playTrackByIdRef,
  ytContainerRef,
}) {
  const ytPlayers = useRef([null, null]);
  const activeYtIndex = useRef(0);
  const ytReady = useRef([false, false]);
  const pendingYtAction = useRef(null);

  // Store callbacks in stable refs to prevent re-initializing player on callback updates
  const handleTrackEndedRef = useRef(handleTrackEnded);
  const setDurationRef = useRef(setDuration);

  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  }, [handleTrackEnded]);

  useEffect(() => {
    setDurationRef.current = setDuration;
  }, [setDuration]);

  // Initialize YouTube players once when user session is established
  useEffect(() => {
    if (!user?.id || !user?.partner_id) return;
    let active = true;

    loadYoutubeApi().then((YT) => {
      if (!active) return;
      const container = ytContainerRef.current;
      if (!container) return;

      // Clean up previous elements to prevent iframe duplication if any
      const player0El = document.getElementById('yt-player-0');
      const player1El = document.getElementById('yt-player-1');
      if (player0El) player0El.innerHTML = '';
      if (player1El) player1El.innerHTML = '';

      const makePlayer = (divId, idx) => {
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
            onReady: (event) => {
              if (!active) return;
              ytReady.current[idx] = true;
              ytPlayers.current[idx] = event.target; // Store the fully decorated player instance!
              console.log(`YouTube player ${idx} ready.`);
              
              // If this is the active index and we have a pending action, play it
              if (pendingYtAction.current && activeYtIndex.current === idx) {
                const { trackId, startTime } = pendingYtAction.current;
                pendingYtAction.current = null;
                playTrackByIdRef.current?.(trackId, startTime);
              }
            },
            onStateChange: (event) => {
              if (!active) return;
              if (idx !== activeYtIndex.current) return;
              if (event.data === 1) {
                setDurationRef.current(ytPlayers.current[activeYtIndex.current]?.getDuration() || 0);
              } else if (event.data === 0) {
                if (!isCrossfadingRef.current) {
                  handleTrackEndedRef.current();
                }
              }
            },
          },
        });
      };

      ytPlayers.current[0] = makePlayer('yt-player-0', 0);
      ytPlayers.current[1] = makePlayer('yt-player-1', 1);
    });

    return () => {
      active = false;
      // Clean up player instances on unmount/session change
      ytReady.current = [false, false];
      if (ytPlayers.current[0]?.destroy) {
        try {
          ytPlayers.current[0].destroy();
        } catch (e) {
          console.warn('Error destroying YT player 0:', e);
        }
      }
      if (ytPlayers.current[1]?.destroy) {
        try {
          ytPlayers.current[1].destroy();
        } catch (e) {
          console.warn('Error destroying YT player 1:', e);
        }
      }
      ytPlayers.current = [null, null];
    };
  }, [user?.id, user?.partner_id, ytContainerRef, isCrossfadingRef, playTrackByIdRef]);

  // YouTube time polling
  useEffect(() => {
    if (!isPlaying || !isActivePlayer) return;
    const interval = setInterval(() => {
      if (isCrossfadingRef.current) return;
      const ytPlayer = ytPlayers.current[activeYtIndex.current];
      if (ytPlayer?.getPlayerState && ytPlayer.getPlayerState() === 3) return; // buffering
      const time = ytPlayer?.getCurrentTime?.() ?? 0;
      setCurrentTime(time);
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, isActivePlayer, isCrossfadingRef, setCurrentTime]);

  const playVideo = useCallback((index) => {
    if (ytReady.current[index]) {
      ytPlayers.current[index]?.playVideo?.();
    }
  }, []);

  const pauseVideo = useCallback((index) => {
    if (ytReady.current[index]) {
      ytPlayers.current[index]?.pauseVideo?.();
    }
  }, []);

  const loadVideo = useCallback((index, videoId, startSeconds) => {
    if (ytReady.current[index]) {
      ytPlayers.current[index]?.loadVideoById?.({ videoId, startSeconds });
    }
  }, []);

  const seekVideo = useCallback((index, seconds, allowSeekAhead) => {
    if (ytReady.current[index]) {
      ytPlayers.current[index]?.seekTo?.(seconds, allowSeekAhead);
    }
  }, []);

  const setVolume = useCallback((index, vol) => {
    if (ytReady.current[index]) {
      ytPlayers.current[index]?.setVolume?.(vol * 100);
    }
  }, []);

  return {
    ytPlayers,
    ytReady,
    pendingYtAction,
    activeYtIndex,
    playVideo,
    pauseVideo,
    loadVideo,
    seekVideo,
    setVolume,
  };
}
