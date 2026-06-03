/**
 * @file ConfettiCanvas.jsx
 * @description Full-screen confetti particle animation rendered on a canvas element.
 * Automatically stops after 4 seconds.
 */

import React, { useEffect, useRef } from 'react';

/**
 * Renders a full-screen confetti particle animation on an HTML canvas.
 * When `active` becomes true the animation starts; it stops automatically
 * after 4 seconds and calls `onComplete` so the parent can clear the flag.
 *
 * @param {{ active: boolean, onComplete: () => void }} props
 * @returns {React.ReactElement | null} A fixed-position canvas, or null when inactive.
 */
export default function ConfettiCanvas({ active, onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ec4899', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
    const particles = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
    }));

    let animationFrameId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 5;

        if (p.y < canvas.height) {
          active = true;
        } else {
          // Recycle
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (active) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    const stopTimer = setTimeout(() => {
      onComplete();
      cancelAnimationFrame(animationFrameId);
    }, 4000);

    return () => {
      clearTimeout(stopTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100] w-full h-full"
    />
  );
}
