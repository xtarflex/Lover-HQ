import { describe, it, expect } from 'vitest';
import { generatePuzzle } from './generator';
import { isGridCompleteAndCorrect, recalculateIntermediateResults } from './validator';

describe('CrossMath generator', () => {
  it('should generate an easy puzzle successfully', () => {
    const { grid, hiddenValues } = generatePuzzle('easy');

    // Grid is always 11x11
    expect(grid.length).toBe(11);
    expect(grid[0].length).toBe(11);
    expect(hiddenValues).toHaveLength(4);

    const solvedGrid = grid.map((row) =>
      row.map((cell) => {
        if (cell.isHidden) return { ...cell, currentValue: cell.value };
        return cell;
      })
    );
    recalculateIntermediateResults(solvedGrid);
    expect(isGridCompleteAndCorrect(solvedGrid, true)).toBe(true);
  });

  it('should generate a medium puzzle successfully', () => {
    const { grid, hiddenValues } = generatePuzzle('medium');

    expect(grid.length).toBe(11);
    expect(grid[0].length).toBe(11);
    expect(hiddenValues).toHaveLength(6);

    const solvedGrid = grid.map((row) =>
      row.map((cell) => {
        if (cell.isHidden) return { ...cell, currentValue: cell.value };
        return cell;
      })
    );
    recalculateIntermediateResults(solvedGrid);
    expect(isGridCompleteAndCorrect(solvedGrid, true)).toBe(true);
  });

  it('should generate an expert puzzle successfully', () => {
    const { grid, hiddenValues } = generatePuzzle('expert');

    expect(grid.length).toBe(11);
    expect(grid[0].length).toBe(11);
    expect(hiddenValues).toHaveLength(10);

    const solvedGrid = grid.map((row) =>
      row.map((cell) => {
        if (cell.isHidden) return { ...cell, currentValue: cell.value };
        return cell;
      })
    );
    recalculateIntermediateResults(solvedGrid);
    expect(isGridCompleteAndCorrect(solvedGrid, true)).toBe(true);
  });

  it('blind result cells are not added to the rack pool', () => {
    const { grid, hiddenValues } = generatePuzzle('easy');
    const blindCells = grid.flat().filter((c) => c.isBlind);
    expect(blindCells.length).toBeGreaterThan(0);
    // No blind cell should also be isHidden
    expect(blindCells.every((c) => !c.isHidden)).toBe(true);
    // hiddenValues matches exactly the isHidden cells
    const hiddenCells = grid.flat().filter((c) => c.isHidden);
    expect(hiddenValues).toHaveLength(hiddenCells.length);
  });

  it('visible clue cells are pre-placed and not in the rack', () => {
    const { grid } = generatePuzzle('medium');
    const clueCells = grid.flat().filter((c) => c.isClue);
    expect(clueCells.length).toBeGreaterThan(0);
    expect(clueCells.every((c) => !c.isHidden)).toBe(true);
  });
});
