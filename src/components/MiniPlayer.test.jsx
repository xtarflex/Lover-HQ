/**
 * @file src/components/MiniPlayer.test.jsx
 * @description Unit tests for MiniPlayer component covering state synchronization and transitions.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MiniPlayer } from './MiniPlayer';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/chat' }),
  useNavigate: () => mockNavigate,
}));

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

const mockPauseLocalPlayback = vi.fn();
const mockResumeLocalPlayback = vi.fn();
const mockHandleListenAlong = vi.fn();

let mockMusicState = {
  currentTrack: {
    id: 'track-1',
    title: 'Solar Echoes',
    artist: 'Nigel Stanford',
    source: 'local',
  },
  currentTime: 30,
  duration: 180,
  isPlaying: true,
  isListenAlongBlocked: false,
  pauseLocalPlayback: mockPauseLocalPlayback,
  resumeLocalPlayback: mockResumeLocalPlayback,
  handleListenAlong: mockHandleListenAlong,
  accentColor: '#38bdf8',
};

vi.mock('../contexts/MusicContext', () => ({
  useMusic: () => mockMusicState,
}));

describe('MiniPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMusicState = {
      currentTrack: {
        id: 'track-1',
        title: 'Solar Echoes',
        artist: 'Nigel Stanford',
        source: 'local',
      },
      currentTime: 30,
      duration: 180,
      isPlaying: true,
      isListenAlongBlocked: false,
      pauseLocalPlayback: mockPauseLocalPlayback,
      resumeLocalPlayback: mockResumeLocalPlayback,
      handleListenAlong: mockHandleListenAlong,
      accentColor: '#38bdf8',
    };
  });

  it('renders maximized mini player with track details and controls', () => {
    render(<MiniPlayer />);

    expect(screen.getByRole('region', { name: /mini player/i })).toBeInTheDocument();
    expect(screen.getByText('Solar Echoes')).toBeInTheDocument();
    expect(screen.getByText('Nigel Stanford')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /minimize mini player/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close mini player/i })).toBeInTheDocument();
  });

  it('toggles playback when play/pause button is clicked', () => {
    render(<MiniPlayer />);

    const pauseButton = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);
    expect(mockPauseLocalPlayback).toHaveBeenCalledTimes(1);
  });

  it('minimizes when minimize button is clicked, and maximizes on pill click', () => {
    const { rerender } = render(<MiniPlayer />);

    // Click minimize button
    const minimizeBtn = screen.getByRole('button', { name: /minimize mini player/i });
    act(() => {
      fireEvent.click(minimizeBtn);
    });

    // Minimized pill should be visible with dismiss button
    expect(screen.getByRole('button', { name: /dismiss mini player/i })).toBeInTheDocument();
    expect(screen.queryByText('Nigel Stanford')).not.toBeInTheDocument();

    // Click to maximize
    const minimizedCard = screen
      .getByRole('button', { name: /dismiss mini player/i })
      .closest('.fixed');
    act(() => {
      fireEvent.click(minimizedCard);
    });

    rerender(<MiniPlayer />);
    expect(screen.getByRole('region', { name: /mini player/i })).toBeInTheDocument();
  });

  it('preserves minimized state across track changes without forcing un-minimize', () => {
    const { rerender } = render(<MiniPlayer />);

    // Minimize player
    const minimizeBtn = screen.getByRole('button', { name: /minimize mini player/i });
    act(() => {
      fireEvent.click(minimizeBtn);
    });

    expect(screen.getByRole('button', { name: /dismiss mini player/i })).toBeInTheDocument();

    // Simulate track change while minimized
    mockMusicState = {
      ...mockMusicState,
      currentTrack: {
        id: 'track-2',
        title: 'The Box',
        artist: 'Roddy Ricch',
        source: 'youtube',
      },
    };

    rerender(<MiniPlayer />);

    // Must stay in minimized state (no dual render, no auto-expand)
    expect(screen.getByRole('button', { name: /dismiss mini player/i })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /mini player/i })).not.toBeInTheDocument();
  });

  it('closes player and pauses playback when close button is clicked', () => {
    render(<MiniPlayer />);

    const closeBtn = screen.getByRole('button', { name: /close mini player/i });
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(mockPauseLocalPlayback).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region', { name: /mini player/i })).not.toBeInTheDocument();
  });
});
