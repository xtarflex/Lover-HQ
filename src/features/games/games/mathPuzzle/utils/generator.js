/**
 * @file generator.js
 * @description Procedural CrossMath equation puzzle generator and backtracking solver.
 * All templates use a fixed 11x11 canvas. No dedicated R cells - result positions are
 * simply N cells that follow an = sign. ~60% of result cells are shown as visible clues,
 * ~40% are hidden and added to the rack pool, increasing gameplay depth.
 */

import {
  isGridCompleteAndCorrect,
  traceHorizontalEquation,
  traceVerticalEquation,
  checkEquationStatus,
  isCellHorizontalResult,
  isCellVerticalResult,
  recalculateIntermediateResults,
} from './validator';

// --- 11x11 Templates (N=number, o=operator, ==equals, .=empty) ---
// N cells that follow = are result cells; generator marks ~60% as visible clues,
// hides the rest (adding them to the player rack).

const EASY_TEMPLATES = [
  [
    '. . . . . . . . . . .',
    '. . . . . . . . . . .',
    '. . . . . . . . . . .',
    '. . . . . . . . . . .',
    '. . . . N o N = N . .',
    '. . . . o . . . . . .',
    '. . . . N o N = N . .',
    '. . . . = . . . . . .',
    '. . . . N . . . . . .',
    '. . . . . . . . . . .',
    '. . . . . . . . . . .',
  ],
  [
    '. . . . . . . . . . .',
    '. . . . . . N o N = N',
    '. . . . . . o . o . .',
    '. . . . . . N o N = N',
    '. . . . . . = . = . .',
    '. . . . . . N . N . .',
    '. . . . . . . . . . .',
    '. . . . . . . . . . .',
    '. . . . . . . . . . .',
    '. . . . . . . . . . .',
    '. . . . . . . . . . .',
  ],
];

const MEDIUM_TEMPLATES = [
  [
    '. . . . . N . . . . .',
    '. . . . . o . . . . .',
    '. . . . . N . . . . .',
    '. . . . . = . . . . .',
    'N o N = N . N o N = N',
    '. . . . . = . . . . .',
    '. . . . . N . . . . .',
    '. . . . . o . . . . .',
    '. . . . . N . . . . .',
    '. . . . . = . . . . .',
    '. . . . . N . . . . .',
  ],
  [
    '. . . . . . . . . . .',
    '. . N o N = N . . . .',
    '. . o . o . o . . . .',
    '. . N o N = N . . . .',
    '. . = . = . = . . . .',
    '. . N . N . N . . . .',
    '. . o . o . o . . . .',
    '. . N o N = N . . . .',
    '. . = . = . = . . . .',
    '. . N . N . N . . . .',
    '. . . . . . . . . . .',
  ],
];

const EXPERT_TEMPLATES = [
  [
    'N o N = N . N o N = N',
    'o . o . . . . . o . o',
    'N . N o N = N . N . N',
    '= . = . o . . . = . =',
    'N . N . N o N = N . N',
    '. . . . = . o . . . .',
    'N o N = N . N o N = N',
    'o . o . . . = . o . o',
    'N . N o N = N . N . N',
    '= . = . . . . . = . =',
    'N o N = N . N o N = N',
  ],
  [
    'N o N = N . . . . . .',
    'o . . . o . . . . . .',
    'N . N o N = N . . . .',
    '= . o . = . . . . . .',
    'N . N . N o N = N . .',
    '. . = . o . . . o . .',
    '. . N . N . N o N = N',
    '. . . . = . o . = . .',
    '. . . . N . N . N . .',
    '. . . . . . = . . . .',
    '. . . . . . N . . . .',
  ],
];

/** @returns {boolean} Whether a cell is any kind of result (follows =) */
function isCellResult(grid, r, c) {
  return isCellHorizontalResult(grid, r, c) || isCellVerticalResult(grid, r, c);
}

/**
 * Evaluates the equation leading to (r,c) and adjusts the operator to keep
 * intermediate values within [1, 500].
 */
