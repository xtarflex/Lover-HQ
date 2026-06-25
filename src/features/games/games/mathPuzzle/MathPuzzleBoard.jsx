/**
 * @file MathPuzzleBoard.jsx
 * @description Renders the CrossMath equation grid, empty slots, placed tiles, and inline validation statuses.
 */

import React from 'react';
import { checkRowEquation, checkColEquation } from './utils/validator';

/**
 * @param {object} props
 * @param {any[][]} props.grid - The puzzle grid state.
 * @param {number} props.size - Matrix size (5, 7, 9).
 * @param {function(number, number): void} props.onCellClick - Tap empty or placed slot.
 * @param {boolean} [props.isDragActive=false] - Whether a tile is currently picked up.
 * @param {boolean} [props.readOnly=false] - Frozen inspect view.
 * @returns {React.ReactElement}
 */
export default function MathPuzzleBoard({
  grid,
  size,
  onCellClick,
  isDragActive = false,
  readOnly = false,
}) {
  const cells = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = grid[r][c];

      if (!cell) {
        cells.push(<div key={`${r}-${c}`} className="math-cell" />);
        continue;
      }

      if (cell.type === 'number') {
        if (cell.isHidden) {
          const val = cell.currentValue;
          const hasTile = val !== undefined && val !== null && val !== '';

          cells.push(
            <button
              key={`${r}-${c}`}
              id={`math-slot-${r}-${c}`}
              disabled={readOnly}
              onClick={() => onCellClick(r, c)}
              className={`math-cell math-cell-slot ${hasTile ? 'has-tile' : ''}`}
              aria-label={`Empty slot at row ${r + 1}, col ${c + 1}`}
            >
              {hasTile && <div className="math-placed-tile">{val}</div>}
            </button>
          );
        } else {
          cells.push(
            <div
              key={`${r}-${c}`}
              className="math-cell math-cell-immutable"
              aria-label={`Immutable number ${cell.value}`}
            >
              {cell.value}
            </div>
          );
        }
      } else if (cell.type === 'operator') {
        cells.push(
          <div key={`${r}-${c}`} className="math-cell math-cell-operator">
            {cell.value}
          </div>
        );
      } else if (cell.type === 'equals') {
        cells.push(
          <div key={`${r}-${c}`} className="math-cell math-cell-equals">
            {cell.value}
          </div>
        );
      } else if (cell.type === 'result') {
        // Compute equation status for this result cell
        let status = 'incomplete';
        if (r < size - 1 && c === size - 1) {
          // Horizontal equation
          status = checkRowEquation(grid, r);
        } else if (r === size - 1 && c < size - 1) {
          // Vertical equation
          status = checkColEquation(grid, c);
        }

        const showDot = status === 'correct' || status === 'incorrect';

        cells.push(
          <div
            key={`${r}-${c}`}
            className="math-cell math-cell-result"
            aria-label={`Result ${cell.value}`}
          >
            {cell.value}
            {showDot && (
              <span
                className={`absolute w-3 h-3 rounded-full -top-1 -right-1 border border-[#0F172A] ${
                  status === 'correct'
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500'
                    : 'bg-red-500 shadow-sm shadow-red-500 animate-bounce'
                }`}
                style={{
                  backgroundColor: status === 'correct' ? '#10B981' : '#EF4444',
                  boxShadow: status === 'correct' ? '0 0 8px #10B981' : '0 0 8px #EF4444',
                }}
              />
            )}
          </div>
        );
      } else {
        cells.push(<div key={`${r}-${c}`} className="math-cell" />);
      }
    }
  }

  return (
    <div
      className={`math-board ${isDragActive ? 'drag-active' : ''}`}
      style={{ '--matrix-size': size }}
      role="grid"
      aria-label="CrossMath puzzle board"
    >
      {cells}
    </div>
  );
}
