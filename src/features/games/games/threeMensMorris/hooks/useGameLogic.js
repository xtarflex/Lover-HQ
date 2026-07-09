/**
 * @file useGameLogic.js
 * @description Hook managing state and transitions for Three Men's Morris.
 */

import { useState, useCallback, useMemo } from 'react';
import { checkWinner, isValidPlacement, isValidMove } from '../utils/rules';

/**
 * @param {object} params
 * @param {string} params.myPlayerKey - 'player1' or 'player2'.
 * @returns {object} Game state and actions.
 */
export function useThreeMensMorrisLogic({ myPlayerKey }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState('player1'); // player1 always starts
  const [piecesPlaced, setPiecesPlaced] = useState({ player1: 0, player2: 0 });
  const [selectedPieceIndex, setSelectedPieceIndex] = useState(null);
  const [winner, setWinner] = useState(null); // 'player1', 'player2', or null

  const isMyTurn = currentTurn === myPlayerKey;

  const phase = useMemo(() => {
    return piecesPlaced.player1 < 3 || piecesPlaced.player2 < 3 ? 'placement' : 'movement';
  }, [piecesPlaced]);

  /**
   * Applies a placement or movement move to the board.
   *
   * @param {object} move
   * @param {string} move.type - 'place' | 'move'
   * @param {string} move.player - 'player1' | 'player2'
   * @param {number} [move.index] - Index for placement
   * @param {number} [move.from] - From index for movement
   * @param {number} [move.to] - To index for movement
   */
  const applyMove = useCallback((move) => {
    const { type, player } = move;
    const nextTurn = player === 'player1' ? 'player2' : 'player1';

    setBoard((prevBoard) => {
      const nextBoard = [...prevBoard];

      if (type === 'place') {
        const { index } = move;
        nextBoard[index] = player;
        setPiecesPlaced((prevPlaced) => ({
          ...prevPlaced,
          [player]: prevPlaced[player] + 1,
        }));
      } else if (type === 'move') {
        const { from, to } = move;
        nextBoard[from] = null;
        nextBoard[to] = player;
      }

      const w = checkWinner(nextBoard);
      if (w) {
        setWinner(w);
        setCurrentTurn(null);
      } else {
        setCurrentTurn(nextTurn);
      }

      return nextBoard;
    });

    setSelectedPieceIndex(null);
  }, []);

  /**
   * Handles user tapping on a node.
   *
   * @param {number} index - Board position index (0-8).
   * @returns {object|null} Payload to broadcast, or null if no state-modifying action occurred.
   */
  const handleNodeClick = useCallback(
    (index) => {
      if (!isMyTurn || winner) return null;

      if (phase === 'placement') {
        if (!isValidPlacement(board, index)) return null;

        const movePayload = {
          type: 'place',
          player: myPlayerKey,
          index,
        };
        applyMove(movePayload);
        return movePayload;
      } else {
        // Movement Phase
        if (selectedPieceIndex === null) {
          // Select own piece
          if (board[index] === myPlayerKey) {
            setSelectedPieceIndex(index);
          }
          return null;
        } else {
          // Piece is selected
          if (selectedPieceIndex === index) {
            // Deselect
            setSelectedPieceIndex(null);
            return null;
          }

          if (board[index] === myPlayerKey) {
            // Change selection to another own piece
            setSelectedPieceIndex(index);
            return null;
          }

          // Attempt to move to target empty slot
          if (isValidMove(board, selectedPieceIndex, index, myPlayerKey)) {
            const movePayload = {
              type: 'move',
              player: myPlayerKey,
              from: selectedPieceIndex,
              to: index,
            };
            applyMove(movePayload);
            return movePayload;
          }

          return null;
        }
      }
    },
    [board, isMyTurn, winner, phase, myPlayerKey, selectedPieceIndex, applyMove]
  );

  /**
   * Reset game state for rematch.
   */
  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentTurn('player1');
    setPiecesPlaced({ player1: 0, player2: 0 });
    setSelectedPieceIndex(null);
    setWinner(null);
  }, []);

  /**
   * Force winner (e.g. upon opponent forfeit).
   *
   * @param {string} playerKey
   */
  const forceWinner = useCallback((playerKey) => {
    setWinner(playerKey);
    setCurrentTurn(null);
  }, []);

  return {
    board,
    phase,
    currentTurn,
    piecesPlaced,
    selectedPieceIndex,
    winner,
    isMyTurn,
    handleNodeClick,
    applyRemoteMove: applyMove,
    reset,
    forceWinner,
  };
}
