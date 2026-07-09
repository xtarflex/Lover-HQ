import { describe, it, expect } from 'vitest';
import { checkWinner, isValidPlacement, isValidMove, CONNECTIONS } from './rules';

describe("Three Men's Morris Game Rules", () => {
  describe('checkWinner', () => {
    it('returns null for an empty board', () => {
      const board = Array(9).fill(null);
      expect(checkWinner(board)).toBeNull();
    });

    it('detects a horizontal win row', () => {
      const board = ['player1', 'player1', 'player1', null, null, null, null, null, null];
      expect(checkWinner(board)).toBe('player1');
    });

    it('detects a vertical win column', () => {
      const board = ['player2', null, null, 'player2', null, null, 'player2', null, null];
      expect(checkWinner(board)).toBe('player2');
    });

    it('detects diagonal win lines passing through the center', () => {
      const board1 = ['player1', null, null, null, 'player1', null, null, null, 'player1'];
      expect(checkWinner(board1)).toBe('player1');

      const board2 = [null, null, 'player2', null, 'player2', null, 'player2', null, null];
      expect(checkWinner(board2)).toBe('player2');
    });

    it('returns null if there are three pieces in a non-winning configuration', () => {
      const board = ['player1', 'player1', null, null, null, 'player1', null, null, null];
      expect(checkWinner(board)).toBeNull();
    });
  });

  describe('isValidPlacement', () => {
    it('returns true if target index is empty', () => {
      const board = Array(9).fill(null);
      expect(isValidPlacement(board, 0)).toBe(true);
      expect(isValidPlacement(board, 4)).toBe(true);
    });

    it('returns false if target index is occupied', () => {
      const board = Array(9).fill(null);
      board[2] = 'player1';
      expect(isValidPlacement(board, 2)).toBe(false);
    });

    it('returns false for out of bounds indexes', () => {
      const board = Array(9).fill(null);
      expect(isValidPlacement(board, -1)).toBe(false);
      expect(isValidPlacement(board, 9)).toBe(false);
    });
  });

  describe('isValidMove', () => {
    it('allows a valid adjacent move to an empty node', () => {
      const board = ['player1', null, null, null, null, null, null, null, null];
      // Node 0 is connected to 1
      expect(isValidMove(board, 0, 1, 'player1')).toBe(true);
    });

    it('rejects moving a piece that belongs to the other player', () => {
      const board = ['player2', null, null, null, null, null, null, null, null];
      expect(isValidMove(board, 0, 1, 'player1')).toBe(false);
    });

    it('rejects moving to an occupied node', () => {
      const board = ['player1', 'player2', null, null, null, null, null, null, null];
      expect(isValidMove(board, 0, 1, 'player1')).toBe(false);
    });

    it('rejects moving to a non-adjacent node', () => {
      const board = ['player1', null, null, null, null, null, null, null, null];
      // Node 0 is not connected to 8
      expect(isValidMove(board, 0, 8, 'player1')).toBe(false);
    });

    it('rejects moving from an empty node', () => {
      const board = Array(9).fill(null);
      expect(isValidMove(board, 0, 1, 'player1')).toBe(false);
    });

    it('rejects out of bounds coordinates', () => {
      const board = ['player1', null, null, null, null, null, null, null, null];
      expect(isValidMove(board, 0, -1, 'player1')).toBe(false);
      expect(isValidMove(board, 0, 9, 'player1')).toBe(false);
    });
  });

  describe('CONNECTIONS maps to valid adjacency requirements', () => {
    it('verifies center node connects to all other 8 nodes', () => {
      expect(CONNECTIONS[4]).toEqual([0, 1, 2, 3, 5, 6, 7, 8]);
    });

    it('verifies corner nodes have 3 connections', () => {
      expect(CONNECTIONS[0].length).toBe(3); // 1, 3, 4
      expect(CONNECTIONS[2].length).toBe(3); // 1, 4, 5
      expect(CONNECTIONS[6].length).toBe(3); // 3, 4, 7
      expect(CONNECTIONS[8].length).toBe(3); // 4, 5, 7
    });
  });
});
