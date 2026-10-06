/**
 * @file FridgeSpeedDial.test.jsx
 * @description Comprehensive unit tests for FridgeSpeedDial component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FridgeSpeedDial from './FridgeSpeedDial';

describe('FridgeSpeedDial', () => {
  const defaultProps = {
    isSpeedDialOpen: false,
    setIsSpeedDialOpen: vi.fn(),
    onAddNote: vi.fn(),
    onAddPhoto: vi.fn(),
    onAddVoice: vi.fn(),
    onAddEmoji: vi.fn(),
    onOpenChat: vi.fn(),
  };

  it('renders closed FAB plus button by default', () => {
    render(<FridgeSpeedDial {...defaultProps} />);

    const fab = screen.getByRole('button', { name: 'Open speed dial' });
    expect(fab).toBeInTheDocument();
    expect(screen.queryByText('Add Note')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Close speed dial overlay')).not.toBeInTheDocument();
  });

  it('triggers setIsSpeedDialOpen when FAB is clicked', () => {
    const setIsSpeedDialOpen = vi.fn();
    render(<FridgeSpeedDial {...defaultProps} setIsSpeedDialOpen={setIsSpeedDialOpen} />);

    const fab = screen.getByRole('button', { name: 'Open speed dial' });
    fireEvent.click(fab);

    expect(setIsSpeedDialOpen).toHaveBeenCalledWith(true);
  });

  it('renders action buttons and backdrop overlay when isSpeedDialOpen is true', () => {
    render(<FridgeSpeedDial {...defaultProps} isSpeedDialOpen={true} />);

    expect(screen.getByRole('button', { name: 'Close speed dial' })).toBeInTheDocument();
    expect(screen.getByLabelText('Close speed dial overlay')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Chat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Note/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Voice Memo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Emoji/i })).toBeInTheDocument();
  });

  it('triggers action callback and closes speed dial when an action button is clicked', () => {
    const onAddNote = vi.fn();
    const setIsSpeedDialOpen = vi.fn();

    render(
      <FridgeSpeedDial
        {...defaultProps}
        isSpeedDialOpen={true}
        onAddNote={onAddNote}
        setIsSpeedDialOpen={setIsSpeedDialOpen}
      />
    );

    const noteBtn = screen.getByRole('button', { name: /Add Note/i });
    fireEvent.click(noteBtn);

    expect(onAddNote).toHaveBeenCalledTimes(1);
    expect(setIsSpeedDialOpen).toHaveBeenCalledWith(false);
  });

  it('dismisses speed dial when clicking the backdrop overlay', () => {
    const setIsSpeedDialOpen = vi.fn();
    render(
      <FridgeSpeedDial
        {...defaultProps}
        isSpeedDialOpen={true}
        setIsSpeedDialOpen={setIsSpeedDialOpen}
      />
    );

    const backdrop = screen.getByLabelText('Close speed dial overlay');
    fireEvent.click(backdrop);

    expect(setIsSpeedDialOpen).toHaveBeenCalledWith(false);
  });

  it('dismisses speed dial when Escape key is pressed', () => {
    const setIsSpeedDialOpen = vi.fn();
    render(
      <FridgeSpeedDial
        {...defaultProps}
        isSpeedDialOpen={true}
        setIsSpeedDialOpen={setIsSpeedDialOpen}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(setIsSpeedDialOpen).toHaveBeenCalledWith(false);
  });
});
