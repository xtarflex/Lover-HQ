/**
 * @file stickerData.js
 * @description Curated custom sticker magnet packs for Lover-HQ chat & fridge.
 * Supports mixed animated (AWEBP/Lottie) and static stickers, configured with
 * local/CDN fallbacks and Supabase Storage bucket readiness.
 */

/**
 * @typedef {object} StickerItem
 * @property {string} id - Unique identifier for the sticker.
 * @property {string} label - Friendly sticker title.
 * @property {'animated'|'static'} type - Sticker type.
 * @property {string} url - Direct image or Lottie WebP URL.
 * @property {string} [packId] - Associated pack identifier.
 */

/**
 * @typedef {object} StickerPack
 * @property {string} id - Unique pack identifier.
 * @property {string} name - Friendly pack title.
 * @property {string} icon - Pack header icon emoji or badge.
 * @property {Array<StickerItem>} stickers - Collection of stickers in pack.
 */

/** @type {Array<StickerPack>} */
export const STICKER_PACKS = [
  {
    id: 'love_magnets',
    name: 'Love Magnets',
    icon: '💖',
    stickers: [
      {
        id: 'love_heart_pulse',
        label: 'Heart Pulse',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp',
      },
      {
        id: 'love_kiss_sparkle',
        label: 'Blow Kiss',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f618/512.webp',
      },
      {
        id: 'love_heart_eyes',
        label: 'Heart Eyes',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp',
      },
      {
        id: 'love_cat_heart',
        label: 'Love Cat',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63b/512.webp',
      },
      {
        id: 'love_rose_static',
        label: 'Red Rose',
        type: 'static',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f339/512.webp',
      },
      {
        id: 'love_sparkles_static',
        label: 'Sparkles',
        type: 'static',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.webp',
      },
    ],
  },
  {
    id: 'mood_reactions',
    name: 'Mood Expressions',
    icon: '🥳',
    stickers: [
      {
        id: 'mood_party_popper',
        label: 'Party Popper',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp',
      },
      {
        id: 'mood_party_face',
        label: 'Party Time',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.webp',
      },
      {
        id: 'mood_mind_blown',
        label: 'Mind Blown',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp',
      },
      {
        id: 'mood_fire_burst',
        label: 'On Fire',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp',
      },
      {
        id: 'mood_ghost_boo',
        label: 'Cute Ghost',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f47b/512.webp',
      },
      {
        id: 'mood_hundred_percent',
        label: '100 Percent',
        type: 'animated',
        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.webp',
      },
    ],
  },
];

/**
 * Returns public URL for Supabase Storage hosted sticker assets if configured,
 * or falls back to standard WebP URL.
 *
 * @param {string} path - Storage path inside 'stickers' bucket.
 * @param {string} fallbackUrl - Default CDN fallback URL.
 * @returns {string} Fully qualified URL.
 */
export function getStickerUrl(path, fallbackUrl) {
  if (path && typeof window !== 'undefined' && window.__SUPABASE_URL__) {
    return `${window.__SUPABASE_URL__}/storage/v1/object/public/stickers/${path}`;
  }
  return fallbackUrl;
}
