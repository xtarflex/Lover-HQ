/**
 * @file AndroidWaveScrubber.jsx
 * @description High-performance interactive media scrubber implementing the Android Squiggly
 * wave animation from android_media_player.html.
 *
 * Specifications:
 * - Default track height: 7px.
 * - Hovered track height: 8px (disabled on mobile via '(hover: hover)' matchMedia).
 * - Upward billowing fluid dual-layer wave pinned to baseline at start & thumb via sine envelope.
 * - Smooth lerp amplitude transition on play/pause (flattens into straight baseline).
 * - Circular thumb scrubber with drop shadow.
 * - Monospace timestamp tracking beneath.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Format total seconds to MM:SS string.
 *
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return '0:00';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * AndroidWaveScrubber component.
 *
 * @param {object} props
 * @param {number} props.duration - Track duration in seconds.
 * @param {number} props.currentTime - Controlled playback time in seconds.
 * @param {boolean} props.isPlaying - Whether media is actively playing.
 * @param {Function} props.onSeek - Callback invoked with new time in seconds.
 * @param {string} [props.accentColor] - Optional accent color.
 * @returns {React.ReactElement}
 */
export function AndroidWaveScrubber({
  duration = 0,
  currentTime = 0,
  isPlaying = false,
  onSeek,
  accentColor,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const stateRef = useRef({
    phase: 0,
    amplitude: isPlaying ? 13 : 0,
    isHovered: false,
    trackThickness: 7,
    lastTime: 0,
  });

  const [dragTime, setDragTime] = useState(null);
  const [hasHoverSupport, setHasHoverSupport] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    }
    return false;
  });

  // Subscribe to media query changes without setting state synchronously in effect body
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const listener = (e) => setHasHoverSupport(e.matches);

    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, []);

  // Pure state derivation: activeTime reflects dragging time or controlled currentTime
  const isDragging = dragTime !== null;
  const activeTime = isDragging ? dragTime : currentTime;

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isSubscribed = true;

    const render = (now) => {
      if (!isSubscribed) return;

      const dt =
        stateRef.current.lastTime > 0
          ? Math.min((now - stateRef.current.lastTime) / 1000, 0.1)
          : 0.016;
      stateRef.current.lastTime = now;

      // Canvas dimensions & High-DPI scaling
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      const padX = 6;
      const barStart = padX;
      const barEnd = width - padX;
      const barWidth = Math.max(1, barEnd - barStart);
      const progressRatio = duration > 0 ? Math.max(0, Math.min(1, activeTime / duration)) : 0;
      const thumbX = barStart + barWidth * progressRatio;
      const y = height - 9; // Baseline located near bottom to give headroom for upward billowing
      const span = thumbX - barStart;

      // Dynamic amplitude scaling: smoothly ramps from ~4.5px at the beginning to full 13px
      // at 25% duration progress. Additionally damps by span when span < 28px to eliminate
      // initial needle spikes and jitter.
      const rampThreshold = 0.25;
      const progressFactor = Math.min(1, Math.max(0, progressRatio / rampThreshold));
      const smoothProgress = progressFactor * progressFactor * (3 - 2 * progressFactor);
      const minAmp = 4.5;
      const maxAmp = 13;
      const baselineAmp = minAmp + (maxAmp - minAmp) * smoothProgress;
      const spanDamping = Math.min(1, Math.max(0, (span - 6) / 22));
      const maxDynamicAmp = baselineAmp * spanDamping;

      // Smooth amplitude lerp towards dynamic target height
      const targetAmplitude = isPlaying ? maxDynamicAmp : 0;
      stateRef.current.amplitude +=
        (targetAmplitude - stateRef.current.amplitude) * Math.min(1, dt * 7);

      if (isPlaying && !isDragging) {
        stateRef.current.phase += dt * 3.2;
      }

      // Smooth track thickness transition (7px default, 8px on hover if device supports hover)
      const targetThickness = stateRef.current.isHovered && hasHoverSupport ? 8 : 7;
      stateRef.current.trackThickness +=
        (targetThickness - stateRef.current.trackThickness) * Math.min(1, dt * 14);

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const thickness = stateRef.current.trackThickness;
      const currentAmp = stateRef.current.amplitude;
      const phase = stateRef.current.phase;

      // Lighter tint of accent color for the 2nd wave
      const lighterAccentColor = accentColor
        ? `color-mix(in srgb, ${accentColor} 50%, #ffffff)`
        : 'rgba(255, 255, 255, 0.45)';

      // ─── 1. Solid Upward Billowing Waves (Played area only) ─────────────
      if (span > 6 && currentAmp > 0.3) {
        const drawUpwardWaveLayer = (amplitude, phaseOffset, speedMult, fillStyle, strokeStyle) => {
          ctx.beginPath();
          ctx.moveTo(barStart, y);

          const step = 2.5;
          for (let x = barStart; x <= thumbX; x += step) {
            const norm = (x - barStart) / span; // 0.0 at barStart, 1.0 at thumb

            // Base envelope guarantees smooth zero-height pinning at both ends
            const baseEnvelope = Math.sin(norm * Math.PI);

            // Flowing multi-frequency ripples from Android squiggly algorithm
            const wave1 = Math.sin(norm * Math.PI * 2.8 - phase * speedMult + phaseOffset);
            const wave2 = Math.cos(norm * Math.PI * 1.4 - phase * (speedMult * 0.7));
            const ripple = 0.55 + 0.45 * (wave1 * 0.7 + wave2 * 0.3);

            // Upward wave crest (negative y offset)
            const h = amplitude * baseEnvelope * Math.max(0, ripple);
            ctx.lineTo(x, y - h);
          }

          // Close down into the baseline track
          ctx.lineTo(thumbX, y + thickness / 2);
          ctx.lineTo(barStart, y + thickness / 2);
          ctx.closePath();

          ctx.fillStyle = fillStyle;
          ctx.fill();

          if (strokeStyle) {
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
          }
        };

        // Layer 1 (2nd Wave): Lighter tint of accent color for depth and halo crest
        drawUpwardWaveLayer(currentAmp * 1.12, 1.85, 0.82, lighterAccentColor, null);

        // Layer 2: Main foreground fluid wave (matches solid accent color / white)
        drawUpwardWaveLayer(
          currentAmp * 0.92,
          0.0,
          1.15,
          accentColor || '#ffffff',
          accentColor || '#ffffff'
        );
      }

      // ─── 2. Straight Progress Baseline Tracks ────────────────────────────
      // Inactive track (thumb to end)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(thumbX, y);
      ctx.lineTo(barEnd, y);
      ctx.stroke();

      // Active track (start to thumb)
      ctx.strokeStyle = accentColor || '#ffffff';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(barStart, y);
      ctx.lineTo(thumbX, y);
      ctx.stroke();

      // ─── 3. Circular Thumb Scrubber ─────────────────────────────────────
      const thumbRadius = stateRef.current.isHovered && hasHoverSupport ? 6.5 : 5.5;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 1;
      ctx.beginPath();
      ctx.arc(thumbX, y, thumbRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, duration, activeTime, isDragging, hasHoverSupport, accentColor]);

  // Handle Seek Calculation from Pointer Position
  const handlePointerSeek = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas || !duration) return 0;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const padX = 6;
      const barWidth = rect.width - padX * 2;
      const x = Math.max(padX, Math.min(clientX - rect.left, rect.width - padX));
      const ratio = Math.max(0, Math.min(1, (x - padX) / barWidth));
      const newTime = ratio * duration;
      setDragTime(newTime);
      return newTime;
    },
    [duration]
  );

  const handlePointerDown = (e) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // pointer capture might not be supported on all browsers
    }
    const newTime = handlePointerSeek(e);
    if (typeof newTime === 'number' && onSeek) {
      onSeek(newTime);
    }
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      e.stopPropagation();
      const newTime = handlePointerSeek(e);
      if (typeof newTime === 'number' && onSeek) {
        onSeek(newTime);
      }
    }
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      e.stopPropagation();
      const finalTime = dragTime;
      setDragTime(null);
      if (typeof finalTime === 'number' && onSeek) {
        onSeek(finalTime);
      }
    }
  };

  const handlePointerEnter = () => {
    if (hasHoverSupport) {
      stateRef.current.isHovered = true;
    }
  };

  const handlePointerLeave = () => {
    stateRef.current.isHovered = false;
  };

  return (
    <div className="w-full flex flex-col select-none" onClick={(e) => e.stopPropagation()}>
      <div
        className="relative w-full h-[28px] cursor-pointer touch-none flex items-end"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        role="progressbar"
        aria-valuenow={Math.floor(activeTime)}
        aria-valuemin={0}
        aria-valuemax={Math.floor(duration)}
        aria-label="Track progress"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Monospace Timestamps Tracking Time & Duration */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5 px-0.5">
        <span>{formatTime(activeTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
