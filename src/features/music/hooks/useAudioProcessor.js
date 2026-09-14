import { useRef, useEffect, useCallback } from 'react';
import { doctorAudioData } from '../lib/audioUtils';

/**
 * @file src/features/music/hooks/useAudioProcessor.js
 * @description Custom React hook managing real-time audio spectrum processing, audio doctoring,
 * dynamic range peak normalization (high-water mark), kick impulse tracking, and container scale pulsing.
 */

/**
 * Custom Hook: useAudioProcessor
 *
 * @param {Object} params
 * @param {AnalyserNode|null} params.analyserNode - Web Audio API analyser node instance.
 * @param {boolean} params.isPlaying - Whether audio is playing.
 * @param {'html5'|'youtube'|'none'} params.activePlayer - Active audio player engine.
 * @param {React.RefObject} [params.containerRef] - Ref to the outer container element to apply transform scale directly.
 * @returns {{
 *   audioDataRef: React.RefObject<{bass: number, mid: number, treble: number, overall: number}>,
 *   pulseRef: React.RefObject<number>,
 *   maxBassObservedRef: React.RefObject<number>,
 *   bassBaselineRef: React.RefObject<number>
 * }} Processing refs object.
 */
export function useAudioProcessor({ analyserNode, isPlaying, activePlayer, containerRef }) {
  const isPlayingRef = useRef(isPlaying);
  const analyserRef = useRef(analyserNode);
  const activePlayerRef = useRef(activePlayer);

  // Audio processing refs
  const audioDataRef = useRef({
    bass: 0.1,
    mid: 0.1,
    treble: 0.1,
    overall: 0.1,
    maxTreble: 0.1,
    flux: 0,
    fluxThreshold: 0,
    bpm: 0,
  });
  const pulseRef = useRef(0);
  const bassBaselineRef = useRef(0.1);
  const maxBassObservedRef = useRef(0.1);
  const maxTrebleRef = useRef(0.1);
  const rawDataBufferRef = useRef(new Uint8Array(64));
  const doctoredBufferRef = useRef(new Float32Array(64));

  // Flux and Time Domain additions
  const previousFreqDataRef = useRef(new Uint8Array(64));
  const timeDomainDataRef = useRef(new Uint8Array(128));
  const fluxHistoryRef = useRef(new Float32Array(240));
  const fluxHistoryIndexRef = useRef(0);
  const frameCountRef = useRef(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    analyserRef.current = analyserNode;
  }, [analyserNode]);

  useEffect(() => {
    activePlayerRef.current = activePlayer;
  }, [activePlayer]);

  const tRef = useRef(0);

  const update = useCallback(
    (delta = 0.016) => {
      tRef.current += delta;
      const t = tRef.current;
      const playing = isPlayingRef.current;
      const playerType = activePlayerRef.current;
      const analyser = analyserRef.current;

      let targetBass = 0.1;
      let targetMid = 0.1;
      let targetTreble = 0.1;
      let pureRawBass = 0.1;

      if (playing && playerType === 'html5' && analyser) {
        // ── State 3: Active Spectrum Audio ───────────────────────────────────
        const raw = rawDataBufferRef.current;
        const prevRaw = previousFreqDataRef.current;
        const timeDomain = timeDomainDataRef.current;

        analyser.getByteFrequencyData(raw);
        analyser.getByteTimeDomainData(timeDomain); // 128 bins of raw waveform

        // Calculate Spectral Flux
        let currentFlux = 0;
        for (let i = 0; i < raw.length; i++) {
          const diff = raw[i] - prevRaw[i];
          if (diff > 0) {
            currentFlux += diff;
          }
          prevRaw[i] = raw[i]; // Update previous array for next frame
        }
        // Normalize flux
        currentFlux = currentFlux / (raw.length * 255);

        // Add to history ring buffer (240 frames ~ 4 seconds)
        const fluxIndex = fluxHistoryIndexRef.current;
        fluxHistoryRef.current[fluxIndex] = currentFlux;
        fluxHistoryIndexRef.current = (fluxIndex + 1) % 240;

        // Calculate Flux Threshold (Rolling average of last 15 frames)
        let fluxSum = 0;
        for (let i = 1; i <= 15; i++) {
          let idx = fluxIndex - i;
          if (idx < 0) idx += 240;
          fluxSum += fluxHistoryRef.current[idx];
        }
        const fluxThreshold = fluxSum / 15;

        // BPM Detection: Autocorrelation on Flux History (every 15 frames to save CPU)
        frameCountRef.current++;
        if (frameCountRef.current % 15 === 0) {
          // Autocorrelation over the 240 frame buffer
          // 60 BPM = 1 beat per second = 60 frames (at 60fps)
          // 180 BPM = 3 beats per second = 20 frames (at 60fps)
          let maxCorrelation = 0;
          let bestLag = 0;

          for (let lag = 20; lag <= 60; lag++) {
            let correlation = 0;
            // Correlate over available history (e.g., oldest 180 frames)
            for (let i = 0; i < 180; i++) {
              let idxA = fluxIndex - i - 1;
              if (idxA < 0) idxA += 240;
              let idxB = fluxIndex - i - 1 - lag;
              if (idxB < 0) idxB += 240;

              correlation += fluxHistoryRef.current[idxA] * fluxHistoryRef.current[idxB];
            }
            if (correlation > maxCorrelation) {
              maxCorrelation = correlation;
              bestLag = lag;
            }
          }

          if (bestLag > 0) {
            // Convert lag (frames) to BPM. (60 fps * 60 seconds) / lag
            const calculatedBPM = 3600 / bestLag;
            audioDataRef.current.bpm = calculatedBPM;
          }
        }

        audioDataRef.current.flux = currentFlux;
        audioDataRef.current.fluxThreshold = fluxThreshold;

        // Pure raw sub-bass bins 1..5 (uncut by Gaussian edge tapering, avoiding DC offset at bin 0)
        let rawBSum = 0;
        for (let i = 1; i < 6; i++) {
          rawBSum += raw[i] / 255.0;
        }
        pureRawBass = rawBSum / 5;

        const doctored = doctorAudioData(raw, doctoredBufferRef.current);

        // Map 64 bins logarithmically across Sub-Bass (0..4), Bass/Low-Mid (5..15), Mid (16..35), Treble (36..63)
        const getBandAverage = (data, startRatio, endRatio) => {
          const start = Math.floor(data.length * startRatio);
          const end = Math.max(start + 1, Math.floor(data.length * endRatio));
          let sum = 0;
          for (let i = start; i < end; i++) sum += data[i];
          return sum / (end - start);
        };

        targetBass = getBandAverage(doctored, 0.0, 0.08); // ~20Hz - 250Hz
        targetMid = getBandAverage(doctored, 0.08, 0.4); // ~250Hz - 2.5kHz
        targetTreble = getBandAverage(doctored, 0.4, 0.95); // ~2.5kHz - 16kHz
      } else if (playing) {
        // ── State 2: Active Simulated (YouTube / Non-CORS) ───────────────────
        // Subtle low kick pulse & boosted treble peaks (>0.32) for multi-origin ripples
        const beatPhase = (t * 3.6) % (Math.PI * 2);
        const grooveVariation = 0.6 + 0.4 * Math.sin(t * 0.8);
        const kickHit = Math.pow(Math.max(0, Math.sin(beatPhase)), 8.0) * grooveVariation;
        pureRawBass = 0.05 + kickHit * 0.15;
        targetBass = pureRawBass;
        targetMid = 0.18 + 0.14 * Math.cos(t * 3.4 + 1.2);
        // Boosted targetTreble so peaks periodically cross 0.32 ripple threshold
        targetTreble = 0.22 + 0.16 * Math.sin(t * 5.1 + 2.5) + (Math.random() - 0.5) * 0.05;
      } else {
        // ── State 1: Idle Ambient Breathing ──────────────────────────────────
        const idleWave = 0.12 + 0.04 * Math.sin(t * 1.4);
        targetBass = idleWave;
        targetMid = idleWave * 0.9;
        targetTreble = idleWave * 0.8;
        pureRawBass = idleWave;
      }

      // Linear Interpolation (Lerp) for silky visualizer transitions
      const lerpSpeed = 0.12;
      const audio = audioDataRef.current;
      audio.bass += (targetBass - audio.bass) * lerpSpeed;
      audio.mid += (targetMid - audio.mid) * lerpSpeed;
      audio.treble += (targetTreble - audio.treble) * lerpSpeed;
      audio.overall = audio.bass * 0.5 + audio.mid * 0.35 + audio.treble * 0.15;

      if (playing) {
        maxTrebleRef.current = Math.max(maxTrebleRef.current * 0.999, targetTreble);
      }
      audio.maxTreble = Math.max(0.05, maxTrebleRef.current);

      // ── Speaker Pulse: Dynamic Range Normalization (High-Water Mark Peak Tracker)
      if (playing) {
        maxBassObservedRef.current = Math.max(maxBassObservedRef.current || 0.1, pureRawBass);
        maxBassObservedRef.current *= 0.9992; // Slow decay so peak adapts dynamically
      }

      // Normalized Bass Percentage (0.0 to 1.0) for ANY song volume
      const bassPercentage = Math.min(
        1.0,
        pureRawBass / Math.max(0.05, maxBassObservedRef.current)
      );

      // Dynamic Baseline Percentage Tracker
      bassBaselineRef.current += (bassPercentage - bassBaselineRef.current) * 0.05;
      const kickImpulse = Math.max(0, bassPercentage - bassBaselineRef.current * 0.4);

      if (playing) {
        if (playerType === 'html5' && analyser) {
          // Real Audio: Dynamic percentage-normalized pulse
          pulseRef.current = Math.max(kickImpulse * 0.85, pulseRef.current * 0.72);
        } else {
          // Simulated: Subtle low kick pulse only (no massive kick)
          pulseRef.current = Math.max(kickImpulse * 0.3, pulseRef.current * 0.72);
        }
      } else {
        pulseRef.current *= 0.6; // Rapid decay when paused
      }

      // Apply transform scale directly to container element if ref provided
      const bassScale = 1.0 + Math.min(0.08, pulseRef.current * 0.15);
      if (containerRef && containerRef.current) {
        containerRef.current.style.transform = `scale(${bassScale.toFixed(4)})`;
      }
    },
    [containerRef]
  );

  return {
    audioDataRef,
    timeDomainDataRef,
    pulseRef,
    maxBassObservedRef,
    bassBaselineRef,
    update,
  };
}
