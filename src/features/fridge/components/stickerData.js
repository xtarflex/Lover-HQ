/**
 * @file stickerData.js
 * @description Sticker Magnet Packs dataset configuration for Lover-HQ chat & fridge.
 * Currently reserved for incoming custom sticker magnet pack data.
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
export const STICKER_PACKS = [];

/**
 * Returns public URL for Supabase Storage hosted sticker assets if configured,
 * or falls back to standard URL.
 *
 * @param {string} path - Storage path inside 'stickers' bucket.
 * @param {string} fallbackUrl - Default fallback URL.
 * @returns {string} Fully qualified URL.
 */
export function getStickerUrl(path, fallbackUrl) {
  if (path && typeof window !== 'undefined' && window.__SUPABASE_URL__) {
    return `${window.__SUPABASE_URL__}/storage/v1/object/public/stickers/${path}`;
  }
  return fallbackUrl;
}
