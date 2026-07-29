/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ListOrdered } from 'lucide-react';
import { SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Play, Pause } from '../../../lib/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusic } from '../../../contexts/MusicContext';
import { formatTime } from '../lib/musicEngine';
import { getTrackArtwork } from '../lib/musicUtils';
import FlipPillToggle from './FlipPillToggle';
import FloatingQueuePanel from './FloatingQueuePanel';
import LiquidBlobVisualizer from './visualizers/LiquidBlobVisualizer';
import WaveBarVisualizer from './visualizers/WaveBarVisualizer';
import VinylDiscVisualizer from './visualizers/VinylDiscVisualizer';

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
export default function NowPlayingFace({ isFlipped, onFlip, onOpenAddModal, onSaveAsPlaylist }) {
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
  const backdropSrc = artworkUrl || PLACEHOLDER_TEXTURE;

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

  // Close queue panel when flipping
  useEffect(() => {
    if (isFlipped) setIsQueueOpen(false);
  }, [isFlipped]);

  return (
    <div className="face-now-playing" style={accentStyle}>
      {/* ── Ambient Blurred Backdrop ───────────────────────────────────────── */}
      <div
        className="ambient-blur-backdrop"
        style={{ backgroundImage: `url("${backdropSrc}")` }}
        aria-hidden="true"
      />

      {/* ── Top Dark Contrast Overlay ──────────────────────────────────────── */}
      <div className="top-dark-overlay" aria-hidden="true" />

      {/* ── Top Controls Bar ──────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4 z-20">
        <button
          onClick={() => navigate('/settings')}
          aria-label="Music settings"
          className="p-2 rounded-full bg-white/8 hover:bg-white/15 backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>

        <FlipPillToggle isFlipped={isFlipped} onFlip={onFlip} accentColor={accentColor} />
      </div>

      {/* ── Visualizer Centerpiece ─────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pt-16 pb-40">
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
                  className="w-28 h-28 rounded-2xl object-cover mx-auto mb-4 shadow-2xl border-2 border-white/10"
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
              <LiquidBlobVisualizer
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
      <div className="playback-controls-hub z-20">
        {/* Track info */}
        <div className="mb-4">
          {currentTrack ? (
            <>
              <h2 className="text-xl font-bold text-white truncate font-rounded drop-shadow-lg">
                {currentTrack.title}
              </h2>
              <p className="text-sm text-white/60 truncate mt-0.5 drop-shadow">
                {currentTrack.artist || 'Unknown Artist'}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white/60 font-rounded">Nothing playing</h2>
              <p className="text-sm text-white/40 mt-0.5">Add a track from the Library</p>
            </>
          )}
        </div>

        {/* Scrubber */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-white/40 font-mono mb-1.5">
            <span>{formatTime(scrubValue !== null ? scrubValue : currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={scrubValue !== null ? scrubValue : currentTime || 0}
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
            aria-valuenow={Math.floor(scrubValue ?? currentTime)}
            aria-valuetext={`${formatTime(scrubValue ?? currentTime)} of ${formatTime(duration)}`}
            className="w-full h-1 rounded-full appearance-none cursor-pointer accent-tinted focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{ accentColor: accentColor || '#F59E0B' }}
          />
        </div>

        {/* Playback controls row */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="flex items-center gap-2 w-20">
            <button
              onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
              className="text-white/50 hover:text-white/90 transition-colors flex-shrink-0"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Skip / Play / Pause */}
          <div className="flex items-center gap-5">
            <button
              disabled={!hasPrev && !currentTrack}
              onClick={handleSkipBack}
              aria-label="Previous or restart"
              className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-40 transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              disabled={!currentTrack}
              onClick={() => (isPlaying ? pauseLocalPlayback() : resumeLocalPlayback())}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-14 h-14 rounded-full flex items-center justify-center text-slate-950 font-bold shadow-xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
              style={{
                background: accentColor
                  ? `linear-gradient(135deg, ${accentColor}, #EC4899)`
                  : 'linear-gradient(135deg, #F59E0B, #EC4899)',
              }}
            >
              {isPlaying ? (
                <Pause size={24} className="fill-slate-950" />
              ) : (
                <Play size={24} className="fill-slate-950 ml-0.5" />
              )}
            </button>

            <button
              disabled={!hasNext}
              onClick={handleSkipNext}
              aria-label="Next track"
              className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-40 transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Queue toggle */}
          <div className="flex justify-end w-20">
            <button
              onClick={() => setIsQueueOpen((o) => !o)}
              aria-label={isQueueOpen ? 'Close queue' : 'Open queue'}
              aria-expanded={isQueueOpen}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${
                isQueueOpen
                  ? 'bg-white/20 border-white/25 text-white'
                  : 'bg-white/8 border-white/10 text-white/60 hover:text-white/90 hover:bg-white/15'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
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
