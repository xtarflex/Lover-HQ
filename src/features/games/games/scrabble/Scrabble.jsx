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
import { AlertCircle, Clock, Wifi, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import './scrabble.css';

const SCRABBLE_2_LETTER_WORDS = new Set([
  'aa',
  'ab',
  'ad',
  'ae',
  'ag',
  'ah',
  'ai',
  'al',
  'am',
  'an',
  'ar',
  'as',
  'at',
  'aw',
  'ax',
  'ay',
  'ba',
  'be',
  'bi',
  'bo',
  'by',
  'da',
  'de',
  'di',
  'do',
  'ed',
  'ee',
  'eh',
  'el',
  'em',
  'en',
  'er',
  'es',
  'et',
  'ex',
  'fa',
  'fe',
  'fy',
  'gi',
  'go',
  'gu',
  'he',
  'hi',
  'hm',
  'ho',
  'id',
  'if',
  'in',
  'io',
  'is',
  'it',
  'ja',
  'jo',
  'ka',
  'ki',
  'ko',
  'la',
  'li',
  'lo',
  'ma',
  'me',
  'mi',
  'mm',
  'mo',
  'mu',
  'my',
  'na',
  'ne',
  'no',
  'nu',
  'ny',
  'ob',
  'od',
  'oe',
  'of',
  'oh',
  'oi',
  'ok',
  'om',
  'on',
  'op',
  'or',
  'os',
  'ou',
  'ow',
  'ox',
  'oy',
  'pa',
  'pe',
  'pi',
  'po',
  'qi',
  're',
  'sh',
  'si',
  'so',
  'ta',
  'te',
  'ti',
  'to',
  'ug',
  'uh',
  'um',
  'un',
  'up',
  'ur',
  'us',
  'ut',
  'we',
  'wo',
  'xi',
  'xu',
  'ya',
  'ye',
  'yo',
  'za',
]);

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
  partnerOnline,
  onBack,
  isHost,
}) {
  const syncSessionId = useMemo(
    () => generateSessionId(gameId, userId, partnerId),
    [gameId, userId, partnerId]
  );

  const recorder = useRef(new GameRecorder(gameId, userId, partnerId));
  const broadcastMoveRef = useRef(null);

  // Game DB Session state
  const [dbSessionId, setDbSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup states
  const [showSetup, setShowSetup] = useState(false);
  const [setupMode, setSetupMode] = useState('timed');
  const [setupTimeLimit, setSetupTimeLimit] = useState(60);
  const [gameMode, setGameMode] = useState('timed');
  const [timeLimit, setTimeLimit] = useState(60);

  const [cellWidth, setCellWidth] = useState(32);

  // Board state: 15x15 grid
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
  const [showBlankModal, setShowBlankModal] = useState(false);
  const [pendingBlankPlacement, setPendingBlankPlacement] = useState(null); // { r, c, rackIndex }
  const [touchDrag, setTouchDrag] = useState(null); // { type: 'rack'|'board', index, x, y, letter, isBlank }

  const [activeUserBubble, setActiveUserBubble] = useState('');
  const [activePartnerBubble, setActivePartnerBubble] = useState('');
  const [userEmojis, setUserEmojis] = useState([]);
  const [partnerEmojis, setPartnerEmojis] = useState([]);

  // Check turn helper
  const isMyTurn = currentTurn === userId;

  const getLetterScore = (letter, isBlank) => {
    if (isBlank || letter === '_') return 0;
    const LETTER_VALUES = {
      A: 1,
      B: 3,
      C: 3,
      D: 2,
      E: 1,
      F: 4,
      G: 2,
      H: 4,
      I: 1,
      J: 8,
      K: 5,
      L: 1,
      M: 3,
      N: 1,
      O: 1,
      P: 3,
      Q: 10,
      R: 1,
      S: 1,
      T: 1,
      U: 1,
      V: 4,
      W: 4,
      X: 8,
      Y: 4,
      Z: 10,
      _: 0,
    };
    return LETTER_VALUES[letter.toUpperCase()] || 0;
  };

  const adjustFinalScores = useCallback(
    (currentScores, finalMyRack, finalPartnerRack, emptiedRackUserId) => {
      const myRackVal = finalMyRack.reduce((sum, l) => sum + getLetterScore(l), 0);
      const partnerRackVal = finalPartnerRack.reduce((sum, l) => sum + getLetterScore(l), 0);

      const adjusted = { ...currentScores };

      if (emptiedRackUserId === userId) {
        adjusted[userId] += partnerRackVal;
        adjusted[partnerId] -= partnerRackVal;
      } else if (emptiedRackUserId === partnerId) {
        adjusted[partnerId] += myRackVal;
        adjusted[userId] -= myRackVal;
      } else {
        adjusted[userId] -= myRackVal;
        adjusted[partnerId] -= partnerRackVal;
      }

      return adjusted;
    },
    [userId, partnerId]
  );

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
      setBag(data.bag);
      setScores(data.scores);
      setCurrentTurn(data.current_turn);
      setConsecutivePasses(data.consecutive_passes || 0);
      setGameMode(data.gameMode || 'timed');
      setTimeLimit(data.timeLimit !== undefined ? data.timeLimit : 60);

      // Normalize board to objects
      let loadedBoard = data.board;
      if (!loadedBoard || loadedBoard.length !== BOARD_SIZE) {
        loadedBoard = Array(BOARD_SIZE)
          .fill(null)
          .map(() => Array(BOARD_SIZE).fill(null));
      }
      const normalizedBoard = loadedBoard.map((row) =>
        row.map((cell) => {
          if (typeof cell === 'string') {
            return { letter: cell, isBlank: false };
          }
          return cell;
        })
      );
      setBoard(normalizedBoard);

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
    const letters = newPlacements.map((p) => (p.isBlank ? '_' : p.letter));
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
      if (payload.type === 'start') {
        setDbSessionId(payload.session.id);
        loadSessionData(payload.session);
      } else if (payload.type === 'move') {
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
    [handleResetLocalState, handleForfeitLocal, triggerPartnerReaction, loadSessionData]
  );

  const broadcastMove = useGameSync(gameId, syncSessionId, handleRemoteBroadcast);
  useEffect(() => {
    broadcastMoveRef.current = broadcastMove;
  }, [broadcastMove]);

  // Listen for partner decline to exit game immediately without forfeit modal
  useEffect(() => {
    const handleDecline = () => onBack();
    window.addEventListener('game-invite-declined', handleDecline);
    return () => window.removeEventListener('game-invite-declined', handleDecline);
  }, [onBack]);

  // Save replay when game ends (only host saves to prevent duplicates)
  useEffect(() => {
    if (!winner || !isHost) return;
    const finalWinnerId = winner === 'win' ? userId : winner === 'loss' ? partnerId : null;
    recorder.current.save(finalWinnerId).catch(console.error);
  }, [winner, isHost, userId, partnerId]);

  const handlePassTurn = useCallback(async () => {
    if (!isMyTurn || winner) return;

    handleRecallAll();

    const newPasses = consecutivePasses + 1;
    const nextTurn = partnerId;

    const sessionData = await fetchCurrentSession();
    if (!sessionData) return;

    let finalWinnerId = null;
    let finalScores = { ...scores };
    if (newPasses >= 4) {
      // Game ends due to 4 consecutive passes
      finalScores = adjustFinalScores(scores, myRack, partnerRack, null);
      finalWinnerId = determineWinner(finalScores);
      setEndReason('consecutive_passes');
      setWinner(finalWinnerId === userId ? 'win' : finalWinnerId === 'draw' ? 'draw' : 'loss');
    }

    const updatedPuzzleData = {
      board,
      bag,
      player_a_rack: isHost ? myRack : partnerRack,
      player_b_rack: isHost ? partnerRack : myRack,
      scores: finalScores,
      current_turn: nextTurn,
      consecutive_passes: newPasses,
    };

    await saveSessionToDb(updatedPuzzleData, finalWinnerId);
    setCurrentTurn(nextTurn);
    setConsecutivePasses(newPasses);
    setScores(finalScores);

    broadcastMove({
      type: 'move',
      board,
      bag,
      scores: finalScores,
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
    adjustFinalScores,
  ]);

  // Turn Countdown Timer (30 seconds)
  const handleTimerExpire = useCallback(() => {
    if (isMyTurn) {
      handlePassTurn();
    }
  }, [isMyTurn, handlePassTurn]);

  const { seconds, pause, start, reset } = useGameTimer(
    gameMode === 'timeless' ? undefined : timeLimit,
    handleTimerExpire,
    false
  );

  // Reset the timer only when the turn changes
  useEffect(() => {
    if (dbSessionId && !winner && gameMode !== 'timeless') {
      reset(true);
    }
  }, [currentTurn, dbSessionId, winner, gameMode, reset]);

  // Pause or resume the timer based on partner connection state
  useEffect(() => {
    if (dbSessionId && !winner && gameMode !== 'timeless') {
      if (partnerOnline) {
        start();
      } else {
        pause();
      }
    } else {
      pause();
    }
  }, [partnerOnline, dbSessionId, winner, gameMode, start, pause]);

  // Auto-clear validation errors after 5 seconds
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => {
        setValidationError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [validationError]);

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
          if (active) {
            setShowSetup(true);
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

  // Host starts the match with chosen settings
  const handleStartConfiguredGame = async () => {
    try {
      setLoading(true);
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
        gameMode: setupMode,
        timeLimit: setupMode === 'timeless' ? 0 : setupTimeLimit,
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

      if (newSession) {
        setDbSessionId(newSession.id);
        loadSessionData(newSession);
        setShowSetup(false);

        // Broadcast game start configuration to partner
        broadcastMoveRef.current?.({
          type: 'start',
          session: newSession,
        });
      }
    } catch (err) {
      console.error('Error starting configured game:', err);
    } finally {
      setLoading(false);
    }
  };

  // Turn Actions
  const handleCellClick = (r, c) => {
    if (!isMyTurn || winner) return;

    const existingPlacementIndex = newPlacements.findIndex((p) => p.r === r && p.c === c);

    if (existingPlacementIndex !== -1) {
      // Recall tile
      const recalled = newPlacements[existingPlacementIndex];
      setMyRack((prev) => [...prev, recalled.isBlank ? '_' : recalled.letter]);
      setNewPlacements((prev) => prev.filter((_, idx) => idx !== existingPlacementIndex));
      setValidationError('');
    } else if (selectedRackIndex !== null && !board[r][c]) {
      // Place tile
      const letter = myRack[selectedRackIndex];
      if (letter === '_') {
        setPendingBlankPlacement({ r, c, rackIndex: selectedRackIndex });
        setShowBlankModal(true);
      } else {
        setNewPlacements((prev) => [...prev, { r, c, letter, isBlank: false }]);
        setMyRack((prev) => prev.filter((_, idx) => idx !== selectedRackIndex));
        setSelectedRackIndex(null);
        setValidationError('');
      }
    }
  };

  const handleSelectBlankLetter = (chosenLetter) => {
    if (!pendingBlankPlacement) return;
    const { r, c, rackIndex } = pendingBlankPlacement;
    setNewPlacements((prev) => [...prev, { r, c, letter: chosenLetter, isBlank: true }]);
    setMyRack((prev) => prev.filter((_, idx) => idx !== rackIndex));
    setPendingBlankPlacement(null);
    setShowBlankModal(false);
    setSelectedRackIndex(null);
    setValidationError('');
  };

  const handleCancelBlankSelection = () => {
    setPendingBlankPlacement(null);
    setShowBlankModal(false);
    setSelectedRackIndex(null);
  };

  // Desktop HTML5 drag/drop handlers
  const handleDragStart = (e, index) => {
    if (!isMyTurn || winner) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'rack', index }));
    e.dataTransfer.effectAllowed = 'move';
    setSelectedRackIndex(index);
  };

  const handleBoardDragStart = (e, placementIndex, r, c) => {
    if (!isMyTurn || winner) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ source: 'board', index: placementIndex, r, c })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnCell = (e, r, c) => {
    e.preventDefault();
    if (!isMyTurn || winner || board[r][c]) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.source === 'rack') {
        const letter = myRack[data.index];
        if (letter === '_') {
          setPendingBlankPlacement({ r, c, rackIndex: data.index });
          setShowBlankModal(true);
        } else {
          setNewPlacements((prev) => [...prev, { r, c, letter, isBlank: false }]);
          setMyRack((prev) => prev.filter((_, idx) => idx !== data.index));
          setSelectedRackIndex(null);
          setValidationError('');
        }
      } else if (data.source === 'board') {
        // Move placed tile on the board
        setNewPlacements((prev) => prev.map((p, idx) => (idx === data.index ? { ...p, r, c } : p)));
        setValidationError('');
      }
    } catch (err) {
      console.error('Error handling drop on cell:', err);
    }
  };

  const handleDropOnRack = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.source === 'board') {
        const recalled = newPlacements[data.index];
        setMyRack((prev) => [...prev, recalled.isBlank ? '_' : recalled.letter]);
        setNewPlacements((prev) => prev.filter((_, idx) => idx !== data.index));
        setValidationError('');
      }
    } catch (err) {
      console.error('Error handling drop on rack:', err);
    }
  };

  // Mobile touch drag/drop handlers
  const handleTouchStartRack = (e, index) => {
    if (!isMyTurn || winner) return;
    const firstCell = document.querySelector('.scrabble-cell');
    if (firstCell) {
      setCellWidth(firstCell.clientWidth || 32);
    }
    const touch = e.touches[0];
    setTouchDrag({
      type: 'rack',
      index,
      x: touch.clientX,
      y: touch.clientY,
      letter: myRack[index],
      isBlank: myRack[index] === '_',
      isOverBoard: false,
    });
  };

  const handleTouchStartBoard = (e, placementIndex) => {
    if (!isMyTurn || winner) return;
    const firstCell = document.querySelector('.scrabble-cell');
    if (firstCell) {
      setCellWidth(firstCell.clientWidth || 32);
    }
    const touch = e.touches[0];
    const placement = newPlacements[placementIndex];
    setTouchDrag({
      type: 'board',
      index: placementIndex,
      x: touch.clientX,
      y: touch.clientY,
      letter: placement.letter,
      isBlank: placement.isBlank,
      isOverBoard: true,
    });
  };

  // Helper for touch drops
  const handleTouchDropOnCell = useCallback(
    (drag, r, c) => {
      if (board[r][c] || winner) return;

      if (drag.type === 'rack') {
        if (drag.letter === '_') {
          setPendingBlankPlacement({ r, c, rackIndex: drag.index });
          setShowBlankModal(true);
        } else {
          setNewPlacements((prev) => [...prev, { r, c, letter: drag.letter, isBlank: false }]);
          setMyRack((prev) => prev.filter((_, idx) => idx !== drag.index));
          setSelectedRackIndex(null);
          setValidationError('');
        }
      } else if (drag.type === 'board') {
        // Move placed tile on the board
        setNewPlacements((prev) => prev.map((p, idx) => (idx === drag.index ? { ...p, r, c } : p)));
        setValidationError('');
      }
    },
    [board, winner]
  );

  const handleTouchDropOnRack = useCallback(
    (drag) => {
      if (drag.type === 'board') {
        const recalled = newPlacements[drag.index];
        setMyRack((prev) => [...prev, recalled.isBlank ? '_' : recalled.letter]);
        setNewPlacements((prev) => prev.filter((_, idx) => idx !== drag.index));
        setValidationError('');
      }
    },
    [newPlacements]
  );

  // Global touch listeners when a touch drag is active
  useEffect(() => {
    if (!touchDrag) return;

    const handleTouchMove = (e) => {
      // Prevent scrolling while dragging tiles
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const isOverBoard = !!element?.closest('.scrabble-board');

      setTouchDrag((prev) =>
        prev
          ? {
              ...prev,
              x: touch.clientX,
              y: touch.clientY,
              isOverBoard,
            }
          : null
      );
    };

    const handleTouchEnd = (e) => {
      if (!touchDrag) return;
      const touch = e.changedTouches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);

      const cellElement = element?.closest('.scrabble-cell');
      const rackElement = element?.closest('.scrabble-rack');

      if (cellElement) {
        const match = cellElement.id.match(/scrabble-cell-(\d+)-(\d+)/);
        if (match) {
          const r = parseInt(match[1], 10);
          const c = parseInt(match[2], 10);
          handleTouchDropOnCell(touchDrag, r, c);
        }
      } else if (rackElement && touchDrag.type === 'board') {
        handleTouchDropOnRack(touchDrag);
      }

      setTouchDrag(null);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchDrag, handleTouchDropOnCell, handleTouchDropOnRack]);

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
        const coversCenter = newPlacements.some((p) => p.r === 7 && p.c === 7);
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
        const wordText = wordTiles
          .map((t) => t.letter)
          .join('')
          .toLowerCase();
        if (wordText.length === 2) {
          if (!SCRABBLE_2_LETTER_WORDS.has(wordText)) {
            throw new Error(`"${wordText.toUpperCase()}" is not a valid 2-letter Scrabble word.`);
          }
        } else {
          const res = await validateOnlineWord(wordText);
          if (!res.valid) {
            throw new Error(`"${wordText.toUpperCase()}" is not a valid word.`);
          }
        }
      }

      // 5. Success! Compute scores
      const turnScore = calculateTurnScore(board, newPlacements);
      const newScores = {
        ...scores,
        [userId]: scores[userId] + turnScore,
      };

      const newBoard = board.map((row) => [...row]);
      newPlacements.forEach(({ r, c, letter, isBlank }) => {
        newBoard[r][c] = { letter, isBlank };
      });

      // Draw replacement tiles
      const drawCount = 7 - myRack.length;
      const { drawn, remainingBag } = drawTiles(bag, drawCount);
      const newMyRack = [...myRack, ...drawn];

      // Check if game end condition met
      const nextTurn = partnerId;
      let finalWinnerId = null;
      let finalScores = { ...newScores };

      const myRackEmpty = newMyRack.length === 0;
      if (myRackEmpty && remainingBag.length === 0) {
        finalScores = adjustFinalScores(newScores, newMyRack, partnerRack, userId);
        finalWinnerId = determineWinner(finalScores);
        setWinner(finalWinnerId === userId ? 'win' : finalWinnerId === 'draw' ? 'draw' : 'loss');
      }

      const updatedPuzzleData = {
        board: newBoard,
        bag: remainingBag,
        player_a_rack: isHost ? newMyRack : partnerRack,
        player_b_rack: isHost ? partnerRack : newMyRack,
        scores: finalScores,
        current_turn: nextTurn,
        consecutive_passes: 0,
      };

      await saveSessionToDb(updatedPuzzleData, finalWinnerId);

      // Local State Update
      setBoard(newBoard);
      setBag(remainingBag);
      setScores(finalScores);
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
        scores: finalScores,
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
    if (!isMyTurn || winner || bag.length < 7) return;
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

    let finalWinnerId = null;
    let finalScores = { ...scores };
    if (newPasses >= 4) {
      finalScores = adjustFinalScores(scores, finalRack, partnerRack, null);
      finalWinnerId = determineWinner(finalScores);
      setWinner(finalWinnerId === userId ? 'win' : finalWinnerId === 'draw' ? 'draw' : 'loss');
    }

    const updatedPuzzleData = {
      board,
      bag: remainingBag,
      player_a_rack: isHost ? finalRack : partnerRack,
      player_b_rack: isHost ? partnerRack : finalRack,
      scores: finalScores,
      current_turn: nextTurn,
      consecutive_passes: newPasses,
    };

    await saveSessionToDb(updatedPuzzleData, finalWinnerId);

    setBag(remainingBag);
    setMyRack(finalRack);
    setShowExchangeModal(false);
    setCurrentTurn(nextTurn);
    setConsecutivePasses(newPasses);
    setScores(finalScores);

    broadcastMove({
      type: 'move',
      board,
      bag: remainingBag,
      scores: finalScores,
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
      gameMode: gameMode,
      timeLimit: timeLimit,
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

    // Write replay if host
    if (isHost) {
      await recorder.current.save(partnerId).catch(console.error);
    }

    // Safely update DB without schema corruption
    const sessionData = await fetchCurrentSession();
    if (sessionData) {
      const updatedPuzzleData = {
        ...sessionData,
        board,
      };
      await saveSessionToDb(updatedPuzzleData, partnerId);
    }
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
        userScore={scores[userId] || 0}
        partnerScore={scores[partnerId] || 0}
        timeLeft={gameMode === 'timeless' ? undefined : seconds}
        onBack={handleBackAction}
        activeUserBubble={activeUserBubble}
        activePartnerBubble={activePartnerBubble}
        userEmojis={userEmojis}
        partnerEmojis={partnerEmojis}
      />

      {/* Validation Errors: Absolute top-right below the header, slide left in / slide right out */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="absolute top-28 right-4 z-50 text-xs text-red-400 font-bold bg-red-950/95 py-2.5 px-4 rounded-xl border border-red-500/30 shadow-2xl flex items-center gap-2 max-w-[280px]"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{validationError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!winner && !partnerOnline ? (
        <div className="flex flex-col items-center justify-center gap-3 text-center py-16 flex-grow">
          <LoadingSpinner size="md" />
          <h3 className="font-heading text-lg font-bold">Waiting for partner…</h3>
          <p className="text-xs text-text-muted max-w-xs leading-relaxed">
            We&apos;re waiting for {partner?.name || 'your partner'} to accept the game invite.
          </p>
        </div>
      ) : showSetup ? (
        <div className="flex flex-col items-center justify-center p-6 bg-surface/60 backdrop-blur-xl border border-surface-border rounded-3xl max-w-md mx-auto my-12 gap-6 shadow-2xl animate-slide-up flex-grow justify-self-center">
          <div className="text-center space-y-2">
            <Gamepad2 className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-xl font-extrabold text-text-main">Scrabble Game Setup</h3>
            <p className="text-xs text-text-muted">
              Configure the rules for your match with {partner?.name || 'Partner'}
            </p>
          </div>

          <div className="w-full space-y-2.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Gameplay Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSetupMode('timed')}
                className={`py-3.5 px-4 rounded-2xl border font-bold text-sm transition-all flex flex-col items-center gap-1.5 ${
                  setupMode === 'timed'
                    ? 'border-primary bg-primary/10 text-primary shadow-md'
                    : 'border-surface-border bg-surface/40 text-text-muted hover:text-text-main hover:border-text-muted'
                }`}
              >
                <Clock className="w-5 h-5" />
                Timed Mode
              </button>
              <button
                onClick={() => setSetupMode('timeless')}
                className={`py-3.5 px-4 rounded-2xl border font-bold text-sm transition-all flex flex-col items-center gap-1.5 ${
                  setupMode === 'timeless'
                    ? 'border-primary bg-primary/10 text-primary shadow-md'
                    : 'border-surface-border bg-surface/40 text-text-muted hover:text-text-main hover:border-text-muted'
                }`}
              >
                <Wifi className="w-5 h-5" />
                Timeless Mode
              </button>
            </div>
          </div>

          {setupMode === 'timed' && (
            <div className="w-full space-y-2.5 animate-fade-in">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Turn Time Limit
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: '30 seconds', value: 30 },
                  { label: '1 minute', value: 60 },
                  { label: '2 minutes', value: 120 },
                  { label: '5 minutes', value: 300 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSetupTimeLimit(opt.value)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      setupTimeLimit === opt.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-surface-border/60 bg-surface/20 text-text-muted hover:text-text-main'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleStartConfiguredGame}
            className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-primary/20 text-sm mt-2"
          >
            Start Match
          </button>
        </div>
      ) : !dbSessionId ? (
        <div className="flex flex-col items-center justify-center gap-4 text-center py-24 px-6 max-w-md mx-auto animate-pulse flex-grow justify-self-center">
          <LoadingSpinner size="md" />
          <h3 className="font-heading text-lg font-bold">Waiting for host…</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            We&apos;re waiting for {partner?.name || 'your partner'} to configure the game settings.
          </p>
        </div>
      ) : (
        <>
          <div className="scrabble-main">
            {/* Scores & Status indicators */}
            <div className="flex w-full max-w-[360px] justify-between items-center text-xs px-1">
              <div className="scrabble-turn-indicator">
                {winner ? (
                  <span className="text-yellow-500 font-bold">Game Over</span>
                ) : isMyTurn ? (
                  <span className="text-yellow-500 font-bold">Your Turn</span>
                ) : (
                  <span>{"Partner's Turn"}</span>
                )}
              </div>
              <div className="scrabble-bag-count">Bag: {bag.length} tiles</div>
            </div>

            {/* Board Component */}
            <ScrabbleBoard
              board={board}
              newPlacements={newPlacements}
              onCellClick={handleCellClick}
              onDragStartTile={handleBoardDragStart}
              onDragOverCell={(e) => e.preventDefault()}
              onDropCell={handleDropOnCell}
              onTouchStartTile={handleTouchStartBoard}
            />

            {/* Scores Display */}
            <div className="flex gap-6 text-xs text-text-muted bg-surface/40 px-4 py-2 rounded-xl border border-surface-border">
              <span>
                You: <b className="text-yellow-500">{scores[userId]} pts</b>
              </span>
              <span>
                {partner?.name || 'Partner'}:{' '}
                <b className="text-secondary">{scores[partnerId]} pts</b>
              </span>
            </div>
          </div>

          {/* Pinned Bottom Controls and Letter Rack */}
          {!winner && !loading && (
            <div
              className="scrabble-rack-container"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnRack}
            >
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
                  disabled={!isMyTurn || bag.length < 7}
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
                onDragStartTile={handleDragStart}
                onTouchStartTile={handleTouchStartRack}
              />
            </div>
          )}
        </>
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

      {(winner || partnerOnline) && (
        <div className="scrabble-reaction-tray">
          <QuickReactionTray onSendReaction={handleSendReaction} onSendChat={handleSendChat} />
        </div>
      )}

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

      {/* Blank Tile Letter Selection Modal */}
      {showBlankModal && (
        <div className="exchange-overlay">
          <div className="exchange-card max-w-[360px]">
            <h3 className="font-heading text-lg font-bold text-text-main">
              Choose Blank Tile Letter
            </h3>
            <p className="text-xs text-text-muted text-center leading-relaxed">
              Select a letter (A-Z) for your blank tile. The tile will count as 0 points.
            </p>

            <div className="grid grid-cols-6 gap-2 w-full p-1 justify-items-center">
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleSelectBlankLetter(letter)}
                  className="w-10 h-10 bg-slate-700 rounded-lg text-sm font-extrabold text-white flex items-center justify-center border border-slate-600 hover:bg-amber-500 hover:text-slate-900 transition-colors"
                >
                  {letter}
                </button>
              ))}
            </div>

            <div className="flex w-full mt-2">
              <button
                onClick={handleCancelBlankSelection}
                className="flex-1 py-2 text-xs font-bold text-text-muted bg-surface/50 rounded-xl border border-surface-border"
              >
                Cancel
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
      {touchDrag && (
        <div
          style={{
            position: 'fixed',
            left: touchDrag.x - (touchDrag.isOverBoard ? cellWidth / 2 : 22),
            top: touchDrag.y - (touchDrag.isOverBoard ? cellWidth / 2 : 22),
            pointerEvents: 'none',
            zIndex: 1000,
            width: touchDrag.isOverBoard ? `${cellWidth}px` : '44px',
            height: touchDrag.isOverBoard ? `${cellWidth}px` : '44px',
          }}
          className={
            touchDrag.isOverBoard
              ? 'scrabble-tile new-placement flex items-center justify-center font-extrabold text-sm select-none'
              : 'rack-tile flex items-center justify-center font-extrabold text-lg select-none touch-drag-ghost'
          }
        >
          {touchDrag.letter}
        </div>
      )}
    </div>
  );
}
