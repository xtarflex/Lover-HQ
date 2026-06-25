/**
 * @file generator.js
 * @description Procedural CrossMath equation puzzle generator and backtracking solver.
 */

import { isGridCompleteAndCorrect, checkRowEquation, checkColEquation } from './validator';

/**
 * Generates a randomized CrossMath puzzle grid based on difficulty.
 *
 * @param {'easy' | 'medium' | 'expert'} difficulty - Game difficulty.
 * @returns {{
 *   grid: any[][],
 *   hiddenValues: number[],
 *   size: number
 * }} The generated grid and hidden values.
 */
export function generatePuzzle(difficulty) {
  let size = 5;
  let operatorsList = ['+', '-'];
  let maxNumber = 10;
  let hideCount = 2;

  if (difficulty === 'medium') {
    size = 7;
    operatorsList = ['+', '-', '*'];
    maxNumber = 20;
    hideCount = 5;
  } else if (difficulty === 'expert') {
    size = 9;
    operatorsList = ['+', '-', '*', '/'];
    maxNumber = 100;
    hideCount = 10;
  }

  let attempts = 0;
  while (attempts < 1000) {
    attempts++;
    const grid = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null));

    // 1. Initialize all cells as empty or structure-based
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isNumRow = r % 2 === 0;
        const isNumCol = c % 2 === 0;
        const isLastRow = r === size - 1;
        const isLastCol = c === size - 1;
        const isPenultimateRow = r === size - 2;
        const isPenultimateCol = c === size - 2;

        if (isNumRow && isNumCol && !isLastRow && !isLastCol) {
          // Number cell
          grid[r][c] = { type: 'number', value: 0, isHidden: false };
        } else if (isNumRow && c % 2 === 1 && c < size - 2) {
          // Horizontal operator
          grid[r][c] = { type: 'operator', value: '' };
        } else if (r % 2 === 1 && isNumCol && r < size - 2) {
          // Vertical operator
          grid[r][c] = { type: 'operator', value: '' };
        } else if (isNumRow && isPenultimateCol) {
          // Equals horizontal
          grid[r][c] = { type: 'equals', value: '=' };
        } else if (isPenultimateRow && isNumCol) {
          // Equals vertical
          grid[r][c] = { type: 'equals', value: '=' };
        } else if (isNumRow && isLastCol) {
          // Result horizontal
          grid[r][c] = { type: 'result', value: 0 };
        } else if (isLastRow && isNumCol) {
          // Result vertical
          grid[r][c] = { type: 'result', value: 0 };
        } else {
          grid[r][c] = { type: 'empty' };
        }
      }
    }

    // 2. Populate numbers and operators
    let ok = true;
    for (let r = 0; r < size - 1; r += 2) {
      for (let c = 0; c < size - 1; c += 2) {
        grid[r][c].value = Math.floor(Math.random() * maxNumber) + 1;
      }
    }

    for (let r = 0; r < size - 2; r++) {
      for (let c = 0; c < size - 2; c++) {
        const cell = grid[r][c];
        if (cell && cell.type === 'operator') {
          cell.value = operatorsList[Math.floor(Math.random() * operatorsList.length)];
        }
      }
    }

    // 3. Evaluate results and check division / integer conditions
    // Check & adjust horizontal equations
    for (let r = 0; r < size - 1; r += 2) {
      const numbers = [];
      const operators = [];
      for (let c = 0; c < size - 2; c += 2) {
        numbers.push(grid[r][c].value);
        if (c + 1 < size - 2) {
          operators.push(grid[r][c + 1].value);
        }
      }

      let tempVal = numbers[0];
      for (let i = 0; i < operators.length; i++) {
        const opCell = grid[r][i * 2 + 1];
        let op = opCell.value;

        if (op === '/') {
          const divisor = numbers[i + 1];
          if (divisor === 0 || tempVal % divisor !== 0) {
            // Adjust operator to non-div
            const fallbacks = operatorsList.filter((o) => o !== '/');
            op = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            opCell.value = op;
          }
        }

        if (op === '/') tempVal /= numbers[i + 1];
        else if (op === '*') tempVal *= numbers[i + 1];
        else if (op === '+') tempVal += numbers[i + 1];
        else if (op === '-') tempVal -= numbers[i + 1];
      }

      if (isNaN(tempVal) || tempVal < 0 || !Number.isInteger(tempVal)) {
        ok = false;
        break;
      }
      grid[r][size - 1].value = tempVal;
    }

    if (!ok) continue;

    // Check & adjust vertical equations
    for (let c = 0; c < size - 1; c += 2) {
      const numbers = [];
      const operators = [];
      for (let r = 0; r < size - 2; r += 2) {
        numbers.push(grid[r][c].value);
        if (r + 1 < size - 2) {
          operators.push(grid[r + 1][c].value);
        }
      }

      let tempVal = numbers[0];
      for (let i = 0; i < operators.length; i++) {
        const opCell = grid[i * 2 + 1][c];
        let op = opCell.value;

        if (op === '/') {
          const divisor = numbers[i + 1];
          if (divisor === 0 || tempVal % divisor !== 0) {
            const fallbacks = operatorsList.filter((o) => o !== '/');
            op = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            opCell.value = op;
          }
        }

        if (op === '/') tempVal /= numbers[i + 1];
        else if (op === '*') tempVal *= numbers[i + 1];
        else if (op === '+') tempVal += numbers[i + 1];
        else if (op === '-') tempVal -= numbers[i + 1];
      }

      if (isNaN(tempVal) || tempVal < 0 || !Number.isInteger(tempVal)) {
        ok = false;
        break;
      }
      grid[size - 1][c].value = tempVal;
    }

    if (!ok) continue;

    // 4. Hide some number cells
    const numberCoords = [];
    for (let r = 0; r < size - 1; r += 2) {
      for (let c = 0; c < size - 1; c += 2) {
        numberCoords.push({ r, c });
      }
    }

    // Shuffle coordinates
    const shuffledCoords = numberCoords.sort(() => Math.random() - 0.5);
    const chosenToHide = shuffledCoords.slice(0, hideCount);

    const hiddenValues = [];
    chosenToHide.forEach(({ r, c }) => {
      grid[r][c].isHidden = true;
      grid[r][c].id = `empty-${r}-${c}`;
      hiddenValues.push(grid[r][c].value);
    });

    // Sort hidden values to make the rack neat
    hiddenValues.sort((a, b) => a - b);

    // 5. Run backtracking solver to check for uniqueness (or solvability for expert)
    const solCount = solveCount(grid, hiddenValues);
    const isValid = difficulty === 'expert' ? solCount >= 1 : solCount === 1;
    if (isValid) {
      return {
        grid,
        hiddenValues,
        size,
      };
    }
  }

  // Fallback in case solver fails to find a unique solution within attempts
  throw new Error('Failed to generate a unique CrossMath puzzle. Try again.');
}

