import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from './url';

describe('sanitizeUrl', () => {
  it('allows http urls', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('allows https urls', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
  });

  it('rejects javascript urls', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('about:blank');
  });

  it('handles relative urls by resolving them', () => {
    const result = sanitizeUrl('/path/to/file');
    expect(result).toMatch(/^http.*\/path\/to\/file$/);
  });
});
