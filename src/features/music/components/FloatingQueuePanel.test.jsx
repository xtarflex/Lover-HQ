/**
 * @file src/features/music/components/FloatingQueuePanel.test.jsx
 * @description Unit tests for FloatingQueuePanel component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FloatingQueuePanel from './FloatingQueuePanel';

// Mock contexts
vi.mock('../../../contexts/MusicContext', () => ({
  useMusic: () => ({
    queue: [
      { id: 'track-1', queue_row_id: 'q-1', title: 'Song One', artist: 'Artist A' },
      { id: 'track-2', queue_row_id: 'q-2', title: 'Song Two', artist: 'Artist B' },
    ],
    currentTrack: { id: 'track-1', queue_row_id: 'q-1' },
    isPlaying: true,
    playTrackById: vi.fn(),
    removeFromActiveQueue: vi.fn(),
    reorderQueue: vi.fn(),
  }),
}));

vi.mock('../../../contexts/AppContext', () => ({
  useAppContext: () => ({
    user: { id: 'user-1', avatar_url: null },
    partner: { id: 'partner-1', avatar_url: null },
  }),
}));

describe('FloatingQueuePanel', () => {
  it('renders queue items and close button when isVisible is true', () => {
    const mockOnClose = vi.fn();
    render(
      <FloatingQueuePanel
        isVisible={true}
        onOpenAddModal={vi.fn()}
        onSaveAsPlaylist={vi.fn()}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Up Next')).toBeInTheDocument();
    expect(screen.getByText('Song One')).toBeInTheDocument();
    expect(screen.getByText('Song Two')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close queue/i });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const mockOnClose = vi.fn();
    render(
      <FloatingQueuePanel
        isVisible={true}
        onOpenAddModal={vi.fn()}
        onSaveAsPlaylist={vi.fn()}
        onClose={mockOnClose}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when isVisible is false', () => {
    const { queryByText } = render(
      <FloatingQueuePanel
        isVisible={false}
        onOpenAddModal={vi.fn()}
        onSaveAsPlaylist={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(queryByText('Up Next')).not.toBeInTheDocument();
  });
});
