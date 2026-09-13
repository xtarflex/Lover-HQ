import React, { useState, useRef } from 'react';
import { ListMusic, Music2 } from 'lucide-react';

/**
 * @file src/features/music/components/FlipPillToggle.jsx
 * @description Persistent 64px x 32px viewport-level pill toggle switch.
 * Features a 26px circular thumb with dynamic --music-accent background,
 * cross-fading SVG icons, and a 3-step sequential animation state machine:
 * 1. 0ms: Thumb slide begins (400ms cubic-bezier transition)
 * 2. 200ms: Icons cross-fade halfway through the slide
 * 3. 300ms: Card flip callback fires near end of slide
 */

/**
 * FlipPillToggle component.
 *
 * @param {Object} props
 * @param {boolean} props.isFlipped - Whether the 3D card is currently showing Face 2.
 * @param {Function} props.onFlip - Callback to trigger the 3D rotator card flip.
 * @param {string|null} [props.accentColor] - Album art accent color for thumb tinting.
 * @returns {React.ReactElement} The FlipPillToggle component.
 */
export default function FlipPillToggle({ isFlipped, onFlip, accentColor }) {
  const [thumbState, setThumbState] = useState(isFlipped);
  const [iconState, setIconState] = useState(isFlipped);
  const [prevIsFlipped, setPrevIsFlipped] = useState(isFlipped);
  const isAnimatingRef = useRef(false);

  // Synchronize internal state when isFlipped prop changes externally
  if (prevIsFlipped !== isFlipped) {
    setPrevIsFlipped(isFlipped);
    setThumbState(isFlipped);
    setIconState(isFlipped);
  }

  /**
   * Handles user click with a 3-step sequential state machine animation.
   *
   * @param {React.MouseEvent} e
   */
  const handleClick = (e) => {
    e.stopPropagation();
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const nextState = !thumbState;

    // Step 1: Thumb slide begins immediately (0ms)
    setThumbState(nextState);

    // Step 2: Icon swap halfway through (200ms)
    setTimeout(() => {
      setIconState(nextState);
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
      type="button"
      aria-label={iconState ? 'Show Now Playing' : 'Show Library & Playlists'}
      aria-pressed={thumbState}
      className={`flip-pill-track ${thumbState ? 'is-active' : ''}`}
      style={accentStyle}
    >
      {/* 26px Circular Thumb */}
      <div className="flip-pill-thumb">
        {/* Cross-fading icon container */}
        <div className="relative w-4 h-4 flex items-center justify-center">
          <ListMusic
            className={`absolute inset-0 w-4 h-4 text-slate-950 transition-all duration-200 ${
              iconState ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-45'
            }`}
          />
          <Music2
            className={`absolute inset-0 w-4 h-4 text-slate-950 transition-all duration-200 ${
              !iconState ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-45'
            }`}
          />
        </div>
      </div>
    </button>
  );
}
