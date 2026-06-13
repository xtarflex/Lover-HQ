import React from 'react';

/**
 * LoadingSpinner component that displays an animated double-heart loader.
 *
 * @param {Object} props - The component props.
 * @param {'xs'|'sm'|'md'|'lg'} [props.size] - The pre-defined size of the spinner.
 * @param {string} [props.className] - Additional CSS classes to style the spinner.
 * @param {boolean} [props.fullScreen] - Whether the spinner should cover the full screen.
 * @returns {React.ReactElement} The rendered LoadingSpinner component.
 */
export function LoadingSpinner({ size, className = '', fullScreen = false }) {
  const hasWidthClass = className.split(' ').some((c) => c.startsWith('w-'));
  const hasHeightClass = className.split(' ').some((c) => c.startsWith('h-'));

  let defaultWidth = 'w-16';
  let defaultHeight = 'h-16';

  if (size === 'xs') {
    defaultWidth = 'w-5';
    defaultHeight = 'h-5';
  } else if (size === 'sm') {
    defaultWidth = 'w-8';
    defaultHeight = 'h-8';
  } else if (size === 'md') {
    defaultWidth = 'w-16';
    defaultHeight = 'h-16';
  } else if (size === 'lg') {
    defaultWidth = 'w-32';
    defaultHeight = 'h-32';
  } else if (fullScreen) {
    defaultWidth = 'w-32';
    defaultHeight = 'h-32';
  }

  const widthClass = hasWidthClass ? '' : defaultWidth;
  const heightClass = hasHeightClass ? '' : defaultHeight;

  const finalClassName = `${widthClass} ${heightClass} text-primary ${className}`
    .replace(/\s+/g, ' ')
    .trim();

  const spinner = (
    <svg
      className={finalClassName}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Mask creates the negative "padding space" around the small heart */}
        <mask id="overlap-cutout">
          <rect width="100%" height="100%" fill="white" />
          <g transform="translate(13, 7) scale(0.8)">
            <path
              d="M12.2 8.3C10.9 6.9 8.5 7.3 8.2 9.2C8 10.5 9.3 11.7 12 13.8M12.2 8.3C13.5 6.8 15.9 7.2 16.2 9C16.4 10.4 15 11.5 12.4 13.7"
              stroke="black"
              strokeWidth="5" /* The thickness of the padded cutout */
              strokeLinecap="round"
            />
          </g>
        </mask>
      </defs>

      {/* Big Heart (Masked by the cutout) */}
      <g transform="translate(2, 0) scale(1.3)" mask="url(#overlap-cutout)">
        <path
          className="draw-path"
          pathLength="100"
          d="M12.2 8.3C10.9 6.9 8.5 7.3 8.2 9.2C8 10.5 9.3 11.7 12 13.8M12.2 8.3C13.5 6.8 15.9 7.2 16.2 9C16.4 10.4 15 11.5 12.4 13.7"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>

      {/* Small Heart (Bottom Right overlapping) */}
      <g transform="translate(13, 7) scale(0.8)">
        <path
          className="draw-path-delayed"
          pathLength="100"
          d="M12.2 8.3C10.9 6.9 8.5 7.3 8.2 9.2C8 10.5 9.3 11.7 12 13.8M12.2 8.3C13.5 6.8 15.9 7.2 16.2 9C16.4 10.4 15 11.5 12.4 13.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
        {spinner}
      </div>
    );
  }

  return spinner;
}
