import { describe, it, expect, vi } from 'vitest';
import { GameRecorder } from './gameRecorder';

// Mock Supabase client database operations
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-replay-uuid' }, error: null })),
        })),
      })),
    })),
  },
}));

describe('GameRecorder', () => {
  it('should initialize with correct game properties and empty moves list', () => {
    const recorder = new GameRecorder('tic-tac-toe', 'userA', 'userB');
    expect(recorder.gameType).toBe('tic-tac-toe');
    expect(recorder.playerAId).toBe('userA');
    expect(recorder.playerBId).toBe('userB');
    expect(recorder.moves).toEqual([]);
    expect(typeof recorder.startTime).toBe('number');
  });

  it('should append moves correctly with playerId, action, and payload data', () => {
    const recorder = new GameRecorder('word-chain', 'userA', 'userB');
    recorder.recordMove('userA', 'word', { word: 'hello' });

    expect(recorder.moves.length).toBe(1);
    expect(recorder.moves[0]).toMatchObject({
      playerId: 'userA',
      action: 'word',
      payload: { word: 'hello' },
    });
    expect(typeof recorder.moves[0].timestamp).toBe('number');
  });

  it('should record multiple moves in sequence preserving order', () => {
    const recorder = new GameRecorder('word-chain', 'userA', 'userB');
    recorder.recordMove('userA', 'word', { word: 'hello' });
    recorder.recordMove('userB', 'word', { word: 'ocean' });

    expect(recorder.moves.length).toBe(2);
    expect(recorder.moves[0].payload.word).toBe('hello');
    expect(recorder.moves[1].payload.word).toBe('ocean');
    expect(recorder.moves[0].timestamp).toBeLessThanOrEqual(recorder.moves[1].timestamp);
  });

  it('should return replay UUID upon calling save() method', async () => {
    const recorder = new GameRecorder('tic-tac-toe', 'userA', 'userB');
    recorder.recordMove('userA', 'place', { index: 4 });

    const id = await recorder.save('userA');
    expect(id).toBe('test-replay-uuid');
  });
});
