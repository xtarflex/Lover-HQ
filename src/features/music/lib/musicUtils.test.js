import { describe, it, expect, vi, afterEach } from 'vitest';
import { getTrackArtwork, gradientFromString, getProxiedUrl } from './musicUtils';

describe('getProxiedUrl', () => {
  const originalEnv = import.meta.env.VITE_SUPABASE_URL;

  afterEach(() => {
    import.meta.env.VITE_SUPABASE_URL = originalEnv;
    vi.unstubAllEnvs();
  });

  it('should return empty string if url is falsy', () => {
    expect(getProxiedUrl('')).toBe('');
    expect(getProxiedUrl(null)).toBe('');
    expect(getProxiedUrl(undefined)).toBe('');
  });

  it('should replace the supabase storage URL with the proxy URL', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    const url = 'https://test.supabase.co/storage/v1/object/public/music-media/test.mp3';
    expect(getProxiedUrl(url)).toBe('/storage-proxy/test.mp3');
  });

  it('should return the original URL if it does not match the prefix', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    const url = 'https://other.supabase.co/storage/v1/object/public/music-media/test.mp3';
    expect(getProxiedUrl(url)).toBe(url);

    const url2 = 'https://test.supabase.co/storage/v1/object/public/other-bucket/test.mp3';
    expect(getProxiedUrl(url2)).toBe(url2);
  });

  it('should return original URL if VITE_SUPABASE_URL is not set', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    const url = 'https://test.supabase.co/storage/v1/object/public/music-media/test.mp3';
    expect(getProxiedUrl(url)).toBe(url);
  });
});

describe('getTrackArtwork', () => {
  it('should return null if track is null or undefined', () => {
    expect(getTrackArtwork(null)).toBeNull();
    expect(getTrackArtwork(undefined)).toBeNull();
  });

  it('should return artwork_url if it exists on the track', () => {
    const track = { artwork_url: 'https://example.com/artwork.jpg' };
    expect(getTrackArtwork(track)).toBe('https://example.com/artwork.jpg');
  });

  it('should return youtube thumbnail url if source is youtube and youtube_id exists', () => {
    const track = { source: 'youtube', youtube_id: 'dQw4w9WgXcQ' };
    expect(getTrackArtwork(track)).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('should return youtube thumbnail url if source is youtube and url is used as id', () => {
    const track = { source: 'youtube', url: 'dQw4w9WgXcQ' };
    expect(getTrackArtwork(track)).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('should return null if source is youtube but no youtube_id or url exists', () => {
    const track = { source: 'youtube' };
    expect(getTrackArtwork(track)).toBeNull();
  });

  it('should return null if no artwork_url exists and source is not youtube', () => {
    const track = { source: 'spotify', url: '123' };
    expect(getTrackArtwork(track)).toBeNull();
    const track2 = {};
    expect(getTrackArtwork(track2)).toBeNull();
  });
});

describe('gradientFromString', () => {
  it('should return an object with background and color properties', () => {
    const result = gradientFromString('Test String');
    expect(result).toHaveProperty('background');
    expect(result).toHaveProperty('color');
    expect(result.color).toBe('#ffffff');
    expect(typeof result.background).toBe('string');
    expect(result.background).toContain('linear-gradient');
  });

  it('should return deterministic results for the same input', () => {
    const result1 = gradientFromString('deterministic string');
    const result2 = gradientFromString('deterministic string');
    expect(result1).toEqual(result2);
  });

  it('should return different results for different inputs', () => {
    const result1 = gradientFromString('string one');
    const result2 = gradientFromString('string two');
    expect(result1.background).not.toBe(result2.background);
  });

  it('should use "Unknown" for empty string input', () => {
    const emptyResult = gradientFromString('');
    const unknownResult = gradientFromString('Unknown');
    expect(emptyResult).toEqual(unknownResult);
  });

  it('should use "Unknown" for null input', () => {
    const nullResult = gradientFromString(null);
    const unknownResult = gradientFromString('Unknown');
    expect(nullResult).toEqual(unknownResult);
  });

  it('should use "Unknown" for undefined input', () => {
    const undefinedResult = gradientFromString(undefined);
    const unknownResult = gradientFromString('Unknown');
    expect(undefinedResult).toEqual(unknownResult);
  });
});
  });
});
