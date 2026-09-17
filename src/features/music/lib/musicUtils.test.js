import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getTrackArtwork,
  gradientFromString,
  getProxiedUrl,
  findQueueTrackIndex,
} from './musicUtils';

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
    expect(getProxiedUrl(url)).toBe('/storage-proxy/music-media/test.mp3');
  });

  it('should return the original URL if it does not match the prefix', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    const url = 'https://other.supabase.co/storage/v1/object/public/music-media/test.mp3';
    expect(getProxiedUrl(url)).toBe(url);

    const url2 = 'https://test.supabase.co/storage/v1/object/public/other-bucket/test.mp3';
    expect(getProxiedUrl(url2)).toBe('/storage-proxy/other-bucket/test.mp3');
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

describe('adjustColorVibrance & getLuminance', () => {
  it('should compute 0 luminance for pure black and 1 for pure white', async () => {
    const { getLuminance } = await import('../hooks/useColorExtractor');
    expect(getLuminance(0, 0, 0)).toBeCloseTo(0, 3);
    expect(getLuminance(255, 255, 255)).toBeCloseTo(1, 3);
  });

  it('should lighten dark colors with luminance < 0.3', async () => {
    const { adjustColorVibrance, getLuminance } = await import('../hooks/useColorExtractor');
    const darkR = 20;
    const darkG = 15;
    const darkB = 25;
    const initialLum = getLuminance(darkR, darkG, darkB);
    expect(initialLum).toBeLessThan(0.3);

    const adjusted = adjustColorVibrance(darkR, darkG, darkB);
    expect(adjusted).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/);
    const [r, g, b] = adjusted.match(/\d+/g).map(Number);
    expect(r).toBeGreaterThan(darkR);
    expect(g).toBeGreaterThan(darkG);
    expect(b).toBeGreaterThan(darkB);
  });

  it('should darken overly bright colors with luminance > 0.85', async () => {
    const { adjustColorVibrance, getLuminance } = await import('../hooks/useColorExtractor');
    const brightR = 250;
    const brightG = 250;
    const brightB = 245;
    const initialLum = getLuminance(brightR, brightG, brightB);
    expect(initialLum).toBeGreaterThan(0.85);

    const adjusted = adjustColorVibrance(brightR, brightG, brightB);
    const [r, g, b] = adjusted.match(/\d+/g).map(Number);
    expect(r).toBeLessThan(brightR);
    expect(g).toBeLessThan(brightG);
    expect(b).toBeLessThan(brightB);
  });
});

describe('findQueueTrackIndex', () => {
  const duplicateTrackId = 'track-wine-pon-you';
  const mockQueue = [
    { id: duplicateTrackId, queue_row_id: 'row-0', title: 'Wine Pon You' },
    { id: 'track-2', queue_row_id: 'row-1', title: 'Song Two' },
    { id: 'track-3', queue_row_id: 'row-2', title: 'Song Three' },
    { id: 'track-4', queue_row_id: 'row-3', title: 'Song Four' },
    { id: 'track-5', queue_row_id: 'row-4', title: 'Song Five' },
    { id: 'track-6', queue_row_id: 'row-5', title: 'Song Six' },
    { id: duplicateTrackId, queue_row_id: 'row-6', title: 'Wine Pon You' },
  ];

  it('should correctly resolve index 6 when playing duplicate track at the end of queue', () => {
    const activeTrack = mockQueue[6];
    const index = findQueueTrackIndex(mockQueue, activeTrack);
    expect(index).toBe(6);
  });

  it('should correctly resolve index 0 when playing duplicate track at the start of queue', () => {
    const activeTrack = mockQueue[0];
    const index = findQueueTrackIndex(mockQueue, activeTrack);
    expect(index).toBe(0);
  });

  it('should enable hasPrev navigation from index 6 to index 5 without restarting', () => {
    const activeTrack = mockQueue[6];
    const currentQueueIndex = findQueueTrackIndex(mockQueue, activeTrack);
    const hasPrev = activeTrack && currentQueueIndex > 0;
    const hasNext =
      activeTrack && currentQueueIndex !== -1 && currentQueueIndex < mockQueue.length - 1;

    expect(hasPrev).toBe(true);
    expect(hasNext).toBe(false);

    const prevTrack = mockQueue[currentQueueIndex - 1];
    expect(prevTrack.queue_row_id).toBe('row-5');
    expect(prevTrack.title).toBe('Song Six');
  });

  it('should fallback to matching id when queue_row_id is not present on currentTrack', () => {
    const legacyTrack = { id: 'track-3', title: 'Song Three' };
    const index = findQueueTrackIndex(mockQueue, legacyTrack);
    expect(index).toBe(2);
  });

  it('should return -1 if track is not found in queue', () => {
    const unknownTrack = { id: 'track-unknown', queue_row_id: 'row-99' };
    expect(findQueueTrackIndex(mockQueue, unknownTrack)).toBe(-1);
  });

  it('should safely return -1 for null, undefined, or empty queue inputs', () => {
    expect(findQueueTrackIndex(null, mockQueue[0])).toBe(-1);
    expect(findQueueTrackIndex(undefined, mockQueue[0])).toBe(-1);
    expect(findQueueTrackIndex([], mockQueue[0])).toBe(-1);
    expect(findQueueTrackIndex(mockQueue, null)).toBe(-1);
    expect(findQueueTrackIndex(mockQueue, undefined)).toBe(-1);
  });

  it('should accurately navigate queues with arbitrary, adjacent, or all-duplicate tracks', () => {
    // 5 entries of the same song in a row
    const repeatedQueue = [
      { id: 'song-repeat', queue_row_id: 'row-a', title: 'Song' },
      { id: 'song-repeat', queue_row_id: 'row-b', title: 'Song' },
      { id: 'song-repeat', queue_row_id: 'row-c', title: 'Song' },
      { id: 'song-repeat', queue_row_id: 'row-d', title: 'Song' },
      { id: 'song-repeat', queue_row_id: 'row-e', title: 'Song' },
    ];

    // Testing each position resolves to its exact index
    for (let i = 0; i < repeatedQueue.length; i++) {
      const idx = findQueueTrackIndex(repeatedQueue, repeatedQueue[i]);
      expect(idx).toBe(i);

      // Verify forward navigation from position i
      if (i < repeatedQueue.length - 1) {
        const nextTrack = repeatedQueue[idx + 1];
        expect(nextTrack.queue_row_id).toBe(repeatedQueue[i + 1].queue_row_id);
      }

      // Verify backward navigation from position i
      if (i > 0) {
        const prevTrack = repeatedQueue[idx - 1];
        expect(prevTrack.queue_row_id).toBe(repeatedQueue[i - 1].queue_row_id);
      }
    }
  });
});
