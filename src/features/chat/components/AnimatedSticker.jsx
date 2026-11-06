/**
 * @file AnimatedSticker.jsx
 * @description Battery-optimized animated emoji & APNG/WebP sticker component for Lover-HQ.
 * Features:
 * - Plays WebP/APNG animation natively for ~3.5s (2 cycles) upon entering viewport (or infinite based on setting).
 * - Pauses offscreen using IntersectionObserver.
 * - Captures frame onto offscreen canvas & unmounts animated img to static PNG data URL (0% CPU/GPU overhead).
 * - Graceful onError fallback rendering.
 * - Heartbeat Haptic Vibration on tap.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * AnimatedSticker component.
 *
 * @param {{
 *   src: string,
 *   alt: string,
 *   char?: string,
 *   className?: string
 * }} props
 * @returns {React.ReactElement}
 */
export function AnimatedSticker({ src, alt, char, className = 'w-14 h-14 object-contain' }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playCountKey, setPlayCountKey] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [frozenDataUrl, setFrozenDataUrl] = useState(null);

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const playTimerRef = useRef(null);

  const hasBeenVisibleRef = useRef(false);

  /**
   * Triggers physical double-pulse heartbeat haptic vibration on mobile devices.
   */
  const triggerHeartbeatHaptic = useCallback(() => {
    const isHeart = char === '❤️' || alt === 'Heart' || (src && src.includes('2764_fe0f'));
    if (isHeart && typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([140, 100, 140]);
      } catch {
        // Ignore unpersisted browser user-gesture restrictions
      }
    }
  }, [char, alt, src]);

  /**
   * Captures current image frame onto offscreen canvas and swaps to static PNG data URL.
   */
  const freezeFrame = useCallback(() => {
    const img = imgRef.current;
    if (img && !char) {
      try {
        const offscreen = document.createElement('canvas');
        const width = img.naturalWidth || 128;
        const height = img.naturalHeight || 128;
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = offscreen.toDataURL('image/png');
          if (dataUrl && dataUrl.length > 50) {
            setFrozenDataUrl(dataUrl);
          }
        }
      } catch {
        // Ignore cross-origin canvas security restrictions
      }
    }
    setIsPlaying(false);
  }, [char]);

  /**
   * Triggers native WebP/APNG playback obeying sticker_playback_mode setting.
   */
  const triggerPlayback = useCallback(() => {
    setHasError(false);
    setIsPlaying(true);
    setPlayCountKey((prev) => prev + 1);
    triggerHeartbeatHaptic();

    const mode =
      typeof window !== 'undefined'
        ? localStorage.getItem('sticker_playback_mode') || 'infinite'
        : 'infinite';

    if (mode === 'two_cycles') {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = setTimeout(() => {
        freezeFrame();
      }, 3500);
    }
  }, [triggerHeartbeatHaptic, freezeFrame]);

  // IntersectionObserver: Handle viewport entry/exit for offscreen battery saving
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          hasBeenVisibleRef.current = true;
          triggerPlayback();
        } else if (hasBeenVisibleRef.current) {
          freezeFrame();
          clearTimeout(playTimerRef.current);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    const handlePrefChange = (e) => {
      if (e?.detail?.key === 'sticker_playback_mode') {
        triggerPlayback();
      }
    };
    window.addEventListener('preference_change', handlePrefChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('preference_change', handlePrefChange);
      clearTimeout(playTimerRef.current);
    };
  }, [triggerPlayback, freezeFrame]);

  if (hasError) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 p-1`}
        title={`Failed to load: ${alt}`}
      >
        <AlertTriangle className="w-5 h-5 text-amber-400/80" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={triggerPlayback}
      title="Tap to replay animation"
      className="cursor-pointer select-none flex items-center justify-center relative group active:scale-95 transition-transform"
    >
      {/* Loading Skeleton Placeholder */}
      {!isLoaded && isPlaying && (
        <div className="absolute inset-0 rounded-2xl bg-slate-800/30 border border-slate-700/20 flex items-center justify-center z-10 pointer-events-none" />
      )}

      {/* Active native WebP/APNG image during playback */}
      {isPlaying ? (
        <img
          ref={imgRef}
          key={`sticker-play-${playCountKey}`}
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setIsLoaded(true);
            setHasError(true);
          }}
        />
      ) : char ? (
        /* Jumbo Static Emoji Symbol Swap when paused */
        <div className="w-14 h-14 flex items-center justify-center text-5xl leading-none select-none opacity-95 group-hover:opacity-100 transition-opacity animate-fade-in">
          <span>{char}</span>
        </div>
      ) : frozenDataUrl ? (
        /* Static frozen PNG snapshot frame when paused (0% CPU/GPU overhead) */
        <img
          src={frozenDataUrl}
          alt={alt}
          className={`${className} block opacity-95 group-hover:opacity-100 transition-opacity`}
        />
      ) : (
        /* Original static asset fallback if offscreen canvas capture fails */
        <img
          src={src}
          alt={alt}
          className={`${className} block opacity-95 group-hover:opacity-100 transition-opacity`}
        />
      )}
    </div>
  );
}

export default AnimatedSticker;
