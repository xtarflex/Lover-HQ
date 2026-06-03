/**
 * @file TicTacToe.jsx
 * @description Tic-Tac-Toe game component. Classic 3×3 grid with real-time
 * move sync via Supabase broadcast and move recording for replay.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import GameHeader from '../../components/GameHeader';
import GameResults from '../../components/GameResults';
import { useGameSync } from '../../hooks/useGameSync';
import { useTicTacToeLogic } from './useGameLogic';
import { GameRecorder } from '../../lib/gameRecorder';
import { generateSessionId } from '../../lib/gameEngine';

/**
 * @param {object} props
 * @param {string} props.gameId
 * @param {string} props.gameName
 * @param {string} props.userId
 * @param {string} props.partnerId
 * @param {object} props.user
 * @param {object} props.partner
 * @param {boolean} props.partnerOnline
 * @param {Function} props.onBack
 */
export default function TicTacToe({ gameId, gameName, userId, partnerId, user, partner, onBack }) {
  // Host (alphabetically first user ID) always plays X
  const mySymbol = userId < partnerId ? 'X' : 'O';
  const sessionId = useRef(generateSessionId(gameId, userId)).current;
  const recorder = useRef(new GameRecorder(gameId, userId, partnerId));

  const {
    board, isMyTurn, winner, winnerId, mySymbol: sym, partnerSymbol,
    handleCellTap, applyRemoteMove, reset,
  } = useTicTacToeLogic({ userId, partnerId, mySymbol });

  // Use a ref so we only call useGameSync once but always have the latest callbacks
  const handlersRef = useRef({ applyRemoteMove, reset, recorder, partnerId, gameId, userId });
  useEffect(() => {
    handlersRef.current = { applyRemoteMove, reset, recorder, partnerId, gameId, userId };
  });

  const handleRemoteMove = useCallback((payload) => {
    const { applyRemoteMove, reset, recorder, partnerId, gameId, userId } = handlersRef.current;
    if (payload.type === 'move') {
      applyRemoteMove(payload);
      recorder.current.recordMove(partnerId, 'place', { index: payload.index });
    } else if (payload.type === 'rematch') {
      reset();
      recorder.current = new GameRecorder(gameId, userId, partnerId);
    }
  }, []); // stable — reads from ref

  const broadcastMove = useGameSync(gameId, sessionId, handleRemoteMove);

  // Save replay when game ends
  useEffect(() => {
    if (!winner) return;
    recorder.current.save(winnerId).catch(console.error);
  }, [winner, winnerId]);

  const onCellTap = (index) => {
    const move = handleCellTap(index);
    if (!move) return;
    recorder.current.recordMove(userId, 'place', { index });
    broadcastMove({ type: 'move', ...move });
  };

  const handleRematch = () => {
    reset();
    recorder.current = new GameRecorder(gameId, userId, partnerId);
    broadcastMove({ type: 'rematch' });
  };



  const result =
    winner === sym
      ? 'win'
      : winner === partnerSymbol
      ? 'loss'
      : winner === 'draw'
      ? 'draw'
      : null;

  const cellBase =
    'aspect-square flex items-center justify-center text-4xl font-extrabold rounded-2xl border-2 transition-all duration-150 select-none cursor-pointer active:scale-90';

  return (
    <div className="flex flex-col h-full relative">
      <GameHeader
        gameName={gameName}
        user={user}
        partner={partner}
        isMyTurn={isMyTurn && !winner}
        onBack={onBack}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Instructions */}
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
          {winner
            ? winner === 'draw'
              ? "It's a draw!"
              : `${winner === sym ? 'You' : partner?.name || 'Partner'} win${winner === sym ? '!' : 's!'}`
            : isMyTurn
            ? `Your turn — tap a cell  (${sym})`
            : `Waiting for ${partner?.name || 'partner'}… (${partnerSymbol})`}
        </p>

        {/* Board */}
        <div
          className="grid grid-cols-3 gap-3 w-full max-w-[320px]"
          role="grid"
          aria-label="Tic-Tac-Toe board"
        >
          {board.map((cell, i) => (
            <button
              key={i}
              id={`ttt-cell-${i}`}
              onClick={() => onCellTap(i)}
              disabled={!!cell || !isMyTurn || !!winner}
              aria-label={`Cell ${i + 1}: ${cell || 'empty'}`}
              className={`${cellBase} ${
                cell === 'X'
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : cell === 'O'
                  ? 'border-secondary/40 bg-secondary/10 text-secondary'
                  : 'border-surface-border bg-surface/50 hover:border-primary/40 hover:bg-primary/5 disabled:hover:border-surface-border disabled:cursor-not-allowed'
              }`}
            >
              {cell}
            </button>
          ))}
        </div>

        {/* Symbol legend */}
        <div className="flex gap-6 text-xs text-text-muted">
          <span>
            <b className="text-primary">{sym}</b> — You
          </span>
          <span>
            <b className="text-secondary">{partnerSymbol}</b> — {partner?.name || 'Partner'}
          </span>
        </div>
      </div>

      {result && (
        <GameResults
          result={result}
          winnerName={partner?.name}
          onRematch={handleRematch}
          onLobby={onBack}
        />
      )}
    </div>
  );
}
