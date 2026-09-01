/**
 * Sanitizes a URL to ensure it uses a safe protocol.
 * This helps prevent Cross-Site Scripting (XSS) vulnerabilities
 * when rendering user-provided URLs in href attributes or passing them to window.open.
 *
 * @param {string} url - The URL to sanitize.
 * @returns {string} The sanitized URL, or a fallback safe URL if invalid or malicious.
 */
export function getSafeUrl(url) {
  if (!url) return '#';
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    const safeProtocols = ['http:', 'https:', 'blob:', 'data:', 'mailto:', 'tel:'];
    if (safeProtocols.includes(parsed.protocol)) {
      return url;
    }
    return '#';
  } catch {
    // ignore error
    return '#';
  }
}
