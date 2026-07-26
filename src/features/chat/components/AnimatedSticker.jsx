/**
 * @file AnimatedSticker.jsx
 * @description Battery-optimized animated emoji sticker component for Lover-HQ.
 * Features:
 * - Plays WebP animation natively for ~3.5s (2 cycles) upon entering viewport.
 * - Swaps to static Jumbo Emoji symbol (or high-DPI canvas snapshot) when paused,
 *   completely stopping WebP infinite looping and eliminating CPU/GPU overhead.
 * - Triggers Heartbeat Haptic Vibration ([140, 100, 140]) on single heart emoji mount or tap.
 * - Replays on tap or when scrolled back into view.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

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

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const playTimerRef = useRef(null);

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
   * Captures current image frame onto canvas as fallback for non-unicode sticker assets.
   */
  const freezeFrame = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (img && canvas && !char) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const width = (img.naturalWidth || 128) * dpr;
        const height = (img.naturalHeight || 128) * dpr;
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        try {
          ctx.drawImage(img, 0, 0, width, height);
        } catch {
          // Ignore cross-origin canvas security errors
        }
      }
    }
    setIsPlaying(false);
  }, [char]);

  /**
   * Triggers native WebP playback for 2 animation loops (~3.5 seconds) then pauses.
   */
  const triggerPlayback = useCallback(() => {
    setIsPlaying(true);
    setPlayCountKey((prev) => prev + 1);
    triggerHeartbeatHaptic();

    clearTimeout(playTimerRef.current);
    playTimerRef.current = setTimeout(() => {
      freezeFrame();
    }, 3500);
  }, [triggerHeartbeatHaptic, freezeFrame]);

  // IntersectionObserver: Handle viewport entry/exit
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          triggerPlayback();
        } else {
          freezeFrame();
          clearTimeout(playTimerRef.current);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      clearTimeout(playTimerRef.current);
    };
  }, [triggerPlayback, freezeFrame]);

  return (
    <div
      ref={containerRef}
      onClick={triggerPlayback}
      title="Tap to replay animation"
      className="cursor-pointer select-none flex items-center justify-center relative group active:scale-95 transition-transform"
    >
      {/* Active native WebP image during playback */}
      {isPlaying ? (
        <img
          ref={imgRef}
          key={`sticker-play-${playCountKey}`}
          src={src}
          alt={alt}
          className={className}
          onLoad={() => {
            const img = imgRef.current;
            const canvas = canvasRef.current;
            if (img && canvas && !char) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const width = img.naturalWidth || 128;
                const height = img.naturalHeight || 128;
                canvas.width = width;
                canvas.height = height;
                try {
                  ctx.drawImage(img, 0, 0, width, height);
                } catch {
                  // Ignore cross-origin error
                }
              }
            }
          }}
        />
      ) : char ? (
        /* Jumbo Static Emoji Symbol Swap when paused */
        <div className="w-14 h-14 flex items-center justify-center text-4xl select-none opacity-95 group-hover:opacity-100 transition-opacity animate-fade-in">
          <span>{char}</span>
        </div>
      ) : (
        /* Static high-DPI frozen canvas frame fallback when paused */
        <canvas
          ref={canvasRef}
          className={`${className} block opacity-95 group-hover:opacity-100 transition-opacity`}
        />
      )}
    </div>
  );
}

export default AnimatedSticker;
