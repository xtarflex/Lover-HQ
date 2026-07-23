/**
 * @file DeleteMessageModal.test.jsx
 * @description Unit tests for DeleteMessageModal component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeleteMessageModal } from './DeleteMessageModal';
import { supabase } from '../../../lib/supabase';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

describe('DeleteMessageModal', () => {
  it('renders nothing when messageToDelete is null', () => {
    const { container } = render(
      <DeleteMessageModal messageToDelete={null} setMessageToDelete={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal content when messageToDelete is set', () => {
    render(<DeleteMessageModal messageToDelete="msg-123" setMessageToDelete={vi.fn()} />);
    expect(screen.getByText('Delete Message?')).toBeInTheDocument();
  });

  it('calls setMessageToDelete(null) on Cancel button click', () => {
    const setMessageToDelete = vi.fn();
    render(
      <DeleteMessageModal messageToDelete="msg-123" setMessageToDelete={setMessageToDelete} />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(setMessageToDelete).toHaveBeenCalledWith(null);
  });

  it('triggers delete request to supabase on Delete button click', async () => {
    const setMessageToDelete = vi.fn();
    render(
      <DeleteMessageModal messageToDelete="msg-123" setMessageToDelete={setMessageToDelete} />
    );
    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(setMessageToDelete).toHaveBeenCalledWith(null);
    });
  });
});
