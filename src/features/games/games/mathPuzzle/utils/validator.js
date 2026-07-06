/**
 * @file validator.js
 * @description Inline equation evaluator and validation checks for CrossMath Race.
 * Supports progressive chained equation model with exactly 2 operands per equation.
 */

/**
 * Evaluates a single 2-operand equation.
 *
 * @param {number[]} numbers - The operands in the equation.
 * @param {string[]} operators - The operators (+, -, x, ÷).
 * @returns {number} The evaluated result.
 */
export function evaluateEquation(numbers, operators) {
  if (numbers.length === 0) return 0;
  let result = numbers[0];

  for (let i = 0; i < operators.length; i++) {
    const op = operators[i];
    const nextNum = numbers[i + 1];
    if (nextNum === undefined) break;

    if (op === '+') {
      result += nextNum;
    } else if (op === '-') {
      result -= nextNum;
    } else if (op === 'x' || op === '×') {
      result *= nextNum;
    } else if (op === '÷') {
      if (nextNum === 0 || result % nextNum !== 0) return NaN;
      result /= nextNum;
    } else {
      return NaN;
    }
  }

  return result;
}

/**
 * Traces a 2-operand horizontal equation ending at result cell (r, c).
 *
 * @param {any[][]} grid - The puzzle grid.
 * @param {number} r - Row index.
 * @param {number} c - Column index of the result cell.
 * @returns {object|null} The parsed equation data or null.
 */
export function traceHorizontalEquation(grid, r, c, useRawValues = false) {
  const numbers = [];
  const operators = [];
  const cellsInEquation = [{ r, c }];

  if (c > 0 && grid[r][c - 1]?.type === 'equals') {
    cellsInEquation.push({ r, c: c - 1 });
  } else {
    return null;
  }

  let c_trace = c - 2;
  let expectingNumber = true;

  while (c_trace >= 0) {
    const cell = grid[r][c_trace];
    if (!cell) break;
    if (cell.type === 'empty') {
      c_trace--;
      continue;
    }

    if (expectingNumber) {
      if (cell.type === 'number') {
        const isRes = isCellResult(grid, r, c_trace);
        const val = useRawValues
          ? cell.value
          : cell.isHidden || isRes
            ? cell.currentValue !== undefined && cell.currentValue !== null
              ? cell.currentValue
              : null
            : cell.value;
        numbers.push(val);
        cellsInEquation.push({ r, c: c_trace });
        expectingNumber = false;
        c_trace--;

        if (numbers.length === 2) {
          break;
        }
      } else {
        break;
      }
    } else {
      if (cell.type === 'operator') {
        operators.push(cell.value);
        cellsInEquation.push({ r, c: c_trace });
        expectingNumber = true;
        c_trace--;
      } else {
        break;
      }
    }
  }

  if (numbers.length < 2) return null;

  numbers.reverse();
  operators.reverse();
  cellsInEquation.reverse();

  return {
    numbers,
    operators,
    expectedResult: grid[r][c].value,
    cells: cellsInEquation,
  };
}

/**
 * Traces a 2-operand vertical equation ending at result cell (r, c).
 *
 * @param {any[][]} grid - The puzzle grid.
 * @param {number} r - Row index.
 * @param {number} c - Column index of the result cell.
 * @returns {object|null} The parsed equation data or null.
 */
export function traceVerticalEquation(grid, r, c, useRawValues = false) {
  const numbers = [];
  const operators = [];
  const cellsInEquation = [{ r, c }];

  if (r > 0 && grid[r - 1]?.[c]?.type === 'equals') {
    cellsInEquation.push({ r: r - 1, c });
  } else {
    return null;
  }

  let r_trace = r - 2;
  let expectingNumber = true;

  while (r_trace >= 0) {
    const cell = grid[r_trace]?.[c];
    if (!cell) break;
    if (cell.type === 'empty') {
      r_trace--;
      continue;
    }

    if (expectingNumber) {
      if (cell.type === 'number') {
        const isRes = isCellResult(grid, r_trace, c);
        const val = useRawValues
          ? cell.value
          : cell.isHidden || isRes
            ? cell.currentValue !== undefined && cell.currentValue !== null
              ? cell.currentValue
              : null
            : cell.value;
        numbers.push(val);
        cellsInEquation.push({ r: r_trace, c });
        expectingNumber = false;
        r_trace--;

        if (numbers.length === 2) {
          break;
        }
      } else {
        break;
      }
    } else {
      if (cell.type === 'operator') {
        operators.push(cell.value);
        cellsInEquation.push({ r: r_trace, c });
        expectingNumber = true;
        r_trace--;
      } else {
        break;
      }
    }
  }

  if (numbers.length < 2) return null;

  numbers.reverse();
  operators.reverse();
  cellsInEquation.reverse();

  return {
    numbers,
    operators,
    expectedResult: grid[r][c].value,
    cells: cellsInEquation,
  };
}

