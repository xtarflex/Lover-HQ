import { describe, it, expect } from 'vitest';
import { getGameById, getGamesByTag } from './index';

describe('Game Registry', () => {
  describe('getGameById', () => {
    it('returns the correct game definition for a known ID', () => {
      const game = getGameById('tic-tac-toe');
      expect(game).toBeDefined();
      expect(game?.id).toBe('tic-tac-toe');
      expect(game?.name).toBe('Tic-Tac-Toe');
    });

    it('returns undefined for a non-existent ID', () => {
      const game = getGameById('non-existent-game-id');
      expect(game).toBeUndefined();
    });

    it('returns undefined when ID is not provided', () => {
      const game = getGameById();
      expect(game).toBeUndefined();
    });
  });

  describe('getGamesByTag', () => {
    it('returns games containing the specified tag', () => {
      const classicGames = getGamesByTag('classic');
      expect(classicGames.length).toBeGreaterThan(0);
      expect(classicGames.every((game) => game.tags.includes('classic'))).toBe(true);

      const hasTicTacToe = classicGames.some((game) => game.id === 'tic-tac-toe');
      const hasScrabble = classicGames.some((game) => game.id === 'scrabble');
      expect(hasTicTacToe).toBe(true);
      expect(hasScrabble).toBe(true);
    });

    it('returns an empty array for a non-existent tag', () => {
      const games = getGamesByTag('non-existent-tag');
      expect(games).toEqual([]);
    });

    it('returns games for a tag unique to one game', () => {
      const drawingGames = getGamesByTag('creative');
      expect(drawingGames.length).toBe(1);
      expect(drawingGames[0].id).toBe('quick-draw');
    });

    it('returns an empty array when tag is not provided', () => {
      const games = getGamesByTag();
      expect(games).toEqual([]);
    });
  });
});
