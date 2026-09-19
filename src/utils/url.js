/**
 * URL Sanitization and Validation Utilities
 *
 * NOTE FOR CHAT EVOLUTION:
 * This utility provides the base protocol verification layer for external and user-generated links.
 * During future chat evolution milestones, this module will serve as the gateway for dedicated
 * chat deliverable renderers, including:
 *   - Rich Open Graph / Web Link Previews
 *   - Deep linking to internal app destinations (Fridge magnets, Games, Music tracks)
 *   - Email / mailto action cards and previews
 *   - Supported music streaming embed previews (Spotify, YouTube, SoundCloud)
 */

/**
 * Protocols deemed safe for navigation, asset loading, and action triggers.
 * Blocks dangerous schemes such as `javascript:`, `vbscript:`, `data:text/html`, and `file:`.
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'blob:', 'data:', 'mailto:', 'tel:']);

/**
 * Validates and sanitizes a URL to guard against XSS and unsafe protocol execution.
 *
 * @param {string} url - The URL string to validate.
 * @param {string} [fallback='#'] - Fallback URL to return if input is invalid or unsafe.
 * @returns {string} The original URL if valid and safe; otherwise the fallback string.
 */
export function getSafeUrl(url, fallback = '#') {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    const baseOrigin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost';

    const parsedUrl = new URL(trimmed, baseOrigin);

    if (ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
      // For data URLs, restrict to safe media MIME types (prevent data:text/html XSS vectors)
      if (parsedUrl.protocol === 'data:') {
        const isSafeData =
          /^data:(image\/(png|jpeg|jpg|webp|gif|svg\+xml)|audio\/(webm|mp3|ogg|wav)|video\/(webm|mp4))/i.test(
            trimmed
          );
        return isSafeData ? trimmed : fallback;
      }

      return trimmed;
    }

    return fallback;
  } catch {
    return fallback;
  }
}
