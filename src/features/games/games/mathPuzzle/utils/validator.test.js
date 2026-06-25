import { describe, it, expect } from 'vitest';
import { evaluateEquation, checkRowEquation } from './validator';

describe('CrossMath validator', () => {
  describe('evaluateEquation', () => {
    it('should evaluate empty equations as 0', () => {
      expect(evaluateEquation([], [])).toBe(0);
    });

    it('should evaluate left-to-right strictly', () => {
      // (3 + 5) * 2 = 16 (strict LTR)
      // Standard PEMDAS would be 3 + 10 = 13. We expect 16.
      expect(evaluateEquation([3, 5, 2], ['+', '*'])).toBe(16);
    });

    it('should handle division correctly', () => {
      expect(evaluateEquation([12, 3, 2], ['/', '+'])).toBe(6);
    });

    it('should handle division by zero', () => {
      expect(evaluateEquation([5, 0], ['/'])).toBeNaN();
    });
  });

  describe('checkRowEquation', () => {
    it('should return correct for valid equation', () => {
      // 3 + 5 = 8
      const grid = [
        [
          { type: 'number', value: 3 },
          { type: 'operator', value: '+' },
          { type: 'number', value: 5 },
          { type: 'equals', value: '=' },
          { type: 'result', value: 8 },
        ],
      ];
      expect(checkRowEquation(grid, 0)).toBe('correct');
    });

    it('should return incorrect for invalid equation', () => {
      // 3 + 5 = 9
      const grid = [
        [
          { type: 'number', value: 3 },
          { type: 'operator', value: '+' },
          { type: 'number', value: 5 },
          { type: 'equals', value: '=' },
          { type: 'result', value: 9 },
        ],
      ];
      expect(checkRowEquation(grid, 0)).toBe('incorrect');
    });

    it('should return incomplete if numbers are empty/null', () => {
      const grid = [
        [
          { type: 'number', value: 3, currentValue: null, isHidden: true },
          { type: 'operator', value: '+' },
          { type: 'number', value: 5 },
          { type: 'equals', value: '=' },
          { type: 'result', value: 8 },
        ],
      ];
      expect(checkRowEquation(grid, 0)).toBe('incomplete');
    });
  });
});
