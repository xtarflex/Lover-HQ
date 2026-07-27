/**
 * @file StickerPlayer.jsx
 * @description Universal multi-format Sticker Player supporting transparent .webp, .png,
 * .svg, and dotLottie (.lottie) animations with tap-to-replay triggers.
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

  const isLottie = src && src.toLowerCase().endsWith('.lottie');

  useEffect(() => {
    const el = playerRef.current;
    if (!el || !isLottie) return;

    try {
      el.setAttribute('background', 'transparent');
      el.setAttribute('speed', '1');
    } catch {
      // Fallback
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (typeof el.play === 'function') {
            try {
              el.play();
            } catch {
              // Fallback
            }
          }
        } else {
          if (typeof el.pause === 'function') {
            try {
              el.pause();
            } catch {
              // Fallback
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [src, isLottie]);

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

  return (
    <div
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