function evaluateAndAdjustEquation(grid, eq, opCellCoords) {
  const A = Number(eq.numbers[0]);
  const B = Number(eq.numbers[1]);
  let op = eq.operators[0];

  if (op === '×' || op === 'x') {
    if (A * B > 500) op = Math.random() < 0.5 ? '+' : '-';
  } else if (op === '÷') {
    if (B === 0 || A % B !== 0 || A / B < 1) op = Math.random() < 0.5 ? '+' : '-';
  }

  if (op === '+' && A + B > 500) op = '-';
  if (op === '-' && A - B < 1) op = '+';

  grid[opCellCoords.r][opCellCoords.c].value = op;

  if (op === '+') return A + B;
  if (op === '-') return A - B;
  if (op === '×' || op === 'x') return A * B;
  if (op === '÷') return A / B;
  return 0;
}

/**
 * Iteratively computes all result cells using raw cell.value fields.
 */
function computeAllResultsChained(grid) {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  let attempts = 0;

  while (attempts < 50) {
    attempts++;
    let changed = false;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const cell = grid[r][c];
        if (cell.type === 'number' && isCellResult(grid, r, c) && cell.value === null) {
          if (isCellHorizontalResult(grid, r, c)) {
            const hEq = traceHorizontalEquation(grid, r, c, true);
            if (hEq && hEq.numbers.every((v) => v !== null)) {
              const opCoords = hEq.cells[1];
              cell.value = evaluateAndAdjustEquation(grid, hEq, opCoords);
              changed = true;
            }
          } else if (isCellVerticalResult(grid, r, c)) {
            const vEq = traceVerticalEquation(grid, r, c, true);
            if (vEq && vEq.numbers.every((v) => v !== null)) {
              const opCoords = vEq.cells[1];
              cell.value = evaluateAndAdjustEquation(grid, vEq, opCoords);
              changed = true;
            }
          }
        }
      }
    }
    if (!changed) break;
  }
}

/**
 * Generates a randomized CrossMath puzzle grid based on difficulty.
 * Always returns an 11x11 grid. Difficulty controls template density,
 * operator set, number range, and how many cells are hidden.
 *
 * @param {'easy' | 'medium' | 'expert'} difficulty
 * @returns {{ grid: any[][], hiddenValues: number[] }}
 */
export function generatePuzzle(difficulty) {
  let templates = EASY_TEMPLATES;
  let operatorsList = ['+', '-'];
  let maxNumber = 10;
  let independentHideCount = 4;

  if (difficulty === 'medium') {
    templates = MEDIUM_TEMPLATES;
    operatorsList = ['+', '-', '×'];
    maxNumber = 15;
    independentHideCount = 6;
  } else if (difficulty === 'expert') {
    templates = EXPERT_TEMPLATES;
    operatorsList = ['+', '-', '×', '÷'];
    maxNumber = 20;
    independentHideCount = 10;
  }

  let attempts = 0;

  while (attempts < 1000) {
    attempts++;

    const template = templates[Math.floor(Math.random() * templates.length)];
    const height = template.length;
    const width = template[0].split(' ').length;

    const grid = template.map((rowStr) =>
      rowStr.split(' ').map((char) => {
        if (char === 'N') return { type: 'number', value: null, isClue: false };
        if (char === 'o') return { type: 'operator', value: null };
        if (char === '=') return { type: 'equals', value: '=' };
        return { type: 'empty' };
      })
    );

    // Populate independent N cells
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (grid[r][c].type === 'number' && !isCellResult(grid, r, c)) {
          grid[r][c].value = Math.floor(Math.random() * maxNumber) + 1;
        }
      }
    }

    // Populate operator cells
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (grid[r][c].type === 'operator') {
          grid[r][c].value = operatorsList[Math.floor(Math.random() * operatorsList.length)];
        }
      }
    }

    // Compute all result N cells
    computeAllResultsChained(grid);

    // Verify all number cells are in valid bounds
    let ok = true;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const cell = grid[r][c];
        if (cell.type === 'number') {
          if (
            cell.value === null ||
            cell.value === undefined ||
            isNaN(cell.value) ||
            cell.value < 1 ||
            cell.value > 500
          ) {
            ok = false;
            break;
          }
        }
      }
      if (!ok) break;
    }
    if (!ok) continue;

    // Separate independent vs result cells
    const independentCells = [];
    const resultCells = [];

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const cell = grid[r][c];
        if (cell.type === 'number') {
          if (isCellResult(grid, r, c)) {
            resultCells.push({ r, c });
          } else {
            independentCells.push({ r, c });
          }
        }
      }
    }

    // Hide subset of independent cells → go into rack pool
    independentCells.sort(() => Math.random() - 0.5);
    const actualHide = Math.min(independentHideCount, independentCells.length);
    const independentToHide = independentCells.slice(0, actualHide);
    const independentToShow = independentCells.slice(actualHide);

    // Pre-placed visible independent clues (shown on board, not in rack)
    independentToShow.forEach(({ r, c }) => {
      grid[r][c].isClue = true;
      grid[r][c].id = `clue-ind-${r}-${c}`;
    });

    // Show ~40% of result cells as visible anchors; the rest are 'blind'
    // Blind result cells: board renders them as a blank tile (no value shown,
    // NOT in rack). The player must deduce them. Wrong independent placements
    // will cause invisible result mismatches that cascade downstream.
    resultCells.sort(() => Math.random() - 0.5);
    const anchorCount = Math.max(1, Math.round(resultCells.length * 0.4));
    const resultToShow = resultCells.slice(0, anchorCount);
    const resultBlind = resultCells.slice(anchorCount);

    resultToShow.forEach(({ r, c }) => {
      grid[r][c].isClue = true;
      grid[r][c].id = `clue-res-${r}-${c}`;
    });

    // Blind result cells — mark with isBlind so the board renders them blank.
    // They are NOT in the rack and NOT isHidden; recalculation still auto-fills
    // their currentValue for downstream equation validation.
    resultBlind.forEach(({ r, c }) => {
      grid[r][c].isBlind = true;
      grid[r][c].id = `blind-res-${r}-${c}`;
    });

    // Only independent hidden cells go into the rack pool
    const hiddenValues = [];
    independentToHide.forEach(({ r, c }) => {
      grid[r][c].isHidden = true;
      grid[r][c].id = `empty-${r}-${c}`;
      hiddenValues.push(grid[r][c].value);
    });
    hiddenValues.sort((a, b) => a - b);

    // Uniqueness check — result cells are deterministic once independents solved
    const solCount = solveCount(grid, hiddenValues);
    if (solCount === 1) {
      return { grid, hiddenValues };
    }
  }

  throw new Error('Failed to generate a unique CrossMath puzzle after 1000 attempts.');
}

