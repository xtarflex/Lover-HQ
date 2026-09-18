/**
 * @file src/features/music/components/VolumeControl.test.jsx
 * @description Unit tests for VolumeControl component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VolumeControl from './VolumeControl';

describe('VolumeControl', () => {
  it('renders primary volume button with correct aria-label when unmuted', () => {
    render(<VolumeControl volume={0.8} changeVolume={vi.fn()} />);

    const button = screen.getByRole('button', { name: /mute volume/i });
    expect(button).toBeInTheDocument();
  });

  it('renders primary volume button with unmute label when muted (volume is 0)', () => {
    render(<VolumeControl volume={0} changeVolume={vi.fn()} />);

    const button = screen.getByRole('button', { name: /unmute volume/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('toggles mute to 0 when clicked, and restores previous volume when clicked again', () => {
    const changeVolume = vi.fn();
    const { rerender } = render(<VolumeControl volume={0.65} changeVolume={changeVolume} />);

    const button = screen.getByRole('button', { name: /mute volume/i });
    fireEvent.click(button);
    expect(changeVolume).toHaveBeenCalledWith(0);

    // Simulate parent state update to volume = 0
    rerender(<VolumeControl volume={0} changeVolume={changeVolume} />);
    const unmuteButton = screen.getByRole('button', { name: /unmute volume/i });
    fireEvent.click(unmuteButton);
    expect(changeVolume).toHaveBeenCalledWith(0.65);
  });

  it('increments volume by 0.05 when clicking the up chevron', () => {
    const changeVolume = vi.fn();
    render(<VolumeControl volume={0.5} changeVolume={changeVolume} />);

    const upButton = screen.getByRole('button', { name: /increase volume/i });
    fireEvent.click(upButton);
    expect(changeVolume).toHaveBeenCalledWith(0.55);
  });

  it('decrements volume by 0.05 when clicking the down chevron', () => {
    const changeVolume = vi.fn();
    render(<VolumeControl volume={0.5} changeVolume={changeVolume} />);

    const downButton = screen.getByRole('button', { name: /decrease volume/i });
    fireEvent.click(downButton);
    expect(changeVolume).toHaveBeenCalledWith(0.45);
  });

  it('adjusts volume when mouse wheel is scrolled over the container', () => {
    const changeVolume = vi.fn();
    render(<VolumeControl volume={0.5} changeVolume={changeVolume} />);

    const container = screen.getByRole('group', { name: /volume controller/i });

    // Scroll up (deltaY < 0) -> increment
    fireEvent.wheel(container, { deltaY: -100 });
    expect(changeVolume).toHaveBeenCalledWith(0.55);

    // Scroll down (deltaY > 0) -> decrement
    fireEvent.wheel(container, { deltaY: 100 });
    expect(changeVolume).toHaveBeenCalledWith(0.45);
  });

  it('handles mobile touch swipe upward to increase volume', () => {
    const changeVolume = vi.fn();
    render(<VolumeControl volume={0.5} changeVolume={changeVolume} />);

    const container = screen.getByRole('group', { name: /volume controller/i });

    // Start touch at Y: 200
    fireEvent.touchStart(container, {
      touches: [{ clientY: 200 }],
    });

    // Move touch up to Y: 150 (deltaY = +50 upward)
    fireEvent.touchMove(container, {
      touches: [{ clientY: 150 }],
    });

    expect(changeVolume).toHaveBeenCalled();
    const calledVolume = changeVolume.mock.calls[0][0];
    expect(calledVolume).toBeGreaterThan(0.5);
  });

  it('handles mobile touch tap (no dragging) to toggle mute', () => {
    const changeVolume = vi.fn();
    render(<VolumeControl volume={0.8} changeVolume={changeVolume} />);

    const button = screen.getByRole('button', { name: /mute volume/i });

    fireEvent.touchStart(button, {
      touches: [{ clientY: 100 }],
    });
    fireEvent.touchEnd(button);
    fireEvent.click(button);

    expect(changeVolume).toHaveBeenCalledWith(0);
  });
});
