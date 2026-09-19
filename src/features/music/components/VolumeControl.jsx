/**
 * @file src/features/music/components/VolumeControl.jsx
 * @description Streamlined interactive volume controller for the Music Room.
 * - Desktop: Hover reveals volume percentage and vertical stepper chevrons (plus mouse wheel roulette).
 * - Mobile: Tapping displays a compact, well-proportioned percentage badge beside the icon.
 *   Clicking/tapping outside dismisses the badge so it never remains stuck.
 * - Explanatory In-App Notifications: Tapping or dragging dispatches clear in-app toast instructions:
 *   Mobile: "Volume: 80% • Swipe up to increase, down to decrease" / "Muted • Swipe up on speaker to increase volume"
 *   Desktop: "Volume: 80% • Scroll wheel or click arrows to adjust" / "Muted • Scroll up or click arrows to increase volume"
 * - Muted state: Dimmed/dull typography and icons.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, Volume1, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppDispatch } from '../../../contexts/AppContext';

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
  const dispatch = useAppDispatch();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const containerRef = useRef(null);
  // Store last non-zero volume to restore on unmute (defaulting to 0.8)
  const previousVolumeRef = useRef(volume > 0 ? volume : 0.8);
  const notificationDebounceRef = useRef(null);
  const mobileCloseTimeoutRef = useRef(null);

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
   * Helper to check if current device interaction is touch-based.
   * @returns {boolean}
   */
  const checkIsTouch = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  }, []);

  /**
   * Dispatches an in-app toast notification explaining how to adjust volume.
   * @param {number} targetVolume - The current/new volume level.
   * @param {boolean} isTouch - Whether triggered via touch.
   */
  const notifyVolume = useCallback(
    (targetVolume, isTouch) => {
      if (!dispatch) return;
      if (notificationDebounceRef.current) {
        clearTimeout(notificationDebounceRef.current);
      }

      let message = '';
      if (targetVolume === 0) {
        message = isTouch
          ? 'Muted • Swipe up on speaker to increase volume'
          : 'Muted • Scroll up or click arrows to increase volume';
      } else {
        const pct = Math.round(targetVolume * 100);
        message = isTouch
          ? `Volume: ${pct}% • Swipe up to increase, down to reduce`
          : `Volume: ${pct}% • Scroll wheel or click arrows to adjust`;
      }

      dispatch({
        type: 'SET_GLOBAL_NOTIFICATION',
        payload: { message, type: 'info' },
      });

      notificationDebounceRef.current = setTimeout(() => {
        dispatch({ type: 'SET_GLOBAL_NOTIFICATION', payload: null });
      }, 3000);
    },
    [dispatch]
  );

  /**
   * Opens the mobile percentage indicator and schedules an auto-dismiss timer.
   */
  const openMobilePercentage = useCallback(() => {
    setIsMobileOpen(true);
    if (mobileCloseTimeoutRef.current) {
      clearTimeout(mobileCloseTimeoutRef.current);
    }
    mobileCloseTimeoutRef.current = setTimeout(() => {
      setIsMobileOpen(false);
    }, 3500);
  }, []);

  // Dismiss mobile percentage indicator when clicking/tapping outside
  useEffect(() => {
    if (!isMobileOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isMobileOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (notificationDebounceRef.current) {
        clearTimeout(notificationDebounceRef.current);
      }
      if (mobileCloseTimeoutRef.current) {
        clearTimeout(mobileCloseTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Toggles between muted state and previous active volume.
   */
  const handleToggleMute = useCallback(() => {
    const isTouch = checkIsTouch();
    openMobilePercentage();

    if (volume > 0) {
      changeVolume(0);
      notifyVolume(0, isTouch);
    } else {
      const restored = previousVolumeRef.current || 0.8;
      changeVolume(restored);
      notifyVolume(restored, isTouch);
    }
  }, [volume, changeVolume, notifyVolume, checkIsTouch, openMobilePercentage]);

  /**
   * Increments volume by 5%.
   * @param {React.MouseEvent} [e] - Optional click event.
   */
  const handleIncrementStep = useCallback(
    (e) => {
      e?.stopPropagation();
      const next = clampVolume(volume + 0.05);
      changeVolume(next);
      notifyVolume(next, false);
    },
    [volume, changeVolume, clampVolume, notifyVolume]
  );

  /**
   * Decrements volume by 5%.
   * @param {React.MouseEvent} [e] - Optional click event.
   */
  const handleDecrementStep = useCallback(
    (e) => {
      e?.stopPropagation();
      const next = clampVolume(volume - 0.05);
      changeVolume(next);
      notifyVolume(next, false);
    },
    [volume, changeVolume, clampVolume, notifyVolume]
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
      const next = clampVolume(volume + delta);
      changeVolume(next);
      notifyVolume(next, false);
    },
    [volume, changeVolume, clampVolume, notifyVolume]
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
        openMobilePercentage();
      }

      if (touchStateRef.current.isDragging) {
        const velocity = Math.abs(deltaY) / elapsed;
        const velocityMultiplier = Math.min(3.5, 1 + velocity * 1.5);

        // Standard stroke distance: ~180px maps to 100% volume
        const volumeChange = (deltaY / 180) * velocityMultiplier;
        const targetVolume = clampVolume(touchStateRef.current.startVolume + volumeChange);
        changeVolume(targetVolume);
      }
    },
    [changeVolume, clampVolume, openMobilePercentage]
  );

  /**
   * Finalizes touch interaction: clears drag state and notifies with current volume.
   */
  const handleTouchEnd = useCallback(() => {
    if (touchStateRef.current.isDragging) {
      notifyVolume(volume, true);
    }
    setTimeout(() => {
      touchStateRef.current.isDragging = false;
    }, 100);
  }, [notifyVolume, volume]);

  const isMuted = volume === 0;
  const volumePercentage = Math.round(volume * 100);
  const isIndicatorVisible = isHovered || isMobileOpen;

  // Pick appropriate icon based on volume level
  const VolumeIcon = isMuted ? VolumeX : volume <= 0.5 ? Volume1 : Volume2;

  const dynamicColor = isMuted
    ? 'rgba(255, 255, 255, 0.4)'
    : `color-mix(in srgb, ${accentColor || 'rgb(var(--primary))'} 30%, #ffffff)`;

  return (
    <div
      ref={containerRef}
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

      {/* Percentage & Desktop Stepper chevrons container */}
      <div
        className={`flex items-center gap-1 transition-all duration-200 overflow-hidden ${
          isIndicatorVisible
            ? 'opacity-100 max-w-[85px] ml-1.5 pointer-events-auto'
            : 'opacity-0 max-w-0 pointer-events-none'
        }`}
        title="Scroll or click chevrons to adjust volume"
      >
        {/* Percentage badge */}
        <span
          className={`text-[10px] font-mono font-bold tracking-tight px-1.5 py-0.5 rounded border backdrop-blur-sm transition-colors ${
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
