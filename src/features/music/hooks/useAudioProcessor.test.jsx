import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioProcessor } from './useAudioProcessor';

describe('useAudioProcessor', () => {
  it('should initialize with default audio metrics', () => {
    const { result } = renderHook(() =>
      useAudioProcessor({
        analyserNode: null,
        workletNode: null,
        isPlaying: false,
        activePlayer: 'none',
      })
    );

    expect(result.current.audioDataRef.current).toEqual({
      bass: 0.1,
      mid: 0.1,
      treble: 0.1,
      overall: 0.1,
      maxTreble: 0.1,
      flux: 0,
      fluxThreshold: 0,
      bpm: 0,
    });
    expect(result.current.pulseRef.current).toBe(0);
  });

  it('should consume AUDIO_METRICS from workletNode port when available', () => {
    const listeners = [];
    const mockPort = {
      addEventListener: vi.fn((event, cb) => listeners.push(cb)),
      removeEventListener: vi.fn(),
      start: vi.fn(),
    };
    const mockWorkletNode = { port: mockPort };

    const { result } = renderHook(() =>
      useAudioProcessor({
        analyserNode: null,
        workletNode: mockWorkletNode,
        isPlaying: true,
        activePlayer: 'html5',
      })
    );

    expect(mockPort.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockPort.start).toHaveBeenCalled();

    // Dispatch simulated worklet metrics
    const incomingMetrics = {
      type: 'AUDIO_METRICS',
      targetBass: 0.85,
      targetMid: 0.65,
      targetTreble: 0.45,
      pureRawBass: 0.8,
      flux: 0.7,
      fluxThreshold: 0.3,
      bpm: 128,
      maxTreble: 0.5,
      timeDomainBuffer: new Uint8Array(128).fill(200),
    };

    act(() => {
      listeners.forEach((cb) => cb({ data: incomingMetrics }));
    });

    // Run update tick to lerp metrics
    act(() => {
      result.current.update(0.016);
    });

    const audio = result.current.audioDataRef.current;
    expect(audio.flux).toBe(0.7);
    expect(audio.fluxThreshold).toBe(0.3);
    expect(audio.bpm).toBe(128);
    expect(audio.bass).toBeGreaterThan(0.1);
    expect(result.current.timeDomainDataRef.current[0]).toBe(200);
  });

  it('should fall back to main-thread analyser calculation when workletNode is absent', () => {
    const mockAnalyser = {
      getByteFrequencyData: vi.fn((buffer) => {
        buffer.fill(180);
      }),
      getByteTimeDomainData: vi.fn((buffer) => {
        buffer.fill(128);
      }),
    };

    const { result } = renderHook(() =>
      useAudioProcessor({
        analyserNode: mockAnalyser,
        workletNode: null,
        isPlaying: true,
        activePlayer: 'html5',
      })
    );

    act(() => {
      result.current.update(0.016);
    });

    expect(mockAnalyser.getByteFrequencyData).toHaveBeenCalled();
    expect(mockAnalyser.getByteTimeDomainData).toHaveBeenCalled();
    expect(result.current.audioDataRef.current.bass).toBeGreaterThan(0.1);
  });

  it('should simulate rhythmic energy when activePlayer is youtube', () => {
    const { result } = renderHook(() =>
      useAudioProcessor({
        analyserNode: null,
        workletNode: null,
        isPlaying: true,
        activePlayer: 'youtube',
      })
    );

    act(() => {
      result.current.update(0.016);
    });

    const audio = result.current.audioDataRef.current;
    expect(audio.bass).toBeGreaterThan(0.05);
    expect(audio.mid).toBeGreaterThan(0.1);
    expect(audio.treble).toBeGreaterThan(0.1);
  });

  it('should decay pulse when audio is paused (ambient breathing mode)', () => {
    const { result } = renderHook(() =>
      useAudioProcessor({
        analyserNode: null,
        workletNode: null,
        isPlaying: false,
        activePlayer: 'none',
      })
    );

    act(() => {
      result.current.update(0.016);
    });

    expect(result.current.pulseRef.current).toBe(0);
  });

  it('should apply scale transform to containerRef on kick pulse', () => {
    const dummyDiv = document.createElement('div');
    const containerRef = { current: dummyDiv };

    const { result } = renderHook(() =>
      useAudioProcessor({
        analyserNode: null,
        workletNode: null,
        isPlaying: true,
        activePlayer: 'youtube',
        containerRef,
      })
    );

    act(() => {
      result.current.update(0.016);
    });

    expect(dummyDiv.style.transform).toMatch(/^scale\(\d+\.\d{4}\)$/);
  });
});
