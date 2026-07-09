/**
 * @file ThreeMensMorris.jsx
 * @description Three Men's Morris game component. Features a 3x3 connection board,
 * two phases (placement and movement), real-time move sync, and emoji reactions.
 */

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import GameResults from '../../components/GameResults';
import { useGameSync } from '../../hooks/useGameSync';
import { useThreeMensMorrisLogic } from './hooks/useGameLogic';
import { GameRecorder } from '../../lib/gameRecorder';
import { generateSessionId } from '../../lib/gameEngine';
import ForfeitModal from '../../components/ForfeitModal';
import QuickReactionTray from '../../components/QuickReactionTray';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import { isValidMove } from './utils/rules';
import './threeMensMorris.css';

/**
 * 3D-like absolute coordinates on a 300x300 viewBox grid for the 9 nodes.
 * @type {Array<{x: number, y: number}>}
 */
const NODE_COORDINATES = [
  { x: 30, y: 30 }, // 0: Top-Left
  { x: 150, y: 30 }, // 1: Top-Center
  { x: 270, y: 30 }, // 2: Top-Right
  { x: 30, y: 150 }, // 3: Middle-Left
  { x: 150, y: 150 }, // 4: Center
  { x: 270, y: 150 }, // 5: Middle-Right
  { x: 30, y: 270 }, // 6: Bottom-Left
  { x: 150, y: 270 }, // 7: Bottom-Center
  { x: 270, y: 270 }, // 8: Bottom-Right
];

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
 * @param {boolean} props.isHost - The host always plays 'player1' (Gold).
 */
