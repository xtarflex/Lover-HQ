/**
 * @file StickerPlayer.jsx
 * @description Universal multi-format Sticker Player supporting transparent .webp, .png,
 * .svg, and dotLottie (.lottie) animations with tap-to-replay triggers.
 */

import React, { useState, useRef } from 'react';

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
  className = 'w-20 h-20 object-contain',
  onClick,
}) {
  const [playKey, setPlayKey] = useState(0);
  const containerRef = useRef(null);

  const isLottie = src && src.toLowerCase().endsWith('.lottie');

  const handleTap = () => {
    setPlayKey((prev) => prev + 1);
    if (onClick) onClick();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      title="Tap to replay"
      className="cursor-pointer select-none flex items-center justify-center relative active:scale-95 transition-transform"
    >
      {isLottie ? (
        <dotlottie-player
          key={`lottie-${playKey}`}
          src={src}
          autoplay
          loop
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <img
          key={`img-sticker-${playKey}`}
          src={src}
          alt={alt}
          loading="lazy"
          className={className}
        />
      )}
    </div>
  );
}

export default StickerPlayer;
