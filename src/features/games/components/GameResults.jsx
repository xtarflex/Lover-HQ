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
 * @param {'completion'|'timeout'|'forfeit'|'correct_guess'} [props.endReason] - How the game ended.
 * @param {'none'|'sending'|'receiving'} props.rematchStatus - Rematch request status.
 * @param {Function} props.onRequestRematch - Request a rematch.
 * @param {Function} props.onAcceptRematch - Accept a rematch request.
 * @param {Function} props.onDeclineRematch - Decline a rematch request.
 * @param {Function} props.onLobby - Called when "Back to Lobby" is tapped.
 */
export default function GameResults({
  result,
  winnerName,
  endReason = 'completion',
  rematchStatus = 'none',
  onRequestRematch,
  onAcceptRematch,
  onDeclineRematch,
  onLobby,
}) {
  const [showConfetti, setShowConfetti] = useState(result === 'win');
  const [confettiParticles, setConfettiParticles] = useState([]);

  useEffect(() => {
    if (result !== 'win') return;

    // Generate random values asynchronously outside the render loop
    const frameId = requestAnimationFrame(() => {
      setConfettiParticles(
        Array.from({ length: 30 }).map((_, i) => ({
          left: Math.random() * 100,
          top: Math.random() * 10,
          color: ['#ec4899', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'][i % 5],
          delay: Math.random() * 1.5,
          duration: 1.5 + Math.random() * 2,
          rotate: Math.random() * 360,
        }))
      );
    });

    const t = setTimeout(() => setShowConfetti(false), 3500);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(t);
    };
  }, [result]);

  const config =
    {
      win: {
        Icon: Trophy,
        iconClass: 'text-amber-400',
        bg: 'from-amber-500/20 to-yellow-500/10',
        border: 'border-amber-500/30',
        heading: '🎉 You Won!',
      },
      draw: {
        Icon: Handshake,
        iconClass: 'text-blue-400',
        bg: 'from-blue-500/20 to-indigo-500/10',
        border: 'border-blue-500/30',
        heading: "🤝 It's a Draw!",
      },
      loss: {
        Icon: Frown,
        iconClass: 'text-rose-400',
        bg: 'from-rose-500/20 to-pink-500/10',
        border: 'border-rose-500/30',
        heading: `${winnerName || 'Partner'} Won!`,
      },
    }[result] || {};

  const { Icon, iconClass, bg, border, heading } = config;

  const getSubtext = () => {
    const partner = winnerName || 'partner';
    if (result === 'win') {
      switch (endReason) {
        case 'forfeit':
          return 'Won because your partner forfeited the game.';
        case 'timeout':
          return 'Won because your partner ran out of time.';
        case 'correct_guess':
          return 'Won by guessing the correct word!';
        case 'completion':
        default:
          return 'Won by completing the game requirements.';
      }
    } else if (result === 'loss') {
      switch (endReason) {
        case 'forfeit':
          return `${partner} won because you forfeited the game.`;
        case 'timeout':
          return `Lost because you ran out of time.`;
        case 'correct_guess':
          return `${partner} won by guessing the correct word!`;
        case 'completion':
        default:
          return `${partner} won by completing the game requirements.`;
      }
    } else if (result === 'draw') {
      switch (endReason) {
        case 'timeout':
          return 'Draw because time expired before the correct guess.';
        case 'completion':
        default:
          return 'Draw by board completion — no moves left.';
      }
    }
    return '';
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-in fade-in duration-300 p-6">
      {/* CSS confetti burst on win */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {confettiParticles.map((p, i) => (
            <span
              key={i}
              className="absolute w-2 h-2 rounded-sm animate-confetti-fall"
              style={{
                left: `${p.left}%`,
                top: `-${p.top}%`,
                background: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                transform: `rotate(${p.rotate}deg)`,
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
          <p className="text-sm text-text-muted leading-relaxed">{getSubtext()}</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {rematchStatus === 'none' && (
            <button
              onClick={onRequestRematch}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          )}

          {rematchStatus === 'sending' && (
            <button
              disabled
              className="w-full py-3 bg-primary/40 text-white/60 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-not-allowed"
            >
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Waiting for partner...
            </button>
          )}

          {rematchStatus === 'receiving' && (
            <div className="flex flex-col gap-2 w-full">
              <p className="text-xs font-bold text-center text-green-400 animate-pulse">
                Rematch requested!
              </p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={onAcceptRematch}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                >
                  Accept
                </button>
                <button
                  onClick={onDeclineRematch}
                  className="flex-1 py-3 bg-surface border border-surface-border text-rose-500 hover:bg-rose-500/10 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

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
