/**
 * @file MathPuzzle.jsx
 * @description Main CrossMath Race game component. Handles difficulty selection,
 * real-time progress broadcasts, drag-and-drop/click placement, and post-race inspection.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { generateSessionId } from '../../lib/gameEngine';
import { GameRecorder } from '../../lib/gameRecorder';
import { useGameSync } from '../../hooks/useGameSync';
import GameHeader from '../../components/GameHeader';
import GameResults from '../../components/GameResults';
import ForfeitModal from '../../components/ForfeitModal';
import QuickReactionTray from '../../components/QuickReactionTray';
import MathPuzzleBoard from './MathPuzzleBoard';
import MathPuzzleTileRack from './MathPuzzleTileRack';
import InspectionPanel from './InspectionPanel';
import {
  isGridCompleteAndCorrect,
  recalculateIntermediateResults,
  getLockedCellsMap,
} from './utils/validator';
import './mathPuzzle.css';

/**
 * Runs the level generator backtracking engine asynchronously on a background Web Worker thread.
 *
 * @param {string} selectedDifficulty - The selected level difficulty ('easy', 'medium', 'expert').
 * @returns {Promise<object>} The generated puzzle layout and pools.
 */
function generatePuzzleAsync(selectedDifficulty) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./utils/generator.worker.js', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e) => {
      const { success, puzzle, error } = e.data;
      worker.terminate();
      if (success) {
        resolve(puzzle);
      } else {
        reject(new Error(error));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage({ difficulty: selectedDifficulty });
  });
}

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
export default function MathPuzzle({
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

  // Game session states
  const [dbSessionId, setDbSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState(null);

  // Puzzle data
  const [grid, setGrid] = useState(null);
  const [rackTiles, setRackTiles] = useState([]);
  const [selectedRackTileId, setSelectedRackTileId] = useState(null);

  // Race progress heartbeats (completion percentages)
  const [myProgress, setMyProgress] = useState(0);
  const [partnerProgress, setPartnerProgress] = useState(0);

  // Game over state
  const [winnerId, setWinnerId] = useState(null);
  const [winnerName, setWinnerName] = useState('');
  const [winner, setWinner] = useState(null);
  const [endReason, setEndReason] = useState('completion');
  const [rematchStatus, setRematchStatus] = useState('none');
  const [showInspection, setShowInspection] = useState(false);
  const [showForfeitModal, setShowForfeitModal] = useState(false);

  // Partner's final grid for post-race comparison
  const [partnerGrid, setPartnerGrid] = useState(null);

  // Emojis & Chat bubbles
  const [activeUserBubble, setActiveUserBubble] = useState('');
  const [activePartnerBubble, setActivePartnerBubble] = useState('');
  const [userEmojis, setUserEmojis] = useState([]);
  const [partnerEmojis, setPartnerEmojis] = useState([]);

  // Drag states
  const [isDragActive, setIsDragActive] = useState(false);
  const [touchDrag, setTouchDrag] = useState(null); // { type: 'rack'|'board', id, value, x, y, r, c }

  const loadSessionData = useCallback(
    (session) => {
      const data = session.puzzle_data;
      setDifficulty(data.difficulty);
      setGrid(data.initial_grid);

      // Initialize rack tiles
      const initialTiles = data.hidden_values.map((val, idx) => ({
        id: `tile-${idx}`,
        value: val,
        isPlaced: false,
      }));
      setRackTiles(initialTiles);

      if (session.winner_id || session.ended_at) {
        setWinnerId(session.winner_id);
        setWinner(session.winner_id === userId ? 'win' : 'loss');
      }
    },
    [userId]
  );

  // Load active session on mount
  useEffect(() => {
    let active = true;

    async function initSession() {
      try {
        setLoading(true);
        // Look for active (unfinished) math race session
        const { data, error } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('game_type', 'math_puzzle')
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
        }
      } catch (err) {
        console.error('Error fetching CrossMath session:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    initSession();
    return () => {
      active = false;
    };
  }, [userId, partnerId, isHost, loadSessionData]);

  const handleResetLocalState = useCallback(
    (session) => {
      setDbSessionId(session.id);
      loadSessionData(session);
      setRematchStatus('none');
      setWinner(null);
      setWinnerId(null);
      setMyProgress(0);
      setPartnerProgress(0);
      setShowInspection(false);
      setPartnerGrid(null);
      recorder.current = new GameRecorder(gameId, userId, partnerId);
    },
    [gameId, userId, partnerId, loadSessionData]
  );

  const handleForfeitLocal = useCallback(() => {
    setWinnerId(userId);
    setWinner('win');
    setEndReason('forfeit');
  }, [userId]);

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

  // Remote Broadcast Sync Handler
  const handleRemoteBroadcast = useCallback(
    (payload) => {
      if (payload.type === 'start') {
        setDbSessionId(payload.sessionId);
        setDifficulty(payload.difficulty);
        setGrid(payload.grid);
        setRackTiles(payload.rackTiles);
        setWinner(null);
        setWinnerId(null);
        setMyProgress(0);
        setPartnerProgress(0);
      } else if (payload.type === 'progress') {
        setPartnerProgress(payload.progress);
      } else if (payload.type === 'finish') {
        setWinnerId(payload.winnerId);
        setWinner(payload.winnerId === userId ? 'win' : 'loss');
        setWinnerName(payload.winnerName);
        setPartnerGrid(payload.finalGrid);
        setShowInspection(true);
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
    [userId, handleResetLocalState, handleForfeitLocal, triggerPartnerReaction]
  );

  const broadcastMove = useGameSync(gameId, syncSessionId, handleRemoteBroadcast);

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

  // Host starts the puzzle race
  const handleStartRace = async (selectedDifficulty) => {
    try {
      setLoading(true);

      const puzzle = await generatePuzzleAsync(selectedDifficulty);

      // Create DB session
      const puzzleData = {
        difficulty: selectedDifficulty,
        initial_grid: puzzle.grid,
        hidden_values: puzzle.hiddenValues,
      };

      const { data: session, error } = await supabase
        .from('game_sessions')
        .insert({
          game_type: 'math_puzzle',
          player_a_id: userId,
          player_b_id: partnerId,
          puzzle_data: puzzleData,
          player_states: {},
        })
        .select('*')
        .single();

      if (error) throw error;

      setDbSessionId(session.id);
      setDifficulty(selectedDifficulty);
      setGrid(puzzle.grid);

      const initialTiles = puzzle.hiddenValues.map((val, idx) => ({
        id: `tile-${idx}`,
        value: val,
        isPlaced: false,
      }));
      setRackTiles(initialTiles);

      // Broadcast start details to partner
      broadcastMove({
        type: 'start',
        sessionId: session.id,
        difficulty: selectedDifficulty,
        grid: puzzle.grid,
        rackTiles: initialTiles,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Progress metrics
  const updateAndBroadcastProgress = useCallback(
    (currentGrid = grid) => {
      if (!currentGrid) return;

      let emptyCount = 0;
      let filledCount = 0;

      currentGrid.forEach((row) =>
        row.forEach((cell) => {
          if (cell && cell.type === 'number' && cell.isHidden) {
            emptyCount++;
            if (
              cell.currentValue !== undefined &&
              cell.currentValue !== null &&
              cell.currentValue !== ''
            ) {
              filledCount++;
            }
          }
        })
      );

      const percent = emptyCount > 0 ? Math.round((filledCount / emptyCount) * 100) : 100;
      setMyProgress(percent);
      broadcastMove({ type: 'progress', progress: percent });
    },
    [grid, broadcastMove]
  );

  // Check if grid is correct & ends race
  const checkBoardCompletion = useCallback(
    async (currentGrid = grid) => {
      if (!currentGrid) return;

      const correct = isGridCompleteAndCorrect(currentGrid);
      if (correct) {
        // Local solve completed! Record final win
        setWinnerId(userId);
        setWinner('win');
        setWinnerName(user?.name || 'You');

        // Update DB game session with winner details
        if (dbSessionId) {
          const { error } = await supabase
            .from('game_sessions')
            .update({
              winner_id: userId,
              ended_at: new Date().toISOString(),
            })
            .eq('id', dbSessionId);

          if (error) console.error(error);
        }

        // Record replay (only host saves to avoid duplicate inserts)
        recorder.current.recordMove(userId, 'finish', { time: Date.now() });
        if (isHost) {
          await recorder.current.save(userId).catch(console.error);
        }

        // Broadcast finish to partner with final board data
        broadcastMove({
          type: 'finish',
          winnerId: userId,
          winnerName: user?.name || 'You',
          finalGrid: currentGrid,
        });

        setShowInspection(true);
      }
    },
    [grid, userId, user, dbSessionId, isHost, broadcastMove]
  );

  // Drag and drop / click logic
  const handleSelectRackTile = (tileId) => {
    if (winner) return;
    setSelectedRackTileId(tileId === selectedRackTileId ? null : tileId);
  };

  const handleCellClick = (r, c) => {
    if (winner || !grid) return;

    const cell = grid[r][c];
    if (!cell || cell.type !== 'number' || !cell.isHidden || getLockedCellsMap(grid)[`${r}-${c}`])
      return;

    // Check if cell is currently occupied
    if (cell.currentValue !== undefined && cell.currentValue !== null) {
      // Recall placed tile
      const val = cell.currentValue;
      const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));
      newGrid[r][c].currentValue = null;
      recalculateIntermediateResults(newGrid);
      setGrid(newGrid);

      // Find the first matching placed tile in rack and restore it
      setRackTiles((prev) =>
        prev.map((t) => {
          if (t.value === val && t.isPlaced) {
            return { ...t, isPlaced: false };
          }
          return t;
        })
      );

      // Update progress
      updateAndBroadcastProgress(newGrid);
      return;
    }

    // Place selected tile
    if (selectedRackTileId) {
      const tile = rackTiles.find((t) => t.id === selectedRackTileId);
      if (!tile || tile.isPlaced) return;

      // Update grid
      const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));
      newGrid[r][c].currentValue = tile.value;
      recalculateIntermediateResults(newGrid);
      setGrid(newGrid);

      // Mark tile as placed
      setRackTiles((prev) =>
        prev.map((t) => (t.id === selectedRackTileId ? { ...t, isPlaced: true } : t))
      );

      setSelectedRackTileId(null);

      // Web Vibrate trigger
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      // Check results and progress
      updateAndBroadcastProgress(newGrid);
      checkBoardCompletion(newGrid);
    }
  };

  // HTML5 Drag-and-drop hooks for Desktop
  const handleDragStart = (e, tileId) => {
    if (winner) return;
    e.dataTransfer.setData('text/plain', tileId);
    setIsDragActive(true);
  };

  const handleBoardDragStart = (e, r, c, val) => {
    if (winner) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'board', r, c, value: val }));
    setIsDragActive(true);
  };

  const handleDragEnd = () => {
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, r, c) => {
    e.preventDefault();
    setIsDragActive(false);

    if (winner || !grid) return;

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    const cell = grid[r][c];
    if (
      !cell ||
      cell.type !== 'number' ||
      !cell.isHidden ||
      cell.currentValue ||
      getLockedCellsMap(grid)[`${r}-${c}`]
    )
      return;

    try {
      if (rawData.startsWith('{')) {
        // Board to board move
        const data = JSON.parse(rawData);
        if (data.source === 'board') {
          const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));
          newGrid[data.r][data.c].currentValue = null;
          newGrid[r][c].currentValue = data.value;
          recalculateIntermediateResults(newGrid);
          setGrid(newGrid);
          updateAndBroadcastProgress(newGrid);
          checkBoardCompletion(newGrid);
        }
      } else {
        // Rack to board move
        const tile = rackTiles.find((t) => t.id === rawData);
        if (!tile || tile.isPlaced) return;

        const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));
        newGrid[r][c].currentValue = tile.value;
        recalculateIntermediateResults(newGrid);
        setGrid(newGrid);

        setRackTiles((prev) => prev.map((t) => (t.id === rawData ? { ...t, isPlaced: true } : t)));

        if (navigator.vibrate) {
          navigator.vibrate(10);
        }

        updateAndBroadcastProgress(newGrid);
        checkBoardCompletion(newGrid);
      }
    } catch (err) {
      console.error('Error handling desktop drop:', err);
    }
  };

  const handleDropOnRack = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (rawData && rawData.startsWith('{')) {
        const data = JSON.parse(rawData);
        if (data.source === 'board') {
          const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));
          newGrid[data.r][data.c].currentValue = null;
          recalculateIntermediateResults(newGrid);
          setGrid(newGrid);

          setRackTiles((prev) =>
            prev.map((t) => {
              if (t.value === data.value && t.isPlaced) {
                return { ...t, isPlaced: false };
              }
              return t;
            })
          );

          updateAndBroadcastProgress(newGrid);
        }
      }
    } catch (err) {
      console.error('Error handling desktop drop on rack:', err);
    }
  };

  // Mobile touch drag/drop handlers
  const handleTouchStartRack = (e, tile) => {
    if (winner) return;
    const touch = e.touches[0];
    setTouchDrag({
      type: 'rack',
      id: tile.id,
      value: tile.value,
      x: touch.clientX,
      y: touch.clientY,
    });
  };

  const handleTouchStartBoard = (e, r, c, val) => {
    if (winner) return;
    const touch = e.touches[0];
    setTouchDrag({
      type: 'board',
      r,
      c,
      value: val,
      x: touch.clientX,
      y: touch.clientY,
    });
  };

  const handleTouchDropOnCell = useCallback(
    (drag, r, c) => {
      if (winner || !grid) return;
      const cell = grid[r][c];
      if (
        !cell ||
        cell.type !== 'number' ||
        !cell.isHidden ||
        cell.currentValue ||
        getLockedCellsMap(grid)[`${r}-${c}`]
      )
        return;

      const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));

      if (drag.type === 'rack') {
        newGrid[r][c].currentValue = drag.value;
        recalculateIntermediateResults(newGrid);
        setGrid(newGrid);
        setRackTiles((prev) => prev.map((t) => (t.id === drag.id ? { ...t, isPlaced: true } : t)));
      } else if (drag.type === 'board') {
        newGrid[drag.r][drag.c].currentValue = null;
        newGrid[r][c].currentValue = drag.value;
        recalculateIntermediateResults(newGrid);
        setGrid(newGrid);
      }

      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      updateAndBroadcastProgress(newGrid);
      checkBoardCompletion(newGrid);
    },
    [grid, winner, checkBoardCompletion, updateAndBroadcastProgress]
  );

  const handleTouchDropOnRack = useCallback(
    (drag) => {
      if (drag.type === 'board') {
        const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));
        newGrid[drag.r][drag.c].currentValue = null;
        recalculateIntermediateResults(newGrid);
        setGrid(newGrid);

        setRackTiles((prev) =>
          prev.map((t) => {
            if (t.value === drag.value && t.isPlaced) {
              return { ...t, isPlaced: false };
            }
            return t;
          })
        );

        updateAndBroadcastProgress(newGrid);
      }
    },
    [grid, updateAndBroadcastProgress]
  );

  // Global touch listeners when a touch drag is active
  useEffect(() => {
    if (!touchDrag) return;

    const handleTouchMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      setTouchDrag((prev) => (prev ? { ...prev, x: touch.clientX, y: touch.clientY } : null));
    };

    const handleTouchEnd = (e) => {
      if (!touchDrag) return;
      const touch = e.changedTouches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);

      const slotElement = element?.closest('.math-cell-slot');
      const rackElement = element?.closest('.math-rack');

      if (slotElement) {
        const match = slotElement.id.match(/math-slot-(\d+)-(\d+)/);
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

  // Rematch & Forfeit controls
  const handleRequestRematch = () => {
    setRematchStatus('sending');
    broadcastMove({ type: 'rematch_request' });
  };

  const handleAcceptRematch = async () => {
    try {
      setLoading(true);
      const puzzle = await generatePuzzleAsync(difficulty);

      const puzzleData = {
        difficulty,
        initial_grid: puzzle.grid,
        hidden_values: puzzle.hiddenValues,
      };

      const { data: session, error } = await supabase
        .from('game_sessions')
        .insert({
          game_type: 'math_puzzle',
          player_a_id: userId,
          player_b_id: partnerId,
          puzzle_data: puzzleData,
          player_states: {},
        })
        .select('*')
        .single();

      if (error) {
        console.error(error);
        return;
      }

      handleResetLocalState(session);
      broadcastMove({ type: 'rematch_accept', newSession: session });
    } catch (err) {
      console.error('Error accepting rematch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRematch = () => {
    setRematchStatus('none');
    broadcastMove({ type: 'rematch_decline' });
  };

  const handleBackAction = () => {
    if (rematchStatus === 'sending' || rematchStatus === 'receiving') {
      broadcastMove({ type: 'rematch_decline' });
    }
    if (!winner && grid) {
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

    // Mark partner as winner in DB
    if (dbSessionId) {
      await supabase
        .from('game_sessions')
        .update({
          winner_id: partnerId,
          ended_at: new Date().toISOString(),
        })
        .eq('id', dbSessionId);
    }

    onBack();
  };

  // Emojis & Chat reactions
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

  const result =
    winner === 'win' ? 'win' : winner === 'loss' ? 'loss' : winner === 'draw' ? 'draw' : null;

  return (
    <div className="math-puzzle-container">
      <GameHeader
        gameName={gameName}
        user={user}
        partner={partner}
        isMyTurn={!winner}
        userScore={myProgress}
        partnerScore={partnerProgress}
        onBack={handleBackAction}
        activeUserBubble={activeUserBubble}
        activePartnerBubble={activePartnerBubble}
        userEmojis={userEmojis}
        partnerEmojis={partnerEmojis}
      />

      {/* Difficulty selector (If game not started and user is host) */}
      {!difficulty && !loading && (
        <div className="math-puzzle-main">
          {!partnerOnline ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <h3 className="font-heading text-lg font-bold">Waiting for partner…</h3>
              <p className="text-xs text-text-muted max-w-xs leading-relaxed">
                We&apos;re waiting for {partner?.name || 'your partner'} to accept the game invite.
              </p>
            </div>
          ) : isHost ? (
            <div className="difficulty-selector">
              <h2 className="font-heading text-xl font-bold text-text-main">Choose Difficulty</h2>
              <p className="text-xs text-text-muted">
                Both of you will solve the identical equation layout in a race to the finish!
              </p>
              <div className="difficulty-options">
                <button onClick={() => handleStartRace('easy')} className="btn-difficulty">
                  Easy
                  <span className="desc">5×5 grid, operators (+, -), numbers 1-10</span>
                </button>
                <button onClick={() => handleStartRace('medium')} className="btn-difficulty">
                  Medium
                  <span className="desc">7×7 grid, operators (+, -, ×), numbers 1-20</span>
                </button>
                <button onClick={() => handleStartRace('expert')} className="btn-difficulty">
                  Expert
                  <span className="desc">9×9 grid, operators (+, -, ×, ÷), numbers 1-100</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 max-w-xs text-center">
              <h3 className="font-heading text-lg font-bold">Waiting for host…</h3>
              <p className="text-xs text-text-muted">
                Your partner {partner?.name || 'Partner'} is selecting the race difficulty. Get
                ready!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Game board view */}
      {difficulty && grid && (
        <div className="math-puzzle-main">
          {/* Race Heartbeat bar */}
          <div className="flex flex-col gap-1 w-full max-w-[360px] px-1">
            <div className="flex justify-between text-[10px] text-text-muted font-bold">
              <span>Your Progress: {myProgress}%</span>
              <span>Partner: {partnerProgress}%</span>
            </div>
            <div className="heartbeat-bar-container">
              <div className="heartbeat-bar-partner" style={{ width: `${partnerProgress}%` }} />
              <div className="heartbeat-bar-user" style={{ width: `${myProgress}%` }} />
            </div>
          </div>

          {/* Board renderer */}
          <div onDragOver={handleDragOver} className="math-board-wrapper">
            <MathPuzzleBoard
              grid={grid}
              onCellClick={handleCellClick}
              isDragActive={isDragActive}
              onDropCell={handleDrop}
              onDragStartTile={handleBoardDragStart}
              onTouchStartTile={handleTouchStartBoard}
            />
          </div>

          {/* Winner banner */}
          {winner && (
            <div className="text-xs font-bold text-center">
              {winner === 'win'
                ? 'You completed the race!'
                : `${partner?.name || 'Partner'} completed the race!`}
              <button
                onClick={() => setShowInspection(true)}
                className="block mx-auto mt-2 text-xs font-extrabold text-amber-500 underline"
              >
                Inspect both grids
              </button>
            </div>
          )}
        </div>
      )}

      {/* Rack tiles display */}
      {difficulty && grid && !winner && (
        <MathPuzzleTileRack
          tiles={rackTiles}
          selectedTileId={selectedRackTileId}
          onSelectTile={handleSelectRackTile}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onTouchStart={handleTouchStartRack}
          onDragOverRack={(e) => e.preventDefault()}
          onDropRack={handleDropOnRack}
        />
      )}

      {/* Emojis floating */}
      <div className="absolute bottom-24 left-6 pointer-events-none w-16 h-48 overflow-visible flex items-end justify-center z-50">
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

      <div className="absolute bottom-24 right-6 pointer-events-none w-16 h-48 overflow-visible flex items-end justify-center z-50">
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

      {difficulty && (
        <div className={winner ? 'math-reaction-tray winner' : 'math-reaction-tray'}>
          <QuickReactionTray onSendReaction={handleSendReaction} onSendChat={handleSendChat} />
        </div>
      )}

      <ForfeitModal
        isOpen={showForfeitModal}
        onClose={() => setShowForfeitModal(false)}
        onConfirm={handleForfeitConfirm}
      />

      {/* Post-race inspection overlay */}
      {showInspection && partnerGrid && (
        <InspectionPanel
          myGrid={grid}
          partnerGrid={partnerGrid}
          user={user}
          partner={partner}
          winnerId={winnerId}
          winnerName={winnerName}
          onClose={() => setShowInspection(false)}
        />
      )}

      {/* Game results rematch options */}
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
            left: touchDrag.x - 22,
            top: touchDrag.y - 22,
            pointerEvents: 'none',
            zIndex: 1000,
            width: '44px',
            height: '44px',
          }}
          className="math-placed-tile flex items-center justify-center font-extrabold text-lg select-none touch-drag-ghost"
        >
          {touchDrag.value}
        </div>
      )}
    </div>
  );
}
