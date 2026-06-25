/**
 * @file validator.js
 * @description Inline equation evaluator and validation checks for CrossMath Race.
 */

/**
 * Evaluates an equation left-to-right.
 *
 * @param {number[]} numbers - The operands in the equation.
 * @param {string[]} operators - The operators (+, -, *, /).
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
    } else if (op === '*') {
      result *= nextNum;
    } else if (op === '/') {
      if (nextNum === 0) return NaN; // Division by zero
      result /= nextNum;
    }
  }

  return result;
}

/**
 * Checks a horizontal row equation in the grid.
 *
 * @param {any[][]} grid - The puzzle grid.
 * @param {number} r - Row index.
 * @returns {'correct' | 'incorrect' | 'incomplete'} Status of the equation.
 */
export function checkRowEquation(grid, r) {
  const size = grid[r].length;
  const numbers = [];
  const operators = [];
  let expectedResult = null;
  let hasEmpty = false;

  for (let c = 0; c < size; c++) {
    const cell = grid[r][c];
    if (!cell) continue;

    if (cell.type === 'number') {
      // Check if it's filled
      const val = cell.currentValue !== undefined ? cell.currentValue : cell.value;
      if (val === null || val === undefined || val === '') {
        hasEmpty = true;
      } else {
        numbers.push(Number(val));
      }
    } else if (cell.type === 'operator') {
      operators.push(cell.value);
    } else if (cell.type === 'result') {
      expectedResult = cell.value;
    }
  }

  if (hasEmpty) return 'incomplete';
  if (expectedResult === null || numbers.length !== operators.length + 1) return 'incomplete';

  const actualResult = evaluateEquation(numbers, operators);
  return Math.abs(actualResult - expectedResult) < 0.0001 ? 'correct' : 'incorrect';
}

/**
 * Checks a vertical column equation in the grid.
 *
 * @param {any[][]} grid - The puzzle grid.
 * @param {number} c - Column index.
 * @returns {'correct' | 'incorrect' | 'incomplete'} Status of the equation.
 */
export function checkColEquation(grid, c) {
  const size = grid.length;
  const numbers = [];
  const operators = [];
  let expectedResult = null;
  let hasEmpty = false;

  for (let r = 0; r < size; r++) {
    const cell = grid[r][c];
    if (!cell) continue;

    if (cell.type === 'number') {
      const val = cell.currentValue !== undefined ? cell.currentValue : cell.value;
      if (val === null || val === undefined || val === '') {
        hasEmpty = true;
      } else {
        numbers.push(Number(val));
      }
    } else if (cell.type === 'operator') {
      operators.push(cell.value);
    } else if (cell.type === 'result') {
      expectedResult = cell.value;
    }
  }

  if (hasEmpty) return 'incomplete';
  if (expectedResult === null || numbers.length !== operators.length + 1) return 'incomplete';

  const actualResult = evaluateEquation(numbers, operators);
  return Math.abs(actualResult - expectedResult) < 0.0001 ? 'correct' : 'incorrect';
}

/**
 * Checks if all equations in the grid are complete and correct.
 *
 * @param {any[][]} grid - The puzzle grid.
 * @returns {boolean} True if the whole board is solved correctly.
 */
export function isGridCompleteAndCorrect(grid) {
  const size = grid.length;

  for (let i = 0; i < size; i += 2) {
    // Check horizontal row equations at even rows (excluding the last row of results)
    if (i < size - 1) {
      const rowStatus = checkRowEquation(grid, i);
      if (rowStatus !== 'correct') return false;
    }

    // Check vertical col equations at even columns (excluding the last col of results)
    if (i < size - 1) {
      const colStatus = checkColEquation(grid, i);
      if (colStatus !== 'correct') return false;
    }
  }

  return true;
}
