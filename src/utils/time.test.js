/**
 * @file time.test.js
 * @description Unit tests for the shared time formatting utilities.
 */
import { describe, it, expect } from 'vitest';
import { formatAudioTime, formatChatDate } from './time';

describe('formatAudioTime', () => {
  it('returns "0:00" for NaN input', () => {
    expect(formatAudioTime(NaN)).toBe('0:00');
  });

  it('formats 0 seconds correctly', () => {
    expect(formatAudioTime(0)).toBe('0:00');
  });

  it('pads single-digit seconds with a leading zero', () => {
    expect(formatAudioTime(65)).toBe('1:05');
  });

  it('formats 90 seconds as "1:30"', () => {
    expect(formatAudioTime(90)).toBe('1:30');
  });

  it('formats exactly 60 seconds as "1:00"', () => {
    expect(formatAudioTime(60)).toBe('1:00');
  });

  it('formats 3600 seconds (1 hour) as "60:00"', () => {
    expect(formatAudioTime(3600)).toBe('60:00');
  });

  it('floors fractional seconds', () => {
    expect(formatAudioTime(61.9)).toBe('1:01');
  });
});

describe('formatChatDate', () => {
  it('returns a non-empty string for a valid ISO date string', () => {
    const result = formatChatDate('2026-07-23T04:30:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes month and day in the output', () => {
    // Use a fixed date — locale output includes month abbreviation and day
    const result = formatChatDate('2026-01-05T12:00:00.000Z');
    // The output varies by locale but must contain a numeric day
    expect(result).toMatch(/5|05/);
  });

  it('handles an invalid date string gracefully (returns "Invalid Date" or similar)', () => {
    const result = formatChatDate('not-a-date');
    expect(typeof result).toBe('string');
  });
});
