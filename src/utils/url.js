/**
 * Sanitizes user-provided URLs to prevent Cross-Site Scripting (XSS) vulnerabilities.
 * Enforces an allowlist of safe protocols to prevent malicious protocols like `javascript:`.
 *
 * @param {string} url - The potentially unsafe URL string.
 * @returns {string} - The original URL if safe, otherwise `#`.
 */
export const sanitizeUrl = (url) => {
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
  } catch {
    // If it's a relative URL, we consider it safe (handled by new URL above)
    // If it's malformed, we return '#'
  }
  return '#';
};