/**
 * Validates sub-equations to prune the backtracking search tree.
 */
function checkSubEquation(grid, r, c) {
  const height = grid.length;
  const width = grid[0]?.length || 0;

  for (let col = 0; col < width; col++) {
    if (isCellHorizontalResult(grid, r, col)) {
      const eq = traceHorizontalEquation(grid, r, col);
      if (eq && checkEquationStatus(eq, grid, true) === 'incorrect') return false;
    }
  }

  for (let row = 0; row < height; row++) {
    if (isCellVerticalResult(grid, row, c)) {
      const eq = traceVerticalEquation(grid, row, c);
      if (eq && checkEquationStatus(eq, grid, true) === 'incorrect') return false;
    }
  }

  return true;
}

/**
 * Backtracking solver to verify uniqueness.
 * Only solves hidden INDEPENDENT cells; result cells are deterministic.
 *
 * @param {any[][]} grid
 * @param {number[]} pool
 * @returns {number} Number of valid solutions (stops at 2).
 */
function solveCount(grid, pool) {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  let targetR = -1;
  let targetC = -1;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const cell = grid[r][c];
      if (
        cell.type === 'number' &&
        cell.isHidden &&
        !isCellResult(grid, r, c) &&
        (cell.currentValue === undefined || cell.currentValue === null)
      ) {
        targetR = r;
        targetC = c;
        break;
      }
    }
    if (targetR !== -1) break;
  }

  if (targetR === -1) {
    recalculateIntermediateResults(grid);
    return isGridCompleteAndCorrect(grid, true) ? 1 : 0;
  }

  let solutions = 0;
  const tried = new Set();

  for (let i = 0; i < pool.length; i++) {
    const val = pool[i];
    if (tried.has(val)) continue;
    tried.add(val);

    grid[targetR][targetC].currentValue = val;
    recalculateIntermediateResults(grid);

    if (checkSubEquation(grid, targetR, targetC)) {
      const newPool = [...pool];
      newPool.splice(i, 1);
      solutions += solveCount(grid, newPool);
    }

    grid[targetR][targetC].currentValue = null;
    recalculateIntermediateResults(grid);

    if (solutions > 1) break;
  }

  return solutions;
}
