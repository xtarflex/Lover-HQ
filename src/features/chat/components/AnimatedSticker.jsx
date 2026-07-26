/**
 * @file AnimatedSticker.jsx
 * @description Battery-optimized animated emoji sticker component for Lover-HQ.
 * Features:
 * - Plays WebP animation for 2 cycles (~3.5s) upon entering viewport.
 * - Freezes onto a static canvas frame when play time expires or scrolled out of viewport (0% GPU/CPU overhead).
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
export function AnimatedSticker({ src, alt, className = 'w-16 h-16 object-contain' }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playCountKey, setPlayCountKey] = useState(0);

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const playTimerRef = useRef(null);

  /**
   * Captures the current image frame onto the canvas to freeze animation and halt GPU decoding.
   */
  const freezeFrame = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (img && canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = img.naturalWidth || 128;
        canvas.height = img.naturalHeight || 128;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } catch {
          // Ignore cross-origin canvas security errors gracefully
        }
      }
    }
    setIsPlaying(false);
  }, []);

  /**
   * Triggers playback for 2 animation loops (~3.5 seconds) then freezes frame.
   */
  const triggerPlayback = useCallback(() => {
    setIsPlaying(true);
    setPlayCountKey((prev) => prev + 1);

    clearTimeout(playTimerRef.current);
    playTimerRef.current = setTimeout(() => {
      freezeFrame();
    }, 3500);
  }, [freezeFrame]);

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
      {/* Active WebP animation */}
      <img
        ref={imgRef}
        key={`sticker-play-${playCountKey}`}
        src={src}
        alt={alt}
        className={`${className} ${isPlaying ? 'block' : 'hidden'}`}
        onLoad={() => {
          if (!isPlaying) freezeFrame();
        }}
      />

      {/* Frozen canvas frame when paused (conserves GPU/battery) */}
      <canvas
        ref={canvasRef}
        className={`${className} ${!isPlaying ? 'block' : 'hidden'} opacity-95 group-hover:opacity-100 transition-opacity`}
      />
    </div>
  );
}
