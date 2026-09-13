/**
 * @file MusicSettingsPanel.jsx
 * @description Settings panel for Music Room features:
 * visualizer picker, tap-to-next mode, and crossfade transition parameters.
 */

import React from 'react';
import { useMusic } from '../../../contexts/MusicContext';
import { Sliders, Radio, Disc, Waves, CircleDot, Image as ImageIcon } from 'lucide-react';

/**
 * @typedef {'liquid'|'wave'|'vinyl'|'ring'} VisualizerMode
 */

/** @type {Array<{id: VisualizerMode, label: string, description: string, icon: React.ComponentType}>} */
const VISUALIZER_OPTIONS = [
  {
    id: 'liquid',
    label: 'Liquid Blob',
    description: 'Organic, Siri-style morphing orb driven by frequency data.',
    icon: Radio,
  },
  {
    id: 'ring',
    label: 'Circular Ring',
    description: 'Radiating frequency bars surrounding album artwork.',
    icon: CircleDot,
  },
  {
    id: 'wave',
    label: 'Wave Bars',
    description: 'Classic audio-reactive bar graph, tinted by album art accent.',
    icon: Waves,
  },
  {
    id: 'vinyl',
    label: 'Vinyl Disc',
    description: 'Spinning record platter with a physical needle arm and artwork spindle.',
    icon: Disc,
  },
];

const BACKDROP_OPTIONS = [
  {
    id: '/backdrops/backdrop-1.png',
    label: 'Soft Pastel',
    src: '/backdrops/backdrop-1.png',
  },
  {
    id: '/backdrops/backdrop-2.png',
    label: 'Butterfly Nature',
    src: '/backdrops/backdrop-2.png',
  },
  {
    id: '/backdrops/backdrop-3.png',
    label: 'Winding River Castle',
    src: '/backdrops/backdrop-3.png',
  },
  {
    id: '/backdrops/backdrop-4.png',
    label: 'Romantic Heart',
    src: '/backdrops/backdrop-4.png',
  },
];

/**
 * MusicSettingsPanel component.
 * Configures the shared Music Room preferences: visualizer, crossfade, fallback backdrop.
 *
 * @returns {React.ReactElement} The settings panel.
 */
export default function MusicSettingsPanel() {
  const music = useMusic();

  if (!music) {
    return (
      <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border text-center text-xs text-text-muted">
        Music player context is unavailable.
      </div>
    );
  }

  const {
    crossfadeDuration,
    setCrossfadeDuration,
    visualizerMode,
    setVisualizerMode,
    fallbackBackdrop,
    setFallbackBackdrop,
  } = music;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-text-main">Music Room Settings</h3>
        <p className="text-xs text-text-muted mt-1">Configure your shared listening experience.</p>
      </div>

      <div className="space-y-4">
        {/* ── Fallback Wallpaper Picker ────────────────────────────────────── */}
        <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border space-y-3">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-text-main">Default Backdrop Wallpaper</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Choose the background wallpaper used during the empty state or when playing tracks
            without cover art.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {BACKDROP_OPTIONS.map(({ id, label, src }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFallbackBackdrop(id)}
                aria-pressed={(fallbackBackdrop || '/backdrops/backdrop-1.png') === id}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all aspect-video flex flex-col justify-end p-2 text-left ${
                  (fallbackBackdrop || '/backdrops/backdrop-1.png') === id
                    ? 'border-primary ring-2 ring-primary/40'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <img
                  src={src}
                  alt={label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white drop-shadow truncate">
                    {label}
                  </span>
                  {(fallbackBackdrop || '/backdrops/backdrop-1.png') === id && (
                    <div className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Visualizer Picker ──────────────────────────────────────────── */}
        <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border space-y-3">
          <div className="flex items-center space-x-2">
            <Waves className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-text-main">Visualizer Style</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Choose how the audio is visualized on the Now Playing screen.
          </p>
          <div className="grid grid-cols-1 gap-2 pt-1">
            {VISUALIZER_OPTIONS.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setVisualizerMode(id)}
                aria-pressed={visualizerMode === id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                  visualizerMode === id
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                    visualizerMode === id
                      ? 'bg-primary/20 text-primary'
                      : 'bg-slate-800 text-text-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p
                    className={`text-xs font-bold ${visualizerMode === id ? 'text-text-main' : 'text-text-muted'}`}
                  >
                    {label}
                  </p>
                  <p className="text-[10px] text-text-muted/70 mt-0.5 leading-relaxed">
                    {description}
                  </p>
                </div>
                {visualizerMode === id && (
                  <div className="ml-auto flex-shrink-0 w-4 h-4 rounded-full bg-primary mt-0.5 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-950" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Crossfade parameter ────────────────────────────────────────── */}
        <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border space-y-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-text-main">Crossfade Transition</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Set the overlap duration in seconds when transitioning from one track to another. High
            values create a smoother fade.
          </p>
          <div className="flex items-center justify-between space-x-4 pt-1">
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={crossfadeDuration}
              onChange={(e) => setCrossfadeDuration(parseInt(e.target.value))}
              aria-label="Crossfade duration in seconds"
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <span className="font-mono text-xs text-text-main bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded-lg min-w-[36px] text-center">
              {crossfadeDuration}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
