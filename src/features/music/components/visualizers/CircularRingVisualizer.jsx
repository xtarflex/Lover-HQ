/**
 * @file src/features/music/components/visualizers/CircularRingVisualizer.jsx
 * @description Audio-reactive circular frequency ring visualizer.
 * Renders artwork in the centre spindle with frequency bars radiating outward
 * in a ring formation, driven by the Web Audio AnalyserNode. Matches reference-2
 * from GH Issue #61. Falls back to a pulsing idle animation when paused.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useMusic } from '../../../../contexts/MusicContext';
import { getTrackArtwork } from '../../lib/musicUtils';

const TWO_PI = Math.PI * 2;
const BAR_COUNT = 128;
const INNER_RADIUS_RATIO = 0.28; // fraction of canvas shortest side
const BAR_MAX_HEIGHT_RATIO = 0.22;
const IDLE_PULSE_SPEED = 0.9;

/**
 * Draws a circular image clipped to a circle on a canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {HTMLImageElement} img - The loaded image element.
 * @param {number} cx - Centre x.
 * @param {number} cy - Centre y.
 * @param {number} radius - Circle radius.
 */
function drawCircularImage(ctx, img, cx, cy, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TWO_PI);
  ctx.closePath();
  ctx.clip();
  const size = radius * 2;
  ctx.drawImage(img, cx - radius, cy - radius, size, size);
  ctx.restore();
}

/**
 * CircularRingVisualizer — audio-reactive frequency ring with artwork centre.
 *
 * @param {Object} props
 * @param {string|null} props.accentColor - CSS accent color string derived from artwork.
 * @returns {React.ReactElement}
 */
export default function CircularRingVisualizer({ accentColor }) {
  const { currentTrack, isPlaying, analyserNode, activePlayer } = useMusic();

  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const analyserRef = useRef(analyserNode);
  const activePlayerRef = useRef(activePlayer);
  const startTimeRef = useRef(null);
  const artworkImageRef = useRef(null);
  const artworkUrlRef = useRef(null);

  // Keep refs in sync without re-triggering the animation loop
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    analyserRef.current = analyserNode;
  }, [analyserNode]);

  useEffect(() => {
    activePlayerRef.current = activePlayer;
  }, [activePlayer]);

  // Preload artwork image whenever track changes
  useEffect(() => {
    const artworkUrl = getTrackArtwork(currentTrack);
    if (!artworkUrl || artworkUrl === artworkUrlRef.current) return;

    artworkUrlRef.current = artworkUrl;
    artworkImageRef.current = null;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      artworkImageRef.current = img;
    };
    img.onerror = () => {
      artworkImageRef.current = null;
    };
    img.src = artworkUrl;
  }, [currentTrack]);

  /**
   * Main animation loop — draws frequency ring bars around the artwork circle.
   */
  const drawFrame = useCallback(() => {
    if (document.hidden) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const cx = width / 2;
    const cy = height / 2;
    const minSide = Math.min(width, height);
    const innerR = minSide * INNER_RADIUS_RATIO;
    const maxBarH = minSide * BAR_MAX_HEIGHT_RATIO;

    const t = (Date.now() - (startTimeRef.current ?? Date.now())) / 1000;

    ctx.clearRect(0, 0, width, height);

    // ── Frequency data ────────────────────────────────────────────────────────
    let dataArray = null;
    const analyser = analyserRef.current;
    const player = activePlayerRef.current;

    if (analyser && isPlayingRef.current && player === 'html5') {
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
    }

    // ── Outer glow ring ───────────────────────────────────────────────────────
    const glowGrad = ctx.createRadialGradient(cx, cy, innerR * 0.9, cx, cy, innerR + maxBarH + 8);
    const baseColor = accentColor || 'rgb(236, 72, 153)';
    glowGrad.addColorStop(0, `${baseColor.replace('rgb', 'rgba').replace(')', ', 0.12)')}`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, innerR + maxBarH + 8, 0, TWO_PI);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // ── Frequency / idle bars ─────────────────────────────────────────────────
    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * TWO_PI - Math.PI / 2;

      let barH;
      if (dataArray) {
        // Map bar index to a spread of the frequency spectrum
        const freqIndex = Math.floor((i / BAR_COUNT) * dataArray.length * 0.75);
        barH = (dataArray[freqIndex] / 255) * maxBarH;
        barH = Math.max(barH, 2);
      } else {
        // Idle breathing: sine wave ripple
        const wave = Math.sin(t * IDLE_PULSE_SPEED + (i / BAR_COUNT) * TWO_PI * 2);
        barH = (0.08 + 0.06 * wave) * maxBarH;
      }

      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const x2 = cx + Math.cos(angle) * (innerR + barH);
      const y2 = cy + Math.sin(angle) * (innerR + barH);

      // Gradient on each bar: accent → transparent tip
      const barGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      const alpha = dataArray ? 0.9 : 0.5;
      barGrad.addColorStop(0, baseColor.replace('rgb', 'rgba').replace(')', `, ${alpha})`));
      barGrad.addColorStop(1, baseColor.replace('rgb', 'rgba').replace(')', ', 0)'));

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = barGrad;
      ctx.lineWidth = Math.max(1.5, (TWO_PI * innerR) / BAR_COUNT - 1);
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // ── Artwork circle ────────────────────────────────────────────────────────
    const artImg = artworkImageRef.current;
    if (artImg) {
      drawCircularImage(ctx, artImg, cx, cy, innerR - 2);
    } else {
      // Fallback: gradient disc
      const discGrad = ctx.createRadialGradient(
        cx - innerR * 0.25,
        cy - innerR * 0.25,
        0,
        cx,
        cy,
        innerR
      );
      discGrad.addColorStop(0, '#334155');
      discGrad.addColorStop(1, '#0f172a');
      ctx.beginPath();
      ctx.arc(cx, cy, innerR - 2, 0, TWO_PI);
      ctx.fillStyle = discGrad;
      ctx.fill();

      // Musical note placeholder
      ctx.font = `${Math.round(innerR * 0.55)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillText('♪', cx, cy);
    }

    // ── Inner ring border ─────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 2, 0, TWO_PI);
    ctx.strokeStyle = `${baseColor.replace('rgb', 'rgba').replace(')', ', 0.3)')}`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [accentColor]);

  // Mount / resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    startTimeRef.current = Date.now();

    const loop = () => {
      if (document.visibilityState !== 'hidden') drawFrame();
      rafRef.current = requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(([entry]) => {
      canvas.width = entry.contentRect.width;
      canvas.height = entry.contentRect.height;
    });

    observer.observe(canvas.parentElement ?? canvas);
    canvas.width = canvas.parentElement?.offsetWidth ?? 300;
    canvas.height = canvas.parentElement?.offsetHeight ?? 300;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !rafRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [drawFrame]);

  return (
    <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" role="presentation" />
  );
}
