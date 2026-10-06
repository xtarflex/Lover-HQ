import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WaterfallScrubber, formatTimestamp } from './WaterfallScrubber';

describe('WaterfallScrubber Component', () => {
  it('formats seconds to (M:SS) correctly', () => {
    expect(formatTimestamp(0)).toBe('0:00');
    expect(formatTimestamp(65)).toBe('1:05');
    expect(formatTimestamp(215)).toBe('3:35');
    expect(formatTimestamp(-10)).toBe('0:00');
  });

  it('renders slider track, canvas, and monospace timestamps', () => {
    const { container } = render(
      <WaterfallScrubber duration={180} initialProgress={45} isPlaying={true} />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuenow', '45');
    expect(slider).toHaveAttribute('aria-valuemax', '180');

    // Canvas element
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Monospace timestamps
    expect(screen.getByText('0:45')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  it('triggers onSeek callback on pointer interaction', () => {
    const mockOnSeek = vi.fn();
    render(
      <WaterfallScrubber
        duration={200}
        initialProgress={50}
        isPlaying={false}
        onSeek={mockOnSeek}
      />
    );

    const slider = screen.getByRole('slider');
    slider.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 200,
      height: 16,
      right: 200,
      bottom: 16,
    }));
    slider.setPointerCapture = vi.fn();

    fireEvent.pointerDown(slider, { clientX: 100, pointerId: 1 });
    expect(mockOnSeek).toHaveBeenCalled();
  });
});
