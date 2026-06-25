/**
 * @file ScrabbleBoard.jsx
 * @description 11×11 grid board renderer for Classic Scrabble.
 */

import React from 'react';
import { getMultiplier, BOARD_SIZE } from './utils/scoring';
import { getLetterScore } from './utils/tileBag';

/**
 * @param {object} props
 * @param {string[][]} props.board - Immutable board state (grid of letters or null).
 * @param {{r: number, c: number, letter: string}[]} props.newPlacements - Tiles placed this turn.
 * @param {function(number, number): void} props.onCellClick - Callback when cell is tapped.
 * @returns {React.ReactElement}
 */
export default function ScrabbleBoard({ board, newPlacements, onCellClick }) {
  // Helper to check if a tile is placed in this cell this turn
  const getNewPlacement = (r, c) => {
    return newPlacements.find((p) => p.r === r && p.c === c);
  };

  const cells = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const tile = board[r][c];
      const newPlacement = getNewPlacement(r, c);
      const mult = getMultiplier(r, c);

      let cellClass = 'cell-plain';
      let multText = '';

      if (mult.type === 'DL') {
        cellClass = 'cell-dl';
        multText = 'DL';
      } else if (mult.type === 'TL') {
        cellClass = 'cell-tl';
        multText = 'TL';
      } else if (mult.type === 'DW') {
        cellClass = 'cell-dw';
        multText = 'DW';
      } else if (mult.type === 'TW') {
        cellClass = 'cell-tw';
        multText = 'TW';
      } else if (r === 5 && c === 5) {
        cellClass = 'cell-center';
        multText = '★';
      }

      const hasTile = !!tile || !!newPlacement;
      const displayLetter = tile || newPlacement?.letter;
      const isNew = !!newPlacement;

      cells.push(
        <button
          key={`${r}-${c}`}
          id={`scrabble-cell-${r}-${c}`}
          onClick={() => onCellClick(r, c)}
          className={`scrabble-cell ${cellClass} ${hasTile ? 'has-tile' : ''}`}
          aria-label={`Cell at row ${r + 1}, column ${c + 1}. ${
            displayLetter
              ? `Contains letter ${displayLetter}`
              : multText
                ? `Multiplier ${multText}`
                : 'Empty cell'
          }`}
        >
          {!hasTile && multText && <span className="cell-mult">{multText}</span>}

          {hasTile && (
            <div className={`scrabble-tile ${isNew ? 'new-placement' : ''}`}>
              {displayLetter}
              <span className="tile-score">{getLetterScore(displayLetter)}</span>
            </div>
          )}
        </button>
      );
    }
  }

  return (
    <div className="scrabble-board" role="grid" aria-label="Scrabble board">
      {cells}
    </div>
  );
}
