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
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],             // diagonals
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

/**
 * Determines whether a word can legally follow the previous word in Word Chain.
 *
 * @param {string} prevWord - The previous word in the chain.
 * @param {string} newWord - The proposed next word.
 * @param {string[]} usedWords - All words already used in the chain.
 * @returns {{ valid: boolean, reason: string }}
 */
export function validateWordChain(prevWord, newWord, usedWords) {
  const trimmed = newWord.trim().toLowerCase();

  if (!trimmed) return { valid: false, reason: 'Word cannot be empty.' };

  if (usedWords.includes(trimmed)) {
    return { valid: false, reason: `"${trimmed}" was already used!` };
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