/**
 * Backtracking solver to count valid solutions.
 *
 * @param {any[][]} grid - The current grid state.
 * @param {number[]} pool - Available tiles left to place.
 * @returns {number} Number of valid solutions.
 */
function solveCount(grid, pool) {
  // Find first hidden cell
  let targetR = -1;
  let targetC = -1;
  const size = grid.length;

  for (let r = 0; r < size - 1; r += 2) {
    for (let c = 0; c < size - 1; c += 2) {
      const cell = grid[r][c];
      if (cell.isHidden && (cell.currentValue === undefined || cell.currentValue === null)) {
        targetR = r;
        targetC = c;
        break;
      }
    }
    if (targetR !== -1) break;
  }

  // Base case: no empty slots left
  if (targetR === -1) {
    return isGridCompleteAndCorrect(grid) ? 1 : 0;
  }

  let solutions = 0;
  const tried = new Set();

  for (let i = 0; i < pool.length; i++) {
    const val = pool[i];
    if (tried.has(val)) continue;
    tried.add(val);

    // Place value
    grid[targetR][targetC].currentValue = val;

    // Early prune check
    let isPossible = true;
    if (targetC === size - 3) {
      const status = checkRowEquation(grid, targetR);
      if (status === 'incorrect') {
        isPossible = false;
      }
    }
    if (isPossible && targetR === size - 3) {
      const status = checkColEquation(grid, targetC);
      if (status === 'incorrect') {
        isPossible = false;
      }
    }

    if (isPossible) {
      // Remaining pool
      const newPool = [...pool];
      newPool.splice(i, 1);

      // Recurse
      solutions += solveCount(grid, newPool);
    }

    // Backtrack
    grid[targetR][targetC].currentValue = null;

    // Early termination if we already know there are multiple solutions
    if (solutions > 1) break;
  }

  return solutions;
}
