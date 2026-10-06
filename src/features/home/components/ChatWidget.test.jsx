/**
 * @file ChatWidget.test.jsx
 * @description Unit tests for ChatWidget component.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatWidget } from './ChatWidget';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

let mockContextState = {
  user: { id: 'user-1', name: 'Taylor' },
  partner: { id: 'partner-1', name: 'Alex', avatar_url: null },
  presence: { partner: 'online' },
  unreadChatCount: 0,
};

vi.mock('../../../contexts/AppContext', () => ({
  useAppContext: () => mockContextState,
}));

const mockSupabaseFrom = vi.fn();
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (...args) => mockSupabaseFrom(...args),
  },
}));

function setupSupabaseMock(message = null) {
  mockSupabaseFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: message, error: null }),
        }),
      }),
    }),
  });
}

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContextState = {
      user: { id: 'user-1', name: 'Taylor' },
      partner: { id: 'partner-1', name: 'Alex', avatar_url: null },
      presence: { partner: 'online' },
      unreadChatCount: 0,
    };
    setupSupabaseMock();
  });

  it('renders partner presence and default prompt state', async () => {
    render(<ChatWidget />);

    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Send a spark to start chatting!')).toBeInTheDocument();
    expect(screen.getByText('Thinking of you ✨')).toBeInTheDocument();
    expect(screen.getByText('What made you smile today?')).toBeInTheDocument();
  });

  it('navigates to /chat with prefilled text when a spark is clicked', async () => {
    render(<ChatWidget />);

    const sparkButton = screen.getByText('Thinking of you ✨');
    fireEvent.click(sparkButton);

    expect(mockNavigate).toHaveBeenCalledWith('/chat', {
      state: { prefilledText: 'Thinking of you ✨' },
    });
  });

  it('renders unread message badge count when unreadChatCount is greater than 0', () => {
    mockContextState.unreadChatCount = 5;

    render(<ChatWidget />);

    expect(screen.getByText('5 new')).toBeInTheDocument();
    expect(screen.getByLabelText('5 unread messages')).toBeInTheDocument();
  });

  it('renders latest message content from partner when fetched', async () => {
    setupSupabaseMock({
      user_id: 'partner-1',
      content: 'Can’t wait to see you tonight!',
      created_at: new Date().toISOString(),
    });

    render(<ChatWidget />);

    await waitFor(() => {
      expect(screen.getByText('Alex said')).toBeInTheDocument();
      expect(screen.getByText('“Can’t wait to see you tonight!”')).toBeInTheDocument();
    });
  });
});
