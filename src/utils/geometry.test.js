/**
 * @file geometry.test.js
 * @description Comprehensive unit tests for 2D geometry functions.
 * Tests edge cases, out-of-bounds inputs, and DOM interaction robustness.
 */

import { describe, it, expect, vi } from 'vitest';
import { computeOffscreenIndicator, scrollToItem } from './geometry.js';

describe('computeOffscreenIndicator', () => {
  // Helper to construct a DOMRect-like object
  const createRect = (left, top, width, height) => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  });

  const containerRect = createRect(0, 0, 100, 100);

  it('returns null when the item is fully or partially inside container', () => {
    // Fully inside
    const item1 = createRect(10, 10, 20, 20);
    expect(computeOffscreenIndicator(containerRect, item1)).toBeNull();

    // Partially inside (overlapping, center is inside container bounds)
    const item2 = createRect(-5, -5, 20, 20); // Center at (5, 5)
    expect(computeOffscreenIndicator(containerRect, item2)).toBeNull();
  });

  it('returns null for degenerate case when item is exactly centered', () => {
    // Container center is (50, 50). Item center is also (50, 50).
    const centeredItem = createRect(40, 40, 20, 20);
    expect(computeOffscreenIndicator(containerRect, centeredItem)).toBeNull();
  });

  it('correctly calculates indicators for off-screen left', () => {
    const item = createRect(-30, 40, 20, 20); // Center: (-20, 50)
    // Container center: (50, 50). dx = -70, dy = 0.
    // Margin: 10. W_inset = 80. H_inset = 80.
    // Expected boundary left: 10, top: 50. Angle: 180 degrees.
    const result = computeOffscreenIndicator(containerRect, item, 10);
    expect(result).not.toBeNull();
    expect(result.left).toBeCloseTo(10);
    expect(result.top).toBeCloseTo(50);
    expect(result.angle).toBeCloseTo(180);
  });

  it('correctly calculates indicators for off-screen right', () => {
    const item = createRect(110, 40, 20, 20); // Center: (120, 50)
    // Container center: (50, 50). dx = 70, dy = 0.
    // Margin: 10. Expected boundary left: 90, top: 50. Angle: 0 degrees.
    const result = computeOffscreenIndicator(containerRect, item, 10);
    expect(result).not.toBeNull();
    expect(result.left).toBeCloseTo(90);
    expect(result.top).toBeCloseTo(50);
    expect(result.angle).toBeCloseTo(0);
  });

  it('correctly calculates indicators for off-screen top', () => {
    const item = createRect(40, -30, 20, 20); // Center: (50, -20)
    // Container center: (50, 50). dx = 0, dy = -70.
    // Margin: 10. Expected boundary left: 50, top: 10. Angle: -90 degrees.
    const result = computeOffscreenIndicator(containerRect, item, 10);
    expect(result).not.toBeNull();
    expect(result.left).toBeCloseTo(50);
    expect(result.top).toBeCloseTo(10);
    expect(result.angle).toBeCloseTo(-90);
  });

  it('correctly calculates indicators for off-screen bottom', () => {
    const item = createRect(40, 110, 20, 20); // Center: (50, 120)
    // Container center: (50, 50). dx = 0, dy = 70.
    // Margin: 10. Expected boundary left: 50, top: 90. Angle: 90 degrees.
    const result = computeOffscreenIndicator(containerRect, item, 10);
    expect(result).not.toBeNull();
    expect(result.left).toBeCloseTo(50);
    expect(result.top).toBeCloseTo(90);
    expect(result.angle).toBeCloseTo(90);
  });

  it('correctly calculates indicators for diagonal bottom-right', () => {
    const item = createRect(110, 110, 20, 20); // Center: (120, 120)
    // dx = 70, dy = 70. W = 80, H = 80.
    // t = min(40/70, 40/70) = 4/7.
    // Expected boundary left: 50 + 40 = 90, top: 50 + 40 = 90. Angle: 45 degrees.
    const result = computeOffscreenIndicator(containerRect, item, 10);
    expect(result).not.toBeNull();
    expect(result.left).toBeCloseTo(90);
    expect(result.top).toBeCloseTo(90);
    expect(result.angle).toBeCloseTo(45);
  });

  it('handles custom margins correctly', () => {
    const item = createRect(110, 40, 20, 20); // Center: (120, 50)
    // Margin = 25. W_inset = 100 - 50 = 50.
    // Expected boundary left: 50 + 25 = 75.
    const result = computeOffscreenIndicator(containerRect, item, 25);
    expect(result.left).toBeCloseTo(75);
  });

  it('behaves robustly under negative container or float boundaries', () => {
    const negContainer = createRect(-100, -100, 200, 200); // Center: (0, 0)
    const item = createRect(190, 190, 20, 20); // Center: (200, 200), dx = 200, dy = 200
    // Margin = 20. W_inset = 200 - 40 = 160. H_inset = 160.
    // t = 80 / 200 = 0.4.
    // x = 80, y = 80.
    // Local result left = containerRect.width / 2 + x = 100 + 80 = 180, top = 180. Angle = 45.
    const result = computeOffscreenIndicator(negContainer, item, 20);
    expect(result.left).toBeCloseTo(180);
    expect(result.top).toBeCloseTo(180);
  });
});

describe('scrollToItem', () => {
  it('does not throw and returns immediately if scrollContainerRef is empty', () => {
    const ref = { current: null };
    expect(() => scrollToItem(ref, 'item-id')).not.toThrow();
  });

  it('does not throw and returns immediately if item is not found inside container', () => {
    const mockContainer = {
      querySelector: vi.fn().mockReturnValue(null),
    };
    const ref = { current: mockContainer };
    expect(() => scrollToItem(ref, 'missing-item-id')).not.toThrow();
    expect(mockContainer.querySelector).toHaveBeenCalledWith(
      '.fridge-item[data-item-id="missing-item-id"]'
    );
  });

  it('queries container and triggers smooth scrollIntoView on found item element', () => {
    const mockItem = {
      scrollIntoView: vi.fn(),
    };
    const mockContainer = {
      querySelector: vi.fn().mockReturnValue(mockItem),
    };
    const ref = { current: mockContainer };

    scrollToItem(ref, 'item-123');

    expect(mockContainer.querySelector).toHaveBeenCalledWith(
      '.fridge-item[data-item-id="item-123"]'
    );
    expect(mockItem.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  });
});
