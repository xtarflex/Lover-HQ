import React, { useRef, useEffect, useCallback } from 'react';

/**
 * @file src/features/music/components/visualizers/WaveBarVisualizer.jsx
 * @description Audio-reactive bar/wave frequency visualizer rendered on a Canvas element.
 * Driven by a Web Audio AnalyserNode when available; falls back to a graceful
 * breathing idle animation when paused or no analyser is connected.
 */

/**
 * WaveBarVisualizer component. Renders an animated bar-graph frequency
 * visualizer on a canvas, tinted by the provided accent color.
 *
 * @param {Object} props
 * @param {AnalyserNode|null} props.analyserNode - Web Audio API analyser node.
 * @param {boolean} props.isPlaying - Whether audio is currently playing.
 * @param {'html5'|'youtube'|'none'} props.activePlayer - Which player is active.
 * @param {string} [props.accentColor] - CSS color string for bar tinting.
 * @returns {React.ReactElement} The WaveBarVisualizer component.
 */
export default function WaveBarVisualizer({ analyserNode, isPlaying, activePlayer, accentColor }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const analyserRef = useRef(analyserNode);
  const activePlayerRef = useRef(activePlayer);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    analyserRef.current = analyserNode;
  }, [analyserNode]);
  useEffect(() => {
    activePlayerRef.current = activePlayer;
  }, [activePlayer]);

  /**
   * Draws a single animation frame of the bar visualizer.
   */
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const playing = isPlayingRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const numBars = 52;
    const gap = 3;
    const barWidth = Math.max(2, (canvas.width - gap * (numBars - 1)) / numBars);

    // Build accent-aware gradient
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    if (accentColor) {
      gradient.addColorStop(0, accentColor);
      gradient.addColorStop(0.5, '#EC4899');
      gradient.addColorStop(1, '#8B5CF6');
    } else {
      gradient.addColorStop(0, '#F59E0B');
      gradient.addColorStop(0.5, '#EC4899');
      gradient.addColorStop(1, '#8B5CF6');
    }
    ctx.fillStyle = gradient;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isHtml5Active = activePlayerRef.current === 'html5';

    if (isHtml5Active && analyser && playing && !prefersReduced) {
      // Live frequency data
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      const binStep = Math.floor(dataArray.length / numBars);

      for (let i = 0; i < numBars; i++) {
        const value = dataArray[i * binStep] / 255;
        const barHeight = Math.max(2, value * canvas.height);
        const x = i * (barWidth + gap);
        const y = canvas.height - barHeight;
        ctx.beginPath();
        ctx.roundRect?.(x, y, barWidth, barHeight, 2) ?? ctx.rect(x, y, barWidth, barHeight);
        ctx.fill();
      }
    } else {
      // Breathing idle animation
      const phase = Date.now() / (prefersReduced ? Infinity : 1000);
      for (let i = 0; i < numBars; i++) {
        const amplitude = playing ? 0.35 + 0.15 * Math.sin(phase * 1.5) : 0.08;
        const wave = 0.5 + 0.5 * Math.sin(i * 0.25 + phase * 2.5);
        const envelope = Math.sin((i / (numBars - 1)) * Math.PI);
        const breathe = prefersReduced ? 0.15 : amplitude * wave * envelope + 0.05;
        const barHeight = Math.max(2, breathe * canvas.height);
        const x = i * (barWidth + gap);
        const y = canvas.height - barHeight;
        ctx.beginPath();
        ctx.roundRect?.(x, y, barWidth, barHeight, 2) ?? ctx.rect(x, y, barWidth, barHeight);
        ctx.fill();
      }
    }
  }, [accentColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.height = 72;

    const loop = () => {
      if (document.visibilityState !== 'hidden') drawFrame();
      animationRef.current = requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(([entry]) => {
      if (canvas) canvas.width = entry.contentRect.width;
    });
    observer.observe(canvas.parentElement ?? canvas);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !animationRef.current) {
        animationRef.current = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [drawFrame]);

  return (
    <canvas ref={canvasRef} className="w-full opacity-85" aria-hidden="true" role="presentation" />
  );
}
