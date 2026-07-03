import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VoiceMessagePlayer } from './Chat';

/**
 * Unit tests for the VoiceMessagePlayer component.
 */
describe('VoiceMessagePlayer', () => {
  it('renders the play button and 25 waveform bars', () => {
    const mockSrc = 'https://example.com/audio.webm';
    const { container } = render(<VoiceMessagePlayer src={mockSrc} />);

    // Play button exists
    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();

    // 25 waveform bars exist
    const waveformBars = container.querySelectorAll('.w-\\[3px\\]');
    expect(waveformBars).toHaveLength(25);
  });

  it('toggles playing state when the play/pause button is clicked', async () => {
    const mockSrc = 'https://example.com/audio.webm';
    render(<VoiceMessagePlayer src={mockSrc} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();

    // Click play
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Renders the pause button
    const pauseButton = await screen.findByRole('button', { name: /pause/i });
    expect(pauseButton).toBeInTheDocument();
  });

  it('handles clicking on the waveform to seek', async () => {
    const mockSrc = 'https://example.com/audio.webm';
    const { container } = render(<VoiceMessagePlayer src={mockSrc} />);

    // Wait for MockAudio to fire metadata/duration events asynchronously
    await waitFor(() => {
      // MockAudio defaults to a duration of 180 seconds, formatted as '3:00'
      expect(screen.getByText('3:00')).toBeInTheDocument();
    });

    const waveformContainer = container.querySelector('.flex.items-center.space-x-\\[2px\\]');
    expect(waveformContainer).toBeInTheDocument();

    // Mock getBoundingClientRect
    vi.spyOn(waveformContainer, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      width: 100,
      top: 0,
      height: 32,
      right: 110,
      bottom: 32,
      x: 10,
      y: 0,
      toJSON: () => {},
    });

    // Click at 50% of the width (clientX = 60, since left is 10, clickX = 50)
    await act(async () => {
      fireEvent.mouseDown(waveformContainer, { clientX: 60 });
    });

    // Since mock duration is 180 (from MockAudio), seeking 50% should update progress
    // Half of the 25 bars (around 12-13 bars) should become filled.
    // Let's verify that the background colors have updated.
    const filledBars = container.querySelectorAll('.bg-primary');
    // Expect some bars to be filled
    expect(filledBars.length).toBeGreaterThan(0);
  });
});
