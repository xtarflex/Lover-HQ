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
 * @param {function(object, number, number, number): void} [props.onDragStartTile] - Desktop drag start for placed tiles.
 * @param {function(object): void} [props.onDragOverCell] - Desktop drag over cell.
 * @param {function(object, number, number): void} [props.onDropCell] - Desktop drop tile on cell.
 * @param {function(object, number): void} [props.onTouchStartTile] - Mobile touch start for placed tiles.
 * @returns {React.ReactElement}
 */
export default function ScrabbleBoard({
  board,
  newPlacements,
  onCellClick,
  onDragStartTile,
  onDragOverCell,
  onDropCell,
  onTouchStartTile,
}) {
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
      } else if (r === 7 && c === 7) {
        cellClass = 'cell-center';
        multText = '★';
      }

      const hasTile = !!tile || !!newPlacement;
      const displayLetter = tile?.letter || newPlacement?.letter;
      const isNew = !!newPlacement;
      const isBlank = !!(tile?.isBlank || newPlacement?.isBlank);

      cells.push(
        <button
          key={`${r}-${c}`}
          id={`scrabble-cell-${r}-${c}`}
          onClick={() => onCellClick(r, c)}
          onDragOver={onDragOverCell}
          onDrop={(e) => onDropCell && onDropCell(e, r, c)}
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
            <div
              draggable={isNew}
              onDragStart={(e) => {
                if (isNew && onDragStartTile) {
                  const idx = newPlacements.findIndex((p) => p.r === r && p.c === c);
                  onDragStartTile(e, idx, r, c);
                }
              }}
              onTouchStart={(e) => {
                if (isNew && onTouchStartTile) {
                  const idx = newPlacements.findIndex((p) => p.r === r && p.c === c);
                  onTouchStartTile(e, idx);
                }
              }}
              className={`scrabble-tile ${isNew ? 'new-placement' : ''} ${isBlank ? 'blank-tile' : ''} ${isNew ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              {displayLetter}
              <span className="tile-score">{getLetterScore(displayLetter, isBlank)}</span>
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
