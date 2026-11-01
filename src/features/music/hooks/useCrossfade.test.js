/**
 * @file src/features/music/hooks/useCrossfade.test.js
 * @description Unit tests for useCrossfade hook:
 * Verifies crossfade initiation, volume ramping, single-track loop support,
 * error resilience (preventing playback stalls), and immediate finalization.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrossfade } from './useCrossfade';

describe('useCrossfade hook', () => {
  let isCrossfadingRef;
  let crossfadeDurationRef;
  let volumeRef;
  let activePlayerRef;
  let audioRef;
  let standbyAudioRef;
  let ytPlayers;
  let ytReady;
  let activeYtIndex;
  let setCurrentTrack;
  let setCurrentTime;
  let setDuration;
  let setIsPlaying;
  let isRemoteActionRef;
  let broadcastPlay;
  let preparePlayer;
  let swapAudioPlayers;
  let initAudioContext;
  let audioCtxRef;
  let connectElementToContext;

  beforeEach(() => {
    vi.useFakeTimers();

    isCrossfadingRef = { current: false };
    crossfadeDurationRef = { current: 3 };
    volumeRef = { current: 1.0 };
    activePlayerRef = { current: 'html5' };

    audioRef = {
      current: {
        volume: 1.0,
        pause: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        load: vi.fn(),
        removeAttribute: vi.fn(),
        currentTime: 100,
        duration: 180,
        paused: false,
        crossOrigin: 'anonymous',
      },
    };

    standbyAudioRef = {
      current: {
        volume: 0,
        pause: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        load: vi.fn(),
        removeAttribute: vi.fn(),
        currentTime: 0,
        duration: 200,
        paused: false,
        crossOrigin: 'anonymous',
        src: '',
      },
    };

    ytPlayers = { current: [null, null] };
    ytReady = { current: [false, false] };
    activeYtIndex = { current: 0 };

    setCurrentTrack = vi.fn();
    setCurrentTime = vi.fn();
    setDuration = vi.fn();
    setIsPlaying = vi.fn();
    isRemoteActionRef = { current: false };
    broadcastPlay = vi.fn();

    preparePlayer = vi.fn().mockReturnValue(standbyAudioRef.current);
    swapAudioPlayers = vi.fn(() => {
      const temp = audioRef.current;
      audioRef.current = standbyAudioRef.current;
      standbyAudioRef.current = temp;
    });
    initAudioContext = vi.fn();
    audioCtxRef = { current: { state: 'running', resume: vi.fn() } };
    connectElementToContext = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('initiates crossfade and prepares standby player for upload track', () => {
    const setActivePlayer = vi.fn();
    const { result } = renderHook(() =>
      useCrossfade({
        isCrossfadingRef,
        crossfadeDurationRef,
        volumeRef,
        activePlayerRef,
        setActivePlayer,
        audioRef,
        standbyAudioRef,
        ytPlayers,
        ytReady,
        activeYtIndex,
        setCurrentTrack,
        setCurrentTime,
        setDuration,
        setIsPlaying,
        isRemoteActionRef,
        broadcastPlay,
        preparePlayer,
        swapAudioPlayers,
        initAudioContext,
        audioCtxRef,
        connectElementToContext,
      })
    );

    const nextTrack = {
      id: 'track-2',
      title: 'Next Track',
      source: 'upload',
      url: 'https://example.com/next.mp3',
      duration_seconds: 210,
    };

    act(() => {
      result.current.startCrossfade(nextTrack);
    });

    expect(isCrossfadingRef.current).toBe(true);
    expect(preparePlayer).toHaveBeenCalledWith(false, true);
    expect(setCurrentTrack).toHaveBeenCalledWith(nextTrack);
    expect(setIsPlaying).toHaveBeenCalledWith(true);
  });

  it('ramps volume down on outgoing player and up on standby player over time', () => {
    const setActivePlayer = vi.fn();
    const { result } = renderHook(() =>
      useCrossfade({
        isCrossfadingRef,
        crossfadeDurationRef,
        volumeRef,
        activePlayerRef,
        setActivePlayer,
        audioRef,
        standbyAudioRef,
        ytPlayers,
        ytReady,
        activeYtIndex,
        setCurrentTrack,
        setCurrentTime,
        setDuration,
        setIsPlaying,
        isRemoteActionRef,
        broadcastPlay,
        preparePlayer,
        swapAudioPlayers,
        initAudioContext,
        audioCtxRef,
        connectElementToContext,
      })
    );

    const nextTrack = {
      id: 'track-2',
      title: 'Next Track',
      source: 'upload',
      url: 'https://example.com/next.mp3',
      duration_seconds: 210,
    };

    act(() => {
      result.current.startCrossfade(nextTrack);
    });

    // Advance halfway through 3-second crossfade (1.5s = 15 ticks)
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(audioRef.current.volume).toBeLessThan(1.0);
    expect(standbyAudioRef.current.volume).toBeGreaterThan(0);

    // Complete the remaining crossfade
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(isCrossfadingRef.current).toBe(false);
    expect(swapAudioPlayers).toHaveBeenCalled();
  });

  it('supports single-track loop crossfade into itself without stalling', () => {
    const setActivePlayer = vi.fn();
    const { result } = renderHook(() =>
      useCrossfade({
        isCrossfadingRef,
        crossfadeDurationRef,
        volumeRef,
        activePlayerRef,
        setActivePlayer,
        audioRef,
        standbyAudioRef,
        ytPlayers,
        ytReady,
        activeYtIndex,
        setCurrentTrack,
        setCurrentTime,
        setDuration,
        setIsPlaying,
        isRemoteActionRef,
        broadcastPlay,
        preparePlayer,
        swapAudioPlayers,
        initAudioContext,
        audioCtxRef,
        connectElementToContext,
      })
    );

    const loopTrack = {
      id: 'track-1',
      title: 'Looping Track',
      source: 'upload',
      url: 'https://example.com/loop.mp3',
      duration_seconds: 180,
    };

    act(() => {
      result.current.startCrossfade(loopTrack);
    });

    expect(isCrossfadingRef.current).toBe(true);
    expect(standbyAudioRef.current.currentTime).toBe(0);

    // Complete crossfade
    act(() => {
      vi.advanceTimersByTime(3100);
    });

    expect(isCrossfadingRef.current).toBe(false);
    expect(swapAudioPlayers).toHaveBeenCalled();
  });

  it('finalizes immediately if standby play() throws an error to avoid silent stall', async () => {
    const setActivePlayer = vi.fn();
    standbyAudioRef.current.play = vi.fn().mockRejectedValue(new Error('Autoplay blocked'));

    const { result } = renderHook(() =>
      useCrossfade({
        isCrossfadingRef,
        crossfadeDurationRef,
        volumeRef,
        activePlayerRef,
        setActivePlayer,
        audioRef,
        standbyAudioRef,
        ytPlayers,
        ytReady,
        activeYtIndex,
        setCurrentTrack,
        setCurrentTime,
        setDuration,
        setIsPlaying,
        isRemoteActionRef,
        broadcastPlay,
        preparePlayer,
        swapAudioPlayers,
        initAudioContext,
        audioCtxRef,
        connectElementToContext,
      })
    );

    const nextTrack = {
      id: 'track-2',
      title: 'Next Track',
      source: 'upload',
      url: 'https://example.com/next.mp3',
      duration_seconds: 210,
    };

    await act(async () => {
      result.current.startCrossfade(nextTrack);
    });

    // The catch block invokes finalizeCrossfadeImmediately to prevent silent stall
    expect(swapAudioPlayers).toHaveBeenCalled();
    expect(isCrossfadingRef.current).toBe(false);
  });

  it('cancels active crossfade and restores original volume on cancelCrossfade', () => {
    const setActivePlayer = vi.fn();
    const { result } = renderHook(() =>
      useCrossfade({
        isCrossfadingRef,
        crossfadeDurationRef,
        volumeRef,
        activePlayerRef,
        setActivePlayer,
        audioRef,
        standbyAudioRef,
        ytPlayers,
        ytReady,
        activeYtIndex,
        setCurrentTrack,
        setCurrentTime,
        setDuration,
        setIsPlaying,
        isRemoteActionRef,
        broadcastPlay,
        preparePlayer,
        swapAudioPlayers,
        initAudioContext,
        audioCtxRef,
        connectElementToContext,
      })
    );

    const nextTrack = {
      id: 'track-2',
      title: 'Next Track',
      source: 'upload',
      url: 'https://example.com/next.mp3',
      duration_seconds: 210,
    };

    act(() => {
      result.current.startCrossfade(nextTrack);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
      result.current.cancelCrossfade();
    });

    expect(isCrossfadingRef.current).toBe(false);
    expect(audioRef.current.volume).toBe(1.0);
    expect(standbyAudioRef.current.pause).toHaveBeenCalled();
  });
});
