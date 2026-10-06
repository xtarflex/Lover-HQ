import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

// Mock AppContext
vi.mock('../../contexts/AppContext', () => ({
  useAppContext: () => ({
    user: { id: 'user-1', name: 'Taylor', created_at: '2026-01-01T00:00:00Z' },
    partner: { id: 'user-2', name: 'Alex' },
    presence: { user: 'online', partner: 'online', partnerRoom: 'Music Room' },
  }),
  useAppDispatch: () => vi.fn(),
}));

// Mock MusicContext
const mockUseMusic = vi.fn(() => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  pauseLocalPlayback: vi.fn(),
  resumeLocalPlayback: vi.fn(),
  seekLocalPlayback: vi.fn(),
  playTrackById: vi.fn(),
  queue: [],
}));

vi.mock('../../contexts/MusicContext', () => ({
  useMusic: () => mockUseMusic(),
}));

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        or: () => ({
          not: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

describe('Home Dashboard Component', () => {
  it('renders all Bento Grid sections properly in State B (Greeting) on initial load', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Row 1: Hero greeting (State B)
    expect(screen.getByRole('region', { name: /hero status/i })).toBeInTheDocument();
    expect(screen.getByText(/welcome home/i)).toBeInTheDocument();

    // Row 2: Widgets
    expect(screen.getByRole('region', { name: /core widgets/i })).toBeInTheDocument();
    expect(screen.getByText(/quick sparks/i)).toBeInTheDocument();
    expect(screen.getAllByText('Games').length).toBeGreaterThanOrEqual(1);

    // Row 3: Navigator
    expect(screen.getByRole('region', { name: /module navigator/i })).toBeInTheDocument();
    expect(screen.getByText(/navigation/i)).toBeInTheDocument();
    expect(screen.getAllByText('Fridge').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Theatre').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Journal').length).toBeGreaterThanOrEqual(1);

    // Discovery Widget
    expect(screen.getAllByText('Try Out').length).toBeGreaterThanOrEqual(1);
  });

  it('renders State A (Media Player) when music is actively playing', () => {
    mockUseMusic.mockReturnValueOnce({
      currentTrack: { id: 'track-1', title: 'Golden Hour', artist: 'JVKE' },
      isPlaying: true,
      currentTime: 30,
      duration: 180,
      pauseLocalPlayback: vi.fn(),
      resumeLocalPlayback: vi.fn(),
      seekLocalPlayback: vi.fn(),
      playTrackById: vi.fn(),
      queue: [{ id: 'track-1', title: 'Golden Hour', artist: 'JVKE' }],
    });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText('Golden Hour')).toBeInTheDocument();
    expect(screen.getByText('JVKE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });
});
