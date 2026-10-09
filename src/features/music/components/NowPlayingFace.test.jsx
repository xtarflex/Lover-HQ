/**
 * @file NowPlayingFace.test.jsx
 * @description Unit tests for NowPlayingFace component:
 * 3D inert layering, repeat mode cycling, and basic playback interactions.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import NowPlayingFace from './NowPlayingFace';
import * as MusicContextModule from '../../../contexts/MusicContext';
import * as AppContextModule from '../../../contexts/AppContext';

// Mock framer-motion to render elements immediately
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style }) => (
      <div className={className} style={style}>
        {children}
      </div>
    ),
    span: ({ children, className }) => <span className={className}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock visualizers to avoid Canvas/WebGL dependencies in JSDOM
vi.mock('./visualizers/FluidVisualizer', () => ({
  default: () => <div data-testid="fluid-vis" />,
}));
vi.mock('./visualizers/WaveBarVisualizer', () => ({
  default: () => <div data-testid="wave-vis" />,
}));
vi.mock('./visualizers/VinylDiscVisualizer', () => ({
  default: () => <div data-testid="vinyl-vis" />,
}));
vi.mock('./visualizers/CircularRingVisualizer', () => ({
  default: () => <div data-testid="ring-vis" />,
}));

describe('NowPlayingFace component', () => {
  const mockSetQueueLoopMode = vi.fn();
  const mockPauseLocalPlayback = vi.fn();
  const mockResumeLocalPlayback = vi.fn();
  const mockPlayTrackById = vi.fn();
  const mockSeekLocalPlayback = vi.fn();
  const mockAppDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({ user: { id: 'user-1' } });
    vi.spyOn(AppContextModule, 'useAppDispatch').mockReturnValue(mockAppDispatch);
    vi.spyOn(MusicContextModule, 'useMusic').mockReturnValue({
      currentTrack: {
        id: 'track-1',
        title: 'Starboy',
        artist: 'The Weeknd',
        duration_seconds: 230,
        artwork_url: 'https://example.com/art.jpg',
      },
      isPlaying: false,
      currentTime: 45,
      duration: 230,
      volume: 0.8,
      crossfadeDuration: 3,
      analyserNode: null,
      workletNode: null,
      activePlayer: 'html5',
      accentColor: '#8b5cf6',
      visualizerMode: 'wave',
      fallbackBackdrop: '/backdrops/backdrop-1.png',
      pauseLocalPlayback: mockPauseLocalPlayback,
      resumeLocalPlayback: mockResumeLocalPlayback,
      seekLocalPlayback: mockSeekLocalPlayback,
      changeVolume: vi.fn(),
      queue: [
        { id: 'track-1', title: 'Starboy', artist: 'The Weeknd' },
        { id: 'track-2', title: 'Blinding Lights', artist: 'The Weeknd' },
      ],
      playTrackById: mockPlayTrackById,
      queueLoopMode: 'off',
      setQueueLoopMode: mockSetQueueLoopMode,
    });
  });

  it('renders inert attribute when card is flipped to Face 2', () => {
    const { container, rerender } = render(
      <MemoryRouter>
        <NowPlayingFace isFlipped={true} onOpenAddModal={vi.fn()} onSaveAsPlaylist={vi.fn()} />
      </MemoryRouter>
    );

    const faceEl = container.querySelector('.face-now-playing');
    expect(faceEl).toHaveAttribute('inert');

    rerender(
      <MemoryRouter>
        <NowPlayingFace isFlipped={false} onOpenAddModal={vi.fn()} onSaveAsPlaylist={vi.fn()} />
      </MemoryRouter>
    );
    expect(faceEl).not.toHaveAttribute('inert');
  });

  it('cycles queue loop mode when clicking repeat button', () => {
    render(
      <MemoryRouter>
        <NowPlayingFace isFlipped={false} onOpenAddModal={vi.fn()} onSaveAsPlaylist={vi.fn()} />
      </MemoryRouter>
    );

    const repeatBtn = screen.getByRole('button', { name: /Repeat off/i });
    expect(repeatBtn).toBeInTheDocument();

    fireEvent.click(repeatBtn);
    expect(mockSetQueueLoopMode).toHaveBeenCalled();

    // Verify updater function behavior
    const updater = mockSetQueueLoopMode.mock.calls[0][0];
    expect(updater('off')).toBe('all');
    expect(updater('all')).toBe('one');
    expect(updater('one')).toBe('off');
  });

  it('toggles playback when clicking the play/pause button', () => {
    render(
      <MemoryRouter>
        <NowPlayingFace isFlipped={false} onOpenAddModal={vi.fn()} onSaveAsPlaylist={vi.fn()} />
      </MemoryRouter>
    );

    const playBtn = screen.getByRole('button', { name: /Play/i });
    fireEvent.click(playBtn);
    expect(mockResumeLocalPlayback).toHaveBeenCalled();
  });
});
