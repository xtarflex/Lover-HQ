/**
 * URL Sanitization Utilities
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'blob:', 'data:', 'mailto:', 'tel:']);

/**
 * Validates and sanitizes a URL string.
 * Returns the sanitized URL if the protocol is allowed, otherwise returns a fallback or empty string.
 *
 * @param {string} url - The URL to sanitize.
 * @param {string} fallback - The fallback URL to use if the original is invalid. Default is '#'.
 * @returns {string} The sanitized URL.
 */
export function getSafeUrl(url, fallback = '#') {
  if (!url || typeof url !== 'string') return fallback;

  try {
    const parsedUrl = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );

    // Check if the protocol is in the allowlist
    if (ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
      // If it's a relative URL parsed with base origin, return original if it didn't change protocol
      // new URL('/path', 'http://localhost') -> protocol is 'http:'
      // If it was just a relative path, we want to return original url.
      // But we can just return url if no exception is thrown and protocol is allowed.
      // Actually, if we just return `url` for relative URLs, it works.
      // Wait, let's just use the `url` itself if it's safe.

      // We parse the URL. If it's a javascript: url, parsedUrl.protocol will be 'javascript:'.
      return url;
    }

    return fallback;
  } catch {
    // If it's a very malformed URL, fallback
    return fallback;
  }
}
