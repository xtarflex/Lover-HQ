/**
 * @file CollectionManagementFace.test.jsx
 * @description Unit tests for CollectionManagementFace component:
 * 3D inert layering, tab navigation, and library tap injection mode integration.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CollectionManagementFace from './CollectionManagementFace';
import * as MusicContextModule from '../../../contexts/MusicContext';

// Mock framer-motion to render elements immediately
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('CollectionManagementFace component', () => {
  const mockInjectTrackIntoQueue = vi.fn();
  const mockRemoveFromLibrary = vi.fn();
  const mockSetIsCardFlipped = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(MusicContextModule, 'useMusic').mockReturnValue({
      library: [
        {
          id: 'lib-track-1',
          title: 'Midnight City',
          artist: 'M83',
          duration_seconds: 243,
          source: 'upload',
          url: 'https://example.com/midnight.mp3',
        },
      ],
      queue: [],
      currentTrack: null,
      isPlaying: false,
      accentColor: '#3b82f6',
      injectTrackIntoQueue: mockInjectTrackIntoQueue,
      removeFromLibrary: mockRemoveFromLibrary,
      playlists: [],
      saveQueueAsPlaylist: vi.fn(),
      loadPlaylist: vi.fn(),
      deletePlaylist: vi.fn(),
      setIsCardFlipped: mockSetIsCardFlipped,
      libraryTapMode: 'override',
    });
  });

  it('renders inert attribute when face is not active (isFlipped=false)', () => {
    const { container, rerender } = render(
      <CollectionManagementFace isFlipped={false} onOpenAddModal={vi.fn()} />
    );

    const faceEl = container.querySelector('.face-collection-management');
    expect(faceEl).toHaveAttribute('inert');

    rerender(<CollectionManagementFace isFlipped={true} onOpenAddModal={vi.fn()} />);
    expect(faceEl).not.toHaveAttribute('inert');
  });

  it('injects track with libraryTapMode strategy when tapping a library track', () => {
    render(<CollectionManagementFace isFlipped={true} onOpenAddModal={vi.fn()} />);

    const trackRow = screen.getByText('Midnight City');
    fireEvent.click(trackRow);

    expect(mockInjectTrackIntoQueue).toHaveBeenCalledWith('lib-track-1', 'override');
    expect(mockSetIsCardFlipped).toHaveBeenCalledWith(false);
  });
});
