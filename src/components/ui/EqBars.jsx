import React from 'react';

/**
 * Animated equalizer bars icon, purely CSS-driven.
 * Staggers animation delays across multiple bars to simulate audio.
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} [props.size='md'] - The size variant of the equalizer.
 * @param {string} [props.color='text-primary'] - CSS class for text/bars color.
 * @param {boolean} [props.paused=false] - Whether the equalizer animation is paused.
 * @returns {React.ReactElement} The EqBars component.
 */
export function EqBars({ size = 'md', color = 'text-primary', paused = false }) {
  const sizeMap = {
    sm: { wrapper: 'h-3 gap-[2px]', bar: 'w-[2px]' },
    md: { wrapper: 'h-4 gap-[2.5px]', bar: 'w-[3px]' },
    lg: { wrapper: 'h-6 gap-[3px]', bar: 'w-[4px]' },
  };
  const s = sizeMap[size] || sizeMap.md;

  // Stagger delays (ms) for the 5 equalizer bars
  const delays = [0, 120, 60, 180, 30];

  return (
    <span
      className={`inline-flex items-end ${s.wrapper} ${color}`}
      aria-hidden="true"
      role="img"
    >
      {delays.map((delay, i) => (
        <span
          key={i}
          className={`${s.bar} rounded-full bg-current`}
          style={{
            height: '20%',
            animation: `eq-bar-wave 0.9s ease-in-out infinite alternate`,
            animationDelay: `${delay}ms`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      ))}
    </span>
  );
}
export default EqBars;
