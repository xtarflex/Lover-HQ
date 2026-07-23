/**
 * @file ReferencedItemPreview.test.jsx
 * @description Unit tests for ReferencedItemPreview component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReferencedItemPreview } from './ReferencedItemPreview';

describe('ReferencedItemPreview', () => {
  it('renders null when referencedItem is null', () => {
    const { container } = render(
      <ReferencedItemPreview referencedItem={null} setReferencedItem={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders reference details for note item', () => {
    const item = { type: 'note', content: JSON.stringify({ text: 'Clean kitchen' }) };
    render(<ReferencedItemPreview referencedItem={item} setReferencedItem={vi.fn()} />);
    expect(screen.getByText('Referencing Fridge note')).toBeInTheDocument();
    expect(screen.getByText('Clean kitchen')).toBeInTheDocument();
  });

  it('calls setReferencedItem(null) on remove button click', () => {
    const setReferencedItem = vi.fn();
    const item = { type: 'photo', content: 'url' };
    render(<ReferencedItemPreview referencedItem={item} setReferencedItem={setReferencedItem} />);
    fireEvent.click(screen.getByLabelText('Remove reference'));
    expect(setReferencedItem).toHaveBeenCalledWith(null);
  });
});
