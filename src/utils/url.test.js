import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from './url';

describe('sanitizeUrl', () => {
  it('allows http/https urls', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('allows relative urls', () => {
    expect(sanitizeUrl('/path/to/file')).toBe('/path/to/file');
  });

  it('blocks javascript protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
    expect(sanitizeUrl('javascript:void(0)')).toBe('#');
  });

  it('allows valid blob and data protocols', () => {
    expect(sanitizeUrl('blob:http://localhost/something')).toBe('blob:http://localhost/something');
    expect(sanitizeUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
  });

  it('returns fallback for empty urls', () => {
    expect(sanitizeUrl(null)).toBe('#');
    expect(sanitizeUrl('')).toBe('#');
  });
});
