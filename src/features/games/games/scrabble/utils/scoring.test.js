import { describe, it, expect } from 'vitest';
import {
  getMultiplier,
  calculateWordScore,
  findWordsFormed,
  calculateTurnScore,
  BOARD_SIZE,
} from './scoring';

const createEmptyBoard = () =>
  Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

describe('scoring utility', () => {
  describe('getMultiplier', () => {
    it('should return TW for corners', () => {
      expect(getMultiplier(0, 0)).toEqual({ type: 'TW', value: 3 });
      expect(getMultiplier(0, 10)).toEqual({ type: 'TW', value: 3 });
      expect(getMultiplier(10, 0)).toEqual({ type: 'TW', value: 3 });
      expect(getMultiplier(10, 10)).toEqual({ type: 'TW', value: 3 });
    });

    it('should return DW for center', () => {
      expect(getMultiplier(5, 5)).toEqual({ type: 'DW', value: 2 });
    });

    it('should return TL for specific cells', () => {
      expect(getMultiplier(1, 5)).toEqual({ type: 'TL', value: 3 });
      expect(getMultiplier(5, 1)).toEqual({ type: 'TL', value: 3 });
    });

    it('should return DL for specific cells', () => {
      expect(getMultiplier(0, 3)).toEqual({ type: 'DL', value: 2 });
      expect(getMultiplier(4, 2)).toEqual({ type: 'DL', value: 2 });
    });

    it('should return null type and value 1 for plain cells', () => {
      expect(getMultiplier(2, 2)).toEqual({ type: 'DW', value: 2 }); // wait, (2,2) is diagonal, so it is DW
      expect(getMultiplier(1, 2)).toEqual({ type: null, value: 1 }); // plain cell
    });
  });

  describe('calculateWordScore', () => {
    it('should score a word without multipliers', () => {
      const board = createEmptyBoard();
      // "CAT" -> C=3, A=1, T=1. Total 5.
      const wordTiles = [
        { r: 1, c: 2, letter: 'C' },
        { r: 1, c: 3, letter: 'A' },
        { r: 1, c: 4, letter: 'T' },
      ];
      // (1,2) is null, (1,3) is null, (1,4) is null. All are new.
      // Wait, is (1,3) a special multiplier?
      // DL spots: [0, 3], [0, 7], [3, 0], [7, 0], [3, 10], [7, 10], [10, 3], [10, 7],
      // [2, 4], [2, 6], [4, 2], [4, 8], [6, 2], [6, 8], [8, 4], [8, 6]
      // (1,2), (1,3), (1,4) are all plain. So score is 5.
      expect(calculateWordScore(wordTiles, board)).toBe(5);
    });

    it('should apply letter multipliers', () => {
      const board = createEmptyBoard();
      // "CAT" where C is on DL (e.g. 4,2), A is on 4,1, T is on 4,0
      // C=3 (DL = 6), A=1, T=1. Total 8.
      const wordTiles = [
        { r: 4, c: 2, letter: 'C' },
        { r: 4, c: 1, letter: 'A' },
        { r: 4, c: 0, letter: 'T' },
      ];
      expect(calculateWordScore(wordTiles, board)).toBe(8);
    });

    it('should apply word multipliers', () => {
      const board = createEmptyBoard();
      // "CAT" crossing center (5,5) which is DW.
      // C=3, A=1, T=1. Total 5 * 2 = 10.
      const wordTiles = [
        { r: 5, c: 4, letter: 'C' },
        { r: 5, c: 5, letter: 'A' },
        { r: 5, c: 6, letter: 'T' },
      ];
      expect(calculateWordScore(wordTiles, board)).toBe(10);
    });

    it('should ignore multipliers for already placed tiles', () => {
      const board = createEmptyBoard();
      // Suppose A on (5,5) was already placed.
      board[5][5] = 'A';
      const wordTiles = [
        { r: 5, c: 4, letter: 'C' },
        { r: 5, c: 5, letter: 'A' },
        { r: 5, c: 6, letter: 'T' },
      ];
      // Since (5,5) is already on board, DW multiplier at (5,5) does not apply.
      // Score = 3 (new C) + 1 (existing A) + 1 (new T) = 5.
      expect(calculateWordScore(wordTiles, board)).toBe(5);
    });
  });

  describe('findWordsFormed', () => {
    it('should find horizontal words', () => {
      const board = createEmptyBoard();
      const placements = [
        { r: 1, c: 2, letter: 'C' },
        { r: 1, c: 3, letter: 'A' },
        { r: 1, c: 4, letter: 'T' },
      ];
      const words = findWordsFormed(board, placements);
      expect(words).toHaveLength(1);
      expect(words[0].map((w) => w.letter).join('')).toBe('CAT');
    });

    it('should find horizontal word and cross words', () => {
      const board = createEmptyBoard();
      // Pre-populate 'O' at (2,3)
      board[2][3] = 'O';
      const placements = [
        { r: 1, c: 2, letter: 'C' },
        { r: 1, c: 3, letter: 'A' },
        { r: 1, c: 4, letter: 'T' },
      ];
      const words = findWordsFormed(board, placements);
      // Main word: CAT (horizontal)
      // Cross word: AO at (1,3)-(2,3) (vertical)
      expect(words).toHaveLength(2);
      const wordsText = words.map((w) => w.map((t) => t.letter).join(''));
      expect(wordsText).toContain('CAT');
      expect(wordsText).toContain('AO');
    });
  });

  describe('calculateTurnScore', () => {
    it('should calculate score for a turn including cross words and bingo', () => {
      const board = createEmptyBoard();
      board[2][3] = 'O';
      const placements = [
        { r: 1, c: 2, letter: 'C' },
        { r: 1, c: 3, letter: 'A' },
        { r: 1, c: 4, letter: 'T' },
      ];
      // CAT (5 pts) + AO (A=1 + O=1 = 2 pts) = 7 pts.
      expect(calculateTurnScore(board, placements)).toBe(7);
    });

    it('should add 50 points bingo bonus when playing 7 tiles', () => {
      const board = createEmptyBoard();
      const placements = [
        { r: 1, c: 1, letter: 'S' },
        { r: 1, c: 2, letter: 'C' },
        { r: 1, c: 3, letter: 'R' },
        { r: 1, c: 4, letter: 'A' },
        { r: 1, c: 5, letter: 'B' },
        { r: 1, c: 6, letter: 'B' },
        { r: 1, c: 7, letter: 'L' }, // 7 tiles
      ];
      const baseScore = calculateWordScore(placements, board);
      const totalScore = calculateTurnScore(board, placements);
      expect(totalScore).toBe(baseScore + 50);
    });
  });
});
