/**
 * @file scoring.js
 * @description Scrabble board layout and word score calculator.
 */

import { getLetterScore } from './tileBag';

export const BOARD_SIZE = 11;
export const CENTER_CELL = { r: 5, c: 5 };

/**
 * Returns the board multiplier definition for a given cell.
 *
 * @param {number} r - Row index (0-10).
 * @param {number} c - Column index (0-10).
 * @returns {{ type: 'DL'|'TL'|'DW'|'TW'|null, value: number }} Multiplier info.
 */
export function getMultiplier(r, c) {
  // 4 corners are TW
  if (
    (r === 0 && c === 0) ||
    (r === 0 && c === BOARD_SIZE - 1) ||
    (r === BOARD_SIZE - 1 && c === 0) ||
    (r === BOARD_SIZE - 1 && c === BOARD_SIZE - 1)
  ) {
    return { type: 'TW', value: 3 };
  }

  // DW Diagonals + Center + Mid-edges
  const isDiagonal = r === c || r === BOARD_SIZE - 1 - c;
  const isCenter = r === CENTER_CELL.r && c === CENTER_CELL.c;
  const isMidEdge =
    (r === 0 && c === 5) || (r === 10 && c === 5) || (r === 5 && c === 0) || (r === 5 && c === 10);

  if (isCenter || isMidEdge || (isDiagonal && r >= 1 && r <= 9)) {
    return { type: 'DW', value: 2 };
  }

  // TL: (1, 5), (5, 1), (5, 9), (9, 5)
  if (
    (r === 1 && c === 5) ||
    (r === 5 && c === 1) ||
    (r === 5 && c === 9) ||
    (r === 9 && c === 5)
  ) {
    return { type: 'TL', value: 3 };
  }

  // DL: Symmetric spots
  const dlSpots = [
    [0, 3],
    [0, 7],
    [3, 0],
    [7, 0],
    [3, 10],
    [7, 10],
    [10, 3],
    [10, 7],
    [2, 4],
    [2, 6],
    [4, 2],
    [4, 8],
    [6, 2],
    [6, 8],
    [8, 4],
    [8, 6],
  ];
  const isDl = dlSpots.some(([dr, dc]) => dr === r && dc === c);
  if (isDl) {
    return { type: 'DL', value: 2 };
  }

  return { type: null, value: 1 };
}

/**
 * Calculates the score of a single word.
 *
 * @param {{r: number, c: number, letter: string}[]} wordTiles - Tiles forming the word.
 * @param {string[][]} board - Immutable board before the current turn.
 * @returns {number} Score for the word.
 */
export function calculateWordScore(wordTiles, board) {
  let wordScore = 0;
  let wordMultiplier = 1;

  for (const tile of wordTiles) {
    const { r, c, letter } = tile;
    const baseScore = getLetterScore(letter);

    // Only apply multiplier if the board cell is currently empty (meaning it's placed this turn)
    const isNew = !board[r][c];

    if (isNew) {
      const mult = getMultiplier(r, c);
      if (mult.type === 'DL') {
        wordScore += baseScore * mult.value;
      } else if (mult.type === 'TL') {
        wordScore += baseScore * mult.value;
      } else {
        wordScore += baseScore;
        if (mult.type === 'DW') {
          wordMultiplier *= mult.value;
        } else if (mult.type === 'TW') {
          wordMultiplier *= mult.value;
        }
      }
    } else {
      wordScore += baseScore;
    }
  }

  return wordScore * wordMultiplier;
}

/**
 * Helper to check if coordinates are within the board.
 *
 * @param {number} r
 * @param {number} c
 * @returns {boolean}
 */
const inBounds = (r, c) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

/**
 * Finds all words formed by a turn's new tile placements.
 *
 * @param {string[][]} board - The board (grid of letter strings or null/empty).
 * @param {{r: number, c: number, letter: string}[]} placements - Newly placed tiles.
 * @returns {{r: number, c: number, letter: string}[][]} Array of words, where each word is an array of tiles.
 */
export function findWordsFormed(board, placements) {
  if (placements.length === 0) return [];

  // Create a combined grid to easily check tile existence
  const grid = board.map((row) => [...row]);
  placements.forEach(({ r, c, letter }) => {
    grid[r][c] = letter;
  });

  const words = [];

  // Helper to trace a word in a specific direction starting from a tile
  const getWordSpan = (startR, startC, isHorizontal) => {
    const tiles = [];
    let r = startR;
    let c = startC;

    // Move to the start of the word span
    if (isHorizontal) {
      while (inBounds(r, c - 1) && grid[r][c - 1]) {
        c--;
      }
      // Read left-to-right
      while (inBounds(r, c) && grid[r][c]) {
        tiles.push({ r, c, letter: grid[r][c] });
        c++;
      }
    } else {
      while (inBounds(r - 1, c) && grid[r - 1][c]) {
        r--;
      }
      // Read top-to-bottom
      while (inBounds(r, c) && grid[r][c]) {
        tiles.push({ r, c, letter: grid[r][c] });
        r++;
      }
    }
    return tiles.length > 1 ? tiles : null;
  };

  // Determine direction of placement (row-aligned or col-aligned)
  const rows = [...new Set(placements.map((p) => p.r))];
  const cols = [...new Set(placements.map((p) => p.c))];

  let mainIsHorizontal = true;
  if (rows.length > 1 && cols.length === 1) {
    mainIsHorizontal = false;
  } else if (rows.length === 1 && cols.length > 1) {
    mainIsHorizontal = true;
  } else if (rows.length === 1 && cols.length === 1) {
    // Single letter placed. Check both directions
    const hWord = getWordSpan(placements[0].r, placements[0].c, true);
    const vWord = getWordSpan(placements[0].r, placements[0].c, false);
    if (hWord) words.push(hWord);
    if (vWord) words.push(vWord);
    return words;
  } else {
    // Invalid non-linear placement, but let's still check what's there
    return [];
  }

  // Find the main word
  const mainWord = getWordSpan(placements[0].r, placements[0].c, mainIsHorizontal);
  if (mainWord) {
    words.push(mainWord);
  }

  // Find cross words for each placed tile
  placements.forEach(({ r, c }) => {
    const crossWord = getWordSpan(r, c, !mainIsHorizontal);
    if (crossWord) {
      words.push(crossWord);
    }
  });

  return words;
}

/**
 * Calculates the total score of a turn.
 *
 * @param {string[][]} board - The board state before this turn.
 * @param {{r: number, c: number, letter: string}[]} placements - Newly placed tiles.
 * @returns {number} Score of the turn.
 */
export function calculateTurnScore(board, placements) {
  const words = findWordsFormed(board, placements);
  let totalScore = words.reduce((sum, word) => sum + calculateWordScore(word, board), 0);

  // Bingo bonus (50 pts for playing all 7 tiles)
  if (placements.length === 7) {
    totalScore += 50;
  }

  return totalScore;
}
