/**
 * @file ThreeMensMorris.jsx
 * @description Three Men's Morris game component. Features a 3x3 connection board,
 * two phases (placement and movement), real-time move sync, and emoji reactions.
 */

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import GameHeader from '../../components/GameHeader';
import GameResults from '../../components/GameResults';
import { useGameSync } from '../../hooks/useGameSync';
import { useThreeMensMorrisLogic } from './hooks/useGameLogic';
import { GameRecorder } from '../../lib/gameRecorder';
import { generateSessionId } from '../../lib/gameEngine';
import ForfeitModal from '../../components/ForfeitModal';
import QuickReactionTray from '../../components/QuickReactionTray';
import { isValidMove } from './utils/rules';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import { supabase } from '../../../../lib/supabase';
import { triggerBuzz, triggerPush } from '../../../../utils/notification';
import './threeMensMorris.css';

/**
 * 3D-like absolute coordinates on a 300x300 viewBox grid for the 9 nodes.
 * @type {Array<{x: number, y: number}>}
 */
const NODE_COORDINATES = [
  { x: 60, y: 60 }, // 0: Top-Left
  { x: 150, y: 60 }, // 1: Top-Center
  { x: 240, y: 60 }, // 2: Top-Right
  { x: 60, y: 150 }, // 3: Middle-Left
  { x: 150, y: 150 }, // 4: Center
  { x: 240, y: 150 }, // 5: Middle-Right
  { x: 60, y: 240 }, // 6: Bottom-Left
  { x: 150, y: 240 }, // 7: Bottom-Center
  { x: 240, y: 240 }, // 8: Bottom-Right
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
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [badgeState, setBadgeState] = useState({ active: false, text: '', hasClose: false });

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
    currentTurn,
    syncState,
  } = useThreeMensMorrisLogic({ myPlayerKey });

  const [scores, setScores] = useState({ user: 0, partner: 0 });

  /**
   * Fetches the completed game history from Supabase and aggregates win counts.
   *
   * @returns {Promise<void>}
   */
  useEffect(() => {
    let active = true;
    const fetchScorecard = async () => {
      try {
        const { data, error } = await supabase
          .from('game_replays')
          .select('winner_id')
          .eq('game_type', gameId)
          .or(
            `and(player_a_id.eq.${userId},player_b_id.eq.${partnerId}),and(player_a_id.eq.${partnerId},player_b_id.eq.${userId})`
          );

        if (error) throw error;

        let userWins = 0;
        let partnerWins = 0;
        data?.forEach((replay) => {
          if (replay.winner_id === userId) {
            userWins++;
          } else if (replay.winner_id === partnerId) {
            partnerWins++;
          }
        });
        if (active) {
          setScores({ user: userWins, partner: partnerWins });
        }
      } catch (err) {
        console.error('Error fetching scorecard:', err);
      }
    };

    fetchScorecard();
    return () => {
      active = false;
    };
  }, [gameId, userId, partnerId, winner]);

  // Trigger haptic vibration and push notification when it becomes the user's turn
  useEffect(() => {
    if (isMyTurn && !winner) {
      triggerBuzz();
      triggerPush(
        "Three Men's Morris",
        `It's your turn! ${partner?.name || 'Your partner'} made a move.`
      );
    }
  }, [isMyTurn, winner, partner]);

  const [prevIsMyTurn, setPrevIsMyTurn] = useState(isMyTurn);
  if (isMyTurn !== prevIsMyTurn) {
    setPrevIsMyTurn(isMyTurn);
    if (isMyTurn) {
      setBannerDismissed(false);
    }
  }

  // stable mapping of pieces to nodes to support smooth sliding transitions
  const stablePieces = useMemo(() => {
    const goldPositions = [];
    const pinkPositions = [];

    board.forEach((val, idx) => {
      if (val === 'player1') {
        goldPositions.push(idx);
      } else if (val === 'player2') {
        pinkPositions.push(idx);
      }
    });

    const goldPieces = Array.from({ length: 3 }).map((_, j) => {
      const hasPiece = j < goldPositions.length;
      const nodeIdx = hasPiece ? goldPositions[j] : null;
      return {
        id: `gold-piece-${j}`,
        player: 'player1',
        nodeIdx,
        coords: nodeIdx !== null ? NODE_COORDINATES[nodeIdx] : { x: 35, y: 90 + j * 60 },
      };
    });

    const pinkPieces = Array.from({ length: 3 }).map((_, j) => {
      const hasPiece = j < pinkPositions.length;
      const nodeIdx = hasPiece ? pinkPositions[j] : null;
      return {
        id: `pink-piece-${j}`,
        player: 'player2',
        nodeIdx,
        coords: nodeIdx !== null ? NODE_COORDINATES[nodeIdx] : { x: 265, y: 90 + j * 60 },
      };
    });

    return [...goldPieces, ...pinkPieces];
  }, [board]);

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
    board,
    currentTurn,
    syncState,
    winner,
    broadcastMove: null,
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
    } else if (payload.type === 'sync_request') {
      const {
        board: latestBoard,
        currentTurn: latestTurn,
        winner: latestWinner,
        broadcastMove: sendSync,
      } = handlersRef.current;
      const isBoardEmpty = latestBoard.every((cell) => cell === null);
      if (!isBoardEmpty) {
        sendSync?.({
          type: 'sync_state',
          board: latestBoard,
          currentTurn: latestTurn,
          winner: latestWinner,
        });
      }
    } else if (payload.type === 'sync_state') {
      const { board: latestBoard, syncState: doSync } = handlersRef.current;
      const isRemoteEmpty = payload.board.every((cell) => cell === null);
      const isLocalEmpty = latestBoard.every((cell) => cell === null);
      if (!isRemoteEmpty || isLocalEmpty) {
        doSync(payload.board, payload.currentTurn, payload.winner);
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
      board,
      currentTurn,
      syncState,
      winner,
      broadcastMove,
    };
  });

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
  }; // Manage sliding turn badge animations on turn change
  useEffect(() => {
    const isMe = isMyTurn && !winner;
    const turnText = isMe ? 'YOUR TURN' : `${(partner?.name || 'PARTNER').toUpperCase()}'S TURN`;

    // 1. Slide out in next tick to avoid synchronous setState inside effect warning
    const slideOutTimer = setTimeout(() => {
      setBadgeState((prev) => ({ ...prev, active: false }));
    }, 0);

    // 2. Wait 350ms, change text, and slide in
    const slideInTimer = setTimeout(() => {
      if (!winner) {
        setBadgeState({
          active: !isMe || !bannerDismissed,
          text: turnText,
          hasClose: isMe,
        });
      }
    }, 350);

    return () => {
      clearTimeout(slideOutTimer);
      clearTimeout(slideInTimer);
    };
  }, [isMyTurn, winner, partner, bannerDismissed]);
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

  const isPlayer1Active =
    (isMyTurn && myPlayerKey === 'player1') || (!isMyTurn && myPlayerKey === 'player2');

  return (
    <div className="flex flex-col h-full relative">
      <GameHeader
        gameName={gameName}
        user={user}
        partner={partner}
        isMyTurn={isMyTurn && !winner}
        userScore={scores.user}
        partnerScore={scores.partner}
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
        <>
          {/* Sliding Turn Badge */}
          <div className="morris-turn-badge-container">
            <div
              className={`morris-turn-badge ${badgeState.active ? 'active' : ''} ${
                isPlayer1Active ? 'gold-theme' : 'pink-theme'
              }`}
            >
              {badgeState.hasClose && (
                <button onClick={() => setBannerDismissed(true)} className="custom-close-x">
                  &times;
                </button>
              )}
              <span className="morris-badge-text">{badgeState.text}</span>
            </div>
          </div>

          <div className="flex-grow flex flex-col items-center justify-center p-6 gap-6">
            {/* Interactive SVG Board */}
            <div className="morris-board-wrapper w-full max-w-[400px]">
              <svg viewBox="0 0 300 300" className="morris-board-svg select-none">
                {/* Board base card backing */}
                <rect
                  x="15"
                  y="15"
                  width="270"
                  height="270"
                  rx="30"
                  ry="30"
                  fill="rgba(15, 23, 42, 0.6)"
                  stroke="#1e293b"
                  strokeWidth="6"
                  style={{ pointerEvents: 'none' }}
                />
                {/* TRACK CHANNELS: Cross and diagonal tracks (Background layer) */}
                <g
                  stroke="#334155"
                  strokeWidth="66"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  style={{ pointerEvents: 'none' }}
                >
                  <line x1="150" y1="60" x2="150" y2="240" />
                  <line x1="60" y1="150" x2="240" y2="150" />
                  <line x1="60" y1="60" x2="240" y2="240" />
                  <line x1="60" y1="240" x2="240" y2="60" />
                </g>

                {/* TRACK CHANNELS: Cross and diagonal tracks (Inner groove layer) */}
                <g
                  stroke="#0f172a"
                  strokeWidth="54"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  style={{ pointerEvents: 'none' }}
                >
                  <line x1="150" y1="60" x2="150" y2="240" />
                  <line x1="60" y1="150" x2="240" y2="150" />
                  <line x1="60" y1="60" x2="240" y2="240" />
                  <line x1="60" y1="240" x2="240" y2="60" />
                </g>

                {/* Supply pockets on margins for unplaced pieces */}
                {Array.from({ length: 3 }).map((_, j) => (
                  <circle
                    key={`supply-pocket-gold-${j}`}
                    cx="35"
                    cy={90 + j * 60}
                    r="18"
                    fill="#0f172a"
                    stroke="#1e293b"
                    strokeWidth="2"
                    style={{ pointerEvents: 'none' }}
                  />
                ))}
                {Array.from({ length: 3 }).map((_, j) => (
                  <circle
                    key={`supply-pocket-pink-${j}`}
                    cx="265"
                    cy={90 + j * 60}
                    r="18"
                    fill="#0f172a"
                    stroke="#1e293b"
                    strokeWidth="2"
                    style={{ pointerEvents: 'none' }}
                  />
                ))}

                {/* Empty Node Sockets (always behind pieces) */}
                {NODE_COORDINATES.map((coords, i) => (
                  <circle
                    key={`socket-${i}`}
                    cx={coords.x}
                    cy={coords.y}
                    r="18"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="2"
                    style={{ pointerEvents: 'none' }}
                  />
                ))}

                {/* Glowing highlight valid targets circles */}
                {NODE_COORDINATES.map((coords, i) => {
                  const status = nodeStatus[i];
                  if (!status.isValidTarget) return null;
                  const themeColor = myPlayerKey === 'player1' ? '#f59e0b' : '#e11d48';
                  const glowColor =
                    myPlayerKey === 'player1'
                      ? 'rgba(245, 158, 11, 0.6)'
                      : 'rgba(225, 29, 72, 0.6)';
                  return (
                    <circle
                      key={`target-${i}`}
                      cx={coords.x}
                      cy={coords.y}
                      r="18"
                      fill="none"
                      stroke={themeColor}
                      strokeWidth="3"
                      className="animate-pulse"
                      style={{
                        filter: `drop-shadow(0 0 6px ${glowColor})`,
                        pointerEvents: 'none',
                      }}
                    />
                  );
                })}

                {/* Render Active Pieces (Stable IDs for smooth sliding transitions using Framer Motion) */}
                {stablePieces.map((piece) => {
                  const isSelected = selectedPieceIndex === piece.nodeIdx;

                  return (
                    <motion.circle
                      key={piece.id}
                      animate={{
                        cx: piece.coords.x,
                        cy: piece.coords.y,
                        opacity: 1,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 150,
                        damping: 18,
                      }}
                      r="15"
                      className={`morris-piece ${piece.player} ${isSelected ? 'selected' : ''}`}
                      style={{
                        pointerEvents: 'none',
                      }}
                    />
                  );
                })}

                {/* Interactive click overlay area for nodes (invisible triggers) */}
                {NODE_COORDINATES.map((coords, i) => (
                  <circle
                    key={`overlay-${i}`}
                    cx={coords.x}
                    cy={coords.y}
                    r="22"
                    fill="transparent"
                    className="morris-node-interactive"
                    onClick={() => onNodeClick(i)}
                    aria-label={`Node ${i + 1}`}
                  />
                ))}
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
        </>
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

      <QuickReactionTray onSendReaction={handleSendReaction} onSendChat={handleSendChat} />
      <ForfeitModal
        isOpen={showForfeitModal}
        onClose={() => setShowForfeitModal(false)}
        onConfirm={handleForfeitConfirm}
      />
    </div>
  );
}
