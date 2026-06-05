/**
 * @file useGameLogic.js
 * @description Quick Draw game logic hook.
 * Manages role assignment, guessing, and word selection.
 */

import { useState, useCallback } from 'react';

/** Default word list for Quick Draw. */
const WORD_LIST = [
  'cat', 'dog', 'house', 'tree', 'sun', 'moon', 'car', 'boat',
  'flower', 'bird', 'fish', 'star', 'cloud', 'heart', 'book',
  'coffee', 'pizza', 'beach', 'mountain', 'rainbow',
];

/**
 * @param {object} params
 * @param {string} params.userId - Current user's ID.
 * @param {string} params.partnerId - Partner's ID.
 * @param {boolean} params.iAmDrawer - Whether the current user is the drawer this round.
 */
export function useQuickDrawLogic({ userId, partnerId, iAmDrawer }) {
  const [targetWord] = useState(
    () => WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
  );
  const [guesses, setGuesses] = useState([]); // { text, playerId, correct }
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  /**
   * Processes a guess from the guesser.
   *
   * @param {string} text - The guess text.
   * @param {string} playerId - Who is guessing.
   * @returns {{ correct: boolean }} Whether the guess was correct.
   */
  const submitGuess = useCallback(
    (text, playerId) => {
      const correct = text.trim().toLowerCase() === targetWord.toLowerCase();
      const entry = { text: text.trim(), playerId, correct };
      setGuesses((prev) => [...prev, entry]);

      if (correct) {
        setWinner(playerId); // guesser wins
        setGameOver(true);
      }

      return { correct };
    },
    [targetWord]
  );

  /** Called when the timer expires with no correct guess. */
  const handleTimeout = useCallback(() => {
    if (!gameOver) {
      setWinner(null); // drawer wins (guesser didn't get it)
      setGameOver(true);
    }
  }, [gameOver]);

  const forceWinner = useCallback((winnerId) => {
    setWinner(winnerId);
    setGameOver(true);
  }, []);

  const winnerId = winner;

  return {
    targetWord,
    guesses,
    gameOver,
    winner,
    winnerId,
    iAmDrawer,
    submitGuess,
    handleTimeout,
    forceWinner,
  };
}
