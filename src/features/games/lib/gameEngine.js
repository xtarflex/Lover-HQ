/**
 * @file gameEngine.js
 * @description Shared game logic helpers used across multiple game modules.
 */

/**
 * Checks the 8 possible Tic-Tac-Toe winning combinations.
 *
 * @param {Array<string|null>} board - 9-element array ('X', 'O', or null).
 * @returns {string|null} 'X', 'O', or null if no winner yet.
 */
export function checkTicTacToeWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // cols
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

/**
 * Calculates the point value of a word based on letter point allocations.
 * Named Letter Points to avoid conflict with future Scrabble implementation.
 *
 * @param {string} word - The word to score.
 * @returns {number} The points scored.
 */
export function calculateLetterPoints(word) {
  if (!word || !word.trim()) return 0;
  const letterScores = {
    a: 1,
    e: 1,
    i: 1,
    o: 1,
    u: 1,
    l: 1,
    n: 1,
    r: 1,
    s: 1,
    t: 1,
    d: 2,
    g: 2,
    b: 3,
    c: 3,
    m: 3,
    p: 3,
    f: 4,
    h: 4,
    v: 4,
    w: 4,
    y: 4,
    k: 5,
    j: 8,
    x: 8,
    q: 10,
    z: 10,
  };
  return [...word.toLowerCase().replace(/[^a-z]/g, '')].reduce(
    (sum, char) => sum + (letterScores[char] || 0),
    0
  );
}

/**
 * Determines whether a word can legally follow the previous word in Word Chain.
 *
 * @param {string} prevWord - The previous word in the chain.
 * @param {string} newWord - The proposed next word.
 * @param {string[]} usedWords - All words already used in the chain.
 * @param {object} [options={}] - Constraint options like minLength and maxLength.
 * @returns {{ valid: boolean, reason: string }}
 */
export function validateWordChain(prevWord, newWord, usedWords, options = {}) {
  const trimmed = newWord.trim().toLowerCase();

  if (!trimmed) return { valid: false, reason: 'Word cannot be empty.' };

  if (usedWords.includes(trimmed)) {
    return { valid: false, reason: `"${trimmed}" was already used!` };
  }

  if (options.minLength && options.minLength !== 'none') {
    const min = parseInt(options.minLength, 10);
    if (trimmed.length < min) {
      return {
        valid: false,
        reason: `Word must be at least ${min} letters long.`,
      };
    }
  }

  if (options.maxLength && options.maxLength !== 'none') {
    const max = parseInt(options.maxLength, 10);
    if (trimmed.length > max) {
      return {
        valid: false,
        reason: `Word must be at most ${max} letters long.`,
      };
    }
  }

  if (prevWord) {
    const lastChar = prevWord[prevWord.length - 1].toLowerCase();
    if (trimmed[0] !== lastChar) {
      return {
        valid: false,
        reason: `Word must start with "${lastChar.toUpperCase()}".`,
      };
    }
  }

  return { valid: true, reason: '' };
}

/**
 * Generates a unique session ID for a new game.
 *
 * @param {string} gameType - The game type ID.
 * @param {string} userId - Current user's ID.
 * @returns {string} Session ID.
 */
export function generateSessionId(gameType, userId, partnerId) {
  if (!userId || !partnerId) {
    return `${gameType}-pending-${Date.now()}`;
  }
  const sorted = [userId, partnerId].sort();
  return `${gameType}-${sorted[0].slice(0, 8)}-${sorted[1].slice(0, 8)}`;
}
