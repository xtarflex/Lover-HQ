/**
 * @file useUnreadChatSync.test.js
 * @description Unit tests for useUnreadChatSync hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUnreadChatSync } from './useUnreadChatSync';

// Hoisted mocks for Supabase
const { mockFrom, mockRemoveChannel, mockChannelObj } = vi.hoisted(() => {
  const mockChannelObj = {
    _realtimeCb: null,
    on: vi.fn(),
    subscribe: vi.fn(),
  };

  mockChannelObj.on.mockImplementation((type, _filter, cb) => {
    if (type === 'postgres_changes') mockChannelObj._realtimeCb = cb;
    return mockChannelObj;
  });
  mockChannelObj.subscribe.mockReturnValue(mockChannelObj);

  return {
    mockFrom: vi.fn(),
    mockRemoveChannel: vi.fn(),
    mockChannelObj,
  };
});

const mockDispatch = vi.fn();
let mockAppContext = {
  user: { id: 'user-me' },
  partner: { id: 'partner-you' },
};

vi.mock('../contexts/AppContext', () => ({
  useAppContext: () => mockAppContext,
  useAppDispatch: () => mockDispatch,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    channel: vi.fn(() => mockChannelObj),
    removeChannel: mockRemoveChannel,
  },
}));

function setupCountMock(count = 3) {
  return {
    select: vi.fn().mockReturnValue({
      neq: vi.fn().mockReturnValue({
        gt: vi.fn().mockResolvedValue({ count, error: null }),
      }),
    }),
  };
}

describe('useUnreadChatSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannelObj._realtimeCb = null;
    localStorage.clear();
    mockFrom.mockReturnValue(setupCountMock(3));
  });

  it('fetches unread count and dispatches SET_UNREAD_CHAT_COUNT when outside /chat', async () => {
    renderHook(() => useUnreadChatSync('/home'));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_UNREAD_CHAT_COUNT',
        payload: 3,
      });
    });
  });

  it('marks chat as read and dispatches SET_UNREAD_CHAT_COUNT 0 when route is /chat', () => {
    renderHook(() => useUnreadChatSync('/chat'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_UNREAD_CHAT_COUNT',
      payload: 0,
    });
    const lastRead = localStorage.getItem('last_read_chat_partner-you_user-me');
    expect(lastRead).toBeTruthy();
  });

  it('refetches unread count on realtime INSERT from partner when outside /chat', async () => {
    mockFrom.mockReturnValue(setupCountMock(4));
    renderHook(() => useUnreadChatSync('/home'));

    await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
    mockDispatch.mockClear();

    await act(async () => {
      mockChannelObj._realtimeCb?.({
        eventType: 'INSERT',
        new: { id: 'new-msg-1', user_id: 'partner-you', content: 'Hey!' },
      });
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_UNREAD_CHAT_COUNT',
        payload: 4,
      });
    });
  });

  it('ignores realtime INSERT from current user', async () => {
    renderHook(() => useUnreadChatSync('/home'));

    await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
    mockDispatch.mockClear();

    await act(async () => {
      mockChannelObj._realtimeCb?.({
        eventType: 'INSERT',
        new: { id: 'my-own-msg', user_id: 'user-me', content: 'Sent by me' },
      });
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
