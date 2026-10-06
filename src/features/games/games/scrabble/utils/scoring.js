/**
 * @file scoring.js
 * @description Scrabble board layout and word score calculator.
 */

import { getLetterScore } from './tileBag';

export const BOARD_SIZE = 15;
export const CENTER_CELL = { r: 7, c: 7 };

// ⚡ Bolt: Pre-calculate multipliers to avoid O(N) array scans during O(N^2) render loops
const BOARD_MULTIPLIERS = Array.from({ length: BOARD_SIZE }, () =>
  Array(BOARD_SIZE).fill({ type: null, value: 1 })
);

// Setup TW (Triple Word)
[
  [0, 0],
  [0, 7],
  [0, 14],
  [7, 0],
  [7, 14],
  [14, 0],
  [14, 7],
  [14, 14],
].forEach(([r, c]) => {
  BOARD_MULTIPLIERS[r][c] = { type: 'TW', value: 3 };
});
// Setup DW (Double Word)
[
  [1, 1],
  [2, 2],
  [3, 3],
  [4, 4],
  [10, 10],
  [11, 11],
  [12, 12],
  [13, 13],
  [1, 13],
  [2, 12],
  [3, 11],
  [4, 10],
  [10, 4],
  [11, 3],
  [12, 2],
  [13, 1],
  [7, 7],
].forEach(([r, c]) => {
  BOARD_MULTIPLIERS[r][c] = { type: 'DW', value: 2 };
});
// Setup TL (Triple Letter)
[
  [1, 5],
  [1, 9],
  [5, 1],
  [5, 5],
  [5, 9],
  [5, 13],
  [9, 1],
  [9, 5],
  [9, 9],
  [9, 13],
  [13, 5],
  [13, 9],
].forEach(([r, c]) => {
  BOARD_MULTIPLIERS[r][c] = { type: 'TL', value: 3 };
});
// Setup DL (Double Letter)
[
  [0, 3],
  [0, 11],
  [2, 6],
  [2, 8],
  [3, 0],
  [3, 7],
  [3, 14],
  [6, 2],
  [6, 6],
  [6, 8],
  [6, 12],
  [7, 3],
  [7, 11],
  [8, 2],
  [8, 6],
  [8, 8],
  [8, 12],
  [11, 0],
  [11, 7],
  [11, 14],
  [12, 6],
  [12, 8],
  [14, 3],
  [14, 11],
].forEach(([r, c]) => {
  BOARD_MULTIPLIERS[r][c] = { type: 'DL', value: 2 };
});

/**
 * Returns the board multiplier definition for a given cell.
 *
 * @param {number} r - Row index (0-14).
 * @param {number} c - Column index (0-14).
 * @returns {{ type: 'DL'|'TL'|'DW'|'TW'|null, value: number }} Multiplier info.
 */
export function getMultiplier(r, c) {
  // O(1) lookup instead of recalculating coordinate logic
  return BOARD_MULTIPLIERS[r]?.[c] || { type: null, value: 1 };
}

/**
 * Calculates the score of a single word.
 *
 * @param {{r: number, c: number, letter: string, isBlank?: boolean}[]} wordTiles - Tiles forming the word.
 * @param {({letter: string, isBlank: boolean}|null)[][]} board - Immutable board before the current turn.
 * @returns {number} Score for the word.
 */
export function calculateWordScore(wordTiles, board) {
  let wordScore = 0;
  let wordMultiplier = 1;

  for (const tile of wordTiles) {
    const { r, c, letter, isBlank } = tile;
    const baseScore = getLetterScore(letter, isBlank);

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
 * @param {({letter: string, isBlank: boolean}|null)[][]} board - The board (grid of tile objects or null/empty).
 * @param {{r: number, c: number, letter: string, isBlank?: boolean}[]} placements - Newly placed tiles.
 * @returns {{r: number, c: number, letter: string, isBlank: boolean}[][]} Array of words.
 */
export function findWordsFormed(board, placements) {
  if (placements.length === 0) return [];

  // Create a combined grid to easily check tile existence
  const grid = board.map((row) => [...row]);
  placements.forEach(({ r, c, letter, isBlank }) => {
    grid[r][c] = { letter, isBlank };
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
        tiles.push({ r, c, letter: grid[r][c].letter, isBlank: !!grid[r][c].isBlank });
        c++;
      }
    } else {
      while (inBounds(r - 1, c) && grid[r - 1][c]) {
        r--;
      }
      // Read top-to-bottom
      while (inBounds(r, c) && grid[r][c]) {
        tiles.push({ r, c, letter: grid[r][c].letter, isBlank: !!grid[r][c].isBlank });
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
    // Invalid non-linear placement
    return [];
  }

  // Find the main word
  const mainWord = getWordSpan(placements[0].r, placements[0].c, mainIsHorizontal);
  if (!mainWord) {
    return [];
  }

  // Continuity validation: ensure all placed tiles are part of this main word span.
  const mainWordKeys = new Set(mainWord.map((t) => `${t.r},${t.c}`));
  const allPlacementsInMainWord = placements.every((p) => mainWordKeys.has(`${p.r},${p.c}`));
  if (!allPlacementsInMainWord) {
    return []; // Gaps or disconnected placements in the line
  }

  words.push(mainWord);

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
 * @param {({letter: string, isBlank: boolean}|null)[][]} board - The board state before this turn.
 * @param {{r: number, c: number, letter: string, isBlank?: boolean}[]} placements - Newly placed tiles.
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
