import React, { useEffect, useRef } from 'react';
import { useMusic } from '../../../contexts/MusicContext';
import { useAppContext } from '../../../contexts/AppContext';
import { Play, Pause } from '../../../lib/icons';
import { formatTime } from '../lib/musicEngine';
import {
  Volume2,
  VolumeX,
  SkipForward,
  ChevronRight,
  Disc,
  Music,
  Tv,
  User,
  Sliders,
} from 'lucide-react';

/**
 * MusicPlayer dashboard component. Renders the interactive, glassmorphic
 * audio dashboard including a rotating vinyl record, a canvas-based audio wave
 * visualizer, progress seek bar, volume control, and DJ info.
 *
 * @returns {React.ReactElement} The MusicPlayer component.
 */
export default function MusicPlayer() {
  const { user, partner } = useAppContext();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    crossfadeDuration,
    setCrossfadeDuration,
    pauseLocalPlayback,
    resumeLocalPlayback,
    seekLocalPlayback,
    changeVolume,
    queue,
    playTrackById,
  } = useMusic();

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Skip to next track helper
  const handleSkipNext = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playTrackById(queue[currentIndex + 1].id, 0);
    }
  };

  // Determine who is the "DJ" (uploader) of the active track
  const getDJNameAndAvatar = () => {
    if (!currentTrack) return { name: '', avatar: null };
    if (user && currentTrack.added_by === user.id) {
      return { name: 'You', avatar: user.avatar_url };
    }
    if (partner && currentTrack.added_by === partner.id) {
      return { name: partner.name, avatar: partner.avatar_url };
    }
    return { name: 'Partner', avatar: null };
  };

  const djInfo = getDJNameAndAvatar();

  // Render simulated frequency wave on Canvas during active playback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 80;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 40;
      const barWidth = canvas.width / numBars - 4;
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#F59E0B'); // Warm Gold
      gradient.addColorStop(1, '#EC4899'); // Rose Pink

      ctx.fillStyle = gradient;

      for (let i = 0; i < numBars; i++) {
        // Calculate a wave height using sine waves, modified by whether audio is playing
        let amplitude = 5;
        if (isPlaying) {
          amplitude = 15 * Math.sin(i * 0.15 + phase) + 10 * Math.sin(i * 0.35 + phase * 1.5) + 20;
          // Soft random fluctuation to make it feel organic
          amplitude += Math.random() * 5;
        } else {
          // Flatten down to a idle hum wave
          amplitude = 4 + Math.sin(i * 0.2 + phase * 0.1) * 2;
        }

        // Clip height within bounds
        const barHeight = Math.min(canvas.height, Math.max(2, amplitude));
        const x = i * (barWidth + 4);
        const y = canvas.height - barHeight;

        // Draw rounded bar
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 3);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      phase += isPlaying ? 0.08 : 0.01;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    // Adjust canvas size on resize
    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying]);

  return (
    <div className="bg-surface/40 backdrop-blur-lg border border-surface-border rounded-2xl p-6 flex flex-col items-center shadow-2xl relative overflow-hidden w-full max-w-md mx-auto">
      {/* Background ambient glow */}
      <div
        className={`absolute -top-24 -left-24 w-48 h-48 rounded-full bg-primary/10 blur-[80px] transition-all duration-1000 ${
          isPlaying ? 'opacity-100 scale-125' : 'opacity-40 scale-100'
        }`}
      />
      <div
        className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-pink-500/10 blur-[80px] transition-all duration-1000 ${
          isPlaying ? 'opacity-100 scale-125' : 'opacity-40 scale-100'
        }`}
      />

      {/* Title & DJ info */}
      <div className="text-center w-full z-10 mb-4">
        {currentTrack ? (
          <>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-surface-border/40 backdrop-blur-md rounded-full border border-surface-border/60 text-xs text-text-muted mb-3">
              {currentTrack.source === 'upload' ? (
                <Disc className="w-3.5 h-3.5 text-primary animate-pulse" />
              ) : (
                <Tv className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              )}
              <span className="capitalize">{currentTrack.source}</span>
            </div>
            <h2 className="text-xl font-bold text-text-main font-rounded truncate px-4">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-text-muted mt-1 truncate px-4">
              {currentTrack.artist || 'Unknown Artist'}
            </p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto mb-3">
              <Music className="w-5 h-5 text-text-muted" />
            </div>
            <h2 className="text-lg font-bold text-text-main font-rounded">Music Room Empty</h2>
            <p className="text-sm text-text-muted mt-1">Add a song below to get started!</p>
          </>
        )}
      </div>

      {/* Rotating Vinyl Record */}
      <div className="relative my-4 z-10 flex justify-center items-center w-56 h-56">
        <div
          className={`w-full h-full rounded-full bg-gradient-to-r from-slate-900 via-black to-slate-900 border-4 border-slate-800 shadow-2xl flex items-center justify-center relative ${
            isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''
          }`}
        >
          {/* Vinyl grooves styling */}
          <div className="absolute inset-4 rounded-full border border-slate-800/40" />
          <div className="absolute inset-8 rounded-full border border-slate-800/30" />
          <div className="absolute inset-12 rounded-full border border-slate-800/20" />
          <div className="absolute inset-16 rounded-full border border-slate-800/10" />

          {/* Center record label */}
          <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center overflow-hidden relative">
            {djInfo.avatar ? (
              <img
                src={djInfo.avatar}
                alt={djInfo.name}
                className="w-full h-full object-cover transform rotate-0"
              />
            ) : (
              <Disc className="w-10 h-10 text-primary" />
            )}
            {/* Record spindle center pin */}
            <div className="absolute w-3.5 h-3.5 bg-background rounded-full border border-slate-700 shadow-inner" />
          </div>
        </div>

        {/* Small floating notes if playing */}
        {isPlaying && (
          <>
            <span className="absolute text-primary text-xl animate-[bounce_2s_infinite] top-0 left-4 opacity-75">
              🎵
            </span>
            <span className="absolute text-pink-500 text-lg animate-[bounce_1.5s_infinite_0.5s] top-6 right-4 opacity-75">
              🎶
            </span>
          </>
        )}
      </div>

      {/* Waveform Canvas */}
      <div className="w-full mt-2 z-10 flex justify-center">
        <canvas ref={canvasRef} className="w-full opacity-80" />
      </div>

      {/* Progress slider bar */}
      <div className="w-full mt-4 z-10">
        <div className="flex justify-between text-xs text-text-muted mb-1 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime || 0}
          disabled={!currentTrack}
          onChange={(e) => seekLocalPlayback(parseFloat(e.target.value))}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
        />
      </div>

      {/* Playback controls row */}
      <div className="flex items-center justify-center space-x-6 mt-6 z-10 w-full">
        {/* Previous Placeholder/Reset */}
        <button
          disabled={!currentTrack}
          onClick={() => seekLocalPlayback(0)}
          className="w-10 h-10 rounded-full border border-slate-700/60 flex items-center justify-center text-text-muted hover:text-text-main transition-colors disabled:opacity-50"
        >
          <span className="transform rotate-180">
            <ChevronRight className="w-5 h-5" />
          </span>
        </button>

        {/* Play/Pause control */}
        <button
          disabled={!currentTrack}
          onClick={() => (isPlaying ? pauseLocalPlayback() : resumeLocalPlayback())}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center text-white border-2 border-primary/20 shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isPlaying ? (
            <Pause size={24} className="fill-white" />
          ) : (
            <Play size={24} className="fill-white ml-1" />
          )}
        </button>

        {/* Skip track control */}
        <button
          disabled={
            !currentTrack || queue.findIndex((t) => t.id === currentTrack.id) >= queue.length - 1
          }
          onClick={handleSkipNext}
          className="w-10 h-10 rounded-full border border-slate-700/60 flex items-center justify-center text-text-muted hover:text-text-main transition-colors disabled:opacity-50"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Footer controls: Volume and Crossfade */}
      <div className="w-full border-t border-surface-border/60 mt-6 pt-5 z-10 flex flex-col space-y-4">
        {/* Volume controls */}
        <div className="flex items-center space-x-3 text-text-muted">
          <button
            onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
            className="hover:text-text-main transition-colors"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => changeVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
          />
        </div>

        {/* Crossfade controls */}
        <div className="flex items-center justify-between text-xs text-text-muted border-t border-slate-800/40 pt-3">
          <div className="flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span className="font-rounded font-bold text-text-main">Crossfade:</span>
            <span>{crossfadeDuration}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={crossfadeDuration}
            onChange={(e) => setCrossfadeDuration(parseInt(e.target.value))}
            className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
          />
        </div>

        {/* Active DJ identifier */}
        {currentTrack && (
          <div className="flex items-center justify-center space-x-2 text-[10px] text-text-muted bg-slate-900/50 py-1.5 px-3 rounded-full border border-slate-800/50 w-fit mx-auto">
            <User className="w-3 h-3 text-primary" />
            <span>Queued by:</span>
            <span className="font-bold text-primary font-rounded">{djInfo.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
