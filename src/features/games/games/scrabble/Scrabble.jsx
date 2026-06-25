/**
 * @file Scrabble.jsx
 * @description Main Classic Scrabble game component. Compact 11x11 grid,
 * turn-based sync, dictionary validation, and real-time timer.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useGameSync } from '../../hooks/useGameSync';
import { generateSessionId } from '../../lib/gameEngine';
import { GameRecorder } from '../../lib/gameRecorder';
import { supabase } from '../../../../lib/supabase';
import GameHeader from '../../components/GameHeader';
import GameResults from '../../components/GameResults';
import ForfeitModal from '../../components/ForfeitModal';
import QuickReactionTray from '../../components/QuickReactionTray';
import ScrabbleBoard from './ScrabbleBoard';
import LetterRack from './LetterRack';
import { createInitialBag, drawTiles } from './utils/tileBag';
import { calculateTurnScore, BOARD_SIZE, findWordsFormed } from './utils/scoring';
import { validateOnlineWord } from '../wordChain/dictionaryService';
import './scrabble.css';

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
 * @param {boolean} props.isHost
 */
export default function Scrabble({
  gameId,
  gameName,
  userId,
  partnerId,
  user,
  partner,
  onBack,
  isHost,
}) {
  const syncSessionId = useMemo(
    () => generateSessionId(gameId, userId, partnerId),
    [gameId, userId, partnerId]
  );

  const recorder = useRef(new GameRecorder(gameId, userId, partnerId));

  // Game DB Session state
  const [dbSessionId, setDbSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Board state: 11x11 grid
  const [board, setBoard] = useState(() =>
    Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null))
  );

  // Tiles and racks
  const [bag, setBag] = useState([]);
  const [myRack, setMyRack] = useState([]);
  const [partnerRack, setPartnerRack] = useState([]);
  const [newPlacements, setNewPlacements] = useState([]);

  // Game statuses
  const [scores, setScores] = useState({ [userId]: 0, [partnerId]: 0 });
  const [currentTurn, setCurrentTurn] = useState('');
  const [winner, setWinner] = useState(null);
  const [endReason, setEndReason] = useState('completion');
  const [rematchStatus, setRematchStatus] = useState('none');
  const [consecutivePasses, setConsecutivePasses] = useState(0);

  // Selection state
  const [selectedRackIndex, setSelectedRackIndex] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Dialogs & UI Emojis
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeSelected, setExchangeSelected] = useState([]);

  const [activeUserBubble, setActiveUserBubble] = useState('');
  const [activePartnerBubble, setActivePartnerBubble] = useState('');
  const [userEmojis, setUserEmojis] = useState([]);
  const [partnerEmojis, setPartnerEmojis] = useState([]);

  // Check turn helper
  const isMyTurn = currentTurn === userId;

  const determineWinner = useCallback(
    (currentScores) => {
      const myScore = currentScores[userId];
      const pScore = currentScores[partnerId];
      if (myScore > pScore) return userId;
      if (pScore > myScore) return partnerId;
      return 'draw';
    },
    [userId, partnerId]
  );

  const loadSessionData = useCallback(
    (session) => {
      const data = session.puzzle_data;
      setBoard(data.board);
      setBag(data.bag);
      setScores(data.scores);
      setCurrentTurn(data.current_turn);
      setConsecutivePasses(data.consecutive_passes || 0);

      const isPlayerA = session.player_a_id === userId;
      setMyRack(isPlayerA ? data.player_a_rack : data.player_b_rack);
      setPartnerRack(isPlayerA ? data.player_b_rack : data.player_a_rack);

      if (session.winner_id || session.ended_at) {
        setWinner(
          session.winner_id === userId ? 'win' : session.winner_id === 'draw' ? 'draw' : 'loss'
        );
      }
    },
    [userId]
  );

  const saveSessionToDb = useCallback(
    async (updatedPuzzleData, finalWinnerId = null) => {
      if (!dbSessionId) return;

      const updates = {
        puzzle_data: updatedPuzzleData,
      };

      if (finalWinnerId !== null) {
        updates.winner_id = finalWinnerId;
        updates.ended_at = new Date().toISOString();
      }

      const { error } = await supabase.from('game_sessions').update(updates).eq('id', dbSessionId);

      if (error) console.error('Error saving session to DB:', error);
    },
    [dbSessionId]
  );

  const fetchCurrentSession = useCallback(async () => {
    if (!dbSessionId) return null;
    const { data, error } = await supabase
      .from('game_sessions')
      .select('puzzle_data')
      .eq('id', dbSessionId)
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    return data.puzzle_data;
  }, [dbSessionId]);

  const handleRecallAll = useCallback(() => {
    if (newPlacements.length === 0) return;
    const letters = newPlacements.map((p) => p.letter);
    setMyRack((prev) => [...prev, ...letters]);
    setNewPlacements([]);
    setValidationError('');
  }, [newPlacements]);

  const handleResetLocalState = useCallback(
    (session) => {
      setDbSessionId(session.id);
      loadSessionData(session);
      setRematchStatus('none');
      setWinner(null);
      setEndReason('completion');
      setNewPlacements([]);
      recorder.current = new GameRecorder(gameId, userId, partnerId);
    },
    [gameId, userId, partnerId, loadSessionData]
  );

  const handleForfeitLocal = useCallback(() => {
    setWinner('win');
    setEndReason('forfeit');
  }, []);

  const triggerPartnerReaction = useCallback((payload) => {
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
  }, []);

  // Remote Broadcast Sync
  const handleRemoteBroadcast = useCallback(
    (payload) => {
      if (payload.type === 'move') {
        setBoard(payload.board);
        setBag(payload.bag);
        setScores(payload.scores);
        setCurrentTurn(payload.turn);
        setConsecutivePasses(payload.consecutivePasses);
        setPartnerRack(payload.partnerRack);
        setNewPlacements([]);
      } else if (payload.type === 'rematch_request') {
        setRematchStatus('receiving');
      } else if (payload.type === 'rematch_accept') {
        handleResetLocalState(payload.newSession);
      } else if (payload.type === 'rematch_decline') {
        setRematchStatus('none');
      } else if (payload.type === 'forfeit') {
        handleForfeitLocal();
      } else if (payload.type === 'reaction') {
        triggerPartnerReaction(payload);
      } else if (payload.type === 'chat') {
        setActivePartnerBubble(payload.text);
        setTimeout(() => setActivePartnerBubble(''), 4000);
      }
    },
    [handleResetLocalState, handleForfeitLocal, triggerPartnerReaction]
  );

  const broadcastMove = useGameSync(gameId, syncSessionId, handleRemoteBroadcast);

  const handlePassTurn = useCallback(async () => {
    if (!isMyTurn || winner) return;

    handleRecallAll();

    const newPasses = consecutivePasses + 1;
    const nextTurn = partnerId;

    const sessionData = await fetchCurrentSession();
    if (!sessionData) return;

    const updatedPuzzleData = {
      board,
      bag,
      player_a_rack: isHost ? myRack : partnerRack,
      player_b_rack: isHost ? partnerRack : myRack,
      scores,
      current_turn: nextTurn,
      consecutive_passes: newPasses,
    };

    let finalWinnerId = null;
    if (newPasses >= 4) {
      // Game ends due to 4 consecutive passes
      finalWinnerId = determineWinner(scores);
      setWinner(finalWinnerId === userId ? 'win' : finalWinnerId === 'draw' ? 'draw' : 'loss');
    }

    await saveSessionToDb(updatedPuzzleData, finalWinnerId);
    setCurrentTurn(nextTurn);
    setConsecutivePasses(newPasses);

    broadcastMove({
      type: 'move',
      board,
      bag,
      scores,
      turn: nextTurn,
      consecutivePasses: newPasses,
      partnerRack: myRack,
    });

    if (finalWinnerId && isHost) {
      recorder.current.recordMove(userId, 'pass_end', {});
      await recorder.current
        .save(finalWinnerId === 'draw' ? null : finalWinnerId)
        .catch(console.error);
    }
  }, [
    isMyTurn,
    winner,
    handleRecallAll,
    consecutivePasses,
    partnerId,
    fetchCurrentSession,
    board,
    bag,
    isHost,
    myRack,
    partnerRack,
    scores,
    determineWinner,
    userId,
    saveSessionToDb,
    broadcastMove,
  ]);

  // Turn Countdown Timer (30 seconds)
  const handleTimerExpire = useCallback(() => {
    if (isMyTurn) {
      handlePassTurn();
    }
  }, [isMyTurn, handlePassTurn]);

  const { seconds, pause, reset } = useGameTimer(30, handleTimerExpire, false);

  // Synchronize timer active state based on turn
  useEffect(() => {
    if (dbSessionId && !winner) {
      reset(true);
    } else {
      pause();
    }
  }, [currentTurn, dbSessionId, winner, pause, reset]);

  // Load or create game session from DB
  useEffect(() => {
    let active = true;

    async function initSession() {
      try {
        setLoading(true);
        // Find existing active session
        const { data, error } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('game_type', 'scrabble')
          .or(
            `and(player_a_id.eq.${userId},player_b_id.eq.${partnerId}),and(player_a_id.eq.${partnerId},player_b_id.eq.${userId})`
          )
          .is('winner_id', null)
          .is('ended_at', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const session = data[0];
          if (active) {
            setDbSessionId(session.id);
            loadSessionData(session);
          }
        } else if (isHost) {
          // Create new session
          const initialBag = createInitialBag();
          const p1Draw = drawTiles(initialBag, 7);
          const p2Draw = drawTiles(p1Draw.remainingBag, 7);

          const initialPuzzleData = {
            board: Array(BOARD_SIZE)
              .fill(null)
              .map(() => Array(BOARD_SIZE).fill(null)),
            bag: p2Draw.remainingBag,
            player_a_rack: p1Draw.drawn,
            player_b_rack: p2Draw.drawn,
            scores: { [userId]: 0, [partnerId]: 0 },
            current_turn: userId,
            consecutive_passes: 0,
          };

          const { data: newSession, error: createError } = await supabase
            .from('game_sessions')
            .insert({
              game_type: 'scrabble',
              player_a_id: userId,
              player_b_id: partnerId,
              puzzle_data: initialPuzzleData,
              player_states: {},
            })
            .select('*')
            .single();

          if (createError) throw createError;

          if (active && newSession) {
            setDbSessionId(newSession.id);
            loadSessionData(newSession);
          }
        }
      } catch (err) {
        console.error('Error initializing Scrabble session:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    initSession();
    return () => {
      active = false;
    };
  }, [isHost, userId, partnerId, loadSessionData]);

  // Turn Actions
  const handleCellClick = (r, c) => {
    if (!isMyTurn || winner) return;

    const existingPlacementIndex = newPlacements.findIndex((p) => p.r === r && p.c === c);

    if (existingPlacementIndex !== -1) {
      // Recall tile
      const recalled = newPlacements[existingPlacementIndex];
      setMyRack((prev) => [...prev, recalled.letter]);
      setNewPlacements((prev) => prev.filter((_, idx) => idx !== existingPlacementIndex));
      setValidationError('');
    } else if (selectedRackIndex !== null && !board[r][c]) {
      // Place tile
      const letter = myRack[selectedRackIndex];
      setNewPlacements((prev) => [...prev, { r, c, letter }]);
      setMyRack((prev) => prev.filter((_, idx) => idx !== selectedRackIndex));
      setSelectedRackIndex(null);
      setValidationError('');
    }
  };

  const handleSelectRackTile = (index) => {
    if (!isMyTurn || winner) return;
    setSelectedRackIndex(index === selectedRackIndex ? null : index);
  };

  const handlePlayWord = async () => {
    if (!isMyTurn || winner || newPlacements.length === 0) return;

    setValidationError('');
    setIsValidating(true);

    try {
      // 1. Line validation
      const rows = [...new Set(newPlacements.map((p) => p.r))];
      const cols = [...new Set(newPlacements.map((p) => p.c))];

      if (rows.length > 1 && cols.length > 1) {
        throw new Error('Tiles must be placed in a straight row or column.');
      }

      // 2. Connectivity check
      const isFirstTurn = board.every((row) => row.every((cell) => cell === null));
      if (isFirstTurn) {
        const coversCenter = newPlacements.some((p) => p.r === 5 && p.c === 5);
        if (!coversCenter) {
          throw new Error('First word must cover the center star (★).');
        }
      } else {
        const hasAdjacent = newPlacements.some(({ r, c }) => {
          const adj = [
            [r - 1, c],
            [r + 1, c],
            [r, c - 1],
            [r, c + 1],
          ];
          return adj.some(([ar, ac]) => {
            return (
              ar >= 0 && ar < BOARD_SIZE && ac >= 0 && ac < BOARD_SIZE && board[ar][ac] !== null
            );
          });
        });
        if (!hasAdjacent) {
          throw new Error('New tiles must connect to existing words.');
        }
      }

      // 3. Extract words formed
      const words = findWordsFormed(board, newPlacements);
      if (words.length === 0) {
        throw new Error('Placements do not form a valid word sequence.');
      }

      // 4. Validate words against dictionary API
      for (const wordTiles of words) {
        const wordText = wordTiles.map((t) => t.letter).join('');
        const res = await validateOnlineWord(wordText);
        if (!res.valid) {
          throw new Error(`"${wordText}" is not a valid word.`);
        }
      }

      // 5. Success! Compute scores
      const turnScore = calculateTurnScore(board, newPlacements);
      const newScores = {
        ...scores,
        [userId]: scores[userId] + turnScore,
      };

      const newBoard = board.map((row) => [...row]);
      newPlacements.forEach(({ r, c, letter }) => {
        newBoard[r][c] = letter;
      });

      // Draw replacement tiles
      const drawCount = 7 - myRack.length;
      const { drawn, remainingBag } = drawTiles(bag, drawCount);
      const newMyRack = [...myRack, ...drawn];

      // Check if game end condition met
      const nextTurn = partnerId;
      let finalWinnerId = null;

      const myRackEmpty = newMyRack.length === 0;
      if (myRackEmpty && remainingBag.length === 0) {
        finalWinnerId = determineWinner(newScores);
        setWinner(finalWinnerId === userId ? 'win' : finalWinnerId === 'draw' ? 'draw' : 'loss');
      }

      const updatedPuzzleData = {
        board: newBoard,
        bag: remainingBag,
        player_a_rack: isHost ? newMyRack : partnerRack,
        player_b_rack: isHost ? partnerRack : newMyRack,
        scores: newScores,
        current_turn: nextTurn,
        consecutive_passes: 0,
      };

      await saveSessionToDb(updatedPuzzleData, finalWinnerId);

      // Local State Update
      setBoard(newBoard);
      setBag(remainingBag);
      setScores(newScores);
      setMyRack(newMyRack);
      setNewPlacements([]);
      setCurrentTurn(nextTurn);
      setConsecutivePasses(0);

      // Replay recording
      recorder.current.recordMove(userId, 'place', { placements: newPlacements, score: turnScore });

      broadcastMove({
        type: 'move',
        board: newBoard,
        bag: remainingBag,
        scores: newScores,
        turn: nextTurn,
        consecutivePasses: 0,
        partnerRack: newMyRack,
      });

      if (finalWinnerId && isHost) {
        await recorder.current
          .save(finalWinnerId === 'draw' ? null : finalWinnerId)
          .catch(console.error);
      }
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setIsValidating(false);
    }
  };

  // Exchange Tiles Modal Actions
  const handleOpenExchange = () => {
    if (!isMyTurn || winner || bag.length === 0) return;
    handleRecallAll();
    setExchangeSelected([]);
    setShowExchangeModal(true);
  };

  const handleToggleExchangeTile = (index) => {
    setExchangeSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleConfirmExchange = async () => {
    if (exchangeSelected.length === 0) return;

    // Get selected letters
    const lettersToReturn = exchangeSelected.map((idx) => myRack[idx]);
    const updatedRack = myRack.filter((_, idx) => !exchangeSelected.includes(idx));

    // Return letters to bag and shuffle
    const newBag = [...bag, ...lettersToReturn];
    // Shuffle the new bag
    const shuffledBag = newBag.sort(() => Math.random() - 0.5);

    // Draw same number of tiles
    const { drawn, remainingBag } = drawTiles(shuffledBag, lettersToReturn.length);
    const finalRack = [...updatedRack, ...drawn];

    const nextTurn = partnerId;
    const newPasses = consecutivePasses + 1;

    const updatedPuzzleData = {
      board,
      bag: remainingBag,
      player_a_rack: isHost ? finalRack : partnerRack,
      player_b_rack: isHost ? partnerRack : finalRack,
      scores,
      current_turn: nextTurn,
      consecutive_passes: newPasses,
    };

    let finalWinnerId = null;
    if (newPasses >= 4) {
      finalWinnerId = determineWinner(scores);
      setWinner(finalWinnerId === userId ? 'win' : finalWinnerId === 'draw' ? 'draw' : 'loss');
    }

    await saveSessionToDb(updatedPuzzleData, finalWinnerId);

    setBag(remainingBag);
    setMyRack(finalRack);
    setShowExchangeModal(false);
    setCurrentTurn(nextTurn);
    setConsecutivePasses(newPasses);

    broadcastMove({
      type: 'move',
      board,
      bag: remainingBag,
      scores,
      turn: nextTurn,
      consecutivePasses: newPasses,
      partnerRack: finalRack,
    });

    if (finalWinnerId && isHost) {
      recorder.current.recordMove(userId, 'exchange_end', {});
      await recorder.current
        .save(finalWinnerId === 'draw' ? null : finalWinnerId)
        .catch(console.error);
    }
  };

  // Helper DB Fetch

  // Rematch & Forfeit handlers
  const handleRequestRematch = () => {
    setRematchStatus('sending');
    broadcastMove({ type: 'rematch_request' });
  };

  const handleAcceptRematch = async () => {
    const newBag = createInitialBag();
    const p1Draw = drawTiles(newBag, 7);
    const p2Draw = drawTiles(p1Draw.remainingBag, 7);

    const initialPuzzleData = {
      board: Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null)),
      bag: p2Draw.remainingBag,
      player_a_rack: p1Draw.drawn,
      player_b_rack: p2Draw.drawn,
      scores: { [userId]: 0, [partnerId]: 0 },
      current_turn: userId,
      consecutive_passes: 0,
    };

    const { data: newSession, error } = await supabase
      .from('game_sessions')
      .insert({
        game_type: 'scrabble',
        player_a_id: userId,
        player_b_id: partnerId,
        puzzle_data: initialPuzzleData,
        player_states: {},
      })
      .select('*')
      .single();

    if (error) {
      console.error(error);
      return;
    }

    handleResetLocalState(newSession);
    broadcastMove({ type: 'rematch_accept', newSession });
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

    await saveSessionToDb(board, partnerId); // End session marking partner as winner
    onBack();
  };

  // Emojis & Chat
  const handleSendReaction = (emoji) => {
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
    setActiveUserBubble(text);
    setTimeout(() => setActiveUserBubble(''), 4000);
    broadcastMove({ type: 'chat', text });
  };

  // Result state
  const result =
    winner === 'win' ? 'win' : winner === 'loss' ? 'loss' : winner === 'draw' ? 'draw' : null;

  return (
    <div className="scrabble-container">
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

      <div className="scrabble-main">
        {/* Scores & Status indicators */}
        <div className="flex w-full max-w-[360px] justify-between items-center text-xs px-1">
          <div className="scrabble-turn-indicator">
            {winner ? (
              <span className="text-yellow-500 font-bold">Game Over</span>
            ) : isMyTurn ? (
              <span className="text-yellow-500 font-bold">Your Turn ({seconds}s)</span>
            ) : (
              <span>{"Partner's Turn"}</span>
            )}
          </div>
          <div className="scrabble-bag-count">Bag: {bag.length} tiles</div>
        </div>

        {/* Board Component */}
        <ScrabbleBoard board={board} newPlacements={newPlacements} onCellClick={handleCellClick} />

        {/* Validation Errors */}
        {validationError && (
          <div className="text-xs text-red-400 font-semibold max-w-[360px] text-center bg-red-950/40 py-2 px-4 rounded-xl border border-red-500/20">
            {validationError}
          </div>
        )}

        {/* Scores Display */}
        <div className="flex gap-6 text-xs text-text-muted bg-surface/40 px-4 py-2 rounded-xl border border-surface-border">
          <span>
            You: <b className="text-yellow-500">{scores[userId]} pts</b>
          </span>
          <span>
            {partner?.name || 'Partner'}: <b className="text-secondary">{scores[partnerId]} pts</b>
          </span>
        </div>
      </div>

      {/* Pinned Bottom Controls and Letter Rack */}
      {!winner && !loading && (
        <div className="scrabble-rack-container">
          <div className="scrabble-controls">
            <button
              onClick={handleRecallAll}
              disabled={!isMyTurn || newPlacements.length === 0}
              className="btn-scrabble btn-scrabble-secondary"
            >
              Recall
            </button>
            <button
              onClick={handleOpenExchange}
              disabled={!isMyTurn || bag.length === 0}
              className="btn-scrabble btn-scrabble-secondary"
            >
              Swap ({bag.length})
            </button>
            <button
              onClick={handlePassTurn}
              disabled={!isMyTurn}
              className="btn-scrabble btn-scrabble-secondary"
            >
              Pass
            </button>
            <button
              onClick={handlePlayWord}
              disabled={!isMyTurn || newPlacements.length === 0 || isValidating}
              className="btn-scrabble btn-scrabble-primary"
            >
              {isValidating ? 'Checking...' : 'Play'}
            </button>
          </div>

          <LetterRack
            rack={myRack}
            selectedTileIndex={selectedRackIndex}
            onSelectTile={handleSelectRackTile}
          />
        </div>
      )}

      {/* Emojis Rendering */}
      <div className="absolute bottom-32 left-6 pointer-events-none w-16 h-48 overflow-visible flex items-end justify-center z-50">
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

      <div className="absolute bottom-32 right-6 pointer-events-none w-16 h-48 overflow-visible flex items-end justify-center z-50">
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

      {/* Exchange Tiles Modal */}
      {showExchangeModal && (
        <div className="exchange-overlay">
          <div className="exchange-card">
            <h3 className="font-heading text-lg font-bold text-text-main">Swap Tiles</h3>
            <p className="text-xs text-text-muted text-center leading-relaxed">
              Select which tiles you want to swap back into the bag. Swapping will end your turn.
            </p>

            <div className="exchange-grid">
              {myRack.map((letter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleToggleExchangeTile(idx)}
                  className={`exchange-tile ${exchangeSelected.includes(idx) ? 'selected' : ''}`}
                >
                  {letter}
                </button>
              ))}
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setShowExchangeModal(false)}
                className="flex-1 py-2 text-xs font-bold text-text-muted bg-surface/50 rounded-xl border border-surface-border"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExchange}
                disabled={exchangeSelected.length === 0}
                className="flex-1 py-2 text-xs font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-40"
              >
                Swap Selected
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
