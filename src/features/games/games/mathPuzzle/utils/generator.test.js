import { describe, it, expect } from 'vitest';
import { generatePuzzle } from './generator';
import { isGridCompleteAndCorrect } from './validator';

describe('CrossMath generator', () => {
  it('should generate an easy puzzle successfully', () => {
    const { grid, hiddenValues, size } = generatePuzzle('easy');
    expect(size).toBe(5);
    expect(grid).toHaveLength(5);
    expect(hiddenValues).toHaveLength(2);

    // Verify grid completeness and correctness if we restore all hidden values
    const solvedGrid = grid.map((row) =>
      row.map((cell) => {
        if (cell.isHidden) {
          return { ...cell, currentValue: cell.value };
        }
        return cell;
      })
    );
    expect(isGridCompleteAndCorrect(solvedGrid)).toBe(true);
  });

  it('should generate a medium puzzle successfully', () => {
    const { grid, hiddenValues, size } = generatePuzzle('medium');
    expect(size).toBe(7);
    expect(grid).toHaveLength(7);
    expect(hiddenValues).toHaveLength(5);
  });

  it('should generate an expert puzzle successfully', () => {
    const { grid, hiddenValues, size } = generatePuzzle('expert');
    expect(size).toBe(9);
    expect(grid).toHaveLength(9);
    expect(hiddenValues).toHaveLength(10);
  });
});
