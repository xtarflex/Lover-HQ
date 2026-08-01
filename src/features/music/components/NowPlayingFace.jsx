import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ListOrdered } from 'lucide-react';
import { SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Play, Pause } from '../../../lib/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusic } from '../../../contexts/MusicContext';
import { formatTime } from '../lib/musicEngine';
import { getTrackArtwork } from '../lib/musicUtils';
import FloatingQueuePanel from './FloatingQueuePanel';
import FluidVisualizer from './visualizers/FluidVisualizer';
import WaveBarVisualizer from './visualizers/WaveBarVisualizer';
import VinylDiscVisualizer from './visualizers/VinylDiscVisualizer';
import CircularRingVisualizer from './visualizers/CircularRingVisualizer';

/**
 * @file src/features/music/components/NowPlayingFace.jsx
 * @description Face 1 of the 3D music card — the immersive "Now Playing" experience.
 * Renders a blurred ambient artwork backdrop, a swappable audio-reactive visualizer
 * centerpiece, and a floating control hub (gear, flip pill, playback controls, queue toggle).
 */

/** High-fidelity placeholder texture used when no artwork is available. */
const PLACEHOLDER_TEXTURE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='50%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%23312e81'/%3E%3Cstop offset='40%25' stop-color='%234c1d95'/%3E%3Cstop offset='100%25' stop-color='%230f172a'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23g)'/%3E%3Ccircle cx='200' cy='200' r='80' fill='%23ffffff08'/%3E%3Ccircle cx='200' cy='200' r='120' fill='%23ffffff04'/%3E%3C/svg%3E";

/**
 * NowPlayingFace component — Face 1 of the music 3D card.
 *
 * @param {Object} props
 * @param {boolean} props.isFlipped - Whether the card is in the flipped state.
 * @param {Function} props.onFlip - Triggers the flip to Face 2.
 * @param {Function} props.onOpenAddModal - Opens the Add Track modal.
 * @param {Function} props.onSaveAsPlaylist - Triggers save queue as playlist.
 * @returns {React.ReactElement} The NowPlayingFace component.
 */
