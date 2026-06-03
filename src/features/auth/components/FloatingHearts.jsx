/**
 * @file FloatingHearts.jsx
 * @description Animated floating heart elements used as decorative background.
 */

import React, { useMemo } from 'react';
import { Heart } from 'lucide-react';

/**
 * Renders a set of animated floating heart elements positioned randomly
 * across the background using cryptographically-random values for consistent
 * layout across renders.
 *
 * @param {{ count?: number }} props
 * @param {number} [props.count=8] - Number of heart elements to render.
 * @returns {React.ReactElement}
 */
export default function FloatingHearts({ count = 8 }) {
  const floatingHearts = useMemo(() => {
    return [...Array(count)].map((_, i) => {
      const arr = new Uint32Array(3);
      window.crypto.getRandomValues(arr);
      const rand1 = arr[0] / (0xffffffff + 1);
      const rand2 = arr[1] / (0xffffffff + 1);
      const rand3 = arr[2] / (0xffffffff + 1);
      return {
        id: i,
        left: `${rand1 * 100}%`,
        top: `${rand2 * 100}%`,
        fontSize: `${20 + rand3 * 40}px`,
        animationDelay: `${i * 0.8}s`,
        animationDuration: `${8 + rand1 * 4}s`,
      };
    });
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute text-primary/20 animate-float"
          style={{
            left: heart.left,
            top: heart.top,
            fontSize: heart.fontSize,
            animationDelay: heart.animationDelay,
            animationDuration: heart.animationDuration,
          }}
        >
          <Heart className="fill-current w-full h-full" />
        </div>
      ))}
    </div>
  );
}
