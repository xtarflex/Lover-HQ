import { describe, it, expect } from 'vitest';
import { createInitialBag, drawTiles, getLetterScore } from './tileBag';

describe('tileBag utility', () => {
  describe('createInitialBag', () => {
    it('should create a bag with 100 tiles', () => {
      const bag = createInitialBag();
      expect(bag).toHaveLength(100);
    });

    it('should contain the expected number of A and Z tiles', () => {
      const bag = createInitialBag();
      const aCount = bag.filter((t) => t === 'A').length;
      const zCount = bag.filter((t) => t === 'Z').length;
      expect(aCount).toBe(9);
      expect(zCount).toBe(1);
    });
  });

  describe('drawTiles', () => {
    it('should draw correct number of tiles and update bag', () => {
      const bag = createInitialBag();
      const { drawn, remainingBag } = drawTiles(bag, 7);
      expect(drawn).toHaveLength(7);
      expect(remainingBag).toHaveLength(93);
      expect([...drawn, ...remainingBag].sort()).toEqual([...bag].sort());
    });

    it('should handle drawing more tiles than are in the bag', () => {
      const bag = ['A', 'B'];
      const { drawn, remainingBag } = drawTiles(bag, 5);
      expect(drawn).toHaveLength(2);
      expect(remainingBag).toHaveLength(0);
    });
  });

  describe('getLetterScore', () => {
    it('should return correct scores for letters case-insensitively', () => {
      expect(getLetterScore('a')).toBe(1);
      expect(getLetterScore('Z')).toBe(10);
      expect(getLetterScore('q')).toBe(10);
      expect(getLetterScore('K')).toBe(5);
    });

    it('should return 0 for empty or invalid letters', () => {
      expect(getLetterScore('')).toBe(0);
      expect(getLetterScore(null)).toBe(0);
      expect(getLetterScore('?')).toBe(0);
    });
  });
});
