/**
 * @file GameResults.jsx
 * @description Win/draw/loss overlay shown at the end of a game.
 * Features a CSS confetti animation on win and rematch/lobby buttons.
 */

import React, { useEffect, useState } from 'react';
import { Trophy, Handshake, Frown, RotateCcw, LayoutGrid } from 'lucide-react';

/**
 * Full-screen overlay announcing the game result.
 *
 * @param {object} props
 * @param {'win'|'loss'|'draw'} props.result - Outcome for the current user.
 * @param {string} [props.winnerName] - Winner's display name.
 * @param {Function} props.onRematch - Called when "Play Again" is tapped.
 * @param {Function} props.onLobby - Called when "Back to Lobby" is tapped.
 */
export default function GameResults({ result, winnerName, onRematch, onLobby }) {
  const [showConfetti, setShowConfetti] = useState(result === 'win');

  useEffect(() => {
    if (result !== 'win') return;
    const t = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(t);
  }, [result]);

  const config = {
    win: {
      Icon: Trophy,
      iconClass: 'text-amber-400',
      bg: 'from-amber-500/20 to-yellow-500/10',
      border: 'border-amber-500/30',
      heading: '🎉 You Won!',
      sub: 'Outstanding move — your partner never saw it coming.',
    },
    draw: {
      Icon: Handshake,
      iconClass: 'text-blue-400',
      bg: 'from-blue-500/20 to-indigo-500/10',
      border: 'border-blue-500/30',
      heading: "🤝 It's a Draw!",
      sub: 'Two great minds, perfectly matched.',
    },
    loss: {
      Icon: Frown,
      iconClass: 'text-rose-400',
      bg: 'from-rose-500/20 to-pink-500/10',
      border: 'border-rose-500/30',
      heading: `${winnerName || 'Partner'} Won!`,
      sub: 'Almost! Challenge them to a rematch.',
    },
  }[result] || {};

  const { Icon, iconClass, bg, border, heading, sub } = config;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-in fade-in duration-300 p-6">
      {/* CSS confetti burst on win */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-2 rounded-sm animate-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 10}%`,
                background: ['#ec4899', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'][i % 5],
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div
        className={`w-full max-w-xs bg-gradient-to-br ${bg} border ${border} rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl`}
      >
        <div className={`p-5 rounded-full bg-surface/60 ${iconClass}`}>
          <Icon className="w-10 h-10" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-text-main">{heading}</h2>
          <p className="text-sm text-text-muted leading-relaxed">{sub}</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onRematch}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button
            onClick={onLobby}
            className="w-full py-3 bg-surface border border-surface-border text-text-main font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-surface/80 transition-all active:scale-95"
          >
            <LayoutGrid className="w-4 h-4" />
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
