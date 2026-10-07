/**
 * @file HeroCard.jsx
 * @description Row 1 full-width Bento hero module.
 *
 * Implements:
 * - State A (Active/Paused Audio): Mobile lockscreen-style notification panel with full-bleed
 *   track artwork backdrop, dimmed scrim overlay, fluid SVG gooey audio visualizer,
 *   and responsive playback controls (Play/Pause, Skip Next, Skip Previous, Scrubber).
 * - State B (Idle Audio): Warm intimate romantic greeting with days-together milestone.
 *
 * Lifecycle Criteria:
 * - Upon initial login / load, Hero begins in State B (Greeting).
 * - When audio starts playing, switches immediately to State A.
 * - When audio is paused, remains in State A for a graceful grace period (45 seconds) before
 *   reverting back to State B. Resuming resets the timer.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Heart } from 'lucide-react';
import { useMusic } from '../../../contexts/MusicContext';
import { useAppContext } from '../../../contexts/AppContext';
import {
  getTrackArtwork,
  findQueueTrackIndex,
  isYouTubeThumbnail,
} from '../../music/lib/musicUtils';
import { AndroidWaveScrubber } from './AndroidWaveScrubber';
import { useNavigate } from 'react-router-dom';

const PAUSE_TIMEOUT_MS = 45000; // 45 seconds

/**
 * Hero Card component for Dashboard Row 1.
 *
 * @returns {React.ReactElement}
 */
