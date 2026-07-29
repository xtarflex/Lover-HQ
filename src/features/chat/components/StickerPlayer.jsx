/**
 * @file StickerPlayer.jsx
 * @description Universal multi-format Sticker Player supporting transparent .webp, .png,
 * .svg, and dotLottie (.lottie) animations with battery-optimized frame unmounting.
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatedSticker } from './AnimatedSticker';

/**
 * Encodes URI path spaces and special characters for sticker asset URLs.
 * @param {string} url
 * @returns {string}
 */
function getCleanStickerUrl(url) {
  if (!url) return '';
  if (url.includes('%20')) return url;
  return encodeURI(url);
}

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
  const [isLoaded, setIsLoaded] = useState(false);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const playTimerRef = useRef(null);
  const isIntersectingRef = useRef(true);

  const cleanSrc = getCleanStickerUrl(src);
  const isLottie =
    cleanSrc &&
    (cleanSrc.toLowerCase().endsWith('.lottie') || cleanSrc.toLowerCase().includes('.lottie'));

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

  // IntersectionObserver: Pause animation when scrolled out of view to save battery and prevent lag
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isLottie) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        isIntersectingRef.current = isVisible;
        const el = playerRef.current;
        if (!el) return;

        if (isVisible) {
          if (typeof el.play === 'function') {
            try {
              el.play();
            } catch {
              // Ignore restriction
            }
          }
        } else {
          if (typeof el.pause === 'function') {
            try {
              el.pause();
            } catch {
              // Ignore restriction
            }
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [isLottie]);

  useEffect(() => {
    const el = playerRef.current;
    if (!el || !isLottie) return;

    try {
      el.setAttribute('autoplay', '');
      if (isInfinite) {
        el.setAttribute('loop', '');
      } else {
        el.removeAttribute('loop');
      }
      if (cleanSrc) {
        el.setAttribute('src', cleanSrc);
      }
    } catch {
      // Guard against non-DOM environments
    }

    const handleReady = () => {
      setIsLoaded(true);
      if (typeof el.play === 'function' && isIntersectingRef.current) {
        try {
          el.play();
        } catch {
          // Fallback
        }
      }
    };

    handleReady();
    el.addEventListener?.('ready', handleReady);
    el.addEventListener?.('load', handleReady);

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
      el.removeEventListener?.('ready', handleReady);
      el.removeEventListener?.('load', handleReady);
      clearTimeout(playTimerRef.current);
    };
  }, [isLottie, isInfinite, playKey, cleanSrc]);

  if (!isLottie) {
    return <AnimatedSticker src={cleanSrc} alt={alt} className={className} />;
  }

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      title="Tap to replay"
      className={`cursor-pointer select-none flex items-center justify-center relative active:scale-95 transition-transform ${className}`}
    >
      {/* Loading Skeleton Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 rounded-2xl bg-slate-800/30 border border-slate-700/20 flex items-center justify-center z-10 pointer-events-none" />
      )}

      <dotlottie-player
        ref={playerRef}
        key={`lottie-${playKey}`}
        src={cleanSrc}
        autoplay={true}
        loop={isInfinite ? true : undefined}
        background="transparent"
        speed="1"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default StickerPlayer;
