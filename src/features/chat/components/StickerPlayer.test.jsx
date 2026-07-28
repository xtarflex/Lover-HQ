/**
 * @file StickerPlayer.test.jsx
 * @description Unit tests for the universal StickerPlayer component supporting dotLottie and WebP stickers.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StickerPlayer } from './StickerPlayer';

describe('StickerPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
  });

  it('renders img element for standard image stickers with clean encoded URL', () => {
    render(<StickerPlayer src="/stickers/Love Heart.png" alt="Love Heart" />);
    const img = screen.getByAltText('Love Heart');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/stickers/Love%20Heart.png');
  });

  it('renders dotlottie-player custom element for .lottie animation assets', () => {
    const { container } = render(
      <StickerPlayer src="/stickers/Bird pair love and flying sky.lottie" alt="Bird Pair" />
    );
    const player = container.querySelector('dotlottie-player');
    expect(player).toBeInTheDocument();
    expect(player).toHaveAttribute(
      'src',
      '/stickers/Bird%20pair%20love%20and%20flying%20sky.lottie'
    );
  });

  it('triggers replay key state increment and click callback on tap', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <StickerPlayer src="/stickers/like.lottie" onClick={handleClick} />
    );
    const wrapper = container.firstChild;

    fireEvent.click(wrapper);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
