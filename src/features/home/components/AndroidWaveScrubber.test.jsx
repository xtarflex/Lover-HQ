import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AndroidWaveScrubber, formatTime } from './AndroidWaveScrubber';

describe('AndroidWaveScrubber Component', () => {
  beforeEach(() => {
    // Mock getContext on HTMLCanvasElement for headless testing
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    }));
  });

  it('formats seconds into MM:SS correctly', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(205)).toBe('3:25');
  });

  it('renders progressbar with correct aria attributes and formatted timestamps', () => {
    render(
      <AndroidWaveScrubber duration={200} currentTime={50} isPlaying={true} onSeek={vi.fn()} />
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    expect(progressbar).toHaveAttribute('aria-valuemax', '200');

    expect(screen.getByText('0:50')).toBeInTheDocument();
    expect(screen.getByText('3:20')).toBeInTheDocument();
  });
});
