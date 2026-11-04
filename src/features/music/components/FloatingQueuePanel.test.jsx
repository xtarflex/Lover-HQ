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
const mockSetQueueLoopMode = vi.fn();
const mockReorderQueue = vi.fn();
const mockRemoveFromActiveQueue = vi.fn();

vi.mock('../../../contexts/MusicContext', () => ({
  useMusic: () => ({
    queue: [
      { id: 'track-1', queue_row_id: 'q-1', title: 'Song One', artist: 'Artist A' },
      { id: 'track-2', queue_row_id: 'q-2', title: 'Song Two', artist: 'Artist B' },
    ],
    currentTrack: { id: 'track-1', queue_row_id: 'q-1' },
    isPlaying: true,
    playTrackById: vi.fn(),
    removeFromActiveQueue: mockRemoveFromActiveQueue,
    reorderQueue: mockReorderQueue,
    queueLoopMode: 'off',
    setQueueLoopMode: mockSetQueueLoopMode,
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

  it('calls onClose when clicking outside the panel', () => {
    const mockOnClose = vi.fn();
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <FloatingQueuePanel
          isVisible={true}
          onOpenAddModal={vi.fn()}
          onSaveAsPlaylist={vi.fn()}
          onClose={mockOnClose}
        />
      </div>
    );

    const outsideArea = screen.getByTestId('outside-area');
    fireEvent.pointerDown(outsideArea);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('cycles queue loop mode when clicking repeat button in bottom toolbar', () => {
    render(
      <FloatingQueuePanel
        isVisible={true}
        onOpenAddModal={vi.fn()}
        onSaveAsPlaylist={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const repeatBtn = screen.getByRole('button', { name: /Repeat off/i });
    expect(repeatBtn).toBeInTheDocument();

    fireEvent.click(repeatBtn);
    expect(mockSetQueueLoopMode).toHaveBeenCalled();
  });

  it('moves track down when clicking Move Down button', () => {
    render(
      <FloatingQueuePanel
        isVisible={true}
        onOpenAddModal={vi.fn()}
        onSaveAsPlaylist={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const moveDownBtn = screen.getByRole('button', { name: /Move Song One down/i });
    expect(moveDownBtn).toBeInTheDocument();

    fireEvent.click(moveDownBtn);
    expect(mockReorderQueue).toHaveBeenCalledWith([
      { id: 'track-2', queue_row_id: 'q-2', title: 'Song Two', artist: 'Artist B' },
      { id: 'track-1', queue_row_id: 'q-1', title: 'Song One', artist: 'Artist A' },
    ]);
  });

  it('removes track when clicking delete button', () => {
    render(
      <FloatingQueuePanel
        isVisible={true}
        onOpenAddModal={vi.fn()}
        onSaveAsPlaylist={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /Remove Song One from queue/i });
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(mockRemoveFromActiveQueue).toHaveBeenCalledWith('q-1');
  });

  it('triggers onSaveAsPlaylist and onOpenAddModal', () => {
    const mockSave = vi.fn();
    const mockAdd = vi.fn();
    render(
      <FloatingQueuePanel
        isVisible={true}
        onOpenAddModal={mockAdd}
        onSaveAsPlaylist={mockSave}
        onClose={vi.fn()}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save queue as playlist/i });
    fireEvent.click(saveBtn);
    expect(mockSave).toHaveBeenCalledTimes(1);

    const addBtn = screen.getByRole('button', { name: /Add song to library/i });
    fireEvent.click(addBtn);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });
});
