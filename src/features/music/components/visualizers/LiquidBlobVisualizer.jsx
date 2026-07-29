import React, { useRef, useEffect, useCallback } from 'react';

/**
 * @file src/features/music/components/visualizers/LiquidBlobVisualizer.jsx
 * @description Immersive organic blob visualizer modelled after AI-assistant voice
 * interfaces (Siri / Gemini). Uses polar coordinate deformation driven by Web Audio
 * frequency data and time-based noise, rendered on a 2D canvas with screen blending.
 */

/**
 * Generates a pseudo-noise value using a layered sine approximation.
 *
 * @param {number} x - Spatial input.
 * @param {number} t - Time input.
 * @returns {number} Noise value in the range [-1, 1].
 */
function pseudoNoise(x, t) {
  return (
    Math.sin(x * 2.1 + t * 1.3) * 0.5 +
    Math.sin(x * 3.7 - t * 0.9) * 0.3 +
    Math.sin(x * 5.2 + t * 0.5) * 0.2
  );
}

/**
 * LiquidBlobVisualizer component. Renders an audio-reactive organic morphing
 * blob on a canvas element, with accent-color luminous glow.
 *
 * @param {Object} props
 * @param {AnalyserNode|null} props.analyserNode - Web Audio API analyser node.
 * @param {boolean} props.isPlaying - Whether audio is currently playing.
 * @param {'html5'|'youtube'|'none'} props.activePlayer - Which player is active.
 * @param {string|null} [props.accentColor] - Dominant color extracted from album art.
 * @returns {React.ReactElement} The LiquidBlobVisualizer component.
 */
export default function LiquidBlobVisualizer({
  analyserNode,
  isPlaying,
  activePlayer,
  accentColor,
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const analyserRef = useRef(analyserNode);
  const activePlayerRef = useRef(activePlayer);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!startTimeRef.current) startTimeRef.current = Date.now();
  }, []);

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
   * Resolves the primary and secondary glow colors from the accent.
   *
   * @returns {{ primary: string, secondary: string, tertiary: string }}
   */
  const resolveColors = useCallback(() => {
    if (accentColor) {
      return {
        primary: accentColor,
        secondary: '#EC4899',
        tertiary: '#8B5CF6',
      };
    }
    return {
      primary: '#F59E0B',
      secondary: '#EC4899',
      tertiary: '#8B5CF6',
    };
  }, [accentColor]);

  /**
   * Draws a single animation frame of the liquid blob.
   */
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const cx = width / 2;
    const cy = height / 2;
    const t = (Date.now() - startTimeRef.current) / 1000;

    ctx.clearRect(0, 0, width, height);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const analyser = analyserRef.current;
    const playing = isPlayingRef.current;
    const isHtml5Active = activePlayerRef.current === 'html5';

    // ── Frequency data ──────────────────────────────────────────────────────
    let energyFactor = 0.18; // idle baseline
    let bassEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;

    if (isHtml5Active && analyser && playing && !prefersReduced) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      const len = dataArray.length;
      for (let i = 0; i < Math.floor(len * 0.15); i++) bassEnergy += dataArray[i];
      for (let i = Math.floor(len * 0.15); i < Math.floor(len * 0.5); i++)
        midEnergy += dataArray[i];
      for (let i = Math.floor(len * 0.5); i < Math.floor(len * 0.8); i++)
        highEnergy += dataArray[i];
      bassEnergy = bassEnergy / (Math.floor(len * 0.15) * 255);
      midEnergy = midEnergy / (Math.floor(len * 0.35) * 255);
      highEnergy = highEnergy / (Math.floor(len * 0.3) * 255);
      energyFactor = bassEnergy * 0.5 + midEnergy * 0.3 + highEnergy * 0.2;
    } else if (playing) {
      // Breathing idle when no analyser (YouTube or paused)
      energyFactor = 0.14 + 0.08 * Math.sin(t * 1.6);
    }

    // ── Base blob radius ────────────────────────────────────────────────────
    const baseRadius = Math.min(cx, cy) * 0.52;
    const numPoints = 128;
    const colors = resolveColors();

    // Draw 3 layered blobs for depth
    const layers = [
      { scale: 1.0, alpha: 0.75, color: colors.primary, noiseFreq: 1.0, timeScale: 1.0 },
      { scale: 0.82, alpha: 0.55, color: colors.secondary, noiseFreq: 1.4, timeScale: 1.3 },
      { scale: 0.65, alpha: 0.45, color: colors.tertiary, noiseFreq: 1.9, timeScale: 0.7 },
    ];

    for (const layer of layers) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = layer.alpha;

      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const noiseVal = pseudoNoise(angle * layer.noiseFreq, t * layer.timeScale);
        const deform = prefersReduced ? 0 : energyFactor * 0.65 * noiseVal * baseRadius;
        const r = baseRadius * layer.scale + deform;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Radial gradient fill
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * layer.scale);
      grad.addColorStop(0, layer.color + 'cc');
      grad.addColorStop(0.6, layer.color + '66');
      grad.addColorStop(1, layer.color + '00');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    // ── Central glow orb ───────────────────────────────────────────────────
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const glowRadius = baseRadius * 0.25 * (1 + energyFactor * 0.4);
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    glowGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    glowGrad.addColorStop(0.4, colors.primary + '88');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [resolveColors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(([entry]) => {
      canvas.width = entry.contentRect.width;
      canvas.height = entry.contentRect.height;
    });
    const parent = canvas.parentElement ?? canvas;
    canvas.width = parent.offsetWidth || 300;
    canvas.height = parent.offsetHeight || 300;
    observer.observe(parent);

    const loop = () => {
      if (document.visibilityState !== 'hidden') drawFrame();
      animationRef.current = requestAnimationFrame(loop);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
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
    <canvas ref={canvasRef} className="liquid-blob-canvas" aria-hidden="true" role="presentation" />
  );
}
