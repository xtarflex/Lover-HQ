import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHtml5Player } from './useHtml5Player';

describe('useHtml5Player', () => {
  let originalAudioContext;
  let mockCtxInstance;

  beforeEach(() => {
    originalAudioContext = window.AudioContext;

    mockCtxInstance = {
      state: 'running',
      destination: {},
      resume: vi.fn(),
      createAnalyser: vi.fn(() => ({
        fftSize: 256,
        connect: vi.fn(),
      })),
      createMediaElementSource: vi.fn(() => ({
        connect: vi.fn(),
      })),
      audioWorklet: {
        addModule: vi.fn().mockResolvedValue(undefined),
      },
    };

    function MockAudioContext() {
      return mockCtxInstance;
    }
    window.AudioContext = MockAudioContext;

    function MockAudioWorkletNode(ctx, name) {
      this.ctx = ctx;
      this.name = name;
      this.connect = vi.fn();
      this.port = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        start: vi.fn(),
      };
    }
    window.AudioWorkletNode = MockAudioWorkletNode;
  });

  afterEach(() => {
    window.AudioContext = originalAudioContext;
    delete window.AudioWorkletNode;
    vi.restoreAllMocks();
  });

  it('should initialize AudioContext and register AudioWorklet on initAudioContext', async () => {
    const { result } = renderHook(() =>
      useHtml5Player({
        volume: 0.8,
        isCrossfadingRef: { current: false },
        setCurrentTime: vi.fn(),
        setDuration: vi.fn(),
        handleTrackEnded: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.initAudioContext();
    });

    expect(mockCtxInstance.audioWorklet.addModule).toHaveBeenCalledWith(
      '/audio-processors/dsp-audio-processor.js'
    );
    expect(result.current.analyserNode).not.toBeNull();
    expect(result.current.workletNode).not.toBeNull();
  });

  it('should catch worklet registration failure gracefully without breaking analyserNode', async () => {
    mockCtxInstance.audioWorklet.addModule = vi
      .fn()
      .mockRejectedValue(new Error('Module load error'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useHtml5Player({
        volume: 0.8,
        isCrossfadingRef: { current: false },
        setCurrentTime: vi.fn(),
        setDuration: vi.fn(),
        handleTrackEnded: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.initAudioContext();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'AudioWorklet registration bypassed, using main-thread fallback:',
      expect.any(Error)
    );
    expect(result.current.analyserNode).not.toBeNull();
    expect(result.current.workletNode).toBeNull();
    consoleSpy.mockRestore();
  });

  it('should resume suspended AudioContext if already created', async () => {
    const { result } = renderHook(() =>
      useHtml5Player({
        volume: 0.8,
        isCrossfadingRef: { current: false },
        setCurrentTime: vi.fn(),
        setDuration: vi.fn(),
        handleTrackEnded: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.initAudioContext();
    });

    mockCtxInstance.state = 'suspended';

    await act(async () => {
      await result.current.initAudioContext();
    });

    expect(mockCtxInstance.resume).toHaveBeenCalled();
  });
});
