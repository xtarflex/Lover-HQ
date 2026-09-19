/**
 * @file src/features/music/components/VolumeControl.jsx
 * @description Streamlined interactive volume controller for the Music Room.
 * - Desktop: Hover reveals volume percentage and vertical stepper chevrons (plus mouse wheel roulette).
 * - Mobile: Keeps control compact so playback buttons are never pushed or misaligned.
 *   Swiping up/down smoothly adjusts volume. Tapping shows an in-app toast notification with volume level.
 * - Muted state: Dimmed/dull typography and icons.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, Volume1, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../../contexts/AppContext';

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
  const { dispatch } = useAppContext();
  const [isHovered, setIsHovered] = useState(false);

  // Store last non-zero volume to restore on unmute (defaulting to 0.8)
  const previousVolumeRef = useRef(volume > 0 ? volume : 0.8);
  const notificationDebounceRef = useRef(null);

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
   * Dispatches a lightweight in-app toast notification for mobile volume feedback.
   * @param {string} message - Message to display.
   */
  const notifyVolume = useCallback(
    (message) => {
      if (!dispatch) return;
      if (notificationDebounceRef.current) {
        clearTimeout(notificationDebounceRef.current);
      }
      dispatch({
        type: 'SET_GLOBAL_NOTIFICATION',
        payload: { message, type: 'info' },
      });
      notificationDebounceRef.current = setTimeout(() => {
        dispatch({ type: 'SET_GLOBAL_NOTIFICATION', payload: null });
      }, 1800);
    },
    [dispatch]
  );

  /**
   * Toggles between muted state and previous active volume.
   */
  const handleToggleMute = useCallback(() => {
    if (volume > 0) {
      changeVolume(0);
      notifyVolume('Muted (0%)');
    } else {
      const restored = previousVolumeRef.current || 0.8;
      changeVolume(restored);
      notifyVolume(`Volume: ${Math.round(restored * 100)}%`);
    }
  }, [volume, changeVolume, notifyVolume]);

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

      touchStateRef.current = {
        startY: touch.clientY,
        startTime: Date.now(),
        startVolume: volume,
        isDragging: false,
      };
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
   * Finalizes touch interaction: clears drag state and shows notification if dragged.
   */
  const handleTouchEnd = useCallback(() => {
    if (touchStateRef.current.isDragging) {
      notifyVolume(`Volume: ${Math.round(volume * 100)}%`);
    }
    setTimeout(() => {
      touchStateRef.current.isDragging = false;
    }, 100);
  }, [notifyVolume, volume]);

  // Clean up any pending notification timer on unmount
  useEffect(() => {
    return () => {
      if (notificationDebounceRef.current) {
        clearTimeout(notificationDebounceRef.current);
      }
    };
  }, []);

  const isMuted = volume === 0;
  const volumePercentage = Math.round(volume * 100);

  // Pick appropriate icon based on volume level
  const VolumeIcon = isMuted ? VolumeX : volume <= 0.5 ? Volume1 : Volume2;

  const dynamicColor = isMuted
    ? 'rgba(255, 255, 255, 0.4)'
    : `color-mix(in srgb, ${accentColor || 'rgb(var(--primary))'} 30%, #ffffff)`;

  return (
    <div
      className="relative flex items-center select-none"
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

      {/* Desktop-only Percentage & Stepper chevrons (never displayed on mobile touch screens) */}
      <div
        className={`hidden md:flex items-center gap-1 transition-all duration-200 overflow-hidden ${
          isHovered
            ? 'opacity-100 max-w-[85px] ml-1 pointer-events-auto'
            : 'opacity-0 max-w-0 pointer-events-none'
        }`}
        title="Scroll or click chevrons to adjust volume"
      >
        {/* Percentage badge */}
        <span
          className={`text-[11px] font-mono font-bold tracking-tight px-1 py-0.5 rounded border backdrop-blur-sm transition-colors ${
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

        {/* Up/Down Stepper Chevrons */}
        <div className="flex flex-col items-center justify-center -space-y-1">
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