export function HeroCard() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    pauseLocalPlayback,
    resumeLocalPlayback,
    seekLocalPlayback,
    playTrackById,
    queue = [],
    accentColor,
    fallbackBackdrop,
  } = useMusic();
  const { user, partner } = useAppContext();
  const navigate = useNavigate();

  // Track whether State A should persist during a pause grace period
  const [showStateAOnPause, setShowStateAOnPause] = useState(false);

  // Manage State A vs State B active criteria gracefully
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        setShowStateAOnPause(true);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      // Audio paused: linger in State A for 45s, then return to State B
      const timer = setTimeout(() => {
        setShowStateAOnPause(false);
      }, PAUSE_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }
  }, [isPlaying]);

  const isStateAActive = Boolean(currentTrack && (isPlaying || showStateAOnPause));

  // Artwork & Backdrop handling matching NowPlayingFace.jsx
  const artworkUrl = useMemo(() => {
    return currentTrack ? getTrackArtwork(currentTrack) : null;
  }, [currentTrack]);

  const backdropSrc = artworkUrl || fallbackBackdrop || '/backdrops/backdrop-1.png';

  // Initialize days together once safely in state to keep rendering pure
  const [daysTogether] = useState(() => {
    if (!user?.created_at) return 42;
    const userTime = new Date(user.created_at).getTime();
    const nowTime = new Date().getTime();
    return Math.max(1, Math.floor((nowTime - userTime) / (1000 * 60 * 60 * 24)));
  });

  // Playback Control Handlers
  const handleTogglePlay = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      pauseLocalPlayback();
    } else {
      resumeLocalPlayback();
    }
  };

  const currentQueueIndex = findQueueTrackIndex(queue, currentTrack);
  const hasPrev = currentTrack && (currentQueueIndex > 0 || currentTime > 3);
  const hasNext = currentTrack && currentQueueIndex !== -1 && currentQueueIndex < queue.length - 1;

  const handlePrevious = (e) => {
    e.stopPropagation();
    if (!currentTrack) return;
    if (currentTime > 3) {
      seekLocalPlayback(0);
      return;
    }
    const idx = findQueueTrackIndex(queue, currentTrack);
    if (idx > 0) {
      const prevTrack = queue[idx - 1];
      playTrackById(prevTrack.queue_row_id || prevTrack.id, 0);
    } else {
      seekLocalPlayback(0);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (!currentTrack || queue.length === 0) return;
    const idx = findQueueTrackIndex(queue, currentTrack);
    if (idx !== -1 && idx < queue.length - 1) {
      const nextTrack = queue[idx + 1];
      playTrackById(nextTrack.queue_row_id || nextTrack.id, 0);
    } else if (queue.length > 0) {
      const firstTrack = queue[0];
      playTrackById(firstTrack.queue_row_id || firstTrack.id, 0);
    }
  };

  // ─── STATE A: Active or Paused Media (Lockscreen Notification Panel) ────────
  if (isStateAActive && currentTrack) {
    return (
      <div
        onClick={() => navigate('/music')}
        className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-surface-border/80 bg-slate-950 cursor-pointer select-none group"
      >
        {/* Full-bleed track artwork background with dark scrim, matching NowPlayingFace scale */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={backdropSrc}
            alt={currentTrack.title || 'Track Art'}
            className={`w-full h-full object-cover filter blur-[2px] transition-transform duration-700 group-hover:scale-105 ${
              isYouTubeThumbnail(currentTrack, artworkUrl) ? 'scale-[1.33]' : 'scale-100'
            }`}
          />
        </div>

        {/* Dimmed multi-stop scrim overlay matching mobile OS notifications */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/40 backdrop-blur-[1px]" />

        {/* Fluid SVG Gooey Audio Visualizer with Seamless Closed-Loop Keyframes */}
        <div className="absolute top-4 right-4 pointer-events-none opacity-80 z-10 flex items-center gap-1.5">
          <svg className="w-16 h-8 overflow-visible" viewBox="0 0 60 30">
            <defs>
              <filter id="hero-gooey">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -6"
                  result="goo"
                />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
              </filter>
            </defs>
            <g filter="url(#hero-gooey)">
              <motion.circle
                cx="15"
                cy="15"
                r={isPlaying ? 7 : 6}
                fill={accentColor || '#f43f5e'}
                animate={
                  isPlaying ? { r: [6, 9.5, 7.5, 6], cy: [15, 12, 18, 15] } : { r: 6, cy: 15 }
                }
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              />
              <motion.circle
                cx="30"
                cy="15"
                r={isPlaying ? 9 : 7}
                fill="#fb923c"
                animate={
                  isPlaying ? { r: [7.5, 11, 8.5, 7.5], cx: [30, 26, 34, 30] } : { r: 7, cx: 30 }
                }
                transition={{ repeat: Infinity, duration: 1.9, ease: 'easeInOut' }}
              />
              <motion.circle
                cx="45"
                cy="15"
                r={isPlaying ? 6.5 : 5}
                fill="#f59e0b"
                animate={
                  isPlaying ? { r: [5, 8.5, 6.5, 5], cy: [15, 17, 12, 15] } : { r: 5, cy: 15 }
                }
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              />
            </g>
          </svg>
        </div>

        {/* Foreground Content */}
        <div className="relative z-20 p-4 sm:p-5 flex flex-col justify-between min-h-[140px] sm:min-h-[155px]">
          {/* Track Info */}
          <div className="max-w-[75%] pr-2">
            <h2 className="text-base sm:text-lg font-heading font-extrabold text-white truncate drop-shadow-md">
              {currentTrack.title || 'Untitled Track'}
            </h2>
            <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
              {currentTrack.artist || 'Unknown Artist'}
            </p>
          </div>

          {/* Android Squiggly Media Scrubber (7px default, 8px hover, upward wave animation) */}
          <div className="mt-2 w-full" onClick={(e) => e.stopPropagation()}>
            <AndroidWaveScrubber
              duration={duration}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onSeek={(newTime) => seekLocalPlayback(newTime)}
              accentColor={accentColor}
            />
          </div>

          {/* Controls Bar */}
          <div
            className="flex items-center justify-end gap-2.5 mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handlePrevious}
              disabled={!hasPrev}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={handleTogglePlay}
              className="w-10 h-10 rounded-full text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
              style={{
                background: accentColor
                  ? `linear-gradient(135deg, ${accentColor}, color-mix(in oklch, ${accentColor} 60%, rgb(var(--primary))))`
                  : 'linear-gradient(135deg, #f43f5e, #fb923c)',
                boxShadow: `0 4px 16px ${
                  accentColor
                    ? `color-mix(in srgb, ${accentColor} 40%, transparent)`
                    : 'rgba(244, 63, 94, 0.4)'
                }`,
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNext && queue.length <= 1}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STATE B: Ambient Greeting Milestone ───────────────────────────────────
  return (
    <div
      onClick={() => navigate('/music')}
      className="relative w-full rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-surface/85 via-surface/65 to-rose-950/20 border border-surface-border shadow-xl backdrop-blur-xl cursor-pointer select-none overflow-hidden group"
    >
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1.5">
            <Heart className="w-3.5 h-3.5 fill-rose-400/40 text-rose-400" />
            <span>Day {daysTogether} Together</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-heading font-extrabold text-text-main">
            {partner
              ? `Welcome home, ${user?.name || 'Love'} & ${partner.name}`
              : `Welcome home, ${user?.name || 'Love'}`}
          </h2>
          <p className="text-xs text-text-muted mt-1 max-w-sm">
            Ready to play a song together or leave a sweet note?
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (currentTrack) {
              resumeLocalPlayback();
            } else {
              navigate('/music');
            }
          }}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 active:scale-95 transition-transform shadow-inner cursor-pointer"
          aria-label="Play music"
        >
          <Play className="w-5 h-5 ml-0.5 fill-primary" />
        </button>
      </div>
    </div>
  );
}

export default HeroCard;
