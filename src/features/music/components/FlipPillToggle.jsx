import React from 'react';
import { Layers } from 'lucide-react';

/**
 * @file src/features/music/components/FlipPillToggle.jsx
 * @description Premium pulsating 3D pill-toggle button that flips the music player
 * between Face 1 (Now Playing) and Face 2 (Collection Management).
 */

/**
 * FlipPillToggle component. Renders a glassmorphic pill button with a pink-to-
 * violet gradient shimmer and a subtle pulse animation when on the Now Playing face.
 *
 * @param {Object} props
 * @param {boolean} props.isFlipped - Whether the card is currently showing Face 2.
 * @param {Function} props.onFlip - Callback invoked when the toggle is tapped.
 * @param {string|null} [props.accentColor] - Album art accent color for tinting.
 * @returns {React.ReactElement} The FlipPillToggle component.
 */
export default function FlipPillToggle({ isFlipped, onFlip, accentColor }) {
  return (
    <button
      onClick={onFlip}
      aria-label={isFlipped ? 'Return to Now Playing' : 'Open Library & Playlists'}
      aria-pressed={isFlipped}
      className={`flip-pill-toggle ${!isFlipped ? 'is-pulsing' : ''}`}
      style={accentColor ? { '--music-accent': accentColor } : {}}
    >
      <Layers
        className="w-3.5 h-3.5 text-white/90 transition-transform duration-500"
        style={{ transform: isFlipped ? 'scaleY(-1)' : 'scaleY(1)' }}
        aria-hidden="true"
      />
      <span className="text-[11px] font-bold text-white/90 tracking-wide select-none">
        {isFlipped ? 'Now Playing' : 'Library'}
      </span>
    </button>
  );
}
