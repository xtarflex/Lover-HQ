/**
 * @file MathPuzzleBoard.jsx
 * @description Renders the CrossMath equation grid, empty slots, placed tiles, and inline validation statuses.
 */

import React from 'react';
import {
  traceHorizontalEquation,
  traceVerticalEquation,
  checkEquationStatus,
  isCellHorizontalResult,
  isCellVerticalResult,
  getLockedCellsMap,
} from './utils/validator';

/**
 * @param {object} props
 * @param {any[][]} props.grid - The puzzle grid state.
 * @param {function(number, number): void} props.onCellClick - Tap empty or placed slot.
 * @param {boolean} [props.isDragActive=false] - Whether a tile is currently picked up.
 * @param {boolean} [props.readOnly=false] - Frozen inspect view.
 * @returns {React.ReactElement}
 */
export default function MathPuzzleBoard({
  grid,
  onCellClick,
  isDragActive = false,
  readOnly = false,
  onDragStartTile,
  onDragOverCell,
  onDropCell,
  onTouchStartTile,
}) {
  const cells = [];
  const cellStatusMap = {};
  const lockedMap = getLockedCellsMap(grid);

  const height = grid.length;
  const width = grid[0]?.length || 0;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (isCellHorizontalResult(grid, r, c)) {
        const hEq = traceHorizontalEquation(grid, r, c);
        if (hEq) {
          const status = checkEquationStatus(hEq, grid);
          if (status === 'correct' || status === 'incorrect') {
            hEq.cells.forEach(({ r: er, c: ec }) => {
              const key = `${er}-${ec}`;
              if (cellStatusMap[key] !== 'incorrect') {
                cellStatusMap[key] = status;
              }
            });
          }
        }
      }

      if (isCellVerticalResult(grid, r, c)) {
        const vEq = traceVerticalEquation(grid, r, c);
        if (vEq) {
          const status = checkEquationStatus(vEq, grid);
          if (status === 'correct' || status === 'incorrect') {
            vEq.cells.forEach(({ r: er, c: ec }) => {
              const key = `${er}-${ec}`;
              if (cellStatusMap[key] !== 'incorrect') {
                cellStatusMap[key] = status;
              }
            });
          }
        }
      }
    }
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const cell = grid[r]?.[c];
      const key = `${r}-${c}`;
      const statusClass = cellStatusMap[key] ? `math-eq-${cellStatusMap[key]}` : '';

      if (!cell || cell.type === 'empty') {
        cells.push(<div key={key} className="math-cell math-cell-empty" />);
        continue;
      }

      // --- Hidden N cell (player fills in) — check BEFORE isIntermediate ---
      if (cell.type === 'number' && cell.isHidden) {
        const val = cell.currentValue;
        const hasTile = val !== undefined && val !== null && val !== '';
        const isLocked = lockedMap[key];

        cells.push(
          <button
            key={key}
            id={`math-slot-${r}-${c}`}
            disabled={readOnly || isLocked}
            onClick={() => onCellClick(r, c)}
            onDragOver={onDragOverCell}
            onDrop={(e) => onDropCell && onDropCell(e, r, c)}
            className={`math-cell math-cell-slot ${hasTile ? 'has-tile' : ''} ${isLocked ? 'math-cell-locked' : ''} ${statusClass}`}
            aria-label={`Empty slot at row ${r + 1}, col ${c + 1}`}
          >
            {hasTile && (
              <div
                draggable={!readOnly && !isLocked}
                onDragStart={(e) => onDragStartTile && onDragStartTile(e, r, c, val)}
                onTouchStart={(e) => onTouchStartTile && onTouchStartTile(e, r, c, val)}
                className="math-placed-tile cursor-grab active:cursor-grabbing"
              >
                {val}
              </div>
            )}
          </button>
        );
        continue;
      }

      // --- Blind result N cell (isBlind=true): value hidden, NOT in rack ---
      // Renders as a blank dark tile. Player deduces from context.
      if (cell.type === 'number' && cell.isBlind) {
        cells.push(
          <div
            key={key}
            className={`math-cell math-cell-blind-result ${statusClass}`}
            aria-label={`Hidden result at row ${r + 1}, col ${c + 1}`}
          />
        );
        continue;
      }

      // --- Visible result N cell (isClue=true, auto-computed anchor) ---
      const isResultCell =
        cell.type === 'number' &&
        (isCellHorizontalResult(grid, r, c) || isCellVerticalResult(grid, r, c));

      if (isResultCell && cell.isClue) {
        const val = cell.currentValue ?? cell.value;
        const hasVal = val !== undefined && val !== null && val !== '' && !isNaN(val);
        const valStr = hasVal ? String(val) : '';
        const style =
          valStr.length > 3 ? { fontSize: `${Math.max(0.45, 3.5 / valStr.length)}em` } : {};
        cells.push(
          <div
            key={key}
            className={`math-cell math-cell-result math-cell-intermediate has-value ${statusClass}`}
            style={style}
            aria-label={`Result ${hasVal ? val : 'empty'}`}
          >
            {hasVal ? val : ''}
          </div>
        );
      } else if (cell.type === 'number') {
        // Visible independent N cell (given clue)
        const valStr = String(cell.value ?? '');
        const style =
          valStr.length > 3 ? { fontSize: `${Math.max(0.45, 3.5 / valStr.length)}em` } : {};
        cells.push(
          <div
            key={key}
            className={`math-cell math-cell-immutable ${statusClass}`}
            style={style}
            aria-label={`Number ${cell.value}`}
          >
            {cell.value}
          </div>
        );
      } else if (cell.type === 'operator') {
        cells.push(
          <div key={key} className={`math-cell math-cell-operator ${statusClass}`}>
            {cell.value}
          </div>
        );
      } else if (cell.type === 'equals') {
        cells.push(
          <div key={key} className={`math-cell math-cell-equals ${statusClass}`}>
            {cell.value}
          </div>
        );
      } else {
        cells.push(<div key={key} className="math-cell math-cell-empty" />);
      }
    }
  }

  return (
    <div
      className={`math-board ${isDragActive ? 'drag-active' : ''}`}
      role="grid"
      aria-label="CrossMath puzzle board"
    >
      {cells}
    </div>
  );
}
