import React from 'react';

/**
 * Custom YouTube Music icon SVG component from user assets.
 *
 * @param {Object} props
 * @param {string} [props.className] - Tailwind/CSS classes
 * @param {number} [props.size] - Width and height in pixels
 * @returns {React.ReactElement} The SVG element.
 */
export function YoutubeIcon({ className = 'w-6 h-6', size }) {
  const finalSize = size || 24;
  return (
    <svg
      className={className}
      width={finalSize}
      height={finalSize}
      viewBox="0 0 100 100"
      version="1.1"
      xmlSpace="preserve"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      fill="none"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0" />
      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <g id="SVGRepo_iconCarrier">
        <g id="Layer_1" />
        <g id="Layer_2">
          <g>
            <g>
              <g>
                <path
                  fill="#FF0000"
                  d="M50,2.5C23.766,2.5,2.5,23.823,2.5,50.126c2.502,63.175,92.507,63.157,95-0.001 C97.5,23.823,76.233,2.5,50,2.5z M50,77.399c-15.036,0-27.27-12.233-27.27-27.27c0.74-18.662,14.654-27.134,27.269-27.134 c0.001,0,0.001,0,0.002,0c12.616,0.001,26.531,8.473,27.267,27.073C77.27,65.167,65.036,77.399,50,77.399z"
                />
                <path
                  fill="#FF0000"
                  d="M50.002,26.103c-15.946-0.001-23.704,12.486-24.165,24.088C25.838,63.453,36.677,74.292,50,74.292 S74.162,63.453,74.162,50.13C73.705,38.591,65.948,26.105,50.002,26.103z"
                />
              </g>
              <path
                fill="#F1F1F1"
                d="M41.055,52.528c-0.001,2.575,0.001,7.867,0,10.46c0,0,21.802-13.417,21.802-13.417L41.055,37.272V52.528z"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
