/**
 * @file WordChain.jsx
 * @description Word Chain game component. Players alternate submitting words
 * where each word must start with the last letter of the previous.
 * Includes a 30-second per-turn timer.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import GameHeader from '../../components/GameHeader';
import GameResults from '../../components/GameResults';
import { useGameSync } from '../../hooks/useGameSync';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useWordChainLogic } from './useGameLogic';
import { GameRecorder } from '../../lib/gameRecorder';
import { generateSessionId } from '../../lib/gameEngine';

const TURN_SECONDS = 30;

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
export default function WordChain({ gameId, gameName, userId, partnerId, user, partner, onBack }) {
  const iGoFirst = userId < partnerId;
  const sessionId = useRef(generateSessionId(gameId, userId, partnerId)).current;
  const recorder = useRef(new GameRecorder(gameId, userId, partnerId));
  const [inputValue, setInputValue] = useState('');

  const {
    chain, isMyTurn, winner, winnerId, prevWord, lastError,
    submitWord, handleTimeout, reset,
  } = useWordChainLogic({ userId, partnerId, iGoFirst });

  const { seconds, start, reset: resetTimer } = useGameTimer(TURN_SECONDS, () => {
    handleTimeout(isMyTurn ? userId : partnerId);
  });

  // Start timer when it's anyone's turn
  useEffect(() => {
    if (!winner) {
      resetTimer(true);
    }
  }, [isMyTurn, winner]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save replay when game ends (only host saves to prevent duplicates)
  useEffect(() => {
    if (!winner || userId >= partnerId) return;
    recorder.current.save(winnerId).catch(console.error);
  }, [winner, winnerId, userId, partnerId]);

  const handleRemoteMove = useCallback(
    (payload) => {
      if (payload.type === 'word') {
        submitWord(payload.word, partnerId);
        recorder.current.recordMove(partnerId, 'word', { word: payload.word });
      } else if (payload.type === 'timeout') {
        handleTimeout(payload.loserId);
      } else if (payload.type === 'rematch') {
        reset(iGoFirst);
        recorder.current = new GameRecorder(gameId, userId, partnerId);
        resetTimer(true);
      }
    },
    [submitWord, handleTimeout, reset, partnerId, iGoFirst, gameId, userId, resetTimer]
  );

  const broadcastMove = useGameSync(gameId, sessionId, handleRemoteMove);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || !isMyTurn || winner) return;
    const word = inputValue.trim().toLowerCase();
    const accepted = submitWord(word, userId);
    if (!accepted) return;
    recorder.current.recordMove(userId, 'word', { word });
    broadcastMove({ type: 'word', word });
    setInputValue('');
  };

  const handleRematch = () => {
    reset(!iGoFirst);
    recorder.current = new GameRecorder(gameId, userId, partnerId);
    resetTimer(true);
    broadcastMove({ type: 'rematch' });
  };

  const result =
    winner === userId ? 'win' : winner && winner !== userId ? 'loss' : winner === 'draw' ? 'draw' : null;

  return (
    <div className="flex flex-col h-full relative">
      <GameHeader
        gameName={gameName}
        user={user}
        partner={partner}
        isMyTurn={isMyTurn && !winner}
        timeLeft={winner ? undefined : seconds}
        onBack={onBack}
      />

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Prompt */}
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
            {iGoFirst ? 'You go first — enter any word!' : `Waiting for ${partner?.name || 'partner'} to start…`}
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
            return (
              <div
                key={i}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl text-sm font-bold max-w-[70%] ${
                    isMe
                      ? 'bg-primary/15 border border-primary/20 text-primary'
                      : 'bg-surface border border-surface-border text-text-main'
                  }`}
                >
                  {entry.word}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {lastError && (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {lastError}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            id="word-chain-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.replace(/[^a-zA-Z]/g, ''))}
            disabled={!isMyTurn || !!winner}
            placeholder={
              isMyTurn
                ? prevWord
                  ? `Word starting with "${prevWord[prevWord.length - 1].toUpperCase()}"…`
                  : 'Any word to start…'
                : `${partner?.name || 'Partner'}'s turn…`
            }
            className="flex-1 px-4 py-3 bg-surface/50 border border-surface-border rounded-2xl text-sm text-text-main placeholder-text-muted/50 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!isMyTurn || !inputValue.trim() || !!winner}
            className="px-4 py-3 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white rounded-2xl transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
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
