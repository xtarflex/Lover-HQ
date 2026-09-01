import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from './url';

describe('sanitizeUrl', () => {
  it('allows http and https URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('allows blob and data URLs', () => {
    expect(sanitizeUrl('blob:http://localhost/123')).toBe('blob:http://localhost/123');
    expect(sanitizeUrl('data:image/png;base64,iVBORw0KGgo')).toBe(
      'data:image/png;base64,iVBORw0KGgo'
    );
  });

  it('allows mailto and tel URLs', () => {
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890');
  });

  it('blocks javascript URLs', () => {
    expect(sanitizeUrl('javascript:alert("xss")')).toBe('');
    expect(sanitizeUrl('javascript:alert("xss")', '#')).toBe('#');
  });

  it('blocks vbscript URLs', () => {
    expect(sanitizeUrl('vbscript:msgbox("xss")')).toBe('');
  });

  it('handles relative URLs correctly', () => {
    expect(sanitizeUrl('/path/to/resource')).toBe('/path/to/resource');
    expect(sanitizeUrl('path/to/resource')).toBe('path/to/resource');
  });

  it('handles invalid URLs gracefully', () => {
    expect(sanitizeUrl(null)).toBe('');
    expect(sanitizeUrl(undefined)).toBe('');
    expect(sanitizeUrl('')).toBe('');
  });
});
