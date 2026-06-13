/**
 * @file TicTacToe.jsx
 * @description Tic-Tac-Toe game component. Classic 3×3 grid with real-time
 * move sync via Supabase broadcast and move recording for replay.
 */

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import GameResults from '../../components/GameResults';
import { useGameSync } from '../../hooks/useGameSync';
import { useTicTacToeLogic } from './useGameLogic';
import { GameRecorder } from '../../lib/gameRecorder';
import { generateSessionId } from '../../lib/gameEngine';
import ForfeitModal from '../../components/ForfeitModal';
import QuickReactionTray from '../../components/QuickReactionTray';

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
 * @param {boolean} props.isHost - Whether the local user initiated the game. The host always plays X.
 */
export default function TicTacToe({ gameId, gameName, userId, partnerId, user, partner, onBack, isHost }) {
  // Host (game initiator) always plays X — NOT alphabetical order.
  const mySymbol = isHost ? 'X' : 'O';
  const sessionId = useMemo(
    () => generateSessionId(gameId, userId, partnerId),
    [gameId, userId, partnerId]
  );
  const recorder = useRef(new GameRecorder(gameId, userId, partnerId));

  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [activeUserBubble, setActiveUserBubble] = useState('');
  const [activePartnerBubble, setActivePartnerBubble] = useState('');
  const [userEmojis, setUserEmojis] = useState([]);
  const [partnerEmojis, setPartnerEmojis] = useState([]);
  const [endReason, setEndReason] = useState('completion');
  const [rematchStatus, setRematchStatus] = useState('none');

  const {
    board,
    isMyTurn,
    winner,
    winnerId,
    mySymbol: sym,
    partnerSymbol,
    handleCellTap,
    applyRemoteMove,
    reset,
    forceWinner,
  } = useTicTacToeLogic({ userId, partnerId, mySymbol });

  // Use a ref so we only call useGameSync once but always have the latest callbacks
  const handlersRef = useRef({
    applyRemoteMove,
    reset,
    recorder,
    partnerId,
    gameId,
    userId,
    forceWinner,
    sym,
    setUserEmojis,
    setPartnerEmojis,
    setActivePartnerBubble,
    setEndReason,
    setRematchStatus,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    handlersRef.current = {
      applyRemoteMove,
      reset,
      recorder,
      partnerId,
      gameId,
      userId,
      forceWinner,
      sym,
      setUserEmojis,
      setPartnerEmojis,
      setActivePartnerBubble,
      setEndReason,
      setRematchStatus,
    };
  });

  const handleRemoteMove = useCallback((payload) => {
    const {
      applyRemoteMove,
      reset,
      recorder,
      partnerId,
      gameId,
      userId,
      forceWinner,
      sym,
      setPartnerEmojis,
      setActivePartnerBubble,
      setEndReason,
      setRematchStatus,
    } = handlersRef.current;
    if (payload.type === 'move') {
      applyRemoteMove(payload);
      recorder.current.recordMove(partnerId, 'place', { index: payload.index });
    } else if (payload.type === 'rematch_request') {
      setRematchStatus('receiving');
    } else if (payload.type === 'rematch_accept') {
      reset();
      setRematchStatus('none');
      setEndReason('completion');
      recorder.current = new GameRecorder(gameId, userId, partnerId);
    } else if (payload.type === 'rematch_decline') {
      setRematchStatus('none');
    } else if (payload.type === 'forfeit') {
      forceWinner(sym);
      setEndReason('forfeit');
      recorder.current.recordMove(partnerId, 'forfeit', {});
    } else if (payload.type === 'reaction') {
      const reactionsEnabled =
        localStorage.getItem('preferences_game_reactions_enabled') !== 'false';
      if (!reactionsEnabled) return;
      const burst = payload.burst || [
        { xOffset: Math.floor(Math.random() * 60) - 30, delay: 0, duration: 3.2, scale: 1 },
      ];
      burst.forEach((item) => {
        const id = Date.now() + Math.random();
        setPartnerEmojis((prev) => [
          ...prev,
          {
            id,
            emoji: payload.emoji,
            xOffset: item.xOffset,
            delay: item.delay,
            duration: item.duration,
            scale: item.scale,
          },
        ]);
        setTimeout(() => {
          setPartnerEmojis((prev) => prev.filter((e) => e.id !== id));
        }, 4500);
      });
    } else if (payload.type === 'chat') {
      const reactionsEnabled =
        localStorage.getItem('preferences_game_reactions_enabled') !== 'false';
      if (!reactionsEnabled) return;
      setActivePartnerBubble(payload.text);
      setTimeout(() => {
        setActivePartnerBubble('');
      }, 4000);
    }
  }, []); // stable — reads from ref

  const broadcastMove = useGameSync(gameId, sessionId, handleRemoteMove);

  // Save replay when game ends (only host saves to prevent duplicates)
  useEffect(() => {
    if (!winner || !isHost) return;
    recorder.current.save(winnerId).catch(console.error);
  }, [winner, winnerId, isHost]);

  // Listen for partner decline to exit game immediately without forfeit modal
  useEffect(() => {
    const handleDecline = () => {
      onBack();
    };
    window.addEventListener('game-invite-declined', handleDecline);
    return () => window.removeEventListener('game-invite-declined', handleDecline);
  }, [onBack]);

  const onCellTap = (index) => {
    const move = handleCellTap(index);
    if (!move) return;
    recorder.current.recordMove(userId, 'place', { index });
    broadcastMove({ type: 'move', ...move });
  };

  const handleRequestRematch = () => {
    setRematchStatus('sending');
    broadcastMove({ type: 'rematch_request' });
  };

  const handleAcceptRematch = () => {
    reset();
    setRematchStatus('none');
    setEndReason('completion');
    recorder.current = new GameRecorder(gameId, userId, partnerId);
    broadcastMove({ type: 'rematch_accept' });
  };

  const handleDeclineRematch = () => {
    setRematchStatus('none');
    broadcastMove({ type: 'rematch_decline' });
  };

  const handleBackAction = () => {
    if (rematchStatus === 'sending' || rematchStatus === 'receiving') {
      broadcastMove({ type: 'rematch_decline' });
    }
    if (!winner) {
      setShowForfeitModal(true);
    } else {
      onBack();
    }
  };

  const handleForfeitConfirm = async () => {
    setShowForfeitModal(false);
    recorder.current.recordMove(userId, 'forfeit', {});
    broadcastMove({ type: 'forfeit', senderId: userId });

    // If we are host, write replay to DB before exiting
    if (isHost) {
      await recorder.current.save(partnerId).catch(console.error);
    }

    onBack();
  };

  const handleSendReaction = (emoji) => {
    const reactionsEnabled = localStorage.getItem('preferences_game_reactions_enabled') !== 'false';
    if (!reactionsEnabled) return;

    // Spawn a burst of 3-4 emojis
    const count = 3 + Math.floor(Math.random() * 2);
    const newEmojis = [];
    for (let i = 0; i < count; i++) {
      const id = Date.now() + Math.random();
      const xOffset = Math.floor(Math.random() * 60) - 30;
      const delay = Math.random() * 0.4;
      const duration = 2.8 + Math.random() * 0.8;
      const scale = 0.8 + Math.random() * 0.5;
      newEmojis.push({ id, emoji, xOffset, delay, duration, scale });

      setTimeout(() => {
        setUserEmojis((prev) => prev.filter((item) => item.id !== id));
      }, 4500);
    }
    setUserEmojis((prev) => [...prev, ...newEmojis]);
    broadcastMove({
      type: 'reaction',
      emoji,
      burst: newEmojis.map((e) => ({
        xOffset: e.xOffset,
        delay: e.delay,
        duration: e.duration,
        scale: e.scale,
      })),
    });
  };

  const handleSendChat = (text) => {
    const reactionsEnabled = localStorage.getItem('preferences_game_reactions_enabled') !== 'false';
    if (!reactionsEnabled) return;
    setActiveUserBubble(text);
    setTimeout(() => {
      setActiveUserBubble('');
    }, 4000);
    broadcastMove({ type: 'chat', text });
  };

  const result =
    winner === sym ? 'win' : winner === partnerSymbol ? 'loss' : winner === 'draw' ? 'draw' : null;

  const cellBase =
    'aspect-square flex items-center justify-center text-4xl font-extrabold rounded-2xl border-2 transition-all duration-150 select-none cursor-pointer active:scale-90';

  return (
    <div className="flex flex-col h-full relative">
      <GameHeader
        gameName={gameName}
        user={user}
        partner={partner}
        isMyTurn={isMyTurn && !winner}
        onBack={handleBackAction}
        activeUserBubble={activeUserBubble}
        activePartnerBubble={activePartnerBubble}
        userEmojis={userEmojis}
        partnerEmojis={partnerEmojis}
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
          endReason={endReason}
          rematchStatus={rematchStatus}
          onRequestRematch={handleRequestRematch}
          onAcceptRematch={handleAcceptRematch}
          onDeclineRematch={handleDeclineRematch}
          onLobby={handleBackAction}
        />
      )}
      {/* Floating Emojis (float up from bottom) */}
      <div className="absolute bottom-20 left-6 pointer-events-none w-16 h-48 overflow-visible flex items-end justify-center z-50">
        {userEmojis.map((item) => (
          <span
            key={item.id}
            style={{
              left: `${item.xOffset}%`,
              animationDelay: `${item.delay || 0}s`,
              animationDuration: `${item.duration || 3.2}s`,
            }}
            className="absolute text-xl animate-float-up pointer-events-none"
          >
            <span className="animate-float-sway inline-block">
              <span style={{ transform: `scale(${item.scale || 1})`, display: 'inline-block' }}>
                {item.emoji}
              </span>
            </span>
          </span>
        ))}
      </div>

      <div className="absolute bottom-20 right-6 pointer-events-none w-16 h-48 overflow-visible flex items-end justify-center z-50">
        {partnerEmojis.map((item) => (
          <span
            key={item.id}
            style={{
              left: `${item.xOffset}%`,
              animationDelay: `${item.delay || 0}s`,
              animationDuration: `${item.duration || 3.2}s`,
            }}
            className="absolute text-xl animate-float-up pointer-events-none"
          >
            <span className="animate-float-sway inline-block">
              <span style={{ transform: `scale(${item.scale || 1})`, display: 'inline-block' }}>
                {item.emoji}
              </span>
            </span>
          </span>
        ))}
      </div>

      <QuickReactionTray onSendReaction={handleSendReaction} onSendChat={handleSendChat} />
      <ForfeitModal
        isOpen={showForfeitModal}
        onClose={() => setShowForfeitModal(false)}
        onConfirm={handleForfeitConfirm}
      />
    </div>
  );
}