export default function NowPlayingFace({ isFlipped, onOpenAddModal, onSaveAsPlaylist }) {
  const navigate = useNavigate();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    analyserNode,
    activePlayer,
    accentColor,
    visualizerMode,
    fallbackBackdrop,
    pauseLocalPlayback,
    resumeLocalPlayback,
    seekLocalPlayback,
    changeVolume,
    queue,
    playTrackById,
  } = useMusic();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [scrubValue, setScrubValue] = useState(null);

  const artworkUrl = currentTrack ? getTrackArtwork(currentTrack) : null;
  const backdropSrc = artworkUrl || fallbackBackdrop || '/backdrops/backdrop-1.png';

  // Dynamic CSS accent variable
  const accentStyle = accentColor ? { '--music-accent': accentColor } : {};

  /** @param {number} index */
  const hasPrev = currentTrack && queue.findIndex((t) => t.id === currentTrack.id) > 0;
  const hasNext =
    currentTrack && queue.findIndex((t) => t.id === currentTrack.id) < queue.length - 1;

  /** Navigates one track back or restarts if less than 3 s in. */
  const handleSkipBack = useCallback(() => {
    if (!currentTrack) return;
    if (currentTime > 3) {
      seekLocalPlayback(0);
      return;
    }
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx > 0) playTrackById(queue[idx - 1].id, 0);
    else seekLocalPlayback(0);
  }, [currentTrack, currentTime, queue, seekLocalPlayback, playTrackById]);

  /** Navigates to the next track in the active queue. */
  const handleSkipNext = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx !== -1 && idx < queue.length - 1) playTrackById(queue[idx + 1].id, 0);
  }, [currentTrack, queue, playTrackById]);

  /** Commits scrubbed value to the player. */
  const handleScrubRelease = useCallback(() => {
    if (scrubValue !== null) {
      seekLocalPlayback(scrubValue);
      setScrubValue(null);
    }
  }, [scrubValue, seekLocalPlayback]);

  // Close queue panel when flipping — driven by isFlipped prop, valid side effect.
  useEffect(() => {
    if (isFlipped) setIsQueueOpen(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [isFlipped]);

  const isYoutube = currentTrack?.source === 'youtube';

  return (
    <div className="face-now-playing" style={accentStyle}>
      {/* ── Ambient Blurred & Dual-Layer Blur Backdrop ─────────────────────── */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={backdropSrc}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        >
          <div
            className={`ambient-blur-backdrop ${isYoutube ? 'is-youtube' : ''}`}
            style={{ backgroundImage: `url("${backdropSrc}")` }}
            aria-hidden="true"
          />
          <div
            className="blur-gradient-overlay"
            id="blur-gradient-overlay"
            style={{ backgroundImage: `url("${backdropSrc}")` }}
            aria-hidden="true"
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Step 1: Dark Gradient Overlay (75% height coverage) ─────────────── */}
      <div className="top-dark-overlay" aria-hidden="true" />

      {/* ── Top Controls Bar ──────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4 z-20 pointer-events-none">
        <button
          onClick={() => navigate('/settings')}
          aria-label="Music settings"
          className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border shadow-[0_4px_16px_rgba(0,0,0,0.35)] hover:border-white/30 active:scale-95 transition-all pointer-events-auto cursor-pointer"
          style={{
            backgroundColor: `color-mix(in srgb, ${accentColor || 'rgb(var(--primary))'} 15%, rgba(255, 255, 255, 0.12))`,
            borderColor: `color-mix(in srgb, ${accentColor || 'rgb(var(--primary))'} 25%, rgba(255, 255, 255, 0.18))`,
            color: `color-mix(in srgb, ${accentColor || 'rgb(var(--primary))'} 30%, #ffffff)`,
          }}
        >
          <Settings className="w-4 h-4 drop-shadow-sm" />
        </button>
      </div>

      {/* ── Visualizer Centerpiece ─────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pt-12 pb-48">
        <AnimatePresence mode="wait">
          {visualizerMode === 'vinyl' ? (
            <motion.div
              key="vinyl"
              className="w-full h-full flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.35 }}
            >
              <VinylDiscVisualizer
                isPlaying={isPlaying}
                artworkUrl={artworkUrl}
                trackTitle={currentTrack?.title || ''}
                accentColor={accentColor}
              />
            </motion.div>
          ) : visualizerMode === 'ring' || visualizerMode === 'circular' ? (
            <motion.div
              key="ring"
              className="w-full h-full flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35 }}
            >
              <CircularRingVisualizer accentColor={accentColor} />
            </motion.div>
          ) : visualizerMode === 'wave' ? (
            <motion.div
              key="wave"
              className="w-full px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {artworkUrl && (
                <img
                  src={artworkUrl}
                  alt={currentTrack?.title}
                  className={`w-28 h-28 rounded-2xl object-cover mx-auto mb-4 shadow-2xl border-2 border-white/10 ${
                    isYoutube ? 'scale-[1.33]' : ''
                  }`}
                />
              )}
              <WaveBarVisualizer
                analyserNode={analyserNode}
                isPlaying={isPlaying}
                activePlayer={activePlayer}
                accentColor={accentColor}
              />
            </motion.div>
          ) : (
            // Default: Liquid Blob
            <motion.div
              key="liquid"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <FluidVisualizer
                analyserNode={analyserNode}
                isPlaying={isPlaying}
                activePlayer={activePlayer}
                accentColor={accentColor}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Floating Control Hub ──────────────────────────────────────────── */}
      <div className="playback-controls-hub absolute bottom-0 left-0 right-0 px-6 pb-12 pt-4 z-20 flex flex-col justify-end">
        {/* Track info */}
        <div className="mb-5">
          {currentTrack ? (
            <>
              <h2 className="text-xl font-bold text-white truncate font-rounded drop-shadow-lg">
                {currentTrack.title}
              </h2>
              <p className="text-sm text-white/70 truncate mt-0.5 drop-shadow">
                {currentTrack.artist || 'Unknown Artist'}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white/70 font-rounded drop-shadow">
                Nothing playing
              </h2>
              <p className="text-sm text-white/50 mt-0.5 drop-shadow">
                Add a track from the Library
              </p>
            </>
          )}
        </div>

        {/* Scrubber & Duration (Duration positioned below scrubber) */}
        <div className="mb-6 flex flex-col gap-1.5">
          {(() => {
            const currentScrub = scrubValue !== null ? scrubValue : currentTime || 0;
            const progressPercent =
              duration > 0 ? Math.min(100, Math.max(0, (currentScrub / duration) * 100)) : 0;
            return (
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentScrub}
                disabled={!currentTrack}
                onChange={(e) => setScrubValue(parseFloat(e.target.value))}
                onMouseUp={handleScrubRelease}
                onTouchEnd={handleScrubRelease}
                onKeyUp={(e) => {
                  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                    handleScrubRelease();
                  }
                }}
                aria-label="Playback progress"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={Math.floor(currentScrub)}
                aria-valuetext={`${formatTime(currentScrub)} of ${formatTime(duration)}`}
                className="music-scrubber-range focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{
                  background: `linear-gradient(to right, var(--music-accent, ${accentColor || 'rgb(var(--primary))'}) ${progressPercent}%, rgba(255, 255, 255, 0.25) ${progressPercent}%)`,
                }}
              />
            );
          })()}
          <div className="flex justify-between text-[11px] text-white/80 font-mono font-medium drop-shadow-md px-0.5">
            <span>{formatTime(scrubValue !== null ? scrubValue : currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls row */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="flex items-center gap-2 w-20">
            <button
              onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
              className="hover:scale-110 active:scale-95 transition-all flex-shrink-0 drop-shadow-md"
              style={{
                color: `color-mix(in srgb, ${accentColor || 'rgb(var(--primary))'} 30%, #ffffff)`,
              }}
            >
              {volume === 0 ? (
                <VolumeX className="w-5 h-5 drop-shadow-md" />
              ) : (
                <Volume2 className="w-5 h-5 drop-shadow-md" />
              )}
            </button>
          </div>

          {/* Skip / Play / Pause */}
          <div className="flex items-center gap-6">
            <button
              disabled={!hasPrev && !currentTrack}
              onClick={handleSkipBack}
              aria-label="Previous or restart"
              className="w-10 h-10 flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-40 transition-all drop-shadow-md"
              style={{
                color: `color-mix(in srgb, ${accentColor || 'rgb(var(--primary))'} 30%, #ffffff)`,
              }}
            >
              <SkipBack className="w-6 h-6 drop-shadow-md" />
            </button>

            <button
              disabled={!currentTrack}
              onClick={() => (isPlaying ? pauseLocalPlayback() : resumeLocalPlayback())}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              style={{
                background: accentColor
                  ? `linear-gradient(135deg, ${accentColor}, color-mix(in oklch, ${accentColor} 60%, rgb(var(--primary))))`
                  : 'linear-gradient(135deg, rgb(var(--primary)), #8b5cf6)',
                boxShadow: `0 8px 28px ${
                  accentColor
                    ? `color-mix(in srgb, ${accentColor} 45%, transparent)`
                    : 'rgba(var(--primary), 0.45)'
                }`,
              }}
            >
              {isPlaying ? (
                <Pause size={24} className="fill-white text-white drop-shadow" />
              ) : (
                <Play size={24} className="fill-white text-white ml-0.5 drop-shadow" />
              )}
            </button>

            <button
              disabled={!hasNext}
              onClick={handleSkipNext}
              aria-label="Next track"
              className="w-10 h-10 flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-40 transition-all drop-shadow-md"
              style={{
                color: `color-mix(in srgb, ${accentColor || 'rgb(var(--primary))'} 30%, #ffffff)`,
              }}
            >
              <SkipForward className="w-6 h-6 drop-shadow-md" />
            </button>
          </div>

          {/* Queue toggle */}
          <div className="flex justify-end w-20">
            <button
              onClick={() => setIsQueueOpen((prev) => !prev)}
              aria-label={isQueueOpen ? 'Close queue' : 'Open queue'}
              aria-expanded={isQueueOpen}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all drop-shadow-md ${
                isQueueOpen
                  ? 'bg-white/30 border-white/50'
                  : 'bg-white/12 border-white/20 hover:bg-white/25'
              }`}
              style={{
                color: `color-mix(in srgb, ${accentColor || 'rgb(var(--primary))'} 30%, #ffffff)`,
              }}
            >
              <ListOrdered className="w-5 h-5 drop-shadow-md" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating Queue Panel ─────────────────────────────────────────── */}
      <FloatingQueuePanel
        isVisible={isQueueOpen}
        onOpenAddModal={onOpenAddModal}
        onSaveAsPlaylist={onSaveAsPlaylist}
      />
    </div>
  );
}
