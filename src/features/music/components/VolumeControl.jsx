/**
 * @file src/features/music/components/VolumeControl.jsx
 * @description Interactive volume controller component for the Music Room.
 * Supports:
 * - Click/tap to toggle mute/unmute (restores previous non-zero volume level).
 * - Desktop hover: reveals volume percentage badge and vertical step chevrons.
 * - Desktop mouse wheel roulette: scroll up to increment, scroll down to decrement.
 * - Mobile touch drag: upward swipe increases volume, downward swipe decreases volume
 *   with dynamic velocity calculation (fast flick = faster change, slow drag = fine adjustment).
 * - Visual muted state: dimmed/dull typography when muted.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, Volume1, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * VolumeControl component.
 *
 * @param {Object} props
 * @param {number} props.volume - Current volume level between 0 and 1.
 * @param {Function} props.changeVolume - Callback to update the volume level.
 * @param {string} [props.accentColor] - Active music room accent color.
 * @returns {React.ReactElement}
 */
export default function VolumeControl({ volume, changeVolume, accentColor }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchActive, setIsTouchActive] = useState(false);

  // Store last non-zero volume to restore on unmute (defaulting to 0.8)
  const previousVolumeRef = useRef(volume > 0 ? volume : 0.8);
  const hideTouchTimeoutRef = useRef(null);

  useEffect(() => {
    if (volume > 0) {
      previousVolumeRef.current = volume;
    }
  }, [volume]);

  // Touch gesture tracking ref
  const touchStateRef = useRef({
    startY: 0,
    startTime: 0,
    startVolume: 0,
    isDragging: false,
  });

  /**
   * Helper to clamp and round volume between 0 and 1.
   * @param {number} val - Raw volume value.
   * @returns {number}
   */
  const clampVolume = useCallback((val) => {
    const clamped = Math.max(0, Math.min(1, val));
    return parseFloat(clamped.toFixed(2));
  }, []);

  /**
   * Toggles between muted state and previous active volume.
   */
  const handleToggleMute = useCallback(() => {
    if (volume > 0) {
      changeVolume(0);
    } else {
      changeVolume(previousVolumeRef.current || 0.8);
    }
  }, [volume, changeVolume]);

  /**
   * Increments volume by 5%.
   * @param {React.MouseEvent} [e] - Optional click event.
   */
  const handleIncrementStep = useCallback(
    (e) => {
      e?.stopPropagation();
      changeVolume(clampVolume(volume + 0.05));
    },
    [volume, changeVolume, clampVolume]
  );

  /**
   * Decrements volume by 5%.
   * @param {React.MouseEvent} [e] - Optional click event.
   */
  const handleDecrementStep = useCallback(
    (e) => {
      e?.stopPropagation();
      changeVolume(clampVolume(volume - 0.05));
    },
    [volume, changeVolume, clampVolume]
  );

  /**
   * Handles mouse wheel scrolling over the volume control.
   * Scroll up increments, scroll down decrements.
   * @param {React.WheelEvent} e - Wheel event.
   */
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const step = 0.05;
      const delta = e.deltaY < 0 ? step : -step;
      changeVolume(clampVolume(volume + delta));
    },
    [volume, changeVolume, clampVolume]
  );

  /**
   * Initiates touch tracking for swipe-to-adjust gesture.
   * @param {React.TouchEvent} e - Touch start event.
   */
  const handleTouchStart = useCallback(
    (e) => {
      const touch = e.touches[0];
      if (!touch) return;

      if (hideTouchTimeoutRef.current) {
        clearTimeout(hideTouchTimeoutRef.current);
      }

      touchStateRef.current = {
        startY: touch.clientY,
        startTime: Date.now(),
        startVolume: volume,
        isDragging: false,
      };
      setIsTouchActive(true);
    },
    [volume]
  );

  /**
   * Calculates displacement and velocity to adjust volume smoothly during touch drag.
   * @param {React.TouchEvent} e - Touch move event.
   */
  const handleTouchMove = useCallback(
    (e) => {
      const touch = e.touches[0];
      if (!touch) return;

      const deltaY = touchStateRef.current.startY - touch.clientY; // Upward is positive
      const elapsed = Math.max(1, Date.now() - touchStateRef.current.startTime);

      if (Math.abs(deltaY) > 8) {
        touchStateRef.current.isDragging = true;
      }

      if (touchStateRef.current.isDragging) {
        // Calculate velocity (pixels per millisecond)
        const velocity = Math.abs(deltaY) / elapsed;
        // Faster flicks scale dynamically (1.0x to 3.5x multiplier)
        const velocityMultiplier = Math.min(3.5, 1 + velocity * 1.5);

        // Standard stroke distance: ~180px maps to 100% volume
        const volumeChange = (deltaY / 180) * velocityMultiplier;
        const targetVolume = clampVolume(touchStateRef.current.startVolume + volumeChange);
        changeVolume(targetVolume);
      }
    },
    [changeVolume, clampVolume]
  );

  /**
   * Finalizes touch interaction: clears drag state and sets auto-hide timer for overlay.
   */
  const handleTouchEnd = useCallback(() => {
    setTimeout(() => {
      touchStateRef.current.isDragging = false;
    }, 100);

    // Gracefully hide the mobile percentage indicator after a brief pause
    hideTouchTimeoutRef.current = setTimeout(() => {
      setIsTouchActive(false);
    }, 1200);
  }, []);

  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (hideTouchTimeoutRef.current) {
        clearTimeout(hideTouchTimeoutRef.current);
      }
    };
  }, []);

  const isMuted = volume === 0;
  const isOverlayVisible = isHovered || isTouchActive;
  const volumePercentage = Math.round(volume * 100);

  // Pick appropriate icon based on volume level
  const VolumeIcon = isMuted ? VolumeX : volume <= 0.5 ? Volume1 : Volume2;

  const dynamicColor = isMuted
    ? 'rgba(255, 255, 255, 0.4)'
    : `color-mix(in srgb, ${accentColor || 'rgb(var(--primary))'} 30%, #ffffff)`;

  return (
    <div
      className="relative flex items-center group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      aria-label="Volume controller"
      role="group"
    >
      {/* Primary speaker button (Mute / Unmute) */}
      <button
        type="button"
        onClick={() => {
          if (touchStateRef.current.isDragging) return;
          handleToggleMute();
        }}
        aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
        className="hover:scale-110 active:scale-95 transition-transform flex-shrink-0 drop-shadow-md p-1 focus:outline-none rounded-lg"
        style={{ color: dynamicColor }}
      >
        <VolumeIcon className="w-5 h-5 drop-shadow-md" />
      </button>

      {/* Percentage & Stepper chevrons container */}
      <div
        className={`flex items-center gap-1.5 transition-all duration-200 overflow-hidden ${
          isOverlayVisible
            ? 'opacity-100 max-w-[100px] ml-1.5 pointer-events-auto'
            : 'opacity-0 max-w-0 pointer-events-none'
        }`}
      >
        {/* Percentage badge */}
        <span
          className={`text-[11px] font-mono font-bold tracking-tight px-1.5 py-0.5 rounded-md border backdrop-blur-sm transition-colors ${
            isMuted
              ? 'text-white/35 bg-white/5 border-white/10'
              : 'text-white/90 bg-white/15 border-white/25 drop-shadow-sm'
          }`}
          style={
            !isMuted ? { borderColor: `${accentColor || 'rgb(var(--primary))'}44` } : undefined
          }
          aria-live="polite"
        >
          {volumePercentage}%
        </span>

        {/* Desktop-only Up/Down Stepper Chevrons */}
        <div className="hidden md:flex flex-col items-center justify-center -space-y-1">
          <button
            type="button"
            onClick={handleIncrementStep}
            disabled={volume >= 1}
            aria-label="Increase volume"
            className="p-0.5 hover:scale-125 disabled:opacity-30 disabled:hover:scale-100 text-white/70 hover:text-white transition-all focus:outline-none"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleDecrementStep}
            disabled={volume <= 0}
            aria-label="Decrease volume"
            className="p-0.5 hover:scale-125 disabled:opacity-30 disabled:hover:scale-100 text-white/70 hover:text-white transition-all focus:outline-none"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
