/**
 * @file usePinnedMessage.test.js
 * @description Unit tests for the usePinnedMessage custom hook.
 * Verifies: localStorage resolution on mount, resolve-pinned-message event handling,
 * and setPinnedMessage direct control.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePinnedMessage } from './usePinnedMessage';

const COUPLE_KEY = 'user-a_user-b';
const messages = [
  { id: 'msg-1', content: 'Hello' },
  { id: 'msg-2', content: 'World' },
];

beforeEach(() => {
  localStorage.clear();
});

describe('usePinnedMessage', () => {
  it('initialises with pinnedMessage null', () => {
    const { result } = renderHook(() => usePinnedMessage(COUPLE_KEY, messages));
    expect(result.current.pinnedMessage).toBeNull();
  });

  it('resolves pinnedMessage from localStorage on mount', () => {
    localStorage.setItem(`pinned_msg_${COUPLE_KEY}`, 'msg-1');
    const { result } = renderHook(() => usePinnedMessage(COUPLE_KEY, messages));
    expect(result.current.pinnedMessage?.id).toBe('msg-1');
  });

  it('does not resolve if storedId does not match any message', () => {
    localStorage.setItem(`pinned_msg_${COUPLE_KEY}`, 'msg-999');
    const { result } = renderHook(() => usePinnedMessage(COUPLE_KEY, messages));
    expect(result.current.pinnedMessage).toBeNull();
  });

  it('resolves pinnedMessage on resolve-pinned-message window event', () => {
    const { result } = renderHook(() => usePinnedMessage(COUPLE_KEY, messages));

    // Simulate the pin_message broadcast handler: store key then fire event
    act(() => {
      localStorage.setItem(`pinned_msg_${COUPLE_KEY}`, 'msg-2');
      window.dispatchEvent(new CustomEvent('resolve-pinned-message'));
    });

    expect(result.current.pinnedMessage?.id).toBe('msg-2');
  });

  it('removes event listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => usePinnedMessage(COUPLE_KEY, messages));
    unmount();

    expect(addSpy).toHaveBeenCalledWith('resolve-pinned-message', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('resolve-pinned-message', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('does nothing when messages array is empty', () => {
    localStorage.setItem(`pinned_msg_${COUPLE_KEY}`, 'msg-1');
    const { result } = renderHook(() => usePinnedMessage(COUPLE_KEY, []));
    expect(result.current.pinnedMessage).toBeNull();
  });

  it('allows manual setPinnedMessage override', () => {
    const { result } = renderHook(() => usePinnedMessage(COUPLE_KEY, messages));

    act(() => {
      result.current.setPinnedMessage({ id: 'manual', content: 'Pinned manually' });
    });

    expect(result.current.pinnedMessage?.id).toBe('manual');
  });
});
