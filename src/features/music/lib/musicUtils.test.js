import { describe, it, expect } from 'vitest';
import { getTrackArtwork } from './musicUtils';

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
