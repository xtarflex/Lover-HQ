import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMusic } from '../contexts/MusicContext';
import { Play, Pause } from '../lib/icons';
import { Radio, X, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { getTrackArtwork } from '../features/music/lib/musicUtils';
import GradientAvatar from './ui/GradientAvatar';
import EqBars from './ui/EqBars';

/**
 * Minimized MiniPlayer component that docks to the side and is draggable.
 *
 * @param {Object} props
 * @returns {React.ReactElement}
 */
function MinimizedMiniPlayer({
  currentTrack,
  isPlaying,
  artworkUrl,
  handleMaximize,
  handleClose,
  handlePlayPause,
  side,
  setSide,
}) {
  const x = useMotionValue(side === 'right' ? window.innerWidth - 96 : 0);
  const y = useMotionValue(0); // vertical offset relative to top-[300px]

  const handleDragEnd = (event, info) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const mid = screenWidth / 2;

    // Detect target side based on drag release point
    const targetSide = info.point.x < mid ? 'left' : 'right';
    setSide(targetSide);

    // Compute target position coordinates
    const targetX = targetSide === 'left' ? 0 : screenWidth - 96;
    // Clamp y between 60px (top safe zone) and screenHeight - 160px (bottom safe zone)
    const targetY = Math.max(60, Math.min(screenHeight - 160, info.point.y)) - 300;

    // Spring animate to snapped position
    animate(x, targetX, { type: 'spring', stiffness: 350, damping: 25 });
    animate(y, targetY, { type: 'spring', stiffness: 350, damping: 25 });
  };

  // Adjust horizontal position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (side === 'right') {
        x.set(window.innerWidth - 96);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [side, x]);

  return (
    <motion.div
      layoutId="miniplayer-container"
      style={{ x, y }}
      drag
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      onClick={handleMaximize}
      className="fixed z-50 w-24 top-[300px] left-0 cursor-pointer select-none touch-none"
    >
      {/* Glassmorphic curved dock card */}
      <div
        className={`relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl py-2.5 px-2 flex items-center transition-all duration-300 hover:bg-slate-900 ${
          side === 'left'
            ? 'rounded-r-3xl border-l-0 pr-3.5 pl-1.5'
            : 'rounded-l-3xl border-r-0 pl-3.5 pr-1.5 justify-end'
        }`}
      >
        {/* Sketch close button overlapping the card border */}
        <button
          onClick={handleClose}
          aria-label="Dismiss mini player"
          className={`absolute top-[-6px] w-5.5 h-5.5 rounded-full bg-slate-800 border border-slate-700 text-text-muted hover:bg-red-500 hover:text-white hover:border-red-600 flex items-center justify-center transition-all shadow-md z-20 ${
            side === 'left' ? 'right-[-6px]' : 'left-[-6px]'
          }`}
        >
          <X size={10} />
        </button>

        {side === 'left' ? (
          <>
            {/* Spinning Artwork Disc */}
            <motion.div
              layoutId="miniplayer-artwork"
              className="relative w-9 h-9 rounded-full border border-slate-600/50 overflow-hidden shadow-md flex-shrink-0 animate-[spin_6s_linear_infinite]"
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
            >
              {artworkUrl ? (
                <img
                  src={artworkUrl}
                  alt=""
                  className={`w-full h-full object-cover ${
                    currentTrack?.source === 'youtube' ? 'scale-[1.33]' : ''
                  }`}
                />
              ) : (
                <GradientAvatar seed={currentTrack.title} size={36} />
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full border border-slate-600" />
              </div>
            </motion.div>

            {/* Micro Play/Pause Control */}
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-text-main border border-slate-700 transition-colors flex-shrink-0"
            >
              {isPlaying ? (
                <Pause size={12} className="text-primary fill-primary" />
              ) : (
                <Play size={12} className="text-primary fill-primary ml-0.5" />
              )}
            </button>
          </>
        ) : (
          <>
            {/* Micro Play/Pause Control */}
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-text-main border border-slate-700 transition-colors flex-shrink-0 mr-2"
            >
              {isPlaying ? (
                <Pause size={12} className="text-primary fill-primary" />
              ) : (
                <Play size={12} className="text-primary fill-primary ml-0.5" />
              )}
            </button>

            {/* Spinning Artwork Disc */}
            <motion.div
              layoutId="miniplayer-artwork"
              className="relative w-9 h-9 rounded-full border border-slate-600/50 overflow-hidden shadow-md flex-shrink-0 animate-[spin_6s_linear_infinite]"
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
            >
              {artworkUrl ? (
                <img
                  src={artworkUrl}
                  alt=""
                  className={`w-full h-full object-cover ${
                    currentTrack?.source === 'youtube' ? 'scale-[1.33]' : ''
                  }`}
                />
              ) : (
                <GradientAvatar seed={currentTrack.title} size={36} />
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full border border-slate-600" />
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Global MiniPlayer component. A glassmorphic floating bar that appears above
 * BottomNav when music is active and the user is outside the Music Room.
 * Slides in and morphs smoothly into a side sticky pill when minimized.
 *
 * @returns {React.ReactElement|null}
 */
export function MiniPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentTrack,
    currentTime,
    duration,
    isPlaying,
    isListenAlongBlocked,
    pauseLocalPlayback,
    resumeLocalPlayback,
    handleListenAlong,
  } = useMusic();

  const [isClosed, setIsClosed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [side, setSide] = useState('right');
  const [lastTrackId, setLastTrackId] = useState(null);

  // Auto-restore and show MiniPlayer on track change
  useEffect(() => {
    if (currentTrack?.id && currentTrack.id !== lastTrackId) {
      setIsClosed(false);
      setIsMinimized(false);
      setLastTrackId(currentTrack.id);
    }
  }, [currentTrack, lastTrackId]);

  if (!currentTrack || isClosed || location.pathname === '/music') return null;

  const artworkUrl = getTrackArtwork(currentTrack);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayPause = (e) => {
    e.stopPropagation();
    isPlaying ? pauseLocalPlayback() : resumeLocalPlayback();
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsClosed(true);
    pauseLocalPlayback();
  };

  return (
    <AnimatePresence initial={false}>
      {!isMinimized ? (
        <motion.div
          key="maximized"
          layoutId="miniplayer-container"
          role="region"
          aria-label="Mini player"
          onClick={() => navigate('/music')}
          className="mini-player-bar fixed bottom-20 left-4 right-4 max-w-[calc(100%-2rem)] md:max-w-lg md:left-1/2 md:-translate-x-1/2 z-40 cursor-pointer"
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        >
          {/* Glassmorphic card */}
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl overflow-hidden transition-all duration-300 hover:bg-slate-900/90">
            {/* 2px progress bar at bottom */}
            <div
              className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-primary via-pink-500 to-violet-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={Math.floor(currentTime)}
              aria-valuemin={0}
              aria-valuemax={Math.floor(duration)}
              aria-label={`Playback: ${Math.round(progress)}%`}
            />

            {/* Ambient colour tint from track artwork */}
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

            {/* Left: vinyl/artwork + track info */}
            <div className="flex items-center space-x-3 overflow-hidden flex-1 mr-3 z-10">
              {/* Artwork disc — spin when playing */}
              <motion.div
                layoutId="miniplayer-artwork"
                className="relative w-10 h-10 rounded-full border border-slate-600/50 flex-shrink-0 overflow-hidden shadow-md animate-[spin_6s_linear_infinite]"
                style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                aria-hidden="true"
              >
                {artworkUrl ? (
                  <img
                    src={artworkUrl}
                    alt=""
                    className={`w-full h-full object-cover ${
                      currentTrack?.source === 'youtube' ? 'scale-[1.33]' : ''
                    }`}
                  />
                ) : (
                  <GradientAvatar seed={currentTrack.title} size={40} />
                )}
                {/* Spindle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-2 h-2 bg-slate-900 rounded-full border border-slate-600" />
                </div>
              </motion.div>

              {/* Title & artist */}
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-sm font-bold text-text-main truncate font-rounded">
                  {currentTrack.title}
                </span>
                <span className="text-xs text-text-muted truncate">
                  {currentTrack.artist || 'Unknown Artist'}
                </span>
              </div>

              {/* EQ bars next to title when playing */}
              {isPlaying && !isListenAlongBlocked && (
                <EqBars size="sm" color="text-primary" paused={false} className="flex-shrink-0" />
              )}
            </div>

            {/* Right: controls */}
            <div className="flex items-center space-x-2 flex-shrink-0 z-10">
              {isListenAlongBlocked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleListenAlong();
                  }}
                  aria-label="Tap to listen along"
                  className="flex items-center space-x-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary px-3 py-1.5 rounded-full text-xs font-bold animate-pulse"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Listen Along</span>
                </button>
              )}

              {/* Minimize Button */}
              <button
                onClick={handleMinimize}
                aria-label="Minimize mini player"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-text-muted hover:text-text-main border border-slate-700 transition-colors"
              >
                <Minimize2 size={14} />
              </button>

              {/* Play/Pause Button */}
              {!isListenAlongBlocked && (
                <button
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-text-main border border-slate-700 transition-colors"
                >
                  {isPlaying ? (
                    <Pause size={16} className="text-primary fill-primary" />
                  ) : (
                    <Play size={16} className="text-primary fill-primary ml-0.5" />
                  )}
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={handleClose}
                aria-label="Close mini player"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center text-text-muted border border-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <MinimizedMiniPlayer
          key="minimized"
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          artworkUrl={artworkUrl}
          handleMaximize={handleMaximize}
          handleClose={handleClose}
          handlePlayPause={handlePlayPause}
          side={side}
          setSide={setSide}
        />
      )}
    </AnimatePresence>
  );
}
