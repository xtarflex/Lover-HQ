/**
 * @file useGameLogic.js
 * @description Quick Draw game logic hook.
 * Manages rounds, role swapping, scoring, and guessing.
 */

import { useState, useCallback } from 'react';

/** Default word list for Quick Draw. */
export const WORD_LIST = [
  'cat',
  'dog',
  'house',
  'tree',
  'sun',
  'moon',
  'car',
  'boat',
  'flower',
  'bird',
  'fish',
  'star',
  'cloud',
  'heart',
  'book',
  'coffee',
  'pizza',
  'beach',
  'mountain',
  'rainbow',
  'apple',
  'banana',
  'pencil',
  'cookie',
  'elephant',
  'guitar',
  'rocket',
  'castle',
  'octopus',
  'butterfly',
];

/**
 * Quick Draw game logic hook.
 *
 * @param {object} params
 * @param {string} params.userId - Current user's ID.
 * @param {string} params.partnerId - Partner's ID.
 * @param {number} [params.maxRounds=3] - Maximum rounds in a match.
 * @param {boolean} [params.isHost] - Whether current player initiated the game.
 */
export function useQuickDrawLogic({ userId, partnerId, maxRounds = 3, isHost }) {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState([]); // { text, playerId, correct }
  const [roundOver, setRoundOver] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null); // ID of winner of current round/game
  const [currentRound, setCurrentRound] = useState(1);
  const [scores, setScores] = useState({ [userId]: 0, [partnerId]: 0 });
  const [drawerId, setDrawerId] = useState(() => {
    if (isHost !== undefined) {
      return isHost ? userId : partnerId;
    }
    return userId < partnerId ? userId : partnerId;
  });
  const [roundDuration, setRoundDuration] = useState(60);

  const iAmDrawer = drawerId === userId;

  /**
   * Processes a guess from the guesser.
   *
   * @param {string} text - The guess text.
   * @param {string} playerId - Who is guessing.
   * @returns {{ correct: boolean }} Whether the guess was correct.
   */
  const submitGuess = useCallback(
    (text, playerId) => {
      if (roundOver) return { correct: false };

      const correct = text.trim().toLowerCase() === targetWord.toLowerCase();
      const entry = { text: text.trim(), playerId, correct };
      setGuesses((prev) => [...prev, entry]);

      if (correct) {
        setWinner(playerId); // guesser wins this round
        setRoundOver(true);

        // Award points: guesser gets 10, drawer gets 5
        setScores((prev) => ({
          ...prev,
          [playerId]: prev[playerId] + 10,
          [drawerId]: prev[drawerId] + 5,
        }));
      }

      return { correct };
    },
    [targetWord, roundOver, drawerId]
  );

  /** Called when the timer expires with no correct guess. */
  const handleTimeout = useCallback(() => {
    if (!roundOver) {
      setWinner(null); // Nobody wins this round
      setRoundOver(true);
    }
  }, [roundOver]);

  /** Force a winner (e.g. on forfeit). */
  const forceWinner = useCallback((winnerId) => {
    setWinner(winnerId);
    setRoundOver(true);
    setGameOver(true);
  }, []);

  /** Starts the next round or ends the game. */
  const nextRound = useCallback(() => {
    if (currentRound >= maxRounds) {
      // Game over, compare scores
      setGameOver(true);
      if (scores[userId] > scores[partnerId]) {
        setWinner(userId);
      } else if (scores[partnerId] > scores[userId]) {
        setWinner(partnerId);
      } else {
        setWinner('draw');
      }
      return;
    }

    // Advance round
    setCurrentRound((prev) => prev + 1);
    setDrawerId((prev) => (prev === userId ? partnerId : userId));
    setTargetWord('');
    setGuesses([]);
    setRoundOver(false);
    setWinner(null);
  }, [currentRound, maxRounds, scores, userId, partnerId]);

  /** Resets the entire match. */
  const reset = useCallback(
    (drawerIsMe) => {
      setTargetWord('');
      setGuesses([]);
      setRoundOver(false);
      setGameOver(false);
      setWinner(null);
      setCurrentRound(1);
      setScores({ [userId]: 0, [partnerId]: 0 });
      if (drawerIsMe !== undefined) {
        setDrawerId(drawerIsMe ? userId : partnerId);
      } else {
        if (isHost !== undefined) {
          setDrawerId(isHost ? userId : partnerId);
        } else {
          setDrawerId(userId < partnerId ? userId : partnerId);
        }
      }
    },
    [userId, partnerId, isHost]
  );

  return {
    targetWord,
    setTargetWord,
    guesses,
    setGuesses,
    roundOver,
    setRoundOver,
    gameOver,
    winner,
    currentRound,
    maxRounds,
    scores,
    drawerId,
    iAmDrawer,
    roundDuration,
    setRoundDuration,
    submitGuess,
    handleTimeout,
    forceWinner,
    nextRound,
    reset,
  };
}
