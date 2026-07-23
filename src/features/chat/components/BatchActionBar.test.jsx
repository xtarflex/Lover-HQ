/**
 * @file BatchActionBar.test.jsx
 * @description Unit tests for the BatchActionBar component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BatchActionBar } from './BatchActionBar';

function makeProps(overrides = {}) {
  return {
    selectedMessageIds: new Set(),
    onCancel: vi.fn(),
    onDelete: vi.fn(),
    onPin: vi.fn(),
    onForward: vi.fn(),
    ...overrides,
  };
}

describe('BatchActionBar', () => {
  it('renders "0 Selected" with empty set', () => {
    render(<BatchActionBar {...makeProps()} />);
    expect(screen.getByText('0 Selected')).toBeInTheDocument();
  });

  it('renders correct count when messages are selected', () => {
    render(<BatchActionBar {...makeProps({ selectedMessageIds: new Set(['a', 'b', 'c']) })} />);
    expect(screen.getByText('3 Selected')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const props = makeProps();
    render(<BatchActionBar {...props} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('Delete button is disabled when nothing is selected', () => {
    render(<BatchActionBar {...makeProps()} />);
    expect(screen.getByText('Delete').closest('button')).toBeDisabled();
  });

  it('Delete button is enabled when messages are selected', () => {
    render(<BatchActionBar {...makeProps({ selectedMessageIds: new Set(['a']) })} />);
    expect(screen.getByText('Delete').closest('button')).not.toBeDisabled();
  });

  it('calls onDelete when Delete is clicked', () => {
    const props = makeProps({ selectedMessageIds: new Set(['a']) });
    render(<BatchActionBar {...props} />);
    fireEvent.click(screen.getByText('Delete').closest('button'));
    expect(props.onDelete).toHaveBeenCalled();
  });

  it('Pin button is disabled unless exactly 1 message is selected', () => {
    const { rerender } = render(<BatchActionBar {...makeProps()} />);
    expect(screen.getByText('Pin').closest('button')).toBeDisabled();

    rerender(<BatchActionBar {...makeProps({ selectedMessageIds: new Set(['a']) })} />);
    expect(screen.getByText('Pin').closest('button')).not.toBeDisabled();

    rerender(<BatchActionBar {...makeProps({ selectedMessageIds: new Set(['a', 'b']) })} />);
    expect(screen.getByText('Pin').closest('button')).toBeDisabled();
  });

  it('calls onForward when Forward is clicked', () => {
    const props = makeProps({ selectedMessageIds: new Set(['a']) });
    render(<BatchActionBar {...props} />);
    fireEvent.click(screen.getByText('Forward').closest('button'));
    expect(props.onForward).toHaveBeenCalled();
  });
});
