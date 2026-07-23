/**
 * @file FridgeItemList.test.jsx
 * @description Unit tests for the FridgeItemList component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FridgeItemList } from './FridgeItemList';

const noteItem = {
  id: 'note-1',
  type: 'note',
  content: JSON.stringify({ text: 'Buy milk', color: 'yellow' }),
  created_at: '2026-01-01T00:00:00Z',
};
const photoItem = {
  id: 'photo-1',
  type: 'photo',
  content: 'https://example.com/photo.jpg',
  created_at: '2026-01-02T00:00:00Z',
};
const voiceItem = {
  id: 'voice-1',
  type: 'voice',
  content: JSON.stringify({ duration: 30 }),
  created_at: '2026-01-03T00:00:00Z',
};

describe('FridgeItemList', () => {
  it('shows empty state when no fridge items', () => {
    render(<FridgeItemList fridgeItems={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('No fridge items found to tag.')).toBeInTheDocument();
  });

  it('renders a note item with text preview', () => {
    render(<FridgeItemList fridgeItems={[noteItem]} onSelect={vi.fn()} />);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText(/Sticky Note/)).toBeInTheDocument();
  });

  it('renders a photo item with thumbnail image', () => {
    render(<FridgeItemList fridgeItems={[photoItem]} onSelect={vi.fn()} />);
    expect(screen.getByAltText('Fridge thumbnail')).toBeInTheDocument();
    expect(screen.getByText('Polaroid Photo')).toBeInTheDocument();
  });

  it('renders a voice item with duration subtext', () => {
    render(<FridgeItemList fridgeItems={[voiceItem]} onSelect={vi.fn()} />);
    expect(screen.getByText('Voice Memo')).toBeInTheDocument();
    expect(screen.getByText(/30s/)).toBeInTheDocument();
  });

  it('calls onSelect with the item when a row is clicked', () => {
    const onSelect = vi.fn();
    render(<FridgeItemList fridgeItems={[noteItem]} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Buy milk').closest('button'));
    expect(onSelect).toHaveBeenCalledWith(noteItem);
  });
});
