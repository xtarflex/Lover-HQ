import React from 'react';
import GradientAvatar from '../../../../components/ui/GradientAvatar';

/**
 * @file src/features/music/components/visualizers/VinylDiscVisualizer.jsx
 * @description Classic vinyl disc visualizer — an oversized unboxed spinning platter
 * with realistic grooved lighting, a physical SVG needle arm, and the active track's
 * artwork rendered as the centre spindle sticker. Controlled by `isPlaying`.
 */

/**
 * VinylDiscVisualizer component. Renders an immersive spinning vinyl record
 * with a needle arm overlay and dynamic artwork spindle sticker.
 *
 * @param {Object} props
 * @param {boolean} props.isPlaying - Whether audio is currently playing.
 * @param {string|null} props.artworkUrl - URL of the current track's artwork.
 * @param {string} props.trackTitle - Title of the current track (fallback seed).
 * @param {string|null} [props.accentColor] - Dominant color for accent tinting.
 * @returns {React.ReactElement} The VinylDiscVisualizer component.
 */
export default function VinylDiscVisualizer({ isPlaying, artworkUrl, trackTitle, accentColor }) {
  const accentStyle = accentColor ? { '--music-accent': accentColor } : {};

  return (
    <div className="vinyl-disc-container w-full h-full" style={accentStyle}>
      {/* ── Platter ─────────────────────────────────────────── */}
      <div
        className={`vinyl-disc-platter relative rounded-full flex items-center justify-center
          w-[min(72vw,320px)] h-[min(72vw,320px)]
          bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950
          shadow-2xl
          ${isPlaying ? '' : 'is-paused'}`}
      >
        {/* Grooved concentric rings with metallic sheen */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-slate-700/20"
            style={{
              inset: `${(i + 1) * 4.5}%`,
              borderColor: `rgba(148,163,184,${0.04 + i * 0.012})`,
              boxShadow: i % 3 === 0 ? 'inset 0 0 4px rgba(255,255,255,0.04)' : 'none',
            }}
          />
        ))}

        {/* Radial conic highlight — simulates vinyl sheen */}
        <div
          className="absolute inset-[6%] rounded-full opacity-10"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.25) 30deg, transparent 60deg, transparent 180deg, rgba(255,255,255,0.15) 210deg, transparent 240deg)',
          }}
        />

        {/* ── Centre spindle sticker ──────────────────────────── */}
        <div className="relative w-[30%] h-[30%] rounded-full overflow-hidden border-2 border-white/10 shadow-xl bg-slate-900 z-10">
          {artworkUrl ? (
            <img
              src={artworkUrl}
              alt={trackTitle || 'Track artwork'}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <GradientAvatar seed={trackTitle || 'vinyl'} size={96} />
          )}
          {/* Centre hole */}
          <div className="absolute inset-[40%] rounded-full bg-slate-950 border border-slate-800 shadow-inner" />
        </div>
      </div>

      {/* ── Needle Arm SVG ──────────────────────────────────────── */}
      <svg
        viewBox="0 0 80 160"
        className={`vinyl-needle-arm w-[18%] max-w-[64px] ${isPlaying ? 'is-playing' : 'is-paused'}`}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pivot ball */}
        <circle cx="66" cy="16" r="10" fill="#6B7280" stroke="#9CA3AF" strokeWidth="1.5" />
        <circle cx="66" cy="16" r="5" fill="#D1D5DB" />

        {/* Arm shaft */}
        <line
          x1="66"
          y1="24"
          x2="22"
          y2="148"
          stroke="#9CA3AF"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Cartridge body */}
        <rect x="12" y="140" width="20" height="10" rx="3" fill="#6B7280" />
        {/* Stylus tip */}
        <line
          x1="22"
          y1="150"
          x2="22"
          y2="158"
          stroke="#EC4899"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
