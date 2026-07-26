/**
 * @file AnimatedSticker.jsx
 * @description Battery-optimized animated emoji sticker component for Lover-HQ.
 * Features:
 * - Plays WebP animation natively for ~3.5s (2 cycles) upon entering viewport.
 * - Freezes onto a static high-res Canvas frame when play duration expires or scrolled out of view,
 *   completely stopping WebP image looping and eliminating CPU/GPU rendering overhead.
 * - Replays from frame 0 on tap or when scrolled back into view.
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
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const playTimerRef = useRef(null);

  /**
   * Freezes the WebP animation by capturing the current frame onto a high-DPI canvas
   * and unmounting/hiding the looping WebP image element.
   */
  const freezeFrame = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (img && canvas) {
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
  }, []);

  /**
   * Triggers native WebP playback for 2 animation loops (~3.5 seconds) then freezes frame.
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
      {/* Active native WebP image during playback */}
      {isPlaying && (
        <img
          ref={imgRef}
          key={`sticker-play-${playCountKey}`}
          src={src}
          alt={alt}
          className={className}
          onLoad={() => {
            // Pre-draw to canvas when image loads so freezeFrame is instant
            const img = imgRef.current;
            const canvas = canvasRef.current;
            if (img && canvas) {
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
      )}

      {/* Static high-DPI frozen canvas frame when paused (stops WebP infinite looping) */}
      <canvas
        ref={canvasRef}
        className={`${className} ${!isPlaying ? 'block' : 'hidden'} opacity-95 group-hover:opacity-100 transition-opacity`}
      />
    </div>
  );
}
