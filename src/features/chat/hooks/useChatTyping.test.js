/**
 * @file useChatTyping.test.js
 * @description Unit tests for the useChatTyping custom hook.
 * Verifies: partner typing broadcast listener, local typing detection,
 * and 2-second auto-clear timeout.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatTyping } from './useChatTyping';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const USER_ID = 'user-a';
const PARTNER_ID = 'user-b';

function makeTypingChannelRef(sendMock = vi.fn()) {
  return { current: { send: sendMock } };
}

const setNewMessageText = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useChatTyping', () => {
  it('initialises with partnerIsTyping false', () => {
    const { result } = renderHook(() =>
      useChatTyping(USER_ID, PARTNER_ID, setNewMessageText, makeTypingChannelRef())
    );
    expect(result.current.partnerIsTyping).toBe(false);
  });

  it('handlePartnerTypingBroadcast sets partnerIsTyping true for partner payload', () => {
    const { result } = renderHook(() =>
      useChatTyping(USER_ID, PARTNER_ID, setNewMessageText, makeTypingChannelRef())
    );

    act(() => {
      result.current.handlePartnerTypingBroadcast({
        payload: { userId: PARTNER_ID, isTyping: true },
      });
    });

    expect(result.current.partnerIsTyping).toBe(true);
  });

  it('handlePartnerTypingBroadcast ignores payloads from own userId', () => {
    const { result } = renderHook(() =>
      useChatTyping(USER_ID, PARTNER_ID, setNewMessageText, makeTypingChannelRef())
    );

    act(() => {
      result.current.handlePartnerTypingBroadcast({
        payload: { userId: USER_ID, isTyping: true },
      });
    });

    expect(result.current.partnerIsTyping).toBe(false);
  });

  it('handleInputChange updates message text via setNewMessageText', () => {
    const { result } = renderHook(() =>
      useChatTyping(USER_ID, PARTNER_ID, setNewMessageText, makeTypingChannelRef())
    );

    act(() => {
      result.current.handleInputChange({ target: { value: 'hello' } });
    });

    expect(setNewMessageText).toHaveBeenCalledWith('hello');
  });

  it('handleInputChange broadcasts typing=true on first keystroke', () => {
    const sendMock = vi.fn();
    const { result } = renderHook(() =>
      useChatTyping(USER_ID, PARTNER_ID, setNewMessageText, makeTypingChannelRef(sendMock))
    );

    act(() => {
      result.current.handleInputChange({ target: { value: 'h' } });
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { userId: USER_ID, isTyping: true } })
    );
  });

  it('does not broadcast typing again if already typing (debounce)', () => {
    const sendMock = vi.fn();
    const { result } = renderHook(() =>
      useChatTyping(USER_ID, PARTNER_ID, setNewMessageText, makeTypingChannelRef(sendMock))
    );

    act(() => {
      result.current.handleInputChange({ target: { value: 'h' } });
      result.current.handleInputChange({ target: { value: 'he' } });
      result.current.handleInputChange({ target: { value: 'hel' } });
    });

    // Only one broadcast=true call — subsequent keystrokes skip the broadcast
    const trueCalls = sendMock.mock.calls.filter((c) => c[0].payload.isTyping === true);
    expect(trueCalls).toHaveLength(1);
  });

  it('broadcasts typing=false after 2 seconds of inactivity', () => {
    const sendMock = vi.fn();
    const { result } = renderHook(() =>
      useChatTyping(USER_ID, PARTNER_ID, setNewMessageText, makeTypingChannelRef(sendMock))
    );

    act(() => {
      result.current.handleInputChange({ target: { value: 'hi' } });
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const falseCalls = sendMock.mock.calls.filter((c) => c[0].payload.isTyping === false);
    expect(falseCalls.length).toBeGreaterThanOrEqual(1);
  });
});
