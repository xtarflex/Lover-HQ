/**
 * @file useChatMessages.test.js
 * @description Unit tests for the useChatMessages custom hook.
 * Mocks Supabase to verify: initial fetch, INSERT/UPDATE/DELETE realtime handlers,
 * and localStorage caching behaviour.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatMessages } from './useChatMessages';

// ─── Hoisted mock references ──────────────────────────────────────────────────
// vi.hoisted ensures these are available before the vi.mock() factory runs.
const { mockFrom, mockRemoveChannel, mockChannelObj } = vi.hoisted(() => {
  const mockChannelObj = {
    _realtimeCb: null,
    on: vi.fn(),
    subscribe: vi.fn(),
  };

  // Default implementations wired at declaration time
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

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    channel: vi.fn(() => mockChannelObj),
    removeChannel: mockRemoveChannel,
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const COUPLE_KEY = 'user-a_user-b';
const scrollToBottom = vi.fn();

const seedMessages = [
  { id: '1', content: 'Hello', created_at: '2026-01-01T00:00:00Z', fridge_item_id: null },
  { id: '2', content: 'World', created_at: '2026-01-01T00:01:00Z', fridge_item_id: null },
];

function makeSelectMock(data = seedMessages) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data, error: null }),
    }),
  };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockChannelObj._realtimeCb = null;
  localStorage.clear();

  // Re-wire implementations after clearAllMocks resets call history
  mockFrom.mockReturnValue(makeSelectMock());
  mockChannelObj.on.mockImplementation((type, _filter, cb) => {
    if (type === 'postgres_changes') mockChannelObj._realtimeCb = cb;
    return mockChannelObj;
  });
  mockChannelObj.subscribe.mockReturnValue(mockChannelObj);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useChatMessages', () => {
  it('fetches initial messages and sets loading to false', async () => {
    const { result } = renderHook(() => useChatMessages(COUPLE_KEY, scrollToBottom));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].id).toBe('1');
  });

  it('mirrors messages to localStorage after fetch', async () => {
    renderHook(() => useChatMessages(COUPLE_KEY, scrollToBottom));

    await waitFor(() => {
      const cached = localStorage.getItem(`chat_history_${COUPLE_KEY}`);
      expect(cached).not.toBeNull();
      expect(JSON.parse(cached)).toHaveLength(2);
    });
  });

  it('adds a new message on INSERT realtime event', async () => {
    const { result } = renderHook(() => useChatMessages(COUPLE_KEY, scrollToBottom));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const newMsg = {
      id: '3',
      content: 'New!',
      created_at: '2026-01-01T00:02:00Z',
      fridge_item_id: null,
    };

    await act(async () => {
      mockChannelObj._realtimeCb?.({ eventType: 'INSERT', new: newMsg, old: {} });
    });

    expect(result.current.messages.some((m) => m.id === '3')).toBe(true);
  });

  it('does not duplicate a message if INSERT fires twice for same id', async () => {
    const { result } = renderHook(() => useChatMessages(COUPLE_KEY, scrollToBottom));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      mockChannelObj._realtimeCb?.({
        eventType: 'INSERT',
        new: { id: '1', content: 'Hello', fridge_item_id: null },
        old: {},
      });
    });

    // id '1' already existed — count should remain 2
    expect(result.current.messages.filter((m) => m.id === '1')).toHaveLength(1);
  });

  it('patches an existing message on UPDATE realtime event', async () => {
    const { result } = renderHook(() => useChatMessages(COUPLE_KEY, scrollToBottom));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      mockChannelObj._realtimeCb?.({
        eventType: 'UPDATE',
        new: { id: '1', content: 'Edited!', fridge_item_id: null },
        old: {},
      });
    });

    const updated = result.current.messages.find((m) => m.id === '1');
    expect(updated.content).toBe('Edited!');
  });

  it('removes a message on DELETE realtime event', async () => {
    const { result } = renderHook(() => useChatMessages(COUPLE_KEY, scrollToBottom));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      mockChannelObj._realtimeCb?.({ eventType: 'DELETE', new: {}, old: { id: '1' } });
    });

    expect(result.current.messages.some((m) => m.id === '1')).toBe(false);
  });

  it('cleans up the Supabase channel on unmount', async () => {
    const { result, unmount } = renderHook(() => useChatMessages(COUPLE_KEY, scrollToBottom));

    await waitFor(() => expect(result.current.loading).toBe(false));
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it('seeds messages from localStorage if available on first render', () => {
    const cached = [{ id: 'cached-1', content: 'From cache' }];
    localStorage.setItem(`chat_history_${COUPLE_KEY}`, JSON.stringify(cached));

    const { result } = renderHook(() => useChatMessages(COUPLE_KEY, scrollToBottom));

    // Initial state is seeded from localStorage before the async fetch resolves
    expect(result.current.messages[0].id).toBe('cached-1');
  });
});
