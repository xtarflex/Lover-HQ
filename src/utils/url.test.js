import { describe, it, expect } from 'vitest';
import { getSafeUrl } from './url';

describe('getSafeUrl', () => {
  it('allows valid https and http URLs', () => {
    expect(getSafeUrl('https://example.com')).toBe('https://example.com');
    expect(getSafeUrl('http://example.com/path?param=1#anchor')).toBe(
      'http://example.com/path?param=1#anchor'
    );
  });

  it('allows safe relative paths', () => {
    expect(getSafeUrl('/assets/image.png')).toBe('/assets/image.png');
    expect(getSafeUrl('subpath/file.jpg')).toBe('subpath/file.jpg');
  });

  it('allows mailto and tel schemes', () => {
    expect(getSafeUrl('mailto:partner@loverhq.app')).toBe('mailto:partner@loverhq.app');
    expect(getSafeUrl('tel:+1234567890')).toBe('tel:+1234567890');
  });

  it('allows blob URLs', () => {
    const blobUrl = 'blob:http://localhost:5173/1234-5678-9012';
    expect(getSafeUrl(blobUrl)).toBe(blobUrl);
  });

  it('allows safe media data URLs', () => {
    const safeDataPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(getSafeUrl(safeDataPng)).toBe(safeDataPng);

    const safeDataWebp =
      'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    expect(getSafeUrl(safeDataWebp)).toBe(safeDataWebp);
  });

  it('blocks dangerous javascript: pseudoprotocol', () => {
    expect(getSafeUrl('javascript:alert(document.cookie)')).toBe('#');
    expect(getSafeUrl('JavaScript:alert(1)')).toBe('#');
    expect(getSafeUrl('   javascript:console.log("hacked")   ')).toBe('#');
  });

  it('blocks dangerous data:text/html vectors', () => {
    expect(getSafeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
    expect(getSafeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('#');
  });

  it('blocks vbscript and file schemes', () => {
    expect(getSafeUrl('vbscript:msgbox("hello")')).toBe('#');
    expect(getSafeUrl('file:///etc/passwd')).toBe('#');
  });

  it('returns fallback for null, undefined, empty, or non-string values', () => {
    expect(getSafeUrl(null)).toBe('#');
    expect(getSafeUrl(undefined)).toBe('#');
    expect(getSafeUrl('')).toBe('#');
    expect(getSafeUrl('   ')).toBe('#');
    expect(getSafeUrl(12345)).toBe('#');
    expect(getSafeUrl({})).toBe('#');
  });

  it('supports custom fallback string', () => {
    expect(getSafeUrl('javascript:void(0)', '')).toBe('');
    expect(getSafeUrl(null, 'about:blank')).toBe('about:blank');
  });
});
