/**
 * @file StickerPlayer.jsx
 * @description Universal multi-format Sticker Player supporting transparent .webp, .png,
 * .svg, and dotLottie (.lottie) animations with native Web Component autoplay and loop attributes.
 */

import React, { useState, useEffect, useRef } from 'react';

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
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const playTimerRef = useRef(null);

  const isLottie = src && src.toLowerCase().endsWith('.lottie');

  const mode =
    typeof window !== 'undefined'
      ? localStorage.getItem('sticker_playback_mode') || 'infinite'
      : 'infinite';
  const isInfinite = mode !== 'two_cycles';

  const handleTap = () => {
    setPlayKey((prev) => prev + 1);
    const el = playerRef.current;
    if (el && typeof el.play === 'function') {
      try {
        el.play();
      } catch {
        // Fallback
      }
    }
    if (onClick) onClick();
  };

  useEffect(() => {
    const el = playerRef.current;
    if (!el || !isLottie) return;

    if (!isInfinite) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = setTimeout(() => {
        if (typeof el.pause === 'function') {
          try {
            el.pause();
          } catch {
            // Fallback
          }
        }
      }, 3500);
    }

    return () => {
      clearTimeout(playTimerRef.current);
    };
  }, [isLottie, isInfinite, playKey]);

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
          autoplay={true}
          loop={isInfinite ? true : undefined}
          background="transparent"
          speed="1"
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
