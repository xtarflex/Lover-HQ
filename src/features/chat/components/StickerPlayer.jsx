/**
 * @file StickerPlayer.jsx
 * @description Universal multi-format Sticker Player supporting transparent .webp, .png,
 * .svg, and dotLottie (.lottie) animations with deterministic 2-cycle playback and tap-to-replay triggers.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * StickerPlayer component.
 *
 * @param {{
 *   src: string,
 *   alt?: string,
 *   className?: string,
 *   onClick?: Function
 * }} props
 * @returns {React.ReactElement}
 */
export function StickerPlayer({
  src,
  alt = 'Sticker',
  className = 'w-24 h-24 object-contain',
  onClick,
}) {
  const [playKey, setPlayKey] = useState(0);
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  const isLottie = src && src.toLowerCase().endsWith('.lottie');

  /**
   * Resets animation to frame 0 and plays exactly 2 full animation cycles.
   */
  const triggerPlayback = useCallback(() => {
    setPlayKey((prev) => prev + 1);
    const el = playerRef.current;
    if (el && isLottie) {
      try {
        el.setAttribute('loop', '2');
        el.setAttribute('background', 'transparent');
        el.setAttribute('speed', '1');
        if (typeof el.seek === 'function') {
          el.seek(0);
        }
        if (typeof el.stop === 'function') {
          el.stop();
        }
        if (typeof el.play === 'function') {
          el.play();
        }
      } catch {
        // Fallback
      }
    }
  }, [isLottie]);

  // Viewport intersection observer: handles entering/exiting view
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !isLottie) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          triggerPlayback();
        } else {
          const el = playerRef.current;
          if (el && typeof el.pause === 'function') {
            try {
              el.pause();
            } catch {
              // Fallback
            }
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [triggerPlayback, isLottie]);

  const handleTap = (e) => {
    e.stopPropagation();
    triggerPlayback();
    if (onClick) onClick();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      title="Tap to replay"
      className={`cursor-pointer select-none flex items-center justify-center relative active:scale-95 transition-transform ${className}`}
    >
      {isLottie ? (
        <dotlottie-player
          ref={playerRef}
          key={`lottie-${playKey}`}
          src={src}
          background="transparent"
          speed="1"
          loop="2"
          autoplay="true"
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <img
          key={`img-sticker-${playKey}`}
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}

export default StickerPlayer;
