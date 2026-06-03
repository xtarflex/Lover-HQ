/**
 * @file QuickDraw.jsx
 * @description Quick Draw game component. The drawer uses a canvas to sketch a word;
 * the guesser has 60 seconds to identify it via a text input.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eraser, Pen } from 'lucide-react';
import GameHeader from '../../components/GameHeader';
import GameResults from '../../components/GameResults';
import { useGameSync } from '../../hooks/useGameSync';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useQuickDrawLogic } from './useGameLogic';
import { GameRecorder } from '../../lib/gameRecorder';
import { generateSessionId } from '../../lib/gameEngine';

const ROUND_SECONDS = 60;

/**
 * @param {object} props
 * @param {string} props.gameId
 * @param {string} props.gameName
 * @param {string} props.userId
 * @param {string} props.partnerId
 * @param {object} props.user
 * @param {object} props.partner
 * @param {Function} props.onBack
 */
export default function QuickDraw({ gameId, gameName, userId, partnerId, user, partner, onBack }) {
  // Alphabetically first user draws first
  const iAmDrawer = userId < partnerId;
  const sessionId = useRef(generateSessionId(gameId, userId)).current;
  const recorder = useRef(new GameRecorder(gameId, userId, partnerId));
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [guessInput, setGuessInput] = useState('');
  const [guessResult, setGuessResult] = useState(null); // 'correct' | 'wrong'

  const {
    targetWord, guesses, gameOver, winner, winnerId,
    submitGuess, handleTimeout,
  } = useQuickDrawLogic({ userId, partnerId, iAmDrawer });

  const { seconds } = useGameTimer(ROUND_SECONDS, handleTimeout, true);

  // Save replay on end
  useEffect(() => {
    if (!gameOver) return;
    recorder.current.save(winnerId).catch(console.error);
  }, [gameOver, winnerId]);

  // Canvas drawing helpers
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e) => {
    if (!iAmDrawer || gameOver) return;
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e, canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!drawing.current || !iAmDrawer) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Broadcast stroke as normalised coordinates for the guesser
    broadcastMove({
      type: 'stroke',
      x: pos.x / canvas.width,
      y: pos.y / canvas.height,
    });
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (iAmDrawer) broadcastMove({ type: 'stroke_end' });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    broadcastMove({ type: 'clear' });
  };

  // Remote events
  const handleRemoteMove = useCallback(
    (payload) => {
      if (payload.type === 'stroke' && !iAmDrawer) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const x = payload.x * canvas.width;
        const y = payload.y * canvas.height;
        if (!drawing.current) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          drawing.current = true;
        }
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      } else if (payload.type === 'stroke_end') {
        drawing.current = false;
      } else if (payload.type === 'clear') {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (payload.type === 'guess') {
        submitGuess(payload.text, partnerId);
        recorder.current.recordMove(partnerId, 'guess', { text: payload.text });
      }
    },
    [iAmDrawer, submitGuess, partnerId]
  );

  const broadcastMove = useGameSync(gameId, sessionId, handleRemoteMove);

  const handleGuessSubmit = (e) => {
    e?.preventDefault();
    if (!guessInput.trim() || gameOver) return;
    const { correct } = submitGuess(guessInput.trim(), userId);
    recorder.current.recordMove(userId, 'guess', { text: guessInput.trim() });
    broadcastMove({ type: 'guess', text: guessInput.trim() });
    setGuessResult(correct ? 'correct' : 'wrong');
    setGuessInput('');
    if (!correct) setTimeout(() => setGuessResult(null), 800);
  };

  const result = gameOver
    ? winner === userId
      ? 'win'
      : winner === partnerId
      ? 'loss'
      : 'draw'
    : null;

  return (
    <div className="flex flex-col h-full relative">
      <GameHeader
        gameName={gameName}
        user={user}
        partner={partner}
        isMyTurn={!iAmDrawer && !gameOver}
        timeLeft={gameOver ? undefined : seconds}
        onBack={onBack}
      />

      <div className="flex-1 flex flex-col items-center p-4 gap-4 overflow-hidden">
        {/* Word display for drawer */}
        {iAmDrawer && (
          <div className="text-center space-y-0.5">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Draw this word</p>
            <p className="text-3xl font-extrabold text-primary">{targetWord}</p>
          </div>
        )}
        {!iAmDrawer && (
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest text-center">
            What is {partner?.name || 'partner'} drawing?
          </p>
        )}

        {/* Canvas */}
        <div className="relative w-full max-w-[380px] aspect-square">
          <canvas
            ref={canvasRef}
            width={380}
            height={380}
            className="w-full h-full rounded-3xl bg-surface/50 border-2 border-surface-border touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
            aria-label={iAmDrawer ? `Drawing canvas for ${targetWord}` : 'Opponent drawing canvas'}
          />
          {iAmDrawer && (
            <button
              onClick={clearCanvas}
              className="absolute bottom-3 right-3 p-2 bg-surface/80 backdrop-blur border border-surface-border rounded-xl text-text-muted hover:text-rose-400 hover:border-rose-500/30 transition-all"
              aria-label="Clear canvas"
            >
              <Eraser className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Guess input (guesser only) */}
        {!iAmDrawer && !gameOver && (
          <form onSubmit={handleGuessSubmit} className="flex gap-2 w-full max-w-[380px]">
            <input
              id="quick-draw-guess"
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder="Type your guess…"
              className={`flex-1 px-4 py-3 bg-surface/50 border rounded-2xl text-sm text-text-main placeholder-text-muted/50 focus:outline-none transition-colors ${
                guessResult === 'correct'
                  ? 'border-green-500 bg-green-500/10'
                  : guessResult === 'wrong'
                  ? 'border-rose-500 bg-rose-500/10 animate-shake'
                  : 'border-surface-border focus:border-primary'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl flex items-center gap-1 transition-all active:scale-95"
            >
              <Pen className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Recent guesses */}
        {guesses.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center max-w-[380px]">
            {guesses.slice(-6).map((g, i) => (
              <span
                key={i}
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  g.correct
                    ? 'bg-green-500/15 text-green-400 border-green-500/30'
                    : 'bg-surface border-surface-border text-text-muted line-through'
                }`}
              >
                {g.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {result && (
        <GameResults
          result={result}
          winnerName={partner?.name}
          onRematch={onBack}
          onLobby={onBack}
        />
      )}
    </div>
  );
}
