import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMusic } from '../contexts/MusicContext';
import { Play, Pause } from '../lib/icons';
import { Music, Radio } from 'lucide-react';

/**
 * Global MiniPlayer component. Renders a floating, glassmorphic bar
 * directly above the BottomNav when music is active and the user
 * is not in the Music Room.
 *
 * @returns {React.ReactElement|null} The MiniPlayer component.
 */
export function MiniPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentTrack,
    isPlaying,
    isListenAlongBlocked,
    pauseLocalPlayback,
    resumeLocalPlayback,
    handleListenAlong,
  } = useMusic();

  // Do not render if there's no active track, or if we're already in the Music Room
  if (!currentTrack || location.pathname === '/music') {
    return null;
  }

  const handlePlayPause = (e) => {
    e.stopPropagation(); // Prevent navigating when clicking play/pause
    if (isPlaying) {
      pauseLocalPlayback();
    } else {
      resumeLocalPlayback();
    }
  };

  return (
    <div
      onClick={() => navigate('/music')}
      className="fixed bottom-20 left-4 right-4 max-w-[calc(100%-2rem)] md:max-w-lg md:left-1/2 md:-translate-x-1/2 z-40 bg-surface/90 backdrop-blur-md border-t border-x border-surface-border rounded-t-2xl px-4 py-3 flex items-center justify-between shadow-xl cursor-pointer transition-all duration-300 hover:bg-surface/95"
    >
      <div className="flex items-center space-x-3 overflow-hidden flex-1 mr-4">
        {/* Spinning avatar/disc preview */}
        <div className="relative w-10 h-10 rounded-full bg-slate-900 border border-slate-700/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <div
            className={`w-full h-full flex items-center justify-center ${
              isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
            }`}
          >
            <Music className="w-5 h-5 text-primary" />
          </div>
          {/* Center spindle point */}
          <div className="absolute w-2 h-2 bg-background rounded-full border border-slate-700" />
        </div>

        {/* Track Title and Artist */}
        <div className="flex flex-col overflow-hidden min-w-0">
          <span className="text-sm font-bold text-text-main truncate font-rounded">
            {currentTrack.title}
          </span>
          <span className="text-xs text-text-muted truncate">
            {currentTrack.artist || 'Unknown Artist'}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {isListenAlongBlocked ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleListenAlong();
            }}
            className="flex items-center space-x-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary px-3 py-1.5 rounded-full text-xs font-bold animate-pulse"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Listen Along</span>
          </button>
        ) : (
          <button
            onClick={handlePlayPause}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-text-main border border-slate-700 transition-colors"
          >
            {isPlaying ? (
              <Pause size={16} className="text-primary fill-primary" />
            ) : (
              <Play size={16} className="text-primary fill-primary ml-0.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
