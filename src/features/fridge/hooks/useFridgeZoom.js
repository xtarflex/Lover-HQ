/**
 * @file useFridgeZoom.js
 * @description Custom hook managing canvas zoom state and
 * pinch-to-zoom touch gestures for the Fridge board.
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Manages zoom level and touch-based pinch-to-zoom for the fridge canvas.
 *
 * Attaches non-passive `touchstart`, `touchmove`, and `touchend` listeners
 * to `scrollContainerRef` so that the browser's native page-scale gesture is
 * suppressed and the app controls zoom directly.
 *
 * @param {React.RefObject<HTMLElement>} scrollContainerRef - Ref to the scrollable viewport.
 * @returns {{
 *   zoom: number,
 *   zoomIn: () => void,
 *   zoomOut: () => void,
 *   resetZoom: () => void
 * }}
 */
export function useFridgeZoom(scrollContainerRef) {
  const [zoom, setZoom] = useState(1.0);
  const [touchStartDist, setTouchStartDist] = useState(0);
  const [touchStartZoom, setTouchStartZoom] = useState(1.0);

  // Keep refs in sync so touch-event callbacks always read the current value
  // without needing them as effect dependencies (which would force re-attaching
  // the non-passive listeners on every render).
  const zoomRef = useRef(zoom);
  const touchStartDistRef = useRef(touchStartDist);
  const touchStartZoomRef = useRef(touchStartZoom);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    touchStartDistRef.current = touchStartDist;
  }, [touchStartDist]);

  useEffect(() => {
    touchStartZoomRef.current = touchStartZoom;
  }, [touchStartZoom]);

  // Programmatic non-passive touch listeners for mobile pinch-to-zoom
  // to prevent default browser scaling behaviour.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        setTouchStartDist(dist);
        setTouchStartZoom(zoomRef.current);
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && touchStartDistRef.current > 0) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = dist / touchStartDistRef.current;
        setZoom(Math.max(0.6, Math.min(1.5, touchStartZoomRef.current * scale)));
      }
    };

    const onTouchEnd = () => {
      setTouchStartDist(0);
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [scrollContainerRef]);

  /**
   * Increments the canvas zoom level, bounded at a maximum of 150%.
   *
   * @returns {void}
   */
  const zoomIn = () => setZoom((prev) => Math.min(1.5, prev + 0.1));

  /**
   * Decrements the canvas zoom level, bounded at a minimum of 60%.
   *
   * @returns {void}
   */
  const zoomOut = () => setZoom((prev) => Math.max(0.6, prev - 0.1));

  /**
   * Resets the canvas zoom level to the default 100%.
   *
   * @returns {void}
   */
  const resetZoom = () => setZoom(1.0);

  return { zoom, zoomIn, zoomOut, resetZoom };
}
