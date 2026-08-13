import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from './url';

describe('sanitizeUrl', () => {
  it('allows safe protocols', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(sanitizeUrl('tel:1234567890')).toBe('tel:1234567890');
    expect(sanitizeUrl('blob:http://localhost:5173/abc')).toBe('blob:http://localhost:5173/abc');
    expect(sanitizeUrl('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==')).toBe(
      'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
    );
  });

  it('blocks unsafe protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
    expect(sanitizeUrl('javascript:alert("XSS")')).toBe('#');
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('#');
    expect(sanitizeUrl('file:///etc/passwd')).toBe('#');
  });

  it('handles relative URLs correctly', () => {
    expect(sanitizeUrl('/relative/path')).toBe('/relative/path');
    expect(sanitizeUrl('relative/path')).toBe('relative/path');
    expect(sanitizeUrl('#hash')).toBe('#hash');
    expect(sanitizeUrl('?query=param')).toBe('?query=param');
  });

  it('handles empty or invalid inputs', () => {
    expect(sanitizeUrl('')).toBe('#');
    expect(sanitizeUrl(null)).toBe('#');
    expect(sanitizeUrl(undefined)).toBe('#');
  });
});
