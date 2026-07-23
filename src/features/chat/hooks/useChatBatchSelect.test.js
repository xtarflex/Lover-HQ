/**
 * @file useChatBatchSelect.test.js
 * @description Unit tests for the useChatBatchSelect custom hook.
 * Verifies: selection mode toggle, individual message select/deselect, and clear.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatBatchSelect } from './useChatBatchSelect';

describe('useChatBatchSelect', () => {
  it('initialises with selection mode off and empty set', () => {
    const { result } = renderHook(() => useChatBatchSelect());
    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedMessageIds.size).toBe(0);
  });

  it('toggleSelectionMode enables selection mode', () => {
    const { result } = renderHook(() => useChatBatchSelect());

    act(() => {
      result.current.toggleSelectionMode();
    });

    expect(result.current.isSelectionMode).toBe(true);
  });

  it('toggleSelectionMode disables and clears selection', () => {
    const { result } = renderHook(() => useChatBatchSelect());

    act(() => {
      result.current.toggleSelectionMode(); // ON
    });
    act(() => {
      result.current.toggleSelectMessage('msg-1');
    });
    act(() => {
      result.current.toggleSelectionMode(); // OFF — should clear
    });

    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedMessageIds.size).toBe(0);
  });

  it('toggleSelectMessage adds a message ID to the set', () => {
    const { result } = renderHook(() => useChatBatchSelect());

    act(() => {
      result.current.toggleSelectMessage('msg-1');
    });

    expect(result.current.selectedMessageIds.has('msg-1')).toBe(true);
  });

  it('toggleSelectMessage removes an already-selected message ID', () => {
    const { result } = renderHook(() => useChatBatchSelect());

    act(() => {
      result.current.toggleSelectMessage('msg-1');
    });
    act(() => {
      result.current.toggleSelectMessage('msg-1');
    });

    expect(result.current.selectedMessageIds.has('msg-1')).toBe(false);
  });

  it('can select multiple messages independently', () => {
    const { result } = renderHook(() => useChatBatchSelect());

    act(() => {
      result.current.toggleSelectMessage('msg-1');
      result.current.toggleSelectMessage('msg-2');
      result.current.toggleSelectMessage('msg-3');
    });

    expect(result.current.selectedMessageIds.size).toBe(3);
  });

  it('clearSelection resets mode and empties the set', () => {
    const { result } = renderHook(() => useChatBatchSelect());

    act(() => {
      result.current.toggleSelectionMode();
      result.current.toggleSelectMessage('msg-1');
      result.current.toggleSelectMessage('msg-2');
    });
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedMessageIds.size).toBe(0);
  });
});
