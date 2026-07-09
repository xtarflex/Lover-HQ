import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThreeMensMorrisLogic } from './useGameLogic';

describe('useThreeMensMorrisLogic Hook', () => {
  it('initializes with default states', () => {
    const { result } = renderHook(() => useThreeMensMorrisLogic({ myPlayerKey: 'player1' }));

    expect(result.current.board).toEqual(Array(9).fill(null));
    expect(result.current.phase).toBe('placement');
    expect(result.current.currentTurn).toBe('player1');
    expect(result.current.winner).toBeNull();
    expect(result.current.isMyTurn).toBe(true);
  });

  it('handles placement turns alternating', () => {
    const { result } = renderHook(() => useThreeMensMorrisLogic({ myPlayerKey: 'player1' }));

    // player1 places piece at node 0
    let actionResult;
    act(() => {
      actionResult = result.current.handleNodeClick(0);
    });

    expect(actionResult).toEqual({
      type: 'place',
      player: 'player1',
      index: 0,
    });
    expect(result.current.board[0]).toBe('player1');
    expect(result.current.piecesPlaced.player1).toBe(1);
    expect(result.current.currentTurn).toBe('player2');
    expect(result.current.isMyTurn).toBe(false); // now it is player2's turn
  });

  it('rejects action if not my turn', () => {
    const { result } = renderHook(() => useThreeMensMorrisLogic({ myPlayerKey: 'player2' }));

    expect(result.current.isMyTurn).toBe(false);

    let actionResult;
    act(() => {
      actionResult = result.current.handleNodeClick(0);
    });

    expect(actionResult).toBeNull();
    expect(result.current.board[0]).toBeNull();
  });

  it('transitions to movement phase after placing all 3 pieces per player', () => {
    const { result } = renderHook(() => useThreeMensMorrisLogic({ myPlayerKey: 'player1' }));

    // Apply placements alternately
    act(() => {
      result.current.applyRemoteMove({ type: 'place', player: 'player1', index: 0 }); // p1
      result.current.applyRemoteMove({ type: 'place', player: 'player2', index: 1 }); // p2
      result.current.applyRemoteMove({ type: 'place', player: 'player1', index: 2 }); // p1
      result.current.applyRemoteMove({ type: 'place', player: 'player2', index: 3 }); // p2
      result.current.applyRemoteMove({ type: 'place', player: 'player1', index: 4 }); // p1
      result.current.applyRemoteMove({ type: 'place', player: 'player2', index: 5 }); // p2
    });

    expect(result.current.phase).toBe('movement');
    expect(result.current.piecesPlaced).toEqual({ player1: 3, player2: 3 });
  });

  it('selects and deselects pieces in movement phase', () => {
    const { result } = renderHook(() => useThreeMensMorrisLogic({ myPlayerKey: 'player1' }));

    // Set up board for movement phase
    act(() => {
      result.current.applyRemoteMove({ type: 'place', player: 'player1', index: 0 }); // p1
      result.current.applyRemoteMove({ type: 'place', player: 'player2', index: 1 }); // p2
      result.current.applyRemoteMove({ type: 'place', player: 'player1', index: 2 }); // p1
      result.current.applyRemoteMove({ type: 'place', player: 'player2', index: 3 }); // p2
      result.current.applyRemoteMove({ type: 'place', player: 'player1', index: 6 }); // p1
      result.current.applyRemoteMove({ type: 'place', player: 'player2', index: 5 }); // p2
    });

    // Currently it is player1's turn
    expect(result.current.currentTurn).toBe('player1');
    expect(result.current.isMyTurn).toBe(true);

    // Select piece at node 0
    act(() => {
      result.current.handleNodeClick(0);
    });
    expect(result.current.selectedPieceIndex).toBe(0);

    // Deselect by clicking again
    act(() => {
      result.current.handleNodeClick(0);
    });
    expect(result.current.selectedPieceIndex).toBeNull();
  });

  it('executes a valid movement move', () => {
    const { result } = renderHook(() => useThreeMensMorrisLogic({ myPlayerKey: 'player1' }));

    // Setup board
    act(() => {
      result.current.applyRemoteMove({ type: 'place', player: 'player1', index: 0 }); // p1 at 0
      result.current.applyRemoteMove({ type: 'place', player: 'player2', index: 1 }); // p2 at 1
      result.current.applyRemoteMove({ type: 'place', player: 'player1', index: 2 }); // p1 at 2
      result.current.applyRemoteMove({ type: 'place', player: 'player2', index: 3 }); // p2 at 3
      result.current.applyRemoteMove({ type: 'place', player: 'player1', index: 8 }); // p1 at 8 (not 6, to avoid diagonal win [2,4,6] on move to 4)
      result.current.applyRemoteMove({ type: 'place', player: 'player2', index: 5 }); // p2 at 5
    });

    // Select piece at 0
    act(() => {
      result.current.handleNodeClick(0);
    });

    // Move to 4 (empty and adjacent to 0)
    let actionResult;
    act(() => {
      actionResult = result.current.handleNodeClick(4);
    });

    expect(actionResult).toEqual({
      type: 'move',
      player: 'player1',
      from: 0,
      to: 4,
    });
    expect(result.current.board[0]).toBeNull();
    expect(result.current.board[4]).toBe('player1');
    expect(result.current.currentTurn).toBe('player2');
  });

  it('detects a winner on remote or local move', () => {
    const { result } = renderHook(() => useThreeMensMorrisLogic({ myPlayerKey: 'player1' }));

    // player1 placements: 0, 1, and then player1 will place at 2 for the win
    act(() => {
      result.current.applyRemoteMove({ type: 'place', player: 'player1', index: 0 });
      result.current.applyRemoteMove({ type: 'place', player: 'player2', index: 3 });
      result.current.applyRemoteMove({ type: 'place', player: 'player1', index: 1 });
      result.current.applyRemoteMove({ type: 'place', player: 'player2', index: 4 });
    });

    expect(result.current.winner).toBeNull();

    // player1 places at 2 to form mill [0,1,2]
    act(() => {
      result.current.handleNodeClick(2);
    });

    expect(result.current.winner).toBe('player1');
    expect(result.current.currentTurn).toBeNull();
  });
});
