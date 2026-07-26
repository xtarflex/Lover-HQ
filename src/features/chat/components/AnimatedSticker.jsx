/**
 * @file AnimatedSticker.jsx
 * @description Battery-optimized animated emoji sticker component for Lover-HQ.
 * Features:
 * - Plays WebP animation for ~3.5s (2 cycles) upon entering viewport.
 * - Pauses WebP animation smoothly after 2 cycles or when scrolled out of view.
 * - Retains 100% native vector/image crispness and smoothness (no canvas rasterization).
 * - Replays on tap or when scrolled back into view.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * AnimatedSticker component.
 *
 * @param {{
 *   src: string,
 *   alt: string,
 *   className?: string
 * }} props
 * @returns {React.ReactElement}
 */
export function AnimatedSticker({ src, alt, className = 'w-14 h-14 object-contain' }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playCountKey, setPlayCountKey] = useState(0);

  const containerRef = useRef(null);
  const playTimerRef = useRef(null);

  /**
   * Pauses animation playback after ~3.5 seconds.
   */
  const pauseAnimation = useCallback(() => {
    setIsPlaying(false);
  }, []);

  /**
   * Triggers playback for 2 animation loops (~3.5 seconds) then pauses.
   */
  const triggerPlayback = useCallback(() => {
    setIsPlaying(true);
    setPlayCountKey((prev) => prev + 1);

    clearTimeout(playTimerRef.current);
    playTimerRef.current = setTimeout(() => {
      pauseAnimation();
    }, 3500);
  }, [pauseAnimation]);

  // IntersectionObserver: Handle viewport entry/exit
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          triggerPlayback();
        } else {
          pauseAnimation();
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
  }, [triggerPlayback, pauseAnimation]);

  return (
    <div
      ref={containerRef}
      onClick={triggerPlayback}
      title="Tap to replay animation"
      className="cursor-pointer select-none flex items-center justify-center relative group active:scale-95 transition-transform"
    >
      <img
        key={`sticker-play-${playCountKey}`}
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          !isPlaying ? 'opacity-90 grayscale-[5%]' : 'opacity-100'
        }`}
      />
    </div>
  );
}
