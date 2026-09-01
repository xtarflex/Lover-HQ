import { useRef, useEffect } from 'react';
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
  const audioDataRef = useRef({ bass: 0.1, mid: 0.1, treble: 0.1, overall: 0.1, maxTreble: 0.1 });
  const pulseRef = useRef(0);
  const bassBaselineRef = useRef(0.1);
  const maxBassObservedRef = useRef(0.1);
  const maxTrebleRef = useRef(0.1);
  const rawDataBufferRef = useRef(new Uint8Array(64));
  const doctoredBufferRef = useRef(new Float32Array(64));

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    analyserRef.current = analyserNode;
  }, [analyserNode]);

  useEffect(() => {
    activePlayerRef.current = activePlayer;
  }, [activePlayer]);

  useEffect(() => {
    let animId;
    let t = 0;

    const processAudioFrame = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(processAudioFrame);
        return;
      }

      t += 0.016;
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
        analyser.getByteFrequencyData(raw);

        // Pure raw sub-bass bins 0..7 (uncut by Gaussian edge tapering)
        let rawBSum = 0;
        for (let i = 0; i < 8; i++) {
          rawBSum += raw[i] / 255.0;
        }
        pureRawBass = rawBSum / 8;

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

      animId = requestAnimationFrame(processAudioFrame);
    };

    processAudioFrame();
    return () => cancelAnimationFrame(animId);
  }, [containerRef]);

  return {
    audioDataRef,
    pulseRef,
    maxBassObservedRef,
    bassBaselineRef,
  };
}
