/**
 * @file useGameLogic.js
 * @description Tic-Tac-Toe game logic hook.
 * Manages local board state, turn tracking, and win detection.
 */

import { useState, useCallback } from 'react';
import { checkTicTacToeWinner } from '../../lib/gameEngine';

/**
 * @param {object} params
 * @param {string} params.userId - Current user's ID.
 * @param {string} params.partnerId - Partner's ID.
 * @param {string} params.mySymbol - 'X' or 'O'.
 * @returns {object} Game state and action helpers.
 */
export function useTicTacToeLogic({ userId, partnerId, mySymbol }) {
  const partnerSymbol = mySymbol === 'X' ? 'O' : 'X';

  /** @type {[Array<string|null>, Function]} */
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentSymbol, setCurrentSymbol] = useState('X'); // X always starts
  const [winner, setWinner] = useState(null); // 'X', 'O', 'draw', or null

  const isMyTurn = currentSymbol === mySymbol;

  /**
   * Applies a move to the board at the given index.
   *
   * @param {number} index - Cell index (0-8).
   * @returns {{ newBoard: Array, winner: string|null }} Updated state for broadcasting.
   */
  const applyMove = useCallback(
    (index, symbol) => {
      const nextBoard = [...board];
      nextBoard[index] = symbol;
      setBoard(nextBoard);

      const w = checkTicTacToeWinner(nextBoard);
      const nextSymbol = symbol === 'X' ? 'O' : 'X';

      if (w) {
        setWinner(w);
        setCurrentSymbol(null);
      } else if (!nextBoard.includes(null)) {
        setWinner('draw');
        setCurrentSymbol(null);
      } else {
        setCurrentSymbol(nextSymbol);
      }

      return { newBoard: nextBoard, winner: w };
    },
    [board]
  );

  /**
   * Handles the local player tapping a cell.
   *
   * @param {number} index - Cell index.
   * @returns {{ index: number, symbol: string }|null} Move data to broadcast, or null if invalid.
   */
  const handleCellTap = useCallback(
    (index) => {
      if (!isMyTurn || winner || board[index]) return null;
      applyMove(index, mySymbol);
      return { index, symbol: mySymbol };
    },
    [board, isMyTurn, mySymbol, winner, applyMove]
  );

  /**
   * Processes a move received from the partner via broadcast.
   *
   * @param {{ index: number, symbol: string }} move
   */
  const applyRemoteMove = useCallback(
    ({ index }) => {
      applyMove(index, partnerSymbol);
    },
    [applyMove, partnerSymbol]
  );

  /** Resets the board for a rematch. */
  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentSymbol('X');
    setWinner(null);
  }, []);

  const forceWinner = useCallback((winSym) => {
    setWinner(winSym);
    setCurrentSymbol(null);
  }, []);

  const winnerId =
    winner === mySymbol ? userId : winner === partnerSymbol ? partnerId : null;

  return {
    board,
    isMyTurn,
    winner,
    winnerId,
    mySymbol,
    partnerSymbol,
    handleCellTap,
    applyRemoteMove,
    reset,
    forceWinner,
  };
}
