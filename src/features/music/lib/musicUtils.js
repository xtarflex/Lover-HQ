/**
 * @file src/features/music/lib/musicUtils.js
 * @description Helper utilities for resolving track cover artwork, generating
 * deterministic complement-color gradients from text strings, and resolving YouTube thumbnails.
 */

/**
 * Returns the best available artwork URL for a track.
 *
 * @param {Object} track - The music track database row object.
 * @returns {string|null} The resolved artwork URL, or null if a gradient fallback is needed.
 */
export function getTrackArtwork(track) {
  if (!track) return null;
  if (track.artwork_url) return track.artwork_url;
  if (track.source === 'youtube') {
    const ytId = track.youtube_id || track.url;
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
  }
  return null;
}

/**
 * Resolves the best-available YouTube thumbnail URL for a given video ID.
 * Prefers maxresdefault, falls back to hqdefault.
 *
 * @param {string} videoId - YouTube video ID.
 * @returns {Promise<string>} Resolved thumbnail URL.
 */
export async function resolveYouTubeThumbnail(videoId) {
  const maxres = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const hq = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const res = await fetch(maxres, { method: 'HEAD' });
    // YouTube returns a 200 with a 120x90 placeholder image for missing maxres.
    // Check content-length to detect placeholder (it is always 1176 bytes).
    const length = parseInt(res.headers.get('content-length') || '0', 10);
    return length > 2000 ? maxres : hq;
  } catch {
    return hq;
  }
}

/**
 * Generates a deterministic CSS gradient style based on a string hash.
 * The same string (e.g. track title) always produces the same colors.
 *
 * @param {string} str - Input string (track title).
 * @returns {Object} React style object containing background and color.
 */
export function gradientFromString(str) {
  if (!str) str = 'Unknown';
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash; // Force 32-bit
  }

  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 137) % 360; // Golden angle offset for complement

  return {
    background: `linear-gradient(135deg, oklch(65% 0.18 ${h1}), oklch(50% 0.14 ${h2}))`,
    color: '#ffffff',
  };
}
