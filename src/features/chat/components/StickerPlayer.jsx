/**
 * @file StickerPlayer.jsx
 * @description Universal multi-format Sticker Player supporting transparent .webp, .png,
 * .svg, and dotLottie (.lottie) animations with tap-to-replay triggers.
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
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const playTimerRef = useRef(null);

  const isLottie = src && src.toLowerCase().endsWith('.lottie');

  const startPlayback = useCallback(() => {
    const el = playerRef.current;
    if (!el || !isLottie) return;

    const mode =
      typeof window !== 'undefined'
        ? localStorage.getItem('sticker_playback_mode') || 'infinite'
        : 'infinite';

    el.setAttribute('background', 'transparent');

    const playNow = () => {
      try {
        if (mode === 'two_cycles') {
          el.removeAttribute('loop');
          if (typeof el.play === 'function') el.play();
          clearTimeout(playTimerRef.current);
          playTimerRef.current = setTimeout(() => {
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
      playNow();
    } else {
      el.addEventListener('ready', playNow, { once: true });
    }
  }, [isLottie]);

  const pausePlayback = useCallback(() => {
    const el = playerRef.current;
    clearTimeout(playTimerRef.current);
    if (el && typeof el.pause === 'function') {
      try {
        el.pause();
      } catch {
        // Fallback
      }
    }
  }, []);

  // IntersectionObserver: Auto-play when entering viewport, pause when exiting
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !isLottie) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startPlayback();
        } else {
          pausePlayback();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      clearTimeout(playTimerRef.current);
    };
  }, [isLottie, startPlayback, pausePlayback, playKey]);

  const handleTap = () => {
    setPlayKey((prev) => prev + 1);
    startPlayback();
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
