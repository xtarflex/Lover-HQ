/**
 * @file geometry.js
 * @description Utility functions for computing 2D intersection geometry,
 * used for off-screen indicator positioning on canvas surfaces.
 */

/**
 * Calculates the edge-clamped position and angle of an off-screen element
 * relative to a container's bounding rect.
 *
 * The function shoots a ray from the centre of the container toward the centre
 * of the item and finds where that ray intersects the inset rectangle defined
 * by `margin` pixels from each edge. It returns `null` when the item centre is
 * already inside the visible container area.
 *
 * @param {DOMRect} containerRect - The bounding rect of the scroll container.
 * @param {DOMRect} itemRect - The bounding rect of the off-screen item.
 * @param {number} [margin=24] - Safety margin in pixels from the container edge.
 * @returns {{left: number, top: number, angle: number} | null} Position and angle in degrees, or null if on-screen.
 */
export function computeOffscreenIndicator(containerRect, itemRect, margin = 24) {
  const itemCenterX = itemRect.left + itemRect.width / 2;
  const itemCenterY = itemRect.top + itemRect.height / 2;

  const isOffLeft = itemCenterX < containerRect.left;
  const isOffRight = itemCenterX > containerRect.right;
  const isOffTop = itemCenterY < containerRect.top;
  const isOffBottom = itemCenterY > containerRect.bottom;

  if (!isOffLeft && !isOffRight && !isOffTop && !isOffBottom) {
    return null;
  }

  const containerCenterX = containerRect.left + containerRect.width / 2;
  const containerCenterY = containerRect.top + containerRect.height / 2;

  const dx = itemCenterX - containerCenterX;
  const dy = itemCenterY - containerCenterY;

  // Guard against degenerate case where item is exactly centred
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return null;

  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;

  const W = containerRect.width - 2 * margin;
  const H = containerRect.height - 2 * margin;

  // Parametric ray: point = (dx * t, dy * t). Find smallest t that hits a wall.
  let t = Infinity;
  if (dx > 0) t = Math.min(t, W / 2 / dx);
  else if (dx < 0) t = Math.min(t, -W / 2 / dx);
  if (dy > 0) t = Math.min(t, H / 2 / dy);
  else if (dy < 0) t = Math.min(t, -H / 2 / dy);

  const x = t * dx;
  const y = t * dy;

  return {
    left: containerRect.width / 2 + x,
    top: containerRect.height / 2 + y,
    angle: angleDeg,
  };
}

/**
 * Smoothly scrolls a scroll container so that the item with the given ID is
 * centred in the viewport.
 *
 * @param {React.RefObject<HTMLElement>} scrollContainerRef - Ref to the scrollable viewport element.
 * @param {string} itemId - The `data-item-id` value of the target fridge item.
 * @returns {void}
 */
export function scrollToItem(scrollContainerRef, itemId) {
  if (!scrollContainerRef.current) return;
  const container = scrollContainerRef.current;
  const itemElement = container.querySelector(`.fridge-item[data-item-id="${itemId}"]`);
  if (itemElement) {
    itemElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }
}
