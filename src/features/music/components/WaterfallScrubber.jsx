/**
 * @file WaterfallScrubber.jsx
 * @description High-performance music scrubber component inspired by Samsung One UI media player.
 *
 * Implements:
 * - Fluid dual-layer waterfall wave canvas animation synced via requestAnimationFrame (60+ FPS).
 * - Layer 1 (Bottom/Accent): Deep vibrant purple (#a855f7) with Math.PI phase offset and 0.8x amplitude.
 * - Layer 2 (Top/Primary): Electric blue (#3b82f6) with 1.0x amplitude.
 * - Smooth lerp amplitude interpolation between playing (wave) and paused (flat line).
 * - Spring physics track expansion (4px -> 16px) and thumb scaling (0px -> 12px) on hover/drag.
 * - High-DPI screen support (window.devicePixelRatio).
 * - Monospace timestamp block tracking formatted time (M:SS).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * Formats a duration in seconds into a clean monospace timestamp string (M:SS).
 *
 * @param {number} seconds - Time in seconds.
 * @returns {string} Formatted time string (e.g., "3:45").
 */
export function formatTimestamp(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * WaterfallScrubber component.
 *
 * @param {object} props
 * @param {number} props.duration - Total track duration in seconds.
 * @param {number} [props.initialProgress=0] - Starting progress in seconds.
 * @param {boolean} props.isPlaying - Current playback active state.
 * @param {number} [props.currentTime] - Controlled playback position in seconds.
 * @param {Function} [props.onSeek] - Callback invoked when the user seeks (newTimeInSeconds).
 * @param {string} [props.className] - Additional wrapper class names.
 * @returns {React.ReactElement}
 */
export function WaterfallScrubber({
  duration = 0,
  initialProgress = 0,
  isPlaying = false,
  currentTime: controlledCurrentTime,
  onSeek,
  className = '',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Interaction States
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [internalTime, setInternalTime] = useState(initialProgress);

  // Derive active display time (prioritizes drag state, then controlled time, then internal progress)

  const activeTime = isDragging
    ? internalTime
    : typeof controlledCurrentTime === 'number'
      ? controlledCurrentTime
      : internalTime;

  const progressRatio = duration > 0 ? Math.min(Math.max(activeTime / duration, 0), 1) : 0;

  // Wave Animation Math Refs
  const phaseRef = useRef(0);
  const currentAmplitudeRef = useRef(0);
  const animationFrameIdRef = useRef(null);

  // Measure canvas size reactively
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 16 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.offsetWidth || 0,
          height: isHovered || isDragging ? 16 : 16, // Canvas draws full buffer
        });
      }
    };

    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [isHovered, isDragging]);

  // RequestAnimationFrame Dual-Layer Waterfall Wave Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const width = canvasSize.width;
      const height = isHovered || isDragging ? 16 : 4; // visual track height
      const centerY = height / 2;

      // Adjust buffer size for Retina / High-DPI
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Background Unplayed Track (Neutral Glass / Semi-transparent slate)
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, height / 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fill();

      const activeWidth = progressRatio * width;

      // Amplitude Lerp Interpolation
      const maxAmplitude = Math.max(height * 0.35, 1.5);
      const targetAmplitude =
        isPlaying && progressRatio < 1 && progressRatio > 0 ? maxAmplitude : 0;

      // Smooth linear interpolation (lerp)
      currentAmplitudeRef.current += (targetAmplitude - currentAmplitudeRef.current) * 0.08;
      if (Math.abs(currentAmplitudeRef.current - targetAmplitude) < 0.005) {
        currentAmplitudeRef.current = targetAmplitude;
      }

      // Horizontal phase shifting continues only while wave has active amplitude
      if (isPlaying && currentAmplitudeRef.current > 0.005) {
        phaseRef.current += 0.065;
      }

      const amp = currentAmplitudeRef.current;
      const phase = phaseRef.current;
      const wavelength = 28; // Wave frequency period
      const frequency = (2 * Math.PI) / wavelength;

      if (activeWidth > 0) {
        // Clip all waves inside the track rounded boundary up to activeWidth
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, activeWidth, height, height / 2);
        ctx.clip();

        // ─── Layer 1: Bottom Accent Wave (Deep Vibrant Purple #a855f7) ───────
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= activeWidth; x += 1.5) {
          const waveY = centerY + Math.sin(x * frequency + phase + Math.PI) * (amp * 0.8);
          ctx.lineTo(x, waveY);
        }
        ctx.lineTo(activeWidth, height);
        ctx.closePath();
        ctx.fillStyle = '#a855f7';
        ctx.fill();

        // ─── Layer 2: Top Primary Wave (Electric Blue #3b82f6) ───────────────
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= activeWidth; x += 1.5) {
          const waveY = centerY + Math.sin(x * frequency + phase) * amp;
          ctx.lineTo(x, waveY);
        }
        ctx.lineTo(activeWidth, height);
        ctx.closePath();
        ctx.fillStyle = '#3b82f6';
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [canvasSize, progressRatio, isPlaying, isHovered, isDragging]);

  // Handle Scrubbing Calculations
  const calculateSeekTime = useCallback(
    (clientX) => {
      if (!containerRef.current || duration <= 0) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, offsetX / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    const newTime = calculateSeekTime(e.clientX);
    setInternalTime(newTime);
    if (onSeek) onSeek(newTime);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    const newTime = calculateSeekTime(e.clientX);
    setInternalTime(newTime);
    if (onSeek) onSeek(newTime);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    const newTime = calculateSeekTime(e.clientX);
    setInternalTime(newTime);
    if (onSeek) onSeek(newTime);
  };

  const isInteractiveActive = isHovered || isDragging;

  return (
    <div
      className={`w-full select-none flex flex-col justify-center ${className}`}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => {
        if (!isDragging) setIsHovered(false);
      }}
    >
      {/* Interactive Track Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsDragging(false)}
        role="slider"
        tabIndex={0}
        aria-label="Audio progress scrubber"
        aria-valuenow={Math.floor(activeTime)}
        aria-valuemin={0}
        aria-valuemax={Math.floor(duration)}
        className="relative w-full py-2.5 cursor-pointer flex items-center touch-none"
      >
        {/* Dynamic Spring-Expanded Track Container (4px -> 16px) */}
        <motion.div
          animate={{ height: isInteractiveActive ? 16 : 4 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full rounded-full overflow-hidden flex items-center"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ width: '100%', height: '100%' }}
          />
        </motion.div>

        {/* Round Scrubber Thumb (0px -> 12px fluid spring scale on hover/drag) */}
        <motion.div
          animate={{
            scale: isInteractiveActive ? 1 : 0,
            opacity: isInteractiveActive ? 1 : 0,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-slate-200 pointer-events-none z-20"
          style={{
            left: `calc(${progressRatio * 100}% - 6px)`,
          }}
        />
      </div>

      {/* Monospace Timestamp Block Directly Underneath Scrubber (M:SS) */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-0.5 mt-0.5">
        <span>{formatTimestamp(activeTime)}</span>
        <span>{formatTimestamp(duration)}</span>
      </div>
    </div>
  );
}

export default WaterfallScrubber;
