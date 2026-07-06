/* eslint-disable */
/**
 * @file WordChain.jsx
 * @description Word Chain game orchestrator. Manages all game state, real-time sync,
 * timer, scoring, and definition enrichment. Delegates the lobby screen to
 * {@link WordChainSetup} and the definition drawer to {@link WordChainDefinitionDrawer}.
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import GameHeader from '../../components/GameHeader';
import GameResults from '../../components/GameResults';
import { useGameSync } from '../../hooks/useGameSync';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useWordChainLogic } from './useGameLogic';
import { GameRecorder } from '../../lib/gameRecorder';
import { generateSessionId, calculateLetterPoints, validateWordChain } from '../../lib/gameEngine';
import ForfeitModal from '../../components/ForfeitModal';
import QuickReactionTray from '../../components/QuickReactionTray';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import WordChainSetup from './WordChainSetup';
import WordChainDefinitionDrawer from './WordChainDefinitionDrawer';
import { validateOnlineWord, fetchDefinitionFromApi } from './dictionaryService';
import localWords from './words.json';

/** @type {Set<string>} Pre-computed set for O(1) local word lookups. */
const localWordsSet = new Set(localWords);

/**
 * Word Chain game component.
 *
 * @param {object} props
 * @param {string} props.gameId - The unique game type ID.
 * @param {string} props.gameName - Display name shown in the game header.
 * @param {string} props.userId - The local user's auth ID.
 * @param {string} props.partnerId - The partner's auth ID.
 * @param {object} props.user - Local user profile object.
 * @param {object} props.partner - Partner profile object.
 * @param {Function} props.onBack - Callback invoked when the user exits the game.
 * @param {boolean} props.isHost - Whether the local user initiated the game (controls config + timer).
 * @returns {React.ReactElement}
 */
