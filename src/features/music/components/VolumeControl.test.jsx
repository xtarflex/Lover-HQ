/**
 * @file src/features/music/components/VolumeControl.test.jsx
 * @description Unit tests for VolumeControl component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import VolumeControl from './VolumeControl';

const mockDispatch = vi.fn();
vi.mock('../../../contexts/AppContext', () => ({
  useAppContext: () => ({}),
  useAppDispatch: () => mockDispatch,
}));

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

  it('dispatches explanatory notification on mute toggle', () => {
    mockDispatch.mockClear();
    render(<VolumeControl volume={0.8} changeVolume={vi.fn()} />);

    const button = screen.getByRole('button', { name: /mute volume/i });
    fireEvent.click(button);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_GLOBAL_NOTIFICATION',
        payload: expect.objectContaining({
          message: expect.stringMatching(/scroll|swipe|arrow/i),
        }),
      })
    );
  });

  it('handles mobile touch swipe downward to smoothly decrease volume', () => {
    const changeVolume = vi.fn();
    render(<VolumeControl volume={0.5} changeVolume={changeVolume} />);

    const container = screen.getByRole('group', { name: /volume controller/i });

    // Start touch at Y: 200
    fireEvent.touchStart(container, {
      touches: [{ clientY: 200 }],
    });

    // Move touch down to Y: 250 (deltaY = -50 downward, deadband 6 -> effectiveDeltaY = -44)
    fireEvent.touchMove(container, {
      touches: [{ clientY: 250 }],
    });

    expect(changeVolume).toHaveBeenCalled();
    const calledVolume = changeVolume.mock.calls[0][0];
    expect(calledVolume).toBeLessThan(0.5);
    // 0.5 - (44 / 260) ≈ 0.3307
    expect(calledVolume).toBeCloseTo(0.33, 2);
  });

  it('filters out jitter within deadband threshold before triggering drag', () => {
    const changeVolume = vi.fn();
    render(<VolumeControl volume={0.5} changeVolume={changeVolume} />);

    const container = screen.getByRole('group', { name: /volume controller/i });

    // Start touch at Y: 200
    fireEvent.touchStart(container, {
      touches: [{ clientY: 200 }],
    });

    // Move touch slightly (3px deltaY <= 6px deadband)
    fireEvent.touchMove(container, {
      touches: [{ clientY: 197 }],
    });

    expect(changeVolume).not.toHaveBeenCalled();
  });

  it('prevents default on touchmove events to suppress browser pull-to-refresh', () => {
    render(<VolumeControl volume={0.5} changeVolume={vi.fn()} />);

    const container = screen.getByRole('group', { name: /volume controller/i });

    const touchMoveEvent = new TouchEvent('touchmove', {
      bubbles: true,
      cancelable: true,
      touches: [{ clientY: 250 }],
    });

    act(() => {
      container.dispatchEvent(touchMoveEvent);
    });
    expect(touchMoveEvent.defaultPrevented).toBe(true);
  });

  it('prevents default on wheel events to suppress page scrolling', () => {
    render(<VolumeControl volume={0.5} changeVolume={vi.fn()} />);

    const container = screen.getByRole('group', { name: /volume controller/i });

    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 100,
    });

    act(() => {
      container.dispatchEvent(wheelEvent);
    });
    expect(wheelEvent.defaultPrevented).toBe(true);
  });

  it('closes mobile percentage indicator on outside click', () => {
    const { container } = render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <VolumeControl volume={0.8} changeVolume={vi.fn()} />
      </div>
    );

    const button = screen.getByRole('button', { name: /mute volume/i });
    fireEvent.click(button);

    const outsideArea = screen.getByTestId('outside-area');
    fireEvent.pointerDown(outsideArea);

    const percentageContainer = container.querySelector('.max-w-0');
    expect(percentageContainer).toBeInTheDocument();
  });
});
