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

    const playNow = () => {
      try {
        const dotLottieInst =
          el.dotLottie || (typeof el.getDotLottie === 'function' ? el.getDotLottie() : null);
        console.log('[StickerPlayer Debug]', {
          src,
          mode,
          isReady: el.isReady,
          hasDotLottie: !!dotLottieInst,
        });

        if (mode === 'two_cycles') {
          if (dotLottieInst && typeof dotLottieInst.setLoop === 'function') {
            dotLottieInst.setLoop(false);
          } else if (typeof el.setLoop === 'function') {
            el.setLoop(false);
          }
          el.loop = false;
          if (typeof el.play === 'function') el.play();

          clearTimeout(playTimerRef.current);
          playTimerRef.current = setTimeout(() => {
            if (typeof el.pause === 'function') el.pause();
          }, 3500);
        } else {
          // Infinite loop mode
          if (dotLottieInst && typeof dotLottieInst.setLoop === 'function') {
            dotLottieInst.setLoop(true);
          } else if (typeof el.setLoop === 'function') {
            el.setLoop(true);
          }
          el.loop = true;
          if (typeof el.play === 'function') el.play();
        }
      } catch (err) {
        console.error('[StickerPlayer Error]', err);
      }
    };

    if (el.isReady) {
      playNow();
    } else {
      el.addEventListener('ready', playNow, { once: true });
    }
  }, [isLottie, src]);

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

    const handleComplete = () => {
      const mode =
        typeof window !== 'undefined'
          ? localStorage.getItem('sticker_playback_mode') || 'infinite'
          : 'infinite';
      console.log('[StickerPlayer] complete event fired', { src, mode });
      if (mode === 'infinite') {
        startPlayback();
      }
    };

    const handlePrefChange = (e) => {
      if (e?.detail?.key === 'sticker_playback_mode') {
        startPlayback();
      }
    };

    const playerEl = playerRef.current;
    if (playerEl) {
      playerEl.addEventListener('complete', handleComplete);
    }
    window.addEventListener('preference_change', handlePrefChange);

    return () => {
      observer.disconnect();
      if (playerEl) {
        playerEl.removeEventListener('complete', handleComplete);
      }
      window.removeEventListener('preference_change', handlePrefChange);
      clearTimeout(playTimerRef.current);
    };
  }, [isLottie, startPlayback, pausePlayback, playKey, src]);

  const handleTap = () => {
    setPlayKey((prev) => prev + 1);
    startPlayback();
    if (onClick) onClick();
  };

  const mode =
    typeof window !== 'undefined'
      ? localStorage.getItem('sticker_playback_mode') || 'infinite'
      : 'infinite';
  const isInfinite = mode !== 'two_cycles';

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
          loop={isInfinite}
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
