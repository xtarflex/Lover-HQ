/**
 * Sanitizes user-provided URLs for use in window.open() or href attributes.
 * Prevents XSS via javascript: or data: protocols when not expected.
 * @param {string} url The URL to sanitize
 * @param {string} [fallback] The fallback string if the URL is invalid (default: '')
 * @returns {string} The sanitized URL or fallback
 */
export const sanitizeUrl = (url, fallback = '') => {
  if (!url) return fallback;
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    const allowedProtocols = ['http:', 'https:', 'blob:', 'data:', 'mailto:', 'tel:'];
    if (allowedProtocols.includes(parsed.protocol)) {
      return url;
    }
    return fallback;
  } catch {
    return fallback;
  }
};