export function checkEquationStatus(eq, grid, useRawValues = false) {
  if (!eq) return 'incomplete';

  const hasEmpty = eq.numbers.some((val) => val === null || val === undefined || val === '');
  if (hasEmpty) return 'incomplete';

  const numValues = eq.numbers.map(Number);
  const actualResult = evaluateEquation(numValues, eq.operators);

  if (isNaN(actualResult)) return 'incorrect';

  // If we are strictly checking the generated target values (e.g. during solving/generating),
  // do full strict validation.
  if (useRawValues) {
    return Math.abs(actualResult - eq.expectedResult) < 0.0001 ? 'correct' : 'incorrect';
  }

  // Otherwise, locate the result cell at the end of the equation.
  // If the result cell is NOT a clue and NOT a legacy result type (i.e. it is blind or hidden),
  // then the equation is logically correct by definition (whatever it evaluates to becomes its value).
  const resultCoords = eq.cells[eq.cells.length - 1];
  const resultCell = grid?.[resultCoords.r]?.[resultCoords.c];
  const isClueOrLegacyResult = resultCell?.isClue || resultCell?.type === 'result';
  if (resultCell && !isClueOrLegacyResult) {
    return 'correct';
  }

  return Math.abs(actualResult - eq.expectedResult) < 0.0001 ? 'correct' : 'incorrect';
}

/**
 * Checks if a cell is the result of a horizontal equation.
 *
 * @param {any[][]} grid - The grid.
 * @param {number} r - Row index.
 * @param {number} c - Col index.
 * @returns {boolean} True if the cell is preceded by an equals sign.
 */
export function isCellHorizontalResult(grid, r, c) {
  return c > 0 && grid[r]?.[c - 1]?.type === 'equals';
}

/**
 * Checks if a cell is the result of a vertical equation.
 *
 * @param {any[][]} grid - The grid.
 * @param {number} r - Row index.
 * @param {number} c - Col index.
 * @returns {boolean} True if the cell has an equals sign above it.
 */
export function isCellVerticalResult(grid, r, c) {
  return r > 0 && grid[r - 1]?.[c]?.type === 'equals';
}

/**
 * Checks if a cell is the result of any equation (horizontal or vertical).
 *
 * @param {any[][]} grid - The grid.
 * @param {number} r - Row index.
 * @param {number} c - Col index.
 * @returns {boolean} True if the cell is any result cell.
 */
export function isCellResult(grid, r, c) {
  return isCellHorizontalResult(grid, r, c) || isCellVerticalResult(grid, r, c);
}

/**
 * Recalculates all visible intermediate result cells on-the-fly.
 * Skips cells marked isHidden=true — those are player-placed and must
 * not be auto-computed (the player fills them in manually).
 *
 * @param {any[][]} grid - The puzzle grid.
 */
export function recalculateIntermediateResults(grid) {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  let changed = true;
  let loops = 0;

  while (changed && loops < 5) {
    changed = false;
    loops++;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const cell = grid[r]?.[c];
        if (
          cell &&
          cell.type === 'number' &&
          !cell.isHidden && // skip hidden cells — player places those
          (isCellHorizontalResult(grid, r, c) || isCellVerticalResult(grid, r, c))
        ) {
          let newValue = null;

          if (isCellHorizontalResult(grid, r, c)) {
            const hEq = traceHorizontalEquation(grid, r, c);
            if (hEq && hEq.numbers.every((v) => v !== null && v !== undefined && v !== '')) {
              newValue = evaluateEquation(hEq.numbers.map(Number), hEq.operators);
            }
          } else if (isCellVerticalResult(grid, r, c)) {
            const vEq = traceVerticalEquation(grid, r, c);
            if (vEq && vEq.numbers.every((v) => v !== null && v !== undefined && v !== '')) {
              newValue = evaluateEquation(vEq.numbers.map(Number), vEq.operators);
            }
          }

          if (cell.currentValue !== newValue) {
            cell.currentValue = newValue;
            changed = true;
          }
        }
      }
    }
  }
}

/**
 * Returns a map of all locked coordinates for equations that are solved correctly.
 *
 * @param {any[][]} grid - The puzzle grid.
 * @returns {Record<string, boolean>} A map of coordinate keys to true.
 */
export function getLockedCellsMap(_grid) {
  return {};
}

/**
 * Checks a horizontal row equation (backward compatibility).
 */
export function checkRowEquation(grid, r) {
  const size = grid[r].length;
  for (let c = 0; c < size; c++) {
    if (grid[r][c]?.type === 'result') {
      const eq = traceHorizontalEquation(grid, r, c);
      if (eq) return checkEquationStatus(eq, grid);
    }
  }
  return 'incomplete';
}

/**
 * Checks a vertical column equation (backward compatibility).
 */
export function checkColEquation(grid, c) {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    if (grid[r]?.[c]?.type === 'result') {
      const eq = traceVerticalEquation(grid, r, c);
      if (eq) return checkEquationStatus(eq, grid);
    }
  }
  return 'incomplete';
}

/**
 * Checks if all equations in the grid are complete and correct.
 *
 * @param {any[][]} grid - The puzzle grid.
 * @returns {boolean} True if the whole board is solved correctly.
 */
export function isGridCompleteAndCorrect(grid, useRawValues = false) {
  const height = grid.length;
  let hasEquation = false;

  for (let r = 0; r < height; r++) {
    const width = grid[r]?.length || 0;
    for (let c = 0; c < width; c++) {
      if (isCellHorizontalResult(grid, r, c)) {
        const hEq = traceHorizontalEquation(grid, r, c, useRawValues);
        if (hEq) {
          hasEquation = true;
          if (checkEquationStatus(hEq, grid, useRawValues) !== 'correct') return false;
        }
      }

      if (isCellVerticalResult(grid, r, c)) {
        const vEq = traceVerticalEquation(grid, r, c, useRawValues);
        if (vEq) {
          hasEquation = true;
          if (checkEquationStatus(vEq, grid, useRawValues) !== 'correct') return false;
        }
      }
    }
  }

  return hasEquation;
}
