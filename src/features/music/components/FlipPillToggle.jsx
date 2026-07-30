import React, { useState, useRef } from 'react';
import { Layers, Music } from 'lucide-react';

/**
 * @file src/features/music/components/FlipPillToggle.jsx
 * @description Premium pulsating 3D pill-toggle button that flips the music player
 * between Face 1 (Now Playing) and Face 2 (Collection Management).
 * Implements a 3-step sequential toggle sequence:
 * 1. Pill thumb translation (400ms CSS spring/ease transition)
 * 2. Icon / text swap at 200ms
 * 3. Card flip dispatch at 300ms
 */

/**
 * FlipPillToggle component.
 *
 * @param {Object} props
 * @param {boolean} props.isFlipped - Whether the 3D card is currently showing Face 2.
 * @param {Function} props.onFlip - Callback to trigger the 3D rotator card flip.
 * @param {string|null} [props.accentColor] - Album art accent color for tinting.
 * @returns {React.ReactElement} The FlipPillToggle component.
 */
export default function FlipPillToggle({ isFlipped, onFlip, accentColor }) {
  const [thumbState, setThumbState] = useState(isFlipped);
  const [labelState, setLabelState] = useState(isFlipped);
  const isAnimatingRef = useRef(false);

  const [prevIsFlipped, setPrevIsFlipped] = useState(isFlipped);

  // Synchronize internal animation state when isFlipped prop changes externally
  if (prevIsFlipped !== isFlipped) {
    setPrevIsFlipped(isFlipped);
    setThumbState(isFlipped);
    setLabelState(isFlipped);
  }

  /**
   * Handles user click with a 3-step sequential animation sequence.
   *
   * @param {React.MouseEvent} e
   */
  const handleClick = (e) => {
    e.stopPropagation();
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const targetState = !thumbState;

    // Step 1: Move pill thumb immediately (400ms CSS transition)
    setThumbState(targetState);

    // Step 2: Icon/Text swap at 200ms
    setTimeout(() => {
      setLabelState(targetState);
    }, 200);

    // Step 3: Card flip at 300ms
    setTimeout(() => {
      onFlip();
      isAnimatingRef.current = false;
    }, 300);
  };

  const accentStyle = accentColor ? { '--music-accent': accentColor } : {};

  return (
    <button
      onClick={handleClick}
      aria-label={labelState ? 'Return to Now Playing' : 'Open Library & Playlists'}
      aria-pressed={thumbState}
      className={`flip-pill-toggle ${!thumbState ? 'is-pulsing' : ''}`}
      style={accentStyle}
    >
      {/* Sliding pill-thumb background indicator */}
      <div
        className="absolute inset-0.5 rounded-full bg-white/15 border border-white/20 transition-transform duration-400 cubic-bezier(0.34, 1.56, 0.64, 1)"
        style={{
          transform: thumbState ? 'translateX(0%)' : 'translateX(0%)',
        }}
      />

      <div className="relative z-10 flex items-center gap-1.5 px-1 py-0.5">
        {labelState ? (
          <Music className="w-3.5 h-3.5 text-white/90 transition-transform duration-300 scale-100" />
        ) : (
          <Layers className="w-3.5 h-3.5 text-white/90 transition-transform duration-300 scale-100" />
        )}
        <span className="text-[11px] font-bold text-white/90 tracking-wide select-none">
          {labelState ? 'Now Playing' : 'Library'}
        </span>
      </div>
    </button>
  );
}
