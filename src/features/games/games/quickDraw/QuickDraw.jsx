/**
 * @file QuickDraw.jsx
 * @description Quick Draw game orchestrator. Manages all game state, real-time sync,
 * timer, canvas drawing logic, and delegates rendering to focused sub-components:
 * {@link QuickDrawSetup}, {@link QuickDrawCanvas}, and {@link QuickDrawRoundOver}.
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import GameResults from '../../components/GameResults';
import { useGameSync } from '../../hooks/useGameSync';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useQuickDrawLogic, WORD_LIST } from './useGameLogic';
import { GameRecorder } from '../../lib/gameRecorder';
import { generateSessionId } from '../../lib/gameEngine';
import ForfeitModal from '../../components/ForfeitModal';
import QuickReactionTray from '../../components/QuickReactionTray';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import QuickDrawSetup from './QuickDrawSetup';
import QuickDrawCanvas from './QuickDrawCanvas';
import QuickDrawRoundOver from './QuickDrawRoundOver';

/**
 * Returns 3 random, unique words from the WORD_LIST.
 *
 * @returns {string[]} An array of 3 random word suggestions.
 */
function getRandomSuggestions() {
  const shuffled = [...WORD_LIST].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

/**
 * Quick Draw game component.
 *
 * @param {object} props
 * @param {string} props.gameId - The unique game type ID.
 * @param {string} props.gameName - Display name shown in the game header.
 * @param {string} props.userId - The local user's auth ID.
 * @param {string} props.partnerId - The partner's auth ID.
 * @param {object} props.user - Local user profile object.
 * @param {object} props.partner - Partner profile object.
 * @param {Function} props.onBack - Callback invoked when the user exits the game.
 * @param {boolean} props.isHost - Whether the local user is the game host (lowest userId).
 * @returns {React.ReactElement}
 */
export default function QuickDraw({
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
  const sessionId = useMemo(
    () => generateSessionId(gameId, userId, partnerId),
    [gameId, userId, partnerId]
  );
  const recorder = useRef(new GameRecorder(gameId, userId, partnerId));
  const canvasRef = useRef(null);

  // Local Drawing state
  const drawing = useRef(false);
  const pointsRef = useRef([]);
  const [brushColor, setBrushColor] = useState('#8B5CF6');
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);

  // Remote Drawing refs
  const remoteDrawing = useRef(false);
  const remotePointsRef = useRef([]);
  const remoteColorRef = useRef('#8B5CF6');
  const remoteSizeRef = useRef(6);
  const remoteIsEraserRef = useRef(false);

  // Guesser / Drawer state
  const [guessInput, setGuessInput] = useState('');
  const [guessResult, setGuessResult] = useState(null); // 'correct' | 'wrong'
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [activeUserBubble, setActiveUserBubble] = useState('');
  const [activePartnerBubble, setActivePartnerBubble] = useState('');
  const [userEmojis, setUserEmojis] = useState([]);
  const [partnerEmojis, setPartnerEmojis] = useState([]);
  const [endReason, setEndReason] = useState('completion');
  const [rematchStatus, setRematchStatus] = useState('none');

  // Typing indicator state
  const [isLocalTyping, setIsLocalTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);

  // Celebration burst emojis
  const [winCelebrationEmojis, setWinCelebrationEmojis] = useState([]);

  // Setup screen state
  const [customWord, setCustomWord] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  const [durationSelect, setDurationSelect] = useState(60);
  const [wordSuggestions, setWordSuggestions] = useState([]);

  const {
    targetWord,
    setTargetWord,
    guesses,
    roundOver,
    gameOver,
    winner,
    currentRound,
    maxRounds,
    scores,
    iAmDrawer,
    roundDuration,
    setRoundDuration,
    submitGuess,
    handleTimeout,
    forceWinner,
    nextRound,
    reset,
  } = useQuickDrawLogic({ userId, partnerId, isHost });

  const [guestSeconds, setGuestSeconds] = useState(roundDuration);

  /**
   * Clears all pixels on the local canvas.
   *
   * @returns {void}
   */
  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handlersRef = useRef({});

  /**
   * Triggers a full-screen party emoji celebration burst.
   *
   * @returns {void}
   */
  const triggerWinCelebration = () => {
    const emojis = ['🎉', '✨', '🥳', '💖', '👑', '🎨', '🔥', '🏆'];
    const newEmojis = [];
    for (let i = 0; i < 35; i++) {
      const id = Date.now() + Math.random() + i;
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 0.8;
      const duration = 2.0 + Math.random() * 2.0;
      const scale = 0.8 + Math.random() * 1.0;
      newEmojis.push({ id, emoji, left, delay, duration, scale });
    }
    setWinCelebrationEmojis(newEmojis);
    setTimeout(() => {
      setWinCelebrationEmojis([]);
    }, 5000);
  };

  /**
   * Handles incoming real-time payloads from the partner.
   *
   * @param {object} payload - The broadcast payload from `useGameSync`.
   * @returns {void}
   */
  const handleRemoteMove = useCallback((payload) => {
    const {
      gameId,
      submitGuess,
      handleTimeout,
      setTargetWord,
      setRoundDuration,
      partnerId,
      iAmDrawer,
      forceWinner,
      userId,
      setPartnerEmojis,
      setActivePartnerBubble,
      reset,
      resetTimer,
      setEndReason,
      setRematchStatus,
      nextRound,
    } = handlersRef.current;

    if (payload.type === 'setup_complete') {
      setTargetWord(payload.targetWord);
      setRoundDuration(payload.duration);
      setGuestSeconds(payload.duration);
    } else if (payload.type === 'next_round') {
      nextRound();
      clearCanvasLocal();
      resetTimer(false);
    } else if (payload.type === 'typing') {
      setPartnerIsTyping(payload.isTyping);
    } else if (payload.type === 'timer_tick') {
      if (!iAmDrawer) {
        setGuestSeconds(payload.seconds);
        if (payload.targetWord) {
          setTargetWord(payload.targetWord);
        }
      }
    } else if (payload.type === 'timeout') {
      handleTimeout();
      setEndReason('timeout');
    } else if (payload.type === 'rematch_request') {
      setRematchStatus('receiving');
    } else if (payload.type === 'rematch_accept') {
      const nextDrawer = !iAmDrawer;
      reset(nextDrawer);
      setRematchStatus('none');
      setEndReason('completion');
      clearCanvasLocal();
      recorder.current = new GameRecorder(gameId, userId, partnerId);
      resetTimer(false);
    } else if (payload.type === 'rematch_decline') {
      setRematchStatus('none');
    } else if (payload.type === 'forfeit') {
      forceWinner(userId);
      setEndReason('forfeit');
      recorder.current.recordMove(partnerId, 'forfeit', {});
    } else if (payload.type === 'guess') {
      const { correct } = submitGuess(payload.text, partnerId);
      if (correct) {
        setEndReason('correct_guess');
        triggerWinCelebration();
      }
      recorder.current.recordMove(partnerId, 'guess', { text: payload.text });
    } else if (payload.type === 'stroke_start' && !iAmDrawer) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      remoteDrawing.current = true;
      const px = payload.x * canvas.width;
      const py = payload.y * canvas.height;
      remotePointsRef.current = [{ x: px, y: py }];
      remoteColorRef.current = payload.color;
      remoteSizeRef.current = payload.size;
      remoteIsEraserRef.current = payload.isEraser;

      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const size = payload.isEraser ? 24 : payload.size;
      ctx.beginPath();
      ctx.arc(px, py, size / 2, 0, Math.PI * 2);
      if (payload.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fill();
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = payload.color;
        ctx.fill();
      }
    } else if (payload.type === 'stroke' && !iAmDrawer) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const px = payload.x * canvas.width;
      const py = payload.y * canvas.height;

      if (remotePointsRef.current.length === 0) {
        remotePointsRef.current = [{ x: px, y: py }];
        remoteDrawing.current = true;
        return;
      }

      remotePointsRef.current.push({ x: px, y: py });
      const points = remotePointsRef.current;

      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = remoteColorRef.current;
      ctx.lineWidth = remoteIsEraserRef.current ? 24 : remoteSizeRef.current;
      ctx.globalCompositeOperation = remoteIsEraserRef.current ? 'destination-out' : 'source-over';

      if (points.length >= 3) {
        ctx.beginPath();
        const xc1 = (points[points.length - 3].x + points[points.length - 2].x) / 2;
        const yc1 = (points[points.length - 3].y + points[points.length - 2].y) / 2;
        ctx.moveTo(xc1, yc1);
        const xc2 = (points[points.length - 2].x + points[points.length - 1].x) / 2;
        const yc2 = (points[points.length - 2].y + points[points.length - 1].y) / 2;
        ctx.quadraticCurveTo(points[points.length - 2].x, points[points.length - 2].y, xc2, yc2);
        ctx.stroke();
      } else if (points.length === 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();
      }
    } else if (payload.type === 'stroke_end' && !iAmDrawer) {
      remoteDrawing.current = false;
      remotePointsRef.current = [];
    } else if (payload.type === 'clear') {
      clearCanvasLocal();
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

  const { seconds, reset: resetTimer } = useGameTimer(
    roundDuration,
    () => {
      if (iAmDrawer) {
        handleTimeout();
        setEndReason('timeout');
        broadcastMove({ type: 'timeout' });
      }
    },
    iAmDrawer && !gameOver && !roundOver && targetWord !== ''
  );

  // Setup random suggestions when the drawer needs to pick a word
  useEffect(() => {
    if (iAmDrawer && !targetWord && !gameOver) {
      const timer = setTimeout(() => {
        setWordSuggestions(getRandomSuggestions());
        setSelectedWord('');
        setCustomWord('');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [iAmDrawer, targetWord, gameOver]);

  // Restart timer whenever targetWord or roundDuration is updated
  useEffect(() => {
    if (targetWord && !roundOver && !gameOver) {
      resetTimer(true);
    }
  }, [targetWord, roundDuration, resetTimer, gameOver, roundOver]);

  // Save replay on end (only host saves to prevent duplicates)
  useEffect(() => {
    if (!gameOver || !isHost) return;
    recorder.current.save(winner === 'draw' ? null : winner).catch(console.error);
  }, [gameOver, winner, isHost]);

  // Listen for partner decline to exit game immediately without forfeit modal
  useEffect(() => {
    const handleDecline = () => {
      onBack();
    };
    window.addEventListener('game-invite-declined', handleDecline);
    return () => window.removeEventListener('game-invite-declined', handleDecline);
  }, [onBack]);

  // Keep handler references fresh so the stable handleRemoteMove callback can read current values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    handlersRef.current = {
      gameId,
      submitGuess,
      handleTimeout,
      setTargetWord,
      setRoundDuration,
      partnerId,
      iAmDrawer,
      forceWinner,
      userId,
      setUserEmojis,
      setPartnerEmojis,
      setActivePartnerBubble,
      reset,
      resetTimer,
      setEndReason,
      setRematchStatus,
      nextRound,
    };
  });

  // Drawer broadcasts the timer tick and current word periodically
  useEffect(() => {
    if (iAmDrawer && !gameOver && !roundOver && targetWord) {
      broadcastMove({ type: 'timer_tick', seconds, targetWord });
    }
  }, [seconds, iAmDrawer, gameOver, roundOver, targetWord, broadcastMove]);

  /**
   * Converts mouse or touch event coordinates to canvas-space coordinates.
   *
   * @param {MouseEvent|TouchEvent} e - The raw input event.
   * @param {HTMLCanvasElement} canvas - The canvas DOM node.
   * @returns {{x: number, y: number}} The scaled coordinates.
   */
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

  /**
   * Begins a new drawing path locally and broadcasts the stroke-start event.
   *
   * @param {MouseEvent|TouchEvent} e - The raw pointer/touch event.
   * @returns {void}
   */
  const startDraw = (e) => {
    if (!iAmDrawer || gameOver || roundOver || !targetWord) return;
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    pointsRef.current = [pos];

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#000000' : brushColor;
    ctx.lineWidth = isEraser ? 24 : brushSize;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (isEraser ? 24 : brushSize) / 2, 0, Math.PI * 2);
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = brushColor;
      ctx.fill();
    }

    broadcastMove({
      type: 'stroke_start',
      x: pos.x / canvas.width,
      y: pos.y / canvas.height,
      color: brushColor,
      size: brushSize,
      isEraser: isEraser,
    });
  };

  /**
   * Extends the active drawing path with quadratic curve smoothing and broadcasts the point.
   *
   * @param {MouseEvent|TouchEvent} e - The raw pointer/touch event.
   * @returns {void}
   */
  const draw = (e) => {
    if (!drawing.current || !iAmDrawer || !targetWord) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    const points = pointsRef.current;
    points.push(pos);

    broadcastMove({
      type: 'stroke',
      x: pos.x / canvas.width,
      y: pos.y / canvas.height,
    });

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = isEraser ? 24 : brushSize;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';

    if (points.length >= 3) {
      ctx.beginPath();
      const xc1 = (points[points.length - 3].x + points[points.length - 2].x) / 2;
      const yc1 = (points[points.length - 3].y + points[points.length - 2].y) / 2;
      ctx.moveTo(xc1, yc1);
      const xc2 = (points[points.length - 2].x + points[points.length - 1].x) / 2;
      const yc2 = (points[points.length - 2].y + points[points.length - 1].y) / 2;
      ctx.quadraticCurveTo(points[points.length - 2].x, points[points.length - 2].y, xc2, yc2);
      ctx.stroke();
    } else if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
    }
  };

  /**
   * Ends the active drawing stroke and broadcasts the stroke-end event.
   *
   * @returns {void}
   */
  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (iAmDrawer) {
      broadcastMove({ type: 'stroke_end' });
    }
  };

  /**
   * Clears the canvas locally and broadcasts the clear event to the partner.
   *
   * @returns {void}
   */
  const clearCanvas = () => {
    clearCanvasLocal();
    broadcastMove({ type: 'clear' });
  };

  /**
   * Broadcasts a burst of floating user emojis and shows them locally.
   *
   * @param {string} emoji - The emoji character to send.
   * @returns {void}
   */
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

  /**
   * Sends a text bubble chat message to the partner.
   *
   * @param {string} text - The message text.
   * @returns {void}
   */
  const handleSendChat = (text) => {
    const reactionsEnabled = localStorage.getItem('preferences_game_reactions_enabled') !== 'false';
    if (!reactionsEnabled) return;
    setActiveUserBubble(text);
    setTimeout(() => {
      setActiveUserBubble('');
    }, 4000);
    broadcastMove({ type: 'chat', text });
  };

  /**
   * Requests a rematch from the partner after the game ends.
   *
   * @returns {void}
   */
  const handleRequestRematch = () => {
    setRematchStatus('sending');
    broadcastMove({ type: 'rematch_request' });
  };

  /**
   * Accepts the partner's rematch request and resets game state.
   *
   * @returns {void}
   */
  const handleAcceptRematch = () => {
    const nextDrawer = !iAmDrawer;
    reset(nextDrawer);
    setRematchStatus('none');
    setEndReason('completion');
    clearCanvasLocal();
    recorder.current = new GameRecorder(gameId, userId, partnerId);
    resetTimer(false);
    broadcastMove({ type: 'rematch_accept' });
  };

  /**
   * Declines the partner's rematch request.
   *
   * @returns {void}
   */
  const handleDeclineRematch = () => {
    setRematchStatus('none');
    broadcastMove({ type: 'rematch_decline' });
  };

  /**
   * Handles the back/exit button — prompts forfeit if the game is still in progress.
   *
   * @returns {void}
   */
  const handleBackAction = () => {
    if (rematchStatus === 'sending' || rematchStatus === 'receiving') {
      broadcastMove({ type: 'rematch_decline' });
    }
    if (!gameOver && partnerOnline) {
      setShowForfeitModal(true);
    } else {
      onBack();
    }
  };

  /**
   * Confirms the forfeit action: records, broadcasts, saves replay, and exits.
   *
   * @returns {Promise<void>}
   */
  const handleForfeitConfirm = async () => {
    setShowForfeitModal(false);
    recorder.current.recordMove(userId, 'forfeit', {});
    broadcastMove({ type: 'forfeit', senderId: userId });
    if (isHost) {
      await recorder.current.save(partnerId).catch(console.error);
    }
    onBack();
  };

  /**
   * Handles local submission of a guess from the guesser input.
   *
   * @param {Event} e - Form submit event.
   * @returns {void}
   */
  const handleGuessSubmit = (e) => {
    e?.preventDefault();
    if (!guessInput.trim() || gameOver) return;
    const trimmedVal = guessInput.trim();

    if (isLocalTyping) {
      setIsLocalTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      broadcastMove({ type: 'typing', isTyping: false });
    }

    const { correct } = submitGuess(trimmedVal, userId);
    recorder.current.recordMove(userId, 'guess', { text: trimmedVal });
    broadcastMove({ type: 'guess', text: trimmedVal });
    setGuessResult(correct ? 'correct' : 'wrong');
    if (correct) {
      setEndReason('correct_guess');
      triggerWinCelebration();
    }
    setGuessInput('');
    if (!correct) setTimeout(() => setGuessResult(null), 800);
  };

  /**
   * Tracks typing state for the guesser and broadcasts a typing indicator.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event.
   * @returns {void}
   */
  const handleGuessInputChange = (e) => {
    const val = e.target.value;
    setGuessInput(val);

    if (!isLocalTyping) {
      setIsLocalTyping(true);
      broadcastMove({ type: 'typing', isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsLocalTyping(false);
      broadcastMove({ type: 'typing', isTyping: false });
    }, 2000);
  };

  /**
   * Clears the typing indicator when the guess input loses focus.
   *
   * @returns {void}
   */
  const handleGuessInputBlur = () => {
    if (isLocalTyping) {
      setIsLocalTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      broadcastMove({ type: 'typing', isTyping: false });
    }
  };

  /**
   * Finalises round setup and transitions to the drawing phase.
   *
   * @returns {void}
   */
  const handleStartRound = () => {
    const word = (customWord.trim() || selectedWord).trim();
    if (!word) return;
    setTargetWord(word);
    setRoundDuration(durationSelect);
    broadcastMove({ type: 'setup_complete', targetWord: word, duration: durationSelect });
  };

  /**
   * Advances the match to the next round.
   *
   * @returns {void}
   */
  const handleNextRound = () => {
    nextRound();
    clearCanvasLocal();
    resetTimer(false);
    broadcastMove({ type: 'next_round' });
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
        timeLeft={gameOver ? undefined : iAmDrawer ? seconds : guestSeconds}
        onBack={handleBackAction}
        activeUserBubble={activeUserBubble}
        activePartnerBubble={activePartnerBubble}
        userEmojis={userEmojis}
        partnerEmojis={partnerEmojis}
      />

      {/* Confetti celebration overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100]">
        {winCelebrationEmojis.map((item) => (
          <span
            key={item.id}
            style={{
              left: `${item.left}%`,
              bottom: `-40px`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`,
            }}
            className="absolute text-3xl animate-float-up pointer-events-none"
          >
            <span
              className="animate-float-sway inline-block"
              style={{ transform: `scale(${item.scale})` }}
            >
              {item.emoji}
            </span>
          </span>
        ))}
      </div>

      {!gameOver && !partnerOnline ? (
        <div className="flex-grow flex flex-col items-center justify-center gap-3 text-center py-16">
          <LoadingSpinner size="md" />
          <h3 className="font-heading text-lg font-bold">Waiting for partner…</h3>
          <p className="text-xs text-text-muted max-w-xs leading-relaxed">
            We&apos;re waiting for {partner?.name || 'your partner'} to accept the game invite.
          </p>
        </div>
      ) : (
        <>
          <div className="flex-grow flex flex-col items-center justify-center p-4 gap-4 overflow-hidden">
            {/* Pre-game / Round Setup Screen */}
            {!gameOver && !roundOver && !targetWord && (
              <QuickDrawSetup
                iAmDrawer={iAmDrawer}
                currentRound={currentRound}
                partner={partner}
                wordSuggestions={wordSuggestions}
                selectedWord={selectedWord}
                setSelectedWord={setSelectedWord}
                customWord={customWord}
                setCustomWord={setCustomWord}
                durationSelect={durationSelect}
                setDurationSelect={setDurationSelect}
                handleStartRound={handleStartRound}
              />
            )}

            {/* Active gameplay canvas + controls */}
            {!gameOver && !roundOver && targetWord && (
              <QuickDrawCanvas
                canvasRef={canvasRef}
                iAmDrawer={iAmDrawer}
                targetWord={targetWord}
                partner={partner}
                brushColor={brushColor}
                setBrushColor={setBrushColor}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                isEraser={isEraser}
                setIsEraser={setIsEraser}
                guessInput={guessInput}
                guessResult={guessResult}
                partnerIsTyping={partnerIsTyping}
                guesses={guesses}
                startDraw={startDraw}
                draw={draw}
                endDraw={endDraw}
                clearCanvas={clearCanvas}
                handleGuessSubmit={handleGuessSubmit}
                handleGuessInputChange={handleGuessInputChange}
                handleGuessInputBlur={handleGuessInputBlur}
              />
            )}
          </div>

          {/* Round Over overlay */}
          {roundOver && !gameOver && (
            <QuickDrawRoundOver
              winner={winner}
              userId={userId}
              partnerId={partnerId}
              partner={partner}
              user={user}
              targetWord={targetWord}
              currentRound={currentRound}
              maxRounds={maxRounds}
              scores={scores}
              handleNextRound={handleNextRound}
            />
          )}
        </>
      )}

      {/* Game Over screen */}
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

      {/* Floating user emojis */}
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

      {/* Floating partner emojis */}
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

      {(gameOver || partnerOnline) && (
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
