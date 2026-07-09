import { describe, it, expect } from 'vitest';
import { GAME_REGISTRY, getGameById, getGamesByTag } from './index';

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
    it('returns matching games when the tag exists', () => {
      const expectedClassicGames = GAME_REGISTRY.filter((g) => g.tags.includes('classic'));
      expect(expectedClassicGames.length).toBeGreaterThan(0);

      const result = getGamesByTag('classic');
      expect(result).toHaveLength(expectedClassicGames.length);
      result.forEach((game) => {
        expect(game.tags).toContain('classic');
      });
    });

    it('returns an empty array when the tag does not exist', () => {
      const result = getGamesByTag('this-tag-does-not-exist');
      expect(result).toEqual([]);
    });

    it('returns games matching another valid tag', () => {
      const expectedThinkingGames = GAME_REGISTRY.filter((g) => g.tags.includes('thinking'));
      expect(expectedThinkingGames.length).toBeGreaterThan(0);

      const result = getGamesByTag('thinking');
      expect(result).toHaveLength(expectedThinkingGames.length);
      result.forEach((game) => {
        expect(game.tags).toContain('thinking');
      });
    });

    it('returns an empty array when tag is not provided', () => {
      const games = getGamesByTag();
      expect(games).toEqual([]);
    });
  });
});
