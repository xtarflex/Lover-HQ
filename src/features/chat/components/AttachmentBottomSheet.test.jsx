/**
 * @file AttachmentBottomSheet.test.jsx
 * @description Unit tests for AttachmentBottomSheet component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AttachmentBottomSheet } from './AttachmentBottomSheet';

describe('AttachmentBottomSheet', () => {
  it('renders null when showItemSelector is false', () => {
    const { container } = render(
      <AttachmentBottomSheet
        showItemSelector={false}
        setShowItemSelector={vi.fn()}
        triggerImageSelect={vi.fn()}
        fridgeItems={[]}
        setReferencedItem={vi.fn()}
        dispatch={vi.fn()}
        simulateSendDocument={vi.fn()}
        simulateSendLocation={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders sheet elements when showItemSelector is true', () => {
    render(
      <AttachmentBottomSheet
        showItemSelector={true}
        setShowItemSelector={vi.fn()}
        triggerImageSelect={vi.fn()}
        fridgeItems={[]}
        setReferencedItem={vi.fn()}
        dispatch={vi.fn()}
        simulateSendDocument={vi.fn()}
        simulateSendLocation={vi.fn()}
      />
    );

    expect(screen.getByText('Recent Fridge Items')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
