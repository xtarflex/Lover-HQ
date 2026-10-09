/**
 * @file MusicSettingsPanel.test.jsx
 * @description Unit tests for MusicSettingsPanel options, toggles, and callbacks.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MusicSettingsPanel from './MusicSettingsPanel';
import * as MusicContextModule from '../../../contexts/MusicContext';

describe('MusicSettingsPanel component', () => {
  const mockSetFallbackBackdrop = vi.fn();
  const mockSetVisualizerMode = vi.fn();
  const mockSetCrossfadeDuration = vi.fn();
  const mockSetLibraryTapMode = vi.fn();
  const mockSetQueueLoopMode = vi.fn();
  const mockSetBackgroundKeepAlive = vi.fn();
  const mockSetStreamErrorAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(MusicContextModule, 'useMusic').mockReturnValue({
      fallbackBackdrop: '/backdrops/backdrop-1.png',
      setFallbackBackdrop: mockSetFallbackBackdrop,
      visualizerMode: 'liquid',
      setVisualizerMode: mockSetVisualizerMode,
      crossfadeDuration: 3,
      setCrossfadeDuration: mockSetCrossfadeDuration,
      libraryTapMode: 'append',
      setLibraryTapMode: mockSetLibraryTapMode,
      queueLoopMode: 'off',
      setQueueLoopMode: mockSetQueueLoopMode,
      backgroundKeepAlive: true,
      setBackgroundKeepAlive: mockSetBackgroundKeepAlive,
      streamErrorAction: 'auto_skip',
      setStreamErrorAction: mockSetStreamErrorAction,
    });
  });

  it('renders fallback notice if music context is unavailable', () => {
    vi.spyOn(MusicContextModule, 'useMusic').mockReturnValue(null);
    render(<MusicSettingsPanel />);
    expect(screen.getByText(/Music player context is unavailable/i)).toBeInTheDocument();
  });

  it('renders all section titles properly', () => {
    render(<MusicSettingsPanel />);
    expect(screen.getByText('Default Backdrop Wallpaper')).toBeInTheDocument();
    expect(screen.getByText('Visualizer Style')).toBeInTheDocument();
    expect(screen.getByText('Library Selection Action')).toBeInTheDocument();
    expect(screen.getByText('Repeat & Looping')).toBeInTheDocument();
    expect(screen.getByText('Continuous Background Playback')).toBeInTheDocument();
    expect(screen.getByText('Stream Interruption Recovery')).toBeInTheDocument();
    expect(screen.getByText('Crossfade Transition')).toBeInTheDocument();
  });

  it('handles library selection action clicks', () => {
    render(<MusicSettingsPanel />);
    const playImmediatelyBtn = screen.getByRole('button', { name: /Play Immediately/i });
    fireEvent.click(playImmediatelyBtn);
    expect(mockSetLibraryTapMode).toHaveBeenCalledWith('override');
  });

  it('handles repeat and loop mode selection clicks', () => {
    render(<MusicSettingsPanel />);
    const loopQueueBtn = screen.getByRole('button', { name: /Loop Entire Queue/i });
    fireEvent.click(loopQueueBtn);
    expect(mockSetQueueLoopMode).toHaveBeenCalledWith('all');

    const repeatCurrentBtn = screen.getByRole('button', { name: /Repeat Current Song/i });
    fireEvent.click(repeatCurrentBtn);
    expect(mockSetQueueLoopMode).toHaveBeenCalledWith('one');
  });

  it('handles continuous background playback switch toggle', () => {
    render(<MusicSettingsPanel />);
    const switchEl = screen.getByRole('switch', { name: /Toggle continuous background playback/i });
    expect(switchEl).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(switchEl);
    expect(mockSetBackgroundKeepAlive).toHaveBeenCalledWith(false);
  });

  it('handles stream interruption recovery selection clicks', () => {
    render(<MusicSettingsPanel />);
    const pauseNotifyBtn = screen.getByRole('button', { name: /Pause & Notify/i });
    fireEvent.click(pauseNotifyBtn);
    expect(mockSetStreamErrorAction).toHaveBeenCalledWith('pause');
  });

  it('handles visualizer style selection clicks', () => {
    render(<MusicSettingsPanel />);
    const vinylBtn = screen.getByRole('button', { name: /Vinyl Disc/i });
    fireEvent.click(vinylBtn);
    expect(mockSetVisualizerMode).toHaveBeenCalledWith('vinyl');
  });

  it('handles crossfade duration slider adjustments', () => {
    render(<MusicSettingsPanel />);
    const slider = screen.getByLabelText(/Crossfade duration in seconds/i);
    fireEvent.change(slider, { target: { value: '6' } });
    expect(mockSetCrossfadeDuration).toHaveBeenCalledWith(6);
  });
});
