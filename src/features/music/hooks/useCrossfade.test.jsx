import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrossfade } from './useCrossfade';

describe('useCrossfade', () => {
  let params;
  let mockAudio;
  let mockStandbyAudio;
  let mockYtPlayer0;
  let mockYtPlayer1;

  beforeEach(() => {
    vi.useFakeTimers();

    mockAudio = {
      volume: 1,
      currentTime: 10,
      pause: vi.fn(),
      removeAttribute: vi.fn(),
      load: vi.fn(),
      crossOrigin: 'anonymous',
    };

    mockStandbyAudio = {
      volume: 0,
      currentTime: 0,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      removeAttribute: vi.fn(),
      load: vi.fn(),
      crossOrigin: 'anonymous',
    };

    mockYtPlayer0 = {
      setVolume: vi.fn(),
      stopVideo: vi.fn(),
      loadVideoById: vi.fn(),
      playVideo: vi.fn(),
      getDuration: vi.fn().mockReturnValue(180),
    };

    mockYtPlayer1 = {
      setVolume: vi.fn(),
      stopVideo: vi.fn(),
      loadVideoById: vi.fn(),
      playVideo: vi.fn(),
      getDuration: vi.fn().mockReturnValue(200),
    };

    params = {
      isCrossfadingRef: { current: false },
      crossfadeDurationRef: { current: 4 },
      volumeRef: { current: 0.8 },
      activePlayerRef: { current: 'html5' },
      setActivePlayer: vi.fn((val) => {
        params.activePlayerRef.current = val;
      }),
      audioRef: { current: mockAudio },
      standbyAudioRef: { current: mockStandbyAudio },
      ytPlayers: { current: [mockYtPlayer0, mockYtPlayer1] },
      ytReady: { current: [true, true] },
      activeYtIndex: { current: 0 },
      setCurrentTrack: vi.fn(),
      setCurrentTime: vi.fn(),
      setDuration: vi.fn(),
      setIsPlaying: vi.fn(),
      isRemoteActionRef: { current: false },
      broadcastPlay: vi.fn(),
      preparePlayer: vi.fn(() => mockStandbyAudio),
      swapAudioPlayers: vi.fn(() => {
        const temp = params.audioRef.current;
        params.audioRef.current = params.standbyAudioRef.current;
        params.standbyAudioRef.current = temp;
      }),
      initAudioContext: vi.fn(),
      audioCtxRef: { current: { state: 'running', resume: vi.fn() } },
      connectElementToContext: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts crossfade with immediate metadata switch and completes after duration', () => {
    const { result } = renderHook(() => useCrossfade(params));

    const nextTrack = {
      id: 'track-2',
      title: 'Incoming Track',
      source: 'upload',
      url: 'https://example.com/track2.mp3',
      duration_seconds: 240,
    };

    act(() => {
      result.current.startCrossfade(nextTrack);
    });

    // Immediate metadata switch
    expect(params.isCrossfadingRef.current).toBe(true);
    expect(params.setCurrentTrack).toHaveBeenCalledWith(nextTrack);
    expect(params.setCurrentTime).toHaveBeenCalledWith(0);
    expect(params.setDuration).toHaveBeenCalledWith(240);
    expect(params.setIsPlaying).toHaveBeenCalledWith(true);

    // Fast-forward interval
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    // Finalized transition
    expect(params.swapAudioPlayers).toHaveBeenCalled();
    expect(params.setActivePlayer).toHaveBeenCalledWith('html5');
    expect(params.broadcastPlay).toHaveBeenCalledWith('track-2', 0);
    expect(params.isCrossfadingRef.current).toBe(false);
  });

  it('cancels active crossfade immediately and restores active volume', () => {
    const { result } = renderHook(() => useCrossfade(params));

    const nextTrack = {
      id: 'track-2',
      source: 'upload',
      url: 'https://example.com/track2.mp3',
      duration_seconds: 240,
    };

    act(() => {
      result.current.startCrossfade(nextTrack);
    });

    // Midway through crossfade (2 seconds in)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(params.isCrossfadingRef.current).toBe(true);

    // Cancel the crossfade
    act(() => {
      result.current.cancelCrossfade();
    });

    expect(params.isCrossfadingRef.current).toBe(false);
    expect(mockStandbyAudio.pause).toHaveBeenCalled();
    expect(mockStandbyAudio.removeAttribute).toHaveBeenCalledWith('src');
    expect(mockStandbyAudio.volume).toBe(0);
    expect(mockAudio.volume).toBe(0.8); // Restored active volume

    // Timers advance after cancel should not trigger completion
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(params.swapAudioPlayers).not.toHaveBeenCalled();
  });

  it('finalizes active crossfade immediately on interruption or skip', () => {
    const { result } = renderHook(() => useCrossfade(params));

    const nextTrack = {
      id: 'track-2',
      source: 'upload',
      url: 'https://example.com/track2.mp3',
      duration_seconds: 240,
    };

    act(() => {
      result.current.startCrossfade(nextTrack);
    });

    // 1 second in, finalize immediately
    act(() => {
      vi.advanceTimersByTime(1000);
      result.current.finalizeCrossfadeImmediately();
    });

    expect(params.isCrossfadingRef.current).toBe(false);
    expect(params.swapAudioPlayers).toHaveBeenCalled();
    expect(params.setActivePlayer).toHaveBeenCalledWith('html5');
    expect(params.broadcastPlay).toHaveBeenCalledWith('track-2', 0);
  });

  it('handles rapid consecutive startCrossfade calls gracefully by finalizing previous transition', () => {
    const { result } = renderHook(() => useCrossfade(params));

    const trackA = {
      id: 'track-a',
      source: 'upload',
      url: 'https://example.com/track-a.mp3',
      duration_seconds: 180,
    };

    const trackB = {
      id: 'track-b',
      source: 'upload',
      url: 'https://example.com/track-b.mp3',
      duration_seconds: 210,
    };

    act(() => {
      result.current.startCrossfade(trackA);
    });

    // Immediately trigger another crossfade while first is in-flight
    act(() => {
      vi.advanceTimersByTime(500);
      result.current.startCrossfade(trackB);
    });

    expect(params.setCurrentTrack).toHaveBeenLastCalledWith(trackB);
    expect(params.isCrossfadingRef.current).toBe(true);

    // Let the second crossfade finish
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(params.isCrossfadingRef.current).toBe(false);
    expect(params.broadcastPlay).toHaveBeenLastCalledWith('track-b', 0);
  });
});