export default function ThreeMensMorris({
  gameId,
  gameName,
  userId,
  partnerId,
  user,
  partner,
  partnerOnline,
  onBack,
  isHost,
}) {
  const myPlayerKey = isHost ? 'player1' : 'player2';

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
    phase,
    selectedPieceIndex,
    winner,
    isMyTurn,
    handleNodeClick,
    applyRemoteMove,
    reset,
    forceWinner,
  } = useThreeMensMorrisLogic({ myPlayerKey });

  // Hold refs of up-to-date state callbacks to ensure stable useGameSync subscription
  const handlersRef = useRef({
    applyRemoteMove,
    reset,
    recorder,
    partnerId,
    gameId,
    userId,
    forceWinner,
    myPlayerKey,
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
      myPlayerKey,
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
      myPlayerKey,
      setPartnerEmojis,
      setActivePartnerBubble,
      setEndReason,
      setRematchStatus,
    } = handlersRef.current;

    if (payload.type === 'move') {
      applyRemoteMove(payload.move);
      if (payload.move.type === 'place') {
        recorder.current.recordMove(partnerId, 'place', { index: payload.move.index });
      } else {
        recorder.current.recordMove(partnerId, 'move', {
          from: payload.move.from,
          to: payload.move.to,
        });
      }
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
      forceWinner(myPlayerKey);
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
  }, []);

  const broadcastMove = useGameSync(gameId, sessionId, handleRemoteMove);

  // Auto-save replay when game completes (only host saves to prevent duplicate DB writes)
  useEffect(() => {
    if (!winner || !isHost) return;
    const winnerId = winner === myPlayerKey ? userId : partnerId;
    recorder.current.save(winnerId).catch(console.error);
  }, [winner, myPlayerKey, userId, partnerId, isHost]);

  // Handle invitation declines
  useEffect(() => {
    const handleDecline = () => {
      onBack();
    };
    window.addEventListener('game-invite-declined', handleDecline);
    return () => window.removeEventListener('game-invite-declined', handleDecline);
  }, [onBack]);

  const onNodeClick = (index) => {
    const move = handleNodeClick(index);
    if (!move) return;

    if (move.type === 'place') {
      recorder.current.recordMove(userId, 'place', { index });
    } else if (move.type === 'move') {
      recorder.current.recordMove(userId, 'move', { from: move.from, to: move.to });
    }

    broadcastMove({ type: 'move', move });
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
    if (!winner && partnerOnline) {
      setShowForfeitModal(true);
    } else {
      onBack();
    }
  };

  const handleForfeitConfirm = async () => {
    setShowForfeitModal(false);
    recorder.current.recordMove(userId, 'forfeit', {});
    broadcastMove({ type: 'forfeit', senderId: userId });

    if (isHost) {
      await recorder.current.save(partnerId).catch(console.error);
    }
    onBack();
  };

  const handleSendReaction = (emoji) => {
    const reactionsEnabled = localStorage.getItem('preferences_game_reactions_enabled') !== 'false';
    if (!reactionsEnabled) return;

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

  const gameResult = useMemo(() => {
    if (!winner) return null;
    return winner === myPlayerKey ? 'win' : 'loss';
  }, [winner, myPlayerKey]);

  // Compute helper highlights for the UI
  const nodeStatus = useMemo(() => {
    return NODE_COORDINATES.map((_, i) => {
      const isOccupied = !!board[i];
      const isMine = board[i] === myPlayerKey;

      let isValidTarget = false;
      if (isMyTurn && !winner) {
        if (phase === 'placement') {
          isValidTarget = !isOccupied;
        } else if (phase === 'movement' && selectedPieceIndex !== null) {
          isValidTarget = isValidMove(board, selectedPieceIndex, i, myPlayerKey);
        }
      }

      return {
        isOccupied,
        isMine,
        isValidTarget,
      };
    });
  }, [board, phase, selectedPieceIndex, isMyTurn, myPlayerKey, winner]);

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

      {!winner && !partnerOnline ? (
        <div className="flex-grow flex flex-col items-center justify-center gap-3 text-center py-16">
          <LoadingSpinner size="md" />
          <h3 className="font-heading text-lg font-bold">Waiting for partner…</h3>
          <p className="text-xs text-text-muted max-w-xs leading-relaxed">
            We&apos;re waiting for {partner?.name || 'your partner'} to accept the game invite.
          </p>
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center p-6 gap-6">
          {/* Status Instruction Text */}
          <div
            className={`morris-status-banner ${
              isMyTurn && !winner ? 'my-turn animate-pulse' : 'partner-turn'
            }`}
          >
            {winner
              ? `${winner === myPlayerKey ? 'You' : partner?.name || 'Partner'} Won the Game!`
              : isMyTurn
                ? phase === 'placement'
                  ? 'Your Turn: Place a piece'
                  : selectedPieceIndex === null
                    ? 'Your Turn: Select a piece to move'
                    : 'Your Turn: Tap adjacent spot to move'
                : `Waiting for ${partner?.name || 'partner'} to play…`}
          </div>

          {/* Interactive SVG Board */}
          <div className="morris-board-wrapper w-full max-w-[320px]">
            <svg viewBox="0 0 300 300" className="morris-board-svg select-none">
              {/* Outer boundary lines */}
              <line x1="30" y1="30" x2="270" y2="30" className="morris-board-line" />
              <line x1="270" y1="30" x2="270" y2="270" className="morris-board-line" />
              <line x1="270" y1="270" x2="30" y2="270" className="morris-board-line" />
              <line x1="30" y1="270" x2="30" y2="30" className="morris-board-line" />

              {/* Horizontal & Vertical center lines */}
              <line x1="30" y1="150" x2="270" y2="150" className="morris-board-line" />
              <line x1="150" y1="30" x2="150" y2="270" className="morris-board-line" />

              {/* Diagonal lines */}
              <line x1="30" y1="30" x2="270" y2="270" className="morris-board-line" />
              <line x1="270" y1="30" x2="30" y2="270" className="morris-board-line" />

              {/* Render Nodes / Intersections */}
              {NODE_COORDINATES.map((coords, i) => {
                const status = nodeStatus[i];
                const isSelected = selectedPieceIndex === i;

                return (
                  <g key={i}>
                    {/* Node base marker (rendered underneath piece) */}
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r="6"
                      className={`morris-node-base ${status.isValidTarget ? 'valid-target' : ''}`}
                    />

                    {/* Active pieces */}
                    {status.isOccupied && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r="12"
                        className={`morris-piece ${board[i]} ${isSelected ? 'selected' : ''}`}
                      />
                    )}

                    {/* Interactive overlay area for easy click targets */}
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r="22"
                      fill="transparent"
                      className="morris-node-interactive"
                      onClick={() => onNodeClick(i)}
                      aria-label={`Node ${i + 1}`}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Player color legend */}
          <div className="flex gap-6 text-[11px] font-bold text-text-muted uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              {isHost ? 'You (Gold)' : `${partner?.name || 'Partner'} (Gold)`}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-error-bg" />
              {isHost ? `${partner?.name || 'Partner'} (Pink)` : 'You (Pink)'}
            </span>
          </div>
        </div>
      )}

      {gameResult && (
        <GameResults
          result={gameResult}
          winnerName={partner?.name}
          endReason={endReason}
          rematchStatus={rematchStatus}
          onRequestRematch={handleRequestRematch}
          onAcceptRematch={handleAcceptRematch}
          onDeclineRematch={handleDeclineRematch}
          onLobby={handleBackAction}
        />
      )}

      {/* Burst emoji containers */}
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

      {(winner || partnerOnline) && (
        <QuickReactionTray onSendReaction={handleSendReaction} onSendChat={handleSendChat} />
      )}
      <ForfeitModal
        isOpen={showForfeitModal}
        onClose={() => setShowForfeitModal(false)}
        onConfirm={handleForfeitConfirm}
      />
    </div>
  );
}
