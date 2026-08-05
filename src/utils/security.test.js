import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from './security';

describe('sanitizeUrl', () => {
  it('allows http and https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('blocks javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
  });

  it('allows relative URLs based on window.location.origin', () => {
    // window.location.origin is usually http://localhost:3000 in tests
    const origin = window.location.origin;
    expect(sanitizeUrl('/path')).toBe(`${origin}/path`);
  });
});