export default function WordChain({
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
  // The host (game initiator) is always the config-setter and timer controller.
  // We do NOT use userId < partnerId here — that would always give config to the same
  // person regardless of who actually started the game.
  const iGoFirst = isHost;
  const sessionId = useMemo(
    () => generateSessionId(gameId, userId, partnerId),
    [gameId, userId, partnerId]
  );
  const recorder = useRef(new GameRecorder(gameId, userId, partnerId));

  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeUserBubble, setActiveUserBubble] = useState('');
  const [activePartnerBubble, setActivePartnerBubble] = useState('');
  const [userEmojis, setUserEmojis] = useState([]);
  const [partnerEmojis, setPartnerEmojis] = useState([]);
  const [endReason, setEndReason] = useState('completion');
  const [rematchStatus, setRematchStatus] = useState('none');

  // Game configuration and runtime state
  const [gameStarted, setGameStarted] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [selectedDefinitionWord, setSelectedDefinitionWord] = useState(null);
  const [drawerDefinition, setDrawerDefinition] = useState('');
  const [drawerPartOfSpeech, setDrawerPartOfSpeech] = useState('');
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [settings, setSettings] = useState({
    mode: 'classic', // 'classic' | 'panic'
    timerLimit: 30, // 15 | 30 | 45 | 60
    scoring: 'none', // 'none' | 'points_race'
    minLength: 'none', // 'none' | '3' | '4' | '5'
    maxLength: 'none', // 'none' | '6' | '8' | '10'
  });

  const {
    chain,
    isMyTurn,
    winner,
    winnerId,
    prevWord,
    lastError,
    setLastError,
    submitWord,
    handleTimeout,
    reset,
    forceWinner,
    updateWordDefinition,
  } = useWordChainLogic({ userId, partnerId, iGoFirst, settings });

  const [guestSeconds, setGuestSeconds] = useState(settings.timerLimit);
  const handlersRef = useRef({});

  // Calculate Letter Points scores dynamically
  const scores = useMemo(() => {
    let userScore = 0;
    let partnerScore = 0;
    chain.forEach((entry) => {
      const points = calculateLetterPoints(entry.word);
      if (entry.playerId === userId) {
        userScore += points;
      } else {
        partnerScore += points;
      }
    });
    return { userScore, partnerScore };
  }, [chain, userId]);

  // Points Race: first to 50 pts wins
  useEffect(() => {
    if (winner || !gameStarted) return;
    if (settings.scoring === 'points_race') {
      if (scores.userScore >= 50) {
        forceWinner(userId);
      } else if (scores.partnerScore >= 50) {
        forceWinner(partnerId);
      }
    }
  }, [scores, winner, gameStarted, settings.scoring, userId, partnerId, forceWinner]);

  // Panic Mode: reduce turn time by 2s per turn, floor at 5s
  const currentTurnLimit = useMemo(() => {
    const baseLimit = settings.timerLimit || 30;
    if (settings.mode !== 'panic') return baseLimit;
    return Math.max(baseLimit - chain.length * 2, 5);
  }, [chain.length, settings.mode, settings.timerLimit]);

  /**
   * Handles incoming real-time payloads from the partner.
   *
   * @param {object} payload - The broadcast payload from `useGameSync`.
   * @returns {void}
   */
  const handleRemoteMove = useCallback((payload) => {
    const {
      submitWord,
      handleTimeout,
      reset,
      forceWinner,
      partnerId,
      iGoFirst,
      gameId,
      userId,
      resetTimer,
      setPartnerEmojis,
      setActivePartnerBubble,
      setSettings,
      setGameStarted,
      setIsTimerPaused,
      setGuestSeconds,
      updateWordDefinition,
    } = handlersRef.current;

    if (payload.type === 'timer_tick') {
      if (!iGoFirst) setGuestSeconds(payload.seconds);
    } else if (payload.type === 'definition_update') {
      updateWordDefinition(payload.word, payload.definition, payload.partOfSpeech);
    } else if (payload.type === 'validating') {
      setIsTimerPaused(true);
    } else if (payload.type === 'validation_failed') {
      setIsTimerPaused(false);
    } else if (payload.type === 'settings_update') {
      setSettings(payload.settings);
      setGuestSeconds(payload.settings.timerLimit);
    } else if (payload.type === 'game_start') {
      setSettings(payload.settings);
      setGameStarted(true);
      setGuestSeconds(payload.settings.timerLimit);
    } else if (payload.type === 'word') {
      submitWord(payload.word, partnerId, payload.definition, payload.partOfSpeech);
      recorder.current.recordMove(partnerId, 'word', {
        word: payload.word,
        definition: payload.definition,
        partOfSpeech: payload.partOfSpeech,
      });
      setIsTimerPaused(false);
    } else if (payload.type === 'timeout') {
      handleTimeout(payload.loserId);
      setEndReason('timeout');
    } else if (payload.type === 'rematch_request') {
      setRematchStatus('receiving');
    } else if (payload.type === 'rematch_accept') {
      reset(iGoFirst);
      setRematchStatus('none');
      setEndReason('completion');
      setGameStarted(false);
      setIsTimerPaused(false);
      recorder.current = new GameRecorder(gameId, userId, partnerId);
      if (iGoFirst) resetTimer(true);
    } else if (payload.type === 'rematch_decline') {
      setRematchStatus('none');
    } else if (payload.type === 'forfeit') {
      forceWinner(userId);
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
      setTimeout(() => setActivePartnerBubble(''), 4000);
    }
  }, []);

  const broadcastMove = useGameSync(gameId, sessionId, handleRemoteMove);

  const {
    seconds,
    reset: resetTimer,
    pause: pauseTimer,
    start: startTimer,
  } = useGameTimer(
    currentTurnLimit,
    () => {
      if (iGoFirst) {
        const loserId = isMyTurn ? userId : partnerId;
        handleTimeout(loserId);
        setEndReason('timeout');
        broadcastMove({ type: 'timeout', loserId });
      }
    },
    iGoFirst && !winner && gameStarted && !isTimerPaused
  );

  // Sync timer pause state
  useEffect(() => {
    if (iGoFirst && !winner && gameStarted) {
      if (isTimerPaused) {
        pauseTimer();
      } else {
        startTimer();
      }
    }
  }, [isTimerPaused, iGoFirst, winner, gameStarted, pauseTimer, startTimer]);

  // Host resets timer on turn change or game start
  useEffect(() => {
    if (iGoFirst && !winner && gameStarted) {
      resetTimer(true);
    }
  }, [isMyTurn, winner, iGoFirst, resetTimer, gameStarted]);

  // Save replay when game ends (host only to prevent duplicates)
  useEffect(() => {
    if (!winner || !isHost) return;
    recorder.current.save(winnerId).catch(console.error);
  }, [winner, winnerId, isHost]);

  // Listen for partner decline to exit without forfeit modal
  useEffect(() => {
    const handleDecline = () => onBack();
    window.addEventListener('game-invite-declined', handleDecline);
    return () => window.removeEventListener('game-invite-declined', handleDecline);
  }, [onBack]);

  // Fetch definition on-demand when the definition drawer is opened
  useEffect(() => {
    if (!selectedDefinitionWord) {
      setDrawerDefinition('');
      setDrawerPartOfSpeech('');
      setDrawerLoading(false);
      return;
    }

    if (selectedDefinitionWord.definition) {
      setDrawerDefinition(selectedDefinitionWord.definition);
      setDrawerPartOfSpeech(selectedDefinitionWord.partOfSpeech || 'unknown');
      setDrawerLoading(false);
      return;
    }

    let active = true;
    const fetchDef = async () => {
      setDrawerLoading(true);
      try {
        const res = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(selectedDefinitionWord.word)}`
        );
        if (!active) return;
        if (res.status === 200) {
          const data = await res.json();
          const entry = data[0];
          const partOfSpeech = entry?.meanings[0]?.partOfSpeech || 'noun';
          const definition =
            entry?.meanings[0]?.definitions[0]?.definition || 'No definition found.';
          setDrawerDefinition(definition);
          setDrawerPartOfSpeech(partOfSpeech);
          updateWordDefinition(selectedDefinitionWord.word, definition, partOfSpeech);
        } else {
          setDrawerDefinition('Definition unavailable.');
          setDrawerPartOfSpeech('unknown');
        }
      } catch {
        if (!active) return;
        setDrawerDefinition('Definition unavailable offline.');
        setDrawerPartOfSpeech('offline');
      } finally {
        if (active) setDrawerLoading(false);
      }
    };

    fetchDef();
    return () => {
      active = false;
    };
  }, [selectedDefinitionWord, updateWordDefinition]);

  // Keep handler references fresh for the stable handleRemoteMove callback

  useEffect(() => {
    handlersRef.current = {
      submitWord,
      handleTimeout,
      reset,
      forceWinner,
      partnerId,
      iGoFirst,
      gameId,
      userId,
      resetTimer,
      setUserEmojis,
      setPartnerEmojis,
      setActivePartnerBubble,
      setEndReason,
      setRematchStatus,
      setSettings,
      setGameStarted,
      setIsTimerPaused,
      setGuestSeconds,
      updateWordDefinition,
    };
  });

  // Host broadcasts the timer tick every second
  useEffect(() => {
    if (iGoFirst && !winner && gameStarted) {
      broadcastMove({ type: 'timer_tick', seconds });
    }
  }, [seconds, iGoFirst, winner, broadcastMove, gameStarted]);

  /**
   * Updates settings locally and broadcasts to partner.
   *
   * @param {object} newSettings - The updated settings object.
   * @returns {void}
   */
  const handleSettingChange = (newSettings) => {
    if (!iGoFirst) return;
    setSettings(newSettings);
    broadcastMove({ type: 'settings_update', settings: newSettings });
  };

  /**
   * Marks the game as started and broadcasts the start event with current settings.
   *
   * @returns {void}
   */
  const handleStartGame = () => {
    if (!iGoFirst) return;
    setGameStarted(true);
    broadcastMove({ type: 'game_start', settings });
  };

  /**
   * Fires a burst of floating emojis locally and broadcasts to partner.
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
   * Sends a text bubble message and broadcasts it to the partner.
   *
   * @param {string} text - The message text.
   * @returns {void}
   */
  const handleSendChat = (text) => {
    const reactionsEnabled = localStorage.getItem('preferences_game_reactions_enabled') !== 'false';
    if (!reactionsEnabled) return;
    setActiveUserBubble(text);
    setTimeout(() => setActiveUserBubble(''), 4000);
    broadcastMove({ type: 'chat', text });
  };

  /**
   * Handles the back/exit button — shows forfeit modal if game is in progress.
   *
   * @returns {void}
   */
  const handleBackAction = () => {
    if (rematchStatus === 'sending' || rematchStatus === 'receiving') {
      broadcastMove({ type: 'rematch_decline' });
    }
    if (!winner && gameStarted && partnerOnline) {
      setShowForfeitModal(true);
    } else {
      onBack();
    }
  };

  /**
   * Confirms forfeit: records, broadcasts, saves replay, then exits.
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
   * Fetches a definition in the background for a locally-validated word
   * and broadcasts the result so both players see it.
   *
   * @param {string} wordToFetch - The word to enrich with a definition.
   * @returns {Promise<void>}
   */
  const fetchDefinitionInBackground = async (wordToFetch) => {
    const result = await fetchDefinitionFromApi(wordToFetch);
    if (result) {
      updateWordDefinition(wordToFetch, result.definition, result.partOfSpeech);
      broadcastMove({
        type: 'definition_update',
        word: wordToFetch,
        definition: result.definition,
        partOfSpeech: result.partOfSpeech,
      });
    }
  };

  /**
   * Validates and submits the player's word input.
   * Runs a synchronous check first, then falls back to async online validation
   * for words not found in the local dictionary.
   *
   * @param {Event} [e] - Optional form submit event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || !isMyTurn || winner || isValidating) return;
    const word = inputValue.trim().toLowerCase();

    // 1. Synchronous check (starting letter, duplicates, length constraints)
    const usedWords = chain.map((e) => e.word);
    const syncCheck = validateWordChain(prevWord, word, usedWords, settings);
    if (!syncCheck.valid) {
      submitWord(word, userId);
      return;
    }

    // 2. Instant local validation (0ms latency, works offline)
    if (localWordsSet.has(word)) {
      const accepted = submitWord(word, userId, '', '');
      if (accepted) {
        recorder.current.recordMove(userId, 'word', { word, definition: '', partOfSpeech: '' });
        broadcastMove({ type: 'word', word, definition: '', partOfSpeech: '' });
        setInputValue('');
        fetchDefinitionInBackground(word);
      }
      return;
    }

    // 3. Async online dictionary lookup (rare words)
    setIsValidating(true);
    setIsTimerPaused(true);
    broadcastMove({ type: 'validating' });

    const dictResult = await validateOnlineWord(word);

    if (!dictResult.valid) {
      setIsValidating(false);
      setIsTimerPaused(false);
      broadcastMove({ type: 'validation_failed' });
      setLastError(dictResult.reason || 'Not a valid English word.');
      return;
    }

    const accepted = submitWord(word, userId, dictResult.definition, dictResult.partOfSpeech);
    if (!accepted) {
      setIsValidating(false);
      setIsTimerPaused(false);
      broadcastMove({ type: 'validation_failed' });
      return;
    }

    recorder.current.recordMove(userId, 'word', {
      word,
      definition: dictResult.definition,
      partOfSpeech: dictResult.partOfSpeech,
    });
    broadcastMove({
      type: 'word',
      word,
      definition: dictResult.definition,
      partOfSpeech: dictResult.partOfSpeech,
    });

    setIsValidating(false);
    setIsTimerPaused(false);
    setInputValue('');
  };

  /**
   * Requests a rematch from the partner.
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
    reset(!iGoFirst);
    setRematchStatus('none');
    setEndReason('completion');
    setGameStarted(false);
    setIsTimerPaused(false);
    recorder.current = new GameRecorder(gameId, userId, partnerId);
    if (iGoFirst) resetTimer(true);
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

  const result =
    winner === userId
      ? 'win'
      : winner && winner !== userId
        ? 'loss'
        : winner === 'draw'
          ? 'draw'
          : null;

  if (!winner && !partnerOnline) {
    return (
      <div className="flex flex-col h-full relative">
        <GameHeader
          gameName={gameName}
          user={user}
          partner={partner}
          isMyTurn={false}
          onBack={handleBackAction}
        />
        <div className="flex-grow flex flex-col items-center justify-center gap-3 text-center py-16">
          <LoadingSpinner size="md" />
          <h3 className="font-heading text-lg font-bold">Waiting for partner…</h3>
          <p className="text-xs text-text-muted max-w-xs leading-relaxed">
            We&apos;re waiting for {partner?.name || 'your partner'} to accept the game invite.
          </p>
        </div>
      </div>
    );
  }

  // --- LOBBY SETUP SCREEN ---
  if (!gameStarted && chain.length === 0) {
    return (
      <div className="flex flex-col h-full relative">
        <GameHeader
          gameName={gameName}
          user={user}
          partner={partner}
          isMyTurn={false}
          onBack={handleBackAction}
        />
        <WordChainSetup
          iGoFirst={iGoFirst}
          partner={partner}
          settings={settings}
          handleSettingChange={handleSettingChange}
          handleStartGame={handleStartGame}
        />
      </div>
    );
  }

  // --- ACTIVE GAME SCREEN ---
  return (
    <div className="flex flex-col h-full relative">
      <GameHeader
        gameName={gameName}
        user={user}
        partner={partner}
        isMyTurn={isMyTurn && !winner}
        userScore={scores.userScore}
        partnerScore={scores.partnerScore}
        timeLeft={winner ? undefined : iGoFirst ? seconds : guestSeconds}
        onBack={handleBackAction}
        activeUserBubble={activeUserBubble}
        activePartnerBubble={activePartnerBubble}
        userEmojis={userEmojis}
        partnerEmojis={partnerEmojis}
      />

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Active rules info bar */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-surface/20 border border-surface-border/40 px-3 py-2 rounded-2xl text-[10px] font-bold text-text-muted text-center leading-none">
          <span>
            Mode: <strong className="text-text-main capitalize">{settings.mode}</strong>
          </span>
          {settings.mode === 'panic' && (
            <span className="text-rose-400">
              Timer: <strong className="font-extrabold">{currentTurnLimit}s</strong>
            </span>
          )}
          <span>
            Goal:{' '}
            <strong className="text-text-main">
              {settings.scoring === 'points_race' ? 'Points Race (50)' : 'Survival'}
            </strong>
          </span>
          {settings.minLength !== 'none' && (
            <span>
              Min Length: <strong className="text-text-main">{settings.minLength} letters</strong>
            </span>
          )}
          {settings.maxLength !== 'none' && (
            <span>
              Max Length: <strong className="text-text-main">{settings.maxLength} letters</strong>
            </span>
          )}
        </div>

        {/* Starting letter prompt */}
        {prevWord ? (
          <div className="text-center">
            <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">
              Next word must start with
            </p>
            <span className="text-4xl font-extrabold text-primary uppercase">
              {prevWord[prevWord.length - 1]}
            </span>
          </div>
        ) : (
          <p className="text-center text-sm text-text-muted">
            {iGoFirst
              ? 'You go first — enter any word!'
              : `Waiting for ${partner?.name || 'partner'} to start…`}
          </p>
        )}

        {/* Chain scroll list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {chain.length === 0 && (
            <p className="text-center text-xs text-text-muted/50 italic py-8">
              The chain starts here…
            </p>
          )}
          {[...chain].reverse().map((entry, i) => {
            const isMe = entry.playerId === userId;
            const points = calculateLetterPoints(entry.word);
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <button
                  onClick={() => setSelectedDefinitionWord(entry)}
                  title="Click to view definition"
                  className={`px-4 py-2.5 rounded-2xl text-sm font-bold max-w-[70%] text-left transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-between gap-4 border ${
                    isMe
                      ? 'bg-primary/15 border-primary/25 text-primary shadow-sm'
                      : 'bg-surface border-surface-border text-text-main shadow-sm'
                  }`}
                >
                  <span className="truncate">{entry.word}</span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md font-mono ${
                      isMe ? 'bg-primary/10 text-primary/80' : 'bg-surface-border text-text-muted'
                    }`}
                  >
                    +{points}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {lastError && (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {lastError}
          </div>
        )}

        {/* Word input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            id="word-chain-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.replace(/[^a-zA-Z]/g, ''))}
            disabled={!isMyTurn || !!winner || isValidating}
            placeholder={
              isMyTurn
                ? isValidating
                  ? 'Validating word...'
                  : prevWord
                    ? `Word starting with "${prevWord[prevWord.length - 1].toUpperCase()}"…`
                    : 'Any word to start…'
                : `${partner?.name || 'Partner'}'s turn…`
            }
            className="flex-1 px-4 py-3 bg-surface/50 border border-surface-border rounded-2xl text-sm text-text-main placeholder-text-muted/50 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!isMyTurn || !inputValue.trim() || !!winner || isValidating}
            className="px-4 py-3 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white rounded-2xl transition-all active:scale-95 flex items-center justify-center min-w-[52px] shadow-md shadow-primary/15"
          >
            {isValidating ? (
              <LoadingSpinner size="xs" className="text-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
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

      {(winner || partnerOnline) && (
        <QuickReactionTray onSendReaction={handleSendReaction} onSendChat={handleSendChat} />
      )}
      <ForfeitModal
        isOpen={showForfeitModal}
        onClose={() => setShowForfeitModal(false)}
        onConfirm={handleForfeitConfirm}
      />

      {/* Word Definition drawer */}
      {selectedDefinitionWord && (
        <WordChainDefinitionDrawer
          selectedDefinitionWord={selectedDefinitionWord}
          drawerDefinition={drawerDefinition}
          drawerPartOfSpeech={drawerPartOfSpeech}
          drawerLoading={drawerLoading}
          calculateLetterPoints={calculateLetterPoints}
          onClose={() => setSelectedDefinitionWord(null)}
        />
      )}
    </div>
  );
}
