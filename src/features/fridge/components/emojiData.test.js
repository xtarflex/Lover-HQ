import { describe, it, expect } from 'vitest';
import { getEmojiCdnUrl, ANIMATED_EMOJIS } from './emojiData';

describe('emojiData', () => {
  describe('getEmojiCdnUrl', () => {
    it('should return a properly formatted CDN URL for a standard hex code', () => {
      const code = '1f602';
      const expectedUrl = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp';
      expect(getEmojiCdnUrl(code)).toBe(expectedUrl);
    });

    it('should handle hex codes with underscores correctly', () => {
      const code = '2764_fe0f';
      const expectedUrl = 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp';
      expect(getEmojiCdnUrl(code)).toBe(expectedUrl);
    });

    it('should format URL with an empty string if code is empty', () => {
      expect(getEmojiCdnUrl('')).toBe('https://fonts.gstatic.com/s/e/notoemoji/latest//512.webp');
    });
  });

  describe('ANIMATED_EMOJIS', () => {
    it('should be an array of emoji objects with required properties', () => {
      expect(Array.isArray(ANIMATED_EMOJIS)).toBe(true);
      expect(ANIMATED_EMOJIS.length).toBeGreaterThan(0);

      ANIMATED_EMOJIS.forEach((emoji) => {
        expect(emoji).toHaveProperty('id');
        expect(typeof emoji.id).toBe('string');

        expect(emoji).toHaveProperty('label');
        expect(typeof emoji.label).toBe('string');

        expect(emoji).toHaveProperty('code');
        expect(typeof emoji.code).toBe('string');

        expect(emoji).toHaveProperty('char');
        expect(typeof emoji.char).toBe('string');
      });
    });

    it('should contain unique ids', () => {
      const ids = ANIMATED_EMOJIS.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should contain unique codes', () => {
      const codes = ANIMATED_EMOJIS.map((e) => e.code);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });
  });
});
