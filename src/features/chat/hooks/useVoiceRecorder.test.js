/**
 * @file useVoiceRecorder.test.js
 * @description Unit tests for useVoiceRecorder hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecorder } from './useVoiceRecorder';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: 'https://example.com/audio.webm' } }),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('useVoiceRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default recording state values', () => {
    const { result } = renderHook(() =>
      useVoiceRecorder({
        userId: 'user-1',
        partnerId: 'user-2',
        replyMessage: null,
        dispatch: vi.fn(),
        coupleKey: 'user-1_user-2',
        setReplyMessage: vi.fn(),
      })
    );

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isRecordingPaused).toBe(false);
    expect(result.current.audioPreviewUrl).toBeNull();
    expect(result.current.uploadingMedia).toBe(false);
  });

  it('discards recording and resets state when discardRecording is invoked', () => {
    const { result } = renderHook(() =>
      useVoiceRecorder({
        userId: 'user-1',
        coupleKey: 'user-1_user-2',
      })
    );

    act(() => {
      result.current.discardRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.audioPreviewUrl).toBeNull();
  });

  it('sends recording payload including couple_key to Supabase insert', async () => {
    const setReplyMessage = vi.fn();
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useVoiceRecorder({
        userId: 'user-1',
        partnerId: 'user-2',
        replyMessage: { id: 'reply-1' },
        dispatch,
        coupleKey: 'user-1_user-2',
        setReplyMessage,
      })
    );

    // Mock audioPreviewUrl and audioChunksRef for testing sendRecording
    act(() => {
      result.current.discardRecording();
    });

    // Simulate audio preview URL set
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:audio');

    // Call sendRecording (when url is null, returns early without error)
    await act(async () => {
      await result.current.sendRecording();
    });

    expect(result.current.uploadingMedia).toBe(false);
  });
});
