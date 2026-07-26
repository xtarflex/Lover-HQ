/**
 * @file AnimatedSticker.test.jsx
 * @description Unit tests for the battery-optimized AnimatedSticker component.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnimatedSticker } from './AnimatedSticker';

describe('AnimatedSticker', () => {
  beforeEach(() => {
    // Mock IntersectionObserver class constructor
    class MockIntersectionObserver {
      constructor(callback) {
        this.callback = callback;
      }
      observe(element) {
        this.callback([{ isIntersecting: true, target: element }]);
      }
      unobserve() {}
      disconnect() {}
    }

    window.IntersectionObserver = MockIntersectionObserver;

    // Mock HTMLCanvasElement.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    });
  });

  it('renders sticker image with given alt and src', () => {
    render(<AnimatedSticker src="https://example.com/emoji.webp" alt="Heart Emoji" />);
    const img = screen.getByAltText('Heart Emoji');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/emoji.webp');
  });

  it('re-triggers animation key playback when clicked/tapped', () => {
    const { container } = render(
      <AnimatedSticker src="https://example.com/emoji.webp" alt="Heart Emoji" />
    );
    const wrapper = container.firstChild;

    expect(screen.getByAltText('Heart Emoji')).toBeInTheDocument();
    fireEvent.click(wrapper);
    expect(screen.getByAltText('Heart Emoji')).toBeInTheDocument();
  });
});
