import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { useAppContext } from './AppContext';
import { useMusicSync } from '../features/music/hooks/useMusicSync';

const MusicContext = createContext(null);

// Load the YouTube IFrame API script exactly once
let ytApiPromise = null;
const loadYoutubeApi = () => {
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    // Set callback
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      resolve(window.YT);
    };

    // Load tag
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  });

  return ytApiPromise;
};

/**
 * Global Music Player Context Provider.
 * Manages the shared playback state, playlist queue, HTML5/YouTube players,
 * real-time synchronization, and track crossfading/overlap transitions.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {React.ReactElement} The Context Provider.
 */
export function MusicProvider({ children }) {
  const supabase = useSupabase();
  const { user } = useAppContext();

  const [queue, setQueue] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [crossfadeDuration, setCrossfadeDuration] = useState(3); // Default 3s crossfade
  const [activePlayer, setActivePlayer] = useState('none'); // 'html5' | 'youtube' | 'none'
  const [isListenAlongBlocked, setIsListenAlongBlocked] = useState(false);

  // Audio elements references
  const audioRef = useRef(null);
  const standbyAudioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const standbyYtPlayerRef = useRef(null);

  // Store whether the current operation is triggered by a remote event (prevents loops)
  const isRemoteAction = useRef(false);

  // Keep refs of volume and crossfade to access inside event listeners/intervals
  const volumeRef = useRef(volume);
  const crossfadeDurationRef = useRef(crossfadeDuration);
  const queueRef = useRef(queue);
  const currentTrackRef = useRef(currentTrack);

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

  // Track if crossfade is currently active
  const isCrossfading = useRef(false);

  // Initialize Audio elements
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const standbyAudio = new Audio();
    standbyAudio.volume = 0;
    standbyAudioRef.current = standbyAudio;

    // Synchronize HTML5 audio events to state
    const handleTimeUpdate = () => {
      if (isCrossfading.current) return;
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (isCrossfading.current) return;
      handleTrackEnded();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);

      standbyAudio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize YouTube elements
  useEffect(() => {
    if (!user || !user.partner_id) return;

    // Create a hidden container for YouTube iframes if it doesn't exist
    let ytContainer = document.getElementById('yt-players-container');
    if (!ytContainer) {
      ytContainer = document.createElement('div');
      ytContainer.id = 'yt-players-container';
      ytContainer.style.position = 'absolute';
      ytContainer.style.width = '1px';
      ytContainer.style.height = '1px';
      ytContainer.style.overflow = 'hidden';
      ytContainer.style.top = '-1000px';
      ytContainer.style.left = '-1000px';
      document.body.appendChild(ytContainer);
    }

    // Create player divs
    const player1Div = document.createElement('div');
    player1Div.id = 'yt-player-1';
    ytContainer.appendChild(player1Div);

    const player2Div = document.createElement('div');
    player2Div.id = 'yt-player-2';
    ytContainer.appendChild(player2Div);

    loadYoutubeApi().then((YT) => {
      ytPlayerRef.current = new YT.Player('yt-player-1', {
        height: '100',
        width: '100',
        videoId: '',
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event) => {
            handleYtStateChange(event, ytPlayerRef.current);
          },
        },
      });

      standbyYtPlayerRef.current = new YT.Player('yt-player-2', {
        height: '100',
        width: '100',
        videoId: '',
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event) => {
            handleYtStateChange(event, standbyYtPlayerRef.current, true);
          },
        },
      });
    });

    return () => {
      if (ytContainer) {
        ytContainer.innerHTML = '';
        if (ytContainer.parentNode) {
          ytContainer.parentNode.removeChild(ytContainer);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle YouTube player state updates
  function handleYtStateChange(event, player, isStandby = false) {
    if (isStandby) return; // Don't track time/duration state for standby player

    // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
    if (event.data === 1) {
      // Playing
      setDuration(player.getDuration() || 0);
    } else if (event.data === 0) {
      // Ended
      if (isCrossfading.current) return;
      handleTrackEnded();
    }
  }

  // Track YouTube playback time periodically
  useEffect(() => {
    let interval = null;
    if (
      isPlaying &&
      activePlayer === 'youtube' &&
      ytPlayerRef.current &&
      ytPlayerRef.current.getCurrentTime
    ) {
      interval = setInterval(() => {
        if (isCrossfading.current) return;

        // Skip updating time if player is buffering (to keep visual state stable)
        if (ytPlayerRef.current.getPlayerState && ytPlayerRef.current.getPlayerState() === 3) {
          return;
        }

        const time = ytPlayerRef.current.getCurrentTime();
        setCurrentTime(time);
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, activePlayer]);

  // Load and Subscribe to Queue changes from DB
  useEffect(() => {
    if (!user || !user.id || !user.partner_id) return;

    const fetchQueue = async () => {
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
        setQueue(data || []);
      } catch (err) {
        console.error('Failed to load queue:', err);
      }
    };

    fetchQueue();

    // Subscribe to Postgres changes on music_queue
    const channel = supabase
      .channel('music_queue_db_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'music_queue',
        },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // Sync callbacks from partner
  const onRemotePlay = (trackId, timestamp) => {
    isRemoteAction.current = true;
    playTrackById(trackId, timestamp);
    isRemoteAction.current = false;
  };

  const onRemotePause = () => {
    isRemoteAction.current = true;
    pauseLocalPlayback();
    isRemoteAction.current = false;
  };

  const onRemoteSeek = (timestamp) => {
    isRemoteAction.current = true;
    seekLocalPlayback(timestamp);
    isRemoteAction.current = false;
  };

  const getCurrentTimeHelper = () => {
    return currentTime;
  };

  // Wire up music broadcast synchronization hook
  const { broadcastPlay, broadcastPause, broadcastSeek, broadcastHeartbeat } = useMusicSync({
    currentTrackId: currentTrack?.id || null,
    isPlaying,
    onRemotePlay,
    onRemotePause,
    onRemoteSeek,
    getCurrentTime: getCurrentTimeHelper,
  });

  // Heartbeat broadcast (every 2 seconds when playing)
  useEffect(() => {
    let interval = null;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        // If we are currently crossfading, do not trigger correction checks
        if (isCrossfading.current) return;
        broadcastHeartbeat(currentTime, isPlaying);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTrack, currentTime]);

  // Monitor crossfading eligibility
  useEffect(() => {
    if (!isPlaying || isCrossfading.current || !currentTrack || duration <= 0) return;

    const remainingTime = duration - currentTime;
    const thresh = crossfadeDurationRef.current;

    // Trigger crossfade transition if we have a next track in the queue
    if (remainingTime <= thresh && thresh > 0 && queueRef.current.length > 0) {
      const currentIndex = queueRef.current.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex !== -1 && currentIndex < queueRef.current.length - 1) {
        const nextTrack = queueRef.current[currentIndex + 1];
        startCrossfade(nextTrack);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration, isPlaying, currentTrack]);

  // Core Play logic
  const playTrackById = async (trackId, startTime = 0) => {
    const track = queueRef.current.find((t) => t.id === trackId);
    if (!track) return;

    // Handle browser autoplay blockages
    let isAutoplayBlocked = false;

    // Pause current active player
    pauseLocalPlayback(false);

    setCurrentTrack(track);
    setCurrentTime(startTime);
    setDuration(track.duration_seconds || 0);

    if (track.source === 'upload') {
      setActivePlayer('html5');
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.currentTime = startTime;
        audioRef.current.volume = volumeRef.current;
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          setIsListenAlongBlocked(false);
        } catch (err) {
          console.warn('HTML5 autoplay blocked by browser:', err);
          isAutoplayBlocked = true;
          setIsPlaying(false);
          setIsListenAlongBlocked(true);
        }
      }
    } else if (track.source === 'youtube') {
      setActivePlayer('youtube');
      if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
        try {
          ytPlayerRef.current.loadVideoById({
            videoId: track.url,
            startSeconds: startTime,
          });
          ytPlayerRef.current.setVolume(volumeRef.current * 100);
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
          setIsListenAlongBlocked(false);
        } catch (err) {
          console.warn('YouTube autoplay blocked by browser:', err);
          isAutoplayBlocked = true;
          setIsPlaying(false);
          setIsListenAlongBlocked(true);
        }
      }
    }

    // Broadcast if triggered locally and not blocked
    if (!isRemoteAction.current && !isAutoplayBlocked) {
      broadcastPlay(trackId, startTime);
    }
  };

  // Pause local playback
  const pauseLocalPlayback = (shouldBroadcast = true) => {
    setIsPlaying(false);
    if (activePlayer === 'html5' && audioRef.current) {
      audioRef.current.pause();
    } else if (
      activePlayer === 'youtube' &&
      ytPlayerRef.current &&
      ytPlayerRef.current.pauseVideo
    ) {
      ytPlayerRef.current.pauseVideo();
    }

    if (shouldBroadcast && !isRemoteAction.current) {
      broadcastPause();
    }
  };

  // Resume local playback
  const resumeLocalPlayback = async () => {
    if (!currentTrack) return;

    let isAutoplayBlocked = false;

    if (activePlayer === 'html5' && audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsListenAlongBlocked(false);
      } catch {
        isAutoplayBlocked = true;
        setIsListenAlongBlocked(true);
      }
    } else if (activePlayer === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.playVideo) {
      try {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
        setIsListenAlongBlocked(false);
      } catch {
        isAutoplayBlocked = true;
        setIsListenAlongBlocked(true);
      }
    }

    if (!isRemoteAction.current && !isAutoplayBlocked && currentTrack) {
      broadcastPlay(currentTrack.id, currentTime);
    }
  };

  // Seek playback
  const seekLocalPlayback = (timestamp) => {
    setCurrentTime(timestamp);
    if (activePlayer === 'html5' && audioRef.current) {
      audioRef.current.currentTime = timestamp;
    } else if (activePlayer === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.seekTo) {
      ytPlayerRef.current.seekTo(timestamp, true);
    }

    if (!isRemoteAction.current) {
      broadcastSeek(timestamp);
    }
  };

  // Handle track ended natural transition
  function handleTrackEnded() {
    if (queueRef.current.length === 0 || !currentTrackRef.current) return;

    const currentIndex = queueRef.current.findIndex((t) => t.id === currentTrackRef.current.id);
    if (currentIndex !== -1 && currentIndex < queueRef.current.length - 1) {
      // Advance to next track
      const nextTrack = queueRef.current[currentIndex + 1];
      playTrackById(nextTrack.id, 0);
    } else {
      // End of queue
      setIsPlaying(false);
      setCurrentTrack(null);
      setCurrentTime(0);
      setDuration(0);
      setActivePlayer('none');
    }
  }

  // Implement smooth crossfading between tracks
  function startCrossfade(nextTrack) {
    if (isCrossfading.current) return;
    isCrossfading.current = true;
    console.debug(`Starting crossfade transition to next track: ${nextTrack.title}`);

    const durationMs = crossfadeDurationRef.current * 1000;
    const intervalTime = 100; // Step volume every 100ms
    const steps = durationMs / intervalTime;
    let currentStep = 0;

    const targetVol = volumeRef.current;

    // Set up the next track in the standby player
    if (nextTrack.source === 'upload') {
      if (standbyAudioRef.current) {
        standbyAudioRef.current.src = nextTrack.url;
        standbyAudioRef.current.currentTime = 0;
        standbyAudioRef.current.volume = 0;
        standbyAudioRef.current.play().catch(() => {});
      }
    } else if (nextTrack.source === 'youtube') {
      if (standbyYtPlayerRef.current && standbyYtPlayerRef.current.loadVideoById) {
        standbyYtPlayerRef.current.loadVideoById({
          videoId: nextTrack.url,
          startSeconds: 0,
        });
        standbyYtPlayerRef.current.setVolume(0);
        standbyYtPlayerRef.current.playVideo();
      }
    }

    const fadeInterval = setInterval(() => {
      currentStep++;
      const ratio = currentStep / steps;

      // Decrement active player volume
      if (activePlayer === 'html5' && audioRef.current) {
        audioRef.current.volume = targetVol * (1 - ratio);
      } else if (
        activePlayer === 'youtube' &&
        ytPlayerRef.current &&
        ytPlayerRef.current.setVolume
      ) {
        ytPlayerRef.current.setVolume(targetVol * (1 - ratio) * 100);
      }

      // Increment standby player volume
      if (nextTrack.source === 'upload' && standbyAudioRef.current) {
        standbyAudioRef.current.volume = targetVol * ratio;
      } else if (
        nextTrack.source === 'youtube' &&
        standbyYtPlayerRef.current &&
        standbyYtPlayerRef.current.setVolume
      ) {
        standbyYtPlayerRef.current.setVolume(targetVol * ratio * 100);
      }

      if (currentStep >= steps) {
        clearInterval(fadeInterval);

        // Complete the swap: Standby player becomes active
        pauseLocalPlayback(false); // Stop old active player

        // Swap HTML5 references
        if (nextTrack.source === 'upload') {
          const temp = audioRef.current;
          audioRef.current = standbyAudioRef.current;
          standbyAudioRef.current = temp;
          setActivePlayer('html5');
        } else if (nextTrack.source === 'youtube') {
          // Swap YouTube player references
          const temp = ytPlayerRef.current;
          ytPlayerRef.current = standbyYtPlayerRef.current;
          standbyYtPlayerRef.current = temp;
          setActivePlayer('youtube');
        }

        setCurrentTrack(nextTrack);
        setCurrentTime(0);
        setDuration(nextTrack.duration_seconds || 0);
        setIsPlaying(true);
        isCrossfading.current = false;

        // Broadcast the new track start
        if (!isRemoteAction.current) {
          broadcastPlay(nextTrack.id, 0);
        }
      }
    }, intervalTime);
  }

  // Change Volume
  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (activePlayer === 'html5' && audioRef.current) {
      audioRef.current.volume = newVolume;
    } else if (activePlayer === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      ytPlayerRef.current.setVolume(newVolume * 100);
    }
  };

  // Listen along / Unblock Autoplay
  const handleListenAlong = () => {
    setIsListenAlongBlocked(false);
    resumeLocalPlayback();
  };

  // Database Queue CRUD actions
  const addToQueue = async (title, artist, source, url, durationSeconds) => {
    if (!user) return;
    try {
      // Find max position index
      const maxPos = queue.reduce((max, track) => Math.max(max, track.position_index || 0), 0);

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
        })
        .select();

      if (error) {
        console.error('Error adding to database queue:', error);
        return;
      }

      // If nothing is playing, autoplay the newly added song
      if (!currentTrack && data && data.length > 0) {
        playTrackById(data[0].id, 0);
      }
    } catch (err) {
      console.error('Failed to add to database queue:', err);
    }
  };

  const removeFromQueue = async (trackId) => {
    try {
      // If deleted track is currently playing, skip or stop
      if (currentTrack && currentTrack.id === trackId) {
        handleTrackEnded();
      }

      const { error } = await supabase.from('music_queue').delete().eq('id', trackId);
      if (error) {
        console.error('Error deleting track:', error);
      }
    } catch (err) {
      console.error('Failed to delete track:', err);
    }
  };

  const reorderQueue = async (reorderedTracks) => {
    setQueue(reorderedTracks); // Optimistic UI update

    try {
      // Prepare batch updates
      const promises = reorderedTracks.map((track, index) => {
        return supabase.from('music_queue').update({ position_index: index }).eq('id', track.id);
      });

      await Promise.all(promises);
    } catch (err) {
      console.error('Failed to update reordered queue positions:', err);
    }
  };

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

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
