/**
 * @file useGameLogic.js
 * @description Word Chain game logic hook.
 * Manages the word chain, turn tracking, and validation.
 */

import { useState, useCallback } from 'react';
import { validateWordChain } from '../../lib/gameEngine';

/**
 * @param {object} params
 * @param {string} params.userId - Current user's ID.
 * @param {string} params.partnerId - Partner's ID.
 * @param {boolean} params.iGoFirst - Whether the current user starts.
 */
export function useWordChainLogic({ userId, partnerId, iGoFirst }) {
  const [chain, setChain] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(iGoFirst ? userId : partnerId);
  const [winner, setWinner] = useState(null); // userId of winner, or 'draw'
  const [lastError, setLastError] = useState('');
  const [timeoutLoserId, setTimeoutLoserId] = useState(null);

  const isMyTurn = currentPlayerId === userId;
  const prevWord = chain[chain.length - 1]?.word || '';

  /**
   * Validates and appends a word to the chain.
   *
   * @param {string} word - The word to submit.
   * @param {string} playerId - Who is submitting.
   * @returns {boolean} Whether the word was accepted.
   */
  const submitWord = useCallback(
    (word, playerId) => {
      const usedWords = chain.map((e) => e.word);
      const { valid, reason } = validateWordChain(prevWord, word, usedWords);

      if (!valid) {
        setLastError(reason);
        return false;
      }

      setLastError('');
      setChain((prev) => [...prev, { word: word.toLowerCase().trim(), playerId }]);
      setCurrentPlayerId((prev) => (prev === userId ? partnerId : userId));
      return true;
    },
    [chain, prevWord, userId, partnerId]
  );

  /**
   * Ends the game because a player ran out of time.
   *
   * @param {string} loserId - The player who timed out.
   */
  const handleTimeout = useCallback(
    (loserId) => {
      setTimeoutLoserId(loserId);
      setWinner(loserId === userId ? partnerId : userId);
    },
    [userId, partnerId]
  );

  /** Resets the game for a rematch. */
  const reset = useCallback(
    (newIGoFirst) => {
      setChain([]);
      setCurrentPlayerId(newIGoFirst ? userId : partnerId);
      setWinner(null);
      setLastError('');
      setTimeoutLoserId(null);
    },
    [userId, partnerId]
  );

  const forceWinner = useCallback((winnerId) => {
    setWinner(winnerId);
  }, []);

  const winnerId = winner === 'draw' ? null : winner || null;

  return {
    chain,
    isMyTurn,
    currentPlayerId,
    winner,
    winnerId,
    lastError,
    prevWord,
    timeoutLoserId,
    submitWord,
    handleTimeout,
    reset,
    forceWinner,
  };
}
