/**
 * @file useOffscreenIndicators.js
 * @description Hook that tracks which new fridge items are scrolled
 * out of the visible viewport and computes their indicator positions.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  computeOffscreenIndicator,
  scrollToItem as scrollToItemUtil,
} from '../../../utils/geometry';

/**
 * Tracks off-screen unread fridge items and exposes a helper to scroll to them.
 *
 * Attaches `scroll` and `resize` listeners to `scrollContainerRef`. After
 * every scroll event (and once on mount after a short settling delay) it
 * queries every `.fridge-item[data-is-new="true"]` element in the container
 * and computes its indicator position using {@link computeOffscreenIndicator}.
 *
 * @param {React.RefObject<HTMLElement>} scrollContainerRef - Ref to the scrollable viewport.
 * @param {Array} items - The current fridge item list (used to re-run the
 *   calculation when items are added or removed).
 * @param {number} zoom - Current zoom level (triggers recalculation on change).
 * @param {boolean} isLoading - Whether data is still loading (defers setup until false).
 * @returns {{
 *   offscreenUnreadItems: Array<{id: string, left: number, top: number, angle: number}>,
 *   scrollToItem: (itemId: string) => void
 * }}
 */
export function useOffscreenIndicators(scrollContainerRef, items, zoom, isLoading) {
  const [offscreenUnreadItems, setOffscreenUnreadItems] = useState([]);

  const updateOffscreenIndicators = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    const itemElements = container.querySelectorAll('.fridge-item[data-is-new="true"]');
    const offscreen = [];

    itemElements.forEach((el) => {
      const itemRect = el.getBoundingClientRect();
      const itemId = el.getAttribute('data-item-id');
      const result = computeOffscreenIndicator(containerRect, itemRect);
      if (result) {
        offscreen.push({ id: itemId, ...result });
      }
    });

    setOffscreenUnreadItems(offscreen);
  }, [scrollContainerRef]);

  // Set up scroll and resize listeners
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoading) return;

    // Run initial calculation with a short timeout to let layout settle
    const initialTimer = setTimeout(() => {
      updateOffscreenIndicators();
    }, 400);

    container.addEventListener('scroll', updateOffscreenIndicators);
    window.addEventListener('resize', updateOffscreenIndicators);

    return () => {
      clearTimeout(initialTimer);
      container.removeEventListener('scroll', updateOffscreenIndicators);
      window.removeEventListener('resize', updateOffscreenIndicators);
    };
  }, [items, zoom, isLoading, scrollContainerRef, updateOffscreenIndicators]);

  /**
   * Smoothly scrolls the container so that the item with the given ID is
   * centred in the visible viewport.
   *
   * @param {string} itemId - The `data-item-id` of the target fridge item.
   * @returns {void}
   */
  const scrollToItem = useCallback(
    (itemId) => {
      scrollToItemUtil(scrollContainerRef, itemId);
    },
    [scrollContainerRef]
  );

  return { offscreenUnreadItems, scrollToItem };
}
