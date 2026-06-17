import React, { useEffect, useRef, useCallback } from 'react';
import { useMusic } from '../../../contexts/MusicContext';
import { useAppContext } from '../../../contexts/AppContext';
import { Play, Pause, YoutubeIcon } from '../../../lib/icons';
import { formatTime } from '../lib/musicEngine';
import { getTrackArtwork } from '../lib/musicUtils';
import GradientAvatar from '../../../components/ui/GradientAvatar';
import {
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Disc,
  Music,
  Sliders,
} from 'lucide-react';

/** Single music note SVG provided by the user. */
const MusicNoteSvg = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M14.3187 2.50498C13.0514 2.35716 11.8489 3.10033 11.4144 4.29989C11.3165 4.57023 11.2821 4.86251 11.266 5.16888C11.2539 5.40001 11.2509 5.67552 11.2503 6L11.25 6.45499V14.5359C10.4003 13.7384 9.25721 13.25 8 13.25C5.37665 13.25 3.25 15.3766 3.25 18C3.25 20.6234 5.37665 22.75 8 22.75C10.6234 22.75 12.75 20.6234 12.75 18V9.21059C12.8548 9.26646 12.9683 9.32316 13.0927 9.38527L15.8002 10.739C16.2185 10.9481 16.5589 11.1183 16.8378 11.2399C17.119 11.3625 17.3958 11.4625 17.6814 11.4958C18.9486 11.6436 20.1511 10.9004 20.5856 9.70089C20.6836 9.43055 20.7179 9.13826 20.7341 8.83189C20.75 8.52806 20.75 8.14752 20.75 7.67988L20.7501 7.59705C20.7502 7.2493 20.7503 6.97726 20.701 6.71946C20.574 6.05585 20.2071 5.46223 19.6704 5.05185L19.2185 4.77088L16.1999 3.26179C15.7816 3.05264 15.4412 2.88244 15.1623 2.76086C14.8811 2.63826 14.6043 2.53829 14.3187 2.50498Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * MusicPlayer dashboard component. Renders the interactive glassmorphic audio
 * dashboard with a rotating vinyl record, a real Web Audio API frequency
 * visualizer, progress/volume sliders, and playback controls.
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
    analyserNode,
  } = useMusic();

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const analyserRef = useRef(analyserNode);

  // Keep refs current for use inside rAF callbacks
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { analyserRef.current = analyserNode; }, [analyserNode]);

  /** Navigates one track backward (restarts if <3 s in), or seeks to 0. */
  const handleSkipBack = () => {
    if (!currentTrack) return;
    if (currentTime > 3) { seekLocalPlayback(0); return; }
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx > 0) playTrackById(queue[idx - 1].id, 0);
    else seekLocalPlayback(0);
  };

  /** Navigates to the next track in queue. */
  const handleSkipNext = () => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx !== -1 && idx < queue.length - 1) playTrackById(queue[idx + 1].id, 0);
  };

  /** Returns who added the current track. */
  const getDJInfo = () => {
    if (!currentTrack) return { name: '', id: null };
    if (user && currentTrack.added_by === user.id) return { name: 'You', id: user.id };
    if (partner && currentTrack.added_by === partner.id) return { name: partner.name, id: partner.id };
    return { name: 'Partner', id: null };
  };

  const djInfo = getDJInfo();
  const artworkUrl = currentTrack ? getTrackArtwork(currentTrack) : null;

  // ─── Canvas visualizer ──────────────────────────────────────────────────────
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const playing = isPlayingRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const numBars = 48;
    const gap = 3;
    const barWidth = Math.max(2, (canvas.width - gap * (numBars - 1)) / numBars);

    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, '#F59E0B');   // amber
    gradient.addColorStop(0.5, '#EC4899'); // rose
    gradient.addColorStop(1, '#8B5CF6');   // violet
    ctx.fillStyle = gradient;

    // Respect prefers-reduced-motion: freeze bars for accessibility
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (analyser && playing && !prefersReduced) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      const binStep = Math.floor(dataArray.length / numBars);

      for (let i = 0; i < numBars; i++) {
        const value = dataArray[i * binStep] / 255;
        const barHeight = Math.max(2, value * canvas.height);
        const x = i * (barWidth + gap);
        const y = canvas.height - barHeight;
        ctx.beginPath();
        ctx.roundRect?.(x, y, barWidth, barHeight, 2) ?? ctx.rect(x, y, barWidth, barHeight);
        ctx.fill();
      }
    } else {
      // Breathing idle animation (or reduced-motion static state)
      const phase = Date.now() / (prefersReduced ? Infinity : 1200);
      for (let i = 0; i < numBars; i++) {
        const breathe = prefersReduced ? 0.15 : 0.1 + 0.05 * Math.sin(i * 0.4 + phase);
        const barHeight = Math.max(2, breathe * canvas.height);
        const x = i * (barWidth + gap);
        const y = canvas.height - barHeight;
        ctx.beginPath();
        ctx.roundRect?.(x, y, barWidth, barHeight, 2) ?? ctx.rect(x, y, barWidth, barHeight);
        ctx.fill();
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.height = 80;

    const loop = () => {
      // Pause rAF when tab is hidden to save CPU (fix #23)
      if (document.visibilityState === 'hidden') {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }
      drawFrame();
      animationRef.current = requestAnimationFrame(loop);
    };

    // fix #29: ResizeObserver for accurate initial sizing and resize handling (fix #40)
    const observer = new ResizeObserver(([entry]) => {
      if (canvas) canvas.width = entry.contentRect.width;
    });
    observer.observe(canvas.parentElement);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !animationRef.current) {
        animationRef.current = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [drawFrame]);

  const hasPrev = currentTrack && queue.findIndex((t) => t.id === currentTrack.id) > 0;
  const hasNext = currentTrack &&
    queue.findIndex((t) => t.id === currentTrack.id) < queue.length - 1;

  return (
    <div className="music-glass-card rounded-2xl p-6 flex flex-col items-center shadow-2xl relative overflow-hidden w-full max-w-md mx-auto">
      {/* Ambient glow orbs */}
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

      {/* Track title & source badge */}
      <div className="text-center w-full z-10 mb-4">
        {currentTrack ? (
          <>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-surface-border/40 backdrop-blur-md rounded-full border border-surface-border/60 text-xs text-text-muted mb-3">
              {currentTrack.source === 'upload' ? (
                <Disc className="w-3.5 h-3.5 text-primary animate-pulse" />
              ) : (
                <YoutubeIcon className="w-3.5 h-3.5 animate-pulse" />
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

      {/* Rotating vinyl record — artwork in centre, angle preserved via animation-play-state (fix #43) */}
      <div className="relative my-4 z-10 flex justify-center items-center w-56 h-56">
        <div
          className="w-full h-full rounded-full bg-gradient-to-r from-slate-900 via-black to-slate-900 border-4 border-slate-800 shadow-2xl flex items-center justify-center relative animate-[spin_10s_linear_infinite]"
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        >
          {/* Vinyl groove rings */}
          <div className="absolute inset-4 rounded-full border border-slate-700/40" />
          <div className="absolute inset-8 rounded-full border border-slate-700/30" />
          <div className="absolute inset-12 rounded-full border border-slate-700/20" />
          <div className="absolute inset-16 rounded-full border border-slate-700/10" />

          {/* Centre label — track artwork or deterministic gradient avatar */}
          <div className="w-20 h-20 rounded-full border-2 border-primary/40 flex items-center justify-center overflow-hidden relative bg-slate-900">
            {artworkUrl ? (
              <img
                src={artworkUrl}
                alt={currentTrack?.title || 'Track artwork'}
                className={`w-full h-full object-cover ${
                  currentTrack?.source === 'youtube' ? 'scale-[1.33]' : ''
                }`}
              />
            ) : (
              <GradientAvatar seed={currentTrack?.title || 'empty'} size={80} />
            )}
            {/* Spindle (only render when showing artwork to avoid covering the fallback icon) */}
            {artworkUrl && (
              <div className="absolute w-3.5 h-3.5 bg-background rounded-full border border-slate-700 shadow-inner" />
            )}
          </div>
        </div>

        {/* Floating music notes (SVG, not emoji) — respect reduced-motion */}
        {isPlaying && (
          <>
            <MusicNoteSvg className="absolute text-primary w-5 h-5 top-0 left-4 opacity-75 animate-[bounce_2s_infinite] motion-reduce:animate-none" />
            <MusicNoteSvg className="absolute text-pink-500 w-4 h-4 top-6 right-4 opacity-75 animate-[bounce_1.5s_infinite_0.5s] motion-reduce:animate-none" />
          </>
        )}
      </div>

      {/* Web Audio frequency visualizer canvas */}
      <div className="w-full mt-2 z-10">
        <canvas
          ref={canvasRef}
          className="w-full opacity-80"
          aria-hidden="true"
        />
      </div>

      {/* Progress bar */}
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
          aria-label="Playback progress"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Math.floor(currentTime)}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center space-x-6 mt-6 z-10 w-full">
        <button
          disabled={!hasPrev && !currentTrack}
          onClick={handleSkipBack}
          aria-label="Previous track or restart"
          className="w-10 h-10 rounded-full border border-slate-700/60 flex items-center justify-center text-text-muted hover:text-text-main transition-colors disabled:opacity-50"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          disabled={!currentTrack}
          onClick={() => (isPlaying ? pauseLocalPlayback() : resumeLocalPlayback())}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center text-white border-2 border-primary/20 shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isPlaying ? (
            <Pause size={24} className="fill-white" />
          ) : (
            <Play size={24} className="fill-white ml-1" />
          )}
        </button>

        <button
          disabled={!hasNext}
          onClick={handleSkipNext}
          aria-label="Next track"
          className="w-10 h-10 rounded-full border border-slate-700/60 flex items-center justify-center text-text-muted hover:text-text-main transition-colors disabled:opacity-50"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Footer: volume + crossfade + DJ badge */}
      <div className="w-full border-t border-surface-border/60 mt-6 pt-5 z-10 flex flex-col space-y-4">
        {/* Volume */}
        <div className="flex items-center space-x-3 text-text-muted">
          <button
            onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            className="hover:text-text-main transition-colors flex-shrink-0"
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
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={volume}
            aria-valuetext={`${Math.round(volume * 100)}%`}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {/* Crossfade */}
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
            aria-label="Crossfade duration in seconds"
            className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
          />
        </div>

        {/* DJ badge */}
        {currentTrack && (
          <div className="flex items-center justify-center space-x-2 text-[10px] text-text-muted bg-slate-900/50 py-1.5 px-3 rounded-full border border-slate-800/50 w-fit mx-auto">
            <Disc className="w-3 h-3 text-primary" />
            <span>Queued by:</span>
            <span className="font-bold text-primary font-rounded">{djInfo.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
