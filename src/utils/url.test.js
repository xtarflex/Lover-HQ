import { describe, it, expect } from 'vitest';
import { getSafeUrl } from './url';

describe('getSafeUrl', () => {
  it('allows safe protocols', () => {
    expect(getSafeUrl('https://example.com')).toBe('https://example.com');
    expect(getSafeUrl('http://example.com')).toBe('http://example.com');
    expect(getSafeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(getSafeUrl('tel:+1234567890')).toBe('tel:+1234567890');
  });

  it('blocks dangerous protocols', () => {
    expect(getSafeUrl('javascript:alert(1)')).toBe('#');
    expect(getSafeUrl('vbscript:msgbox(1)')).toBe('#');
    expect(getSafeUrl('file:///etc/passwd')).toBe('#');
    expect(getSafeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
  });

  it('handles relative URLs', () => {
    expect(getSafeUrl('/path/to/file')).toBe('/path/to/file');
  });

  it('handles invalid URLs', () => {
    expect(getSafeUrl(null)).toBe('#');
    expect(getSafeUrl(undefined)).toBe('#');
  });
});
