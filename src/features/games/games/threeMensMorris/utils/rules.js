/**
 * @file rules.js
 * @description Core game rules and validation logic for Three Men's Morris.
 */

/**
 * Valid winning line combinations on the 3x3 grid.
 * @type {Array<Array<number>>}
 */
export const WIN_COMBINATIONS = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals (via center node 4)
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Adjacency map defining valid movement connections between the 9 grid nodes.
 * @type {Object<number, Array<number>>}
 */
export const CONNECTIONS = {
  0: [1, 3, 4],
  1: [0, 2, 4],
  2: [1, 4, 5],
  3: [0, 4, 6],
  4: [0, 1, 2, 3, 5, 6, 7, 8],
  5: [2, 4, 8],
  6: [3, 4, 7],
  7: [4, 6, 8],
  8: [4, 5, 7],
};

/**
 * Checks if a player has formed a line of three pieces.
 *
 * @param {Array<string|null>} board - The 9-element board array.
 * @returns {string|null} The winner's player identifier ('player1' or 'player2'), or null if no winner.
 */
export function checkWinner(board) {
  for (const [a, b, c] of WIN_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

/**
 * Validates whether a piece can be placed at a specific index during the placement phase.
 *
 * @param {Array<string|null>} board - The 9-element board array.
 * @param {number} index - The target board index (0-8).
 * @returns {boolean} True if the placement is valid, false otherwise.
 */
export function isValidPlacement(board, index) {
  if (index < 0 || index > 8) return false;
  return board[index] === null;
}

/**
 * Validates whether a move from one index to another is legal during the movement phase.
 *
 * @param {Array<string|null>} board - The 9-element board array.
 * @param {number} fromIndex - The index of the piece being moved (0-8).
 * @param {number} toIndex - The target index to move to (0-8).
 * @param {string} player - The active player identifier ('player1' or 'player2').
 * @returns {boolean} True if the move is legal, false otherwise.
 */
export function isValidMove(board, fromIndex, toIndex, player) {
  // Check bounds
  if (fromIndex < 0 || fromIndex > 8 || toIndex < 0 || toIndex > 8) return false;

  // Must move your own piece
  if (board[fromIndex] !== player) return false;

  // Destination must be empty
  if (board[toIndex] !== null) return false;

  // Must be adjacent / connected
  const adjacent = CONNECTIONS[fromIndex];
  if (!adjacent || !adjacent.includes(toIndex)) return false;

  return true;
}
