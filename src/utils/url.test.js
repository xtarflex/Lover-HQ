import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from './url';

describe('sanitizeUrl', () => {
  it('allows safe protocols', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
  });

  it('blocks dangerous protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('about:blank');
    expect(sanitizeUrl('vbscript:msgbox("hello")')).toBe('about:blank');
  });

  it('allows relative urls', () => {
    expect(sanitizeUrl('/test.png')).toBe('/test.png');
  });
});
