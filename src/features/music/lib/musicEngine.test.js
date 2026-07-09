import { describe, it, expect } from 'vitest';
import {
  extractYoutubeId,
  parseFilenameMetadata,
  formatTime,
  cleanArtistName,
} from './musicEngine';

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

  it('should parse filenames with multiple hyphens correctly', () => {
    const meta = parseFilenameMetadata('Coldplay - Yellow - Live.mp3');
    expect(meta).toEqual({ artist: 'Coldplay', title: 'Yellow - Live' });
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

  it('should handle negative numbers and undefined gracefully', () => {
    expect(formatTime(-10)).toBe('0:00');
    expect(formatTime(undefined)).toBe('0:00');
  });

  it('should handle extremely large durations', () => {
    expect(formatTime(1e15)).toBe('16666666666666:40');
    expect(formatTime(1e21)).toBe('16666666666666666000:40');
  });

  it('should handle fractional numbers', () => {
    expect(formatTime(65.7)).toBe('1:05');
    expect(formatTime(0.9)).toBe('0:00');
    expect(formatTime(60.0001)).toBe('1:00');
  });

  it('should handle empty/non-numeric inputs', () => {
    expect(formatTime('')).toBe('0:00');
    expect(formatTime('abc')).toBe('0:00');
    expect(formatTime([])).toBe('0:00');
    expect(formatTime({})).toBe('0:00');
    // Note: formatTime(true) returns '0:01' in current implementation because isNaN(true) is false, true < 0 is false, true/60 is 0.016, true%60 is 1.
    expect(formatTime(true)).toBe('0:01');
  });
});

describe('parseFilenameMetadata edge cases', () => {
  it('should handle extremely long title strings with special characters', () => {
    const longArtist = 'A'.repeat(5000);
    const longTitle = 'B'.repeat(5000);
    const filename = `${longArtist} - ${longTitle}.mp3`;
    const meta = parseFilenameMetadata(filename);
    expect(meta.artist).toBe(longArtist);
    expect(meta.title).toBe(longTitle);
  });

  it('should handle special characters and symbols', () => {
    const meta = parseFilenameMetadata('Artist & Co. - Title @ #1! ($) [Remix] {2026} + _ - .mp3');
    expect(meta).toEqual({
      artist: 'Artist & Co.',
      title: 'Title @ #1! ($) [Remix] {2026} + _ -',
    });
  });

  it('should handle non-standard spacing and multiple hyphens', () => {
    const meta1 = parseFilenameMetadata('Artist - - Title.mp3');
    expect(meta1).toEqual({ artist: 'Artist', title: '- Title' });

    const meta2 = parseFilenameMetadata('Artist - Title - Remix - 2026.mp3');
    expect(meta2).toEqual({ artist: 'Artist', title: 'Title - Remix - 2026' });
  });

  it('should handle files without extensions or multiple extensions', () => {
    const meta1 = parseFilenameMetadata('Artist - Title');
    expect(meta1).toEqual({ artist: 'Artist', title: 'Title' });

    const meta2 = parseFilenameMetadata('Artist - Title.tar.gz');
    expect(meta2).toEqual({ artist: 'Artist', title: 'Title.tar' });
  });

  it('should handle paths in filename', () => {
    const meta1 = parseFilenameMetadata('/path/to/some/Artist - Title.mp3');
    expect(meta1).toEqual({ artist: 'Artist', title: 'Title' });

    const meta2 = parseFilenameMetadata('C:\\Music\\Folder\\Artist - Title.wav');
    expect(meta2).toEqual({ artist: 'Artist', title: 'Title' });
  });

  it('should handle unicode characters and showcase regexp limitations', () => {
    // garçon has a non-ASCII character 'ç'
    const meta = parseFilenameMetadata('garçon.mp3');
    // Expected result of current implementation: 'GarçOn' due to \b\w regex match on 'o' preceded by non-word 'ç'
    expect(meta.title).toBe('GarçOn');

    // Test with emoji
    const metaEmoji = parseFilenameMetadata('emoji_✨_test.mp3');
    expect(metaEmoji.title).toBe('Emoji ✨ Test');
  });
});

describe('cleanArtistName', () => {
  it('should return empty string for null, undefined, or empty artist names', () => {
    expect(cleanArtistName(null)).toBe('');
    expect(cleanArtistName(undefined)).toBe('');
    expect(cleanArtistName('')).toBe('');
  });

  it('should remove exact " - Topic" suffix case-insensitively', () => {
    expect(cleanArtistName('Madara Dusal - Topic')).toBe('Madara Dusal');
    expect(cleanArtistName('Madara Dusal - topic')).toBe('Madara Dusal');
    expect(cleanArtistName('Madara Dusal - TOPIC')).toBe('Madara Dusal');
  });

  it('should remove " - Topic" with variation in spacing', () => {
    expect(cleanArtistName('Madara Dusal-Topic')).toBe('Madara Dusal');
    expect(cleanArtistName('Madara Dusal  -  Topic')).toBe('Madara Dusal');
    expect(cleanArtistName('Madara Dusal -Topic')).toBe('Madara Dusal');
    expect(cleanArtistName('Madara Dusal- Topic')).toBe('Madara Dusal');
  });

  it('should remove trailing hyphens and spaces', () => {
    expect(cleanArtistName('Madara Dusal -')).toBe('Madara Dusal');
    expect(cleanArtistName('Madara Dusal - ')).toBe('Madara Dusal');
    expect(cleanArtistName('Madara Dusal-')).toBe('Madara Dusal');
  });

  it('should trim the final artist name', () => {
    expect(cleanArtistName('  Madara Dusal  ')).toBe('Madara Dusal');
  });

  it('should keep valid hyphens in the middle of artist names', () => {
    expect(cleanArtistName('Jay-Z')).toBe('Jay-Z');
    expect(cleanArtistName('Jay-Z - Topic')).toBe('Jay-Z');
    expect(cleanArtistName('Slipknot - Topic')).toBe('Slipknot');
  });

  it('should not remove "Topic" if it is part of the artist name (not a suffix)', () => {
    expect(cleanArtistName('Topic')).toBe('Topic');
    expect(cleanArtistName('Hot Topic')).toBe('Hot Topic');
    expect(cleanArtistName('The Topic Band')).toBe('The Topic Band');
    expect(cleanArtistName('Topic - The Band')).toBe('Topic - The Band');
  });

  it('should handle strings that become empty after cleaning', () => {
    expect(cleanArtistName(' - Topic')).toBe('');
    expect(cleanArtistName('-')).toBe('');
    expect(cleanArtistName(' - ')).toBe('');
  });
});
