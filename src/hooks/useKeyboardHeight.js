/**
 * @file useKeyboardHeight.js
 * @description Custom hook that tracks the on-screen keyboard height on mobile
 * browsers using the Visual Viewport API. Returns the current keyboard height
 * and the visible viewport height so components can adjust their layout
 * accordingly (e.g. push an input bar above the keyboard).
 */

import { useState, useEffect } from 'react';

/**
 * Tracks the software keyboard height and visible viewport height via the
 * `window.visualViewport` API. Falls back gracefully in environments where
 * the Visual Viewport API is unavailable (SSR, older browsers).
 *
 * @returns {{ keyboardHeight: number, viewportHeight: number }}
 *   `keyboardHeight` — estimated height of the on-screen keyboard in pixels (0 when hidden).
 *   `viewportHeight` — visible viewport height in pixels.
 */
export function useKeyboardHeight() {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    /**
     * Recalculates the keyboard and viewport height from the current Visual Viewport state.
     *
     * @returns {void}
     */
    const handleViewportChange = () => {
      const vv = window.visualViewport;
      setViewportHeight(vv.height);
      const offsetBottom = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardHeight(Math.max(0, offsetBottom));
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);

    // Run once immediately so the initial values are accurate
    handleViewportChange();

    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportChange);
      window.visualViewport.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  return { keyboardHeight, viewportHeight };
}
