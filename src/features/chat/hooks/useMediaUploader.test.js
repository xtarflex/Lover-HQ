/**
 * @file useMediaUploader.test.js
 * @description Unit tests for useMediaUploader hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaUploader } from './useMediaUploader';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: 'https://example.com/media.webp' } }),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('useMediaUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default empty state', () => {
    const { result } = renderHook(() => useMediaUploader({ userId: 'user-1' }));

    expect(result.current.pendingMediaFiles).toEqual([]);
    expect(result.current.activePreviewIndex).toBe(0);
    expect(result.current.mediaCaption).toBe('');
    expect(result.current.isCropping).toBe(false);
  });

  it('updates pendingMediaFiles when setter is invoked', () => {
    const { result } = renderHook(() => useMediaUploader({ userId: 'user-1' }));
    const fakeFile = new File(['test'], 'test.png', { type: 'image/png' });

    act(() => {
      result.current.setPendingMediaFiles([
        { file: fakeFile, rotation: 0, flipped: false, filter: 'none' },
      ]);
    });

    expect(result.current.pendingMediaFiles).toHaveLength(1);
  });

  it('applies crop aspect ratio correctly', () => {
    const { result } = renderHook(() => useMediaUploader({ userId: 'user-1' }));

    act(() => {
      result.current.applyAspectRatio('1:1');
    });

    expect(result.current.cropAspectRatio).toBe('1:1');
  });
});
