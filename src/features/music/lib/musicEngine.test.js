import { describe, it, expect } from 'vitest';
import { extractYoutubeId, parseFilenameMetadata, formatTime } from './musicEngine';

describe('extractYoutubeId', () => {
  it('should return null for empty or invalid urls', () => {
    expect(extractYoutubeId(null)).toBeNull();
    expect(extractYoutubeId('')).toBeNull();
    expect(extractYoutubeId('https://google.com')).toBeNull();
    expect(extractYoutubeId('https://youtube.com')).toBeNull();
  });

  it('should parse standard watch URLs', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYoutubeId('youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYoutubeId('https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=share')).toBe(
      'dQw4w9WgXcQ'
    );
  });

  it('should parse shortened youtu.be URLs', () => {
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYoutubeId('youtu.be/dQw4w9WgXcQ?t=43')).toBe('dQw4w9WgXcQ');
  });

  it('should parse embed URLs', () => {
    expect(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
});

describe('parseFilenameMetadata', () => {
  it('should return empty title/artist for empty input', () => {
    expect(parseFilenameMetadata(null)).toEqual({ title: '', artist: '' });
    expect(parseFilenameMetadata('')).toEqual({ title: '', artist: '' });
  });

  it('should parse standard "Artist - Title" format', () => {
    const meta = parseFilenameMetadata('Coldplay - Yellow.mp3');
    expect(meta).toEqual({ artist: 'Coldplay', title: 'Yellow' });
  });

  it('should handle filenames with dashes but no spaces', () => {
    const meta = parseFilenameMetadata('coldplay-yellow.mp3');
    expect(meta).toEqual({ artist: '', title: 'Coldplay Yellow' });
  });

  it('should replace underscores and capitalize titles', () => {
    const meta = parseFilenameMetadata('viva_la_vida_instrumental.m4a');
    expect(meta).toEqual({ artist: '', title: 'Viva La Vida Instrumental' });
  });
});

describe('formatTime', () => {
  it('should format 0 and positive times correctly', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(59)).toBe('0:59');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(125)).toBe('2:05');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('should handle NaN and null edge cases gracefully', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(null)).toBe('0:00');
  });
});
