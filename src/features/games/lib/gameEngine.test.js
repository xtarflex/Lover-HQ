import { describe, it, expect } from 'vitest';
import {
  checkTicTacToeWinner,
  validateWordChain,
  generateSessionId,
  calculateLetterPoints,
} from './gameEngine';

describe('checkTicTacToeWinner', () => {
  it('should return null for an empty board', () => {
    const board = Array(9).fill(null);
    expect(checkTicTacToeWinner(board)).toBeNull();
  });

  it('should detect row wins', () => {
    // Top row
    expect(checkTicTacToeWinner(['X', 'X', 'X', null, 'O', null, 'O', null, null])).toBe('X');
    // Middle row
    expect(checkTicTacToeWinner([null, 'X', null, 'O', 'O', 'O', 'X', null, null])).toBe('O');
    // Bottom row
    expect(checkTicTacToeWinner(['O', null, null, null, 'O', null, 'X', 'X', 'X'])).toBe('X');
  });

  it('should detect column wins', () => {
    // Left column
    expect(checkTicTacToeWinner(['X', null, 'O', 'X', 'O', null, 'X', null, null])).toBe('X');
    // Middle column
    expect(checkTicTacToeWinner(['X', 'O', null, null, 'O', null, 'X', 'O', null])).toBe('O');
    // Right column
    expect(checkTicTacToeWinner([null, 'O', 'X', null, null, 'X', 'O', null, 'X'])).toBe('X');
  });

  it('should detect diagonal wins', () => {
    // Top-left to bottom-right
    expect(checkTicTacToeWinner(['X', 'O', null, 'O', 'X', null, null, null, 'X'])).toBe('X');
    // Top-right to bottom-left
    expect(checkTicTacToeWinner(['X', null, 'O', null, 'O', null, 'O', 'X', null])).toBe('O');
  });

  it('should return null for games in progress without a winner', () => {
    expect(checkTicTacToeWinner(['X', 'O', 'X', null, 'O', null, null, null, null])).toBeNull();
  });

  it('should return null for a drawn board', () => {
    // A classic draw board situation (full, no 3-in-a-row)
    const drawBoard = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(checkTicTacToeWinner(drawBoard)).toBeNull();
  });
});

describe('validateWordChain', () => {
  it('should reject empty or whitespace-only words', () => {
    expect(validateWordChain(null, '', []).valid).toBe(false);
    expect(validateWordChain(null, '   ', []).valid).toBe(false);
  });

  it('should accept the first word when prevWord is empty', () => {
    const result = validateWordChain(null, 'Apple', []);
    expect(result.valid).toBe(true);
  });

  it('should accept a word that begins with the last character of the previous word', () => {
    // "apple" ends with "e", "elephant" starts with "e"
    const result = validateWordChain('apple', 'elephant', []);
    expect(result.valid).toBe(true);
  });

  it('should reject a word that does not begin with the last character of the previous word', () => {
    // "apple" ends with "e", "banana" starts with "b"
    const result = validateWordChain('apple', 'banana', []);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('must start with "E"');
  });

  it('should reject duplicate words in the chain', () => {
    const result = validateWordChain('apple', 'elephant', ['elephant']);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('already used');
  });

  it('should enforce minLength constraint', () => {
    expect(validateWordChain(null, 'cat', [], { minLength: 4 }).valid).toBe(false);
    expect(validateWordChain(null, 'apple', [], { minLength: 4 }).valid).toBe(true);
    expect(validateWordChain(null, 'cat', [], { minLength: 'none' }).valid).toBe(true);
  });

  it('should enforce maxLength constraint', () => {
    expect(validateWordChain(null, 'elephant', [], { maxLength: 5 }).valid).toBe(false);
    expect(validateWordChain(null, 'apple', [], { maxLength: 5 }).valid).toBe(true);
    expect(validateWordChain(null, 'elephant', [], { maxLength: 'none' }).valid).toBe(true);
  });
});

describe('calculateLetterPoints', () => {
  it('should return 0 for empty or whitespace-only words', () => {
    expect(calculateLetterPoints('')).toBe(0);
    expect(calculateLetterPoints('   ')).toBe(0);
    expect(calculateLetterPoints(null)).toBe(0);
  });

  it('should calculate points correctly for standard words', () => {
    // c=3, a=1, t=1 => 5
    expect(calculateLetterPoints('cat')).toBe(5);
    // a=1, p=3, p=3, l=1, e=1 => 9
    expect(calculateLetterPoints('apple')).toBe(9);
  });

  it('should calculate points correctly for high-scoring words', () => {
    // q=10, u=1, a=1, r=1, t=1, z=10 => 24
    expect(calculateLetterPoints('quartz')).toBe(24);
  });

  it('should be case-insensitive and ignore non-alphabetic characters', () => {
    expect(calculateLetterPoints('Apple!')).toBe(9);
    expect(calculateLetterPoints('Q-U-I-Z')).toBe(22);
    expect(calculateLetterPoints('QUIZ')).toBe(22);
  });
});

describe('generateSessionId', () => {
  it('should consistently sort user IDs alphabetically to generate the same session ID', () => {
    const id1 = generateSessionId('ttt', 'userA', 'userB');
    const id2 = generateSessionId('ttt', 'userB', 'userA');
    expect(id1).toBe(id2);
    expect(id1).toBe('ttt-userA-userB');
  });

  it('should fall back to a pending timestamp ID if a user ID is missing', () => {
    const id = generateSessionId('ttt', null, 'userB');
    expect(id).toMatch(/^ttt-pending-\d+/);
  });
});
