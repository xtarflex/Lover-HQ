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

    const mode =
      typeof window !== 'undefined'
        ? localStorage.getItem('sticker_playback_mode') || 'infinite'
        : 'infinite';

    el.setAttribute('background', 'transparent');
    let timer;

    const startPlayback = () => {
      try {
        if (mode === 'two_cycles') {
          el.removeAttribute('loop');
          if (typeof el.play === 'function') el.play();
          timer = setTimeout(() => {
            if (typeof el.pause === 'function') el.pause();
          }, 3500);
        } else {
          el.setAttribute('loop', '');
          if (typeof el.play === 'function') el.play();
        }
      } catch {
        // Fallback
      }
    };

    if (el.isReady) {
      startPlayback();
    } else {
      el.addEventListener('ready', startPlayback, { once: true });
    }

    return () => {
      clearTimeout(timer);
      el.removeEventListener('ready', startPlayback);
    };
  }, [src, playKey, isLottie]);

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
