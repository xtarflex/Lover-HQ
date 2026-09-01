/**
 * Validates and sanitizes a URL to ensure it uses a safe protocol.
 * This prevents Cross-Site Scripting (XSS) via malicious protocols like `javascript:`.
 *
 * @param {string} url - The URL to sanitize.
 * @returns {string} The sanitized URL, or 'about:blank' if the protocol is unsafe or parsing fails.
 */
export const getSafeUrl = (url) => {
  if (!url) return 'about:blank';
  try {
    const parsed = new URL(url, window.location.origin);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return parsed.href;
    }
    return 'about:blank';
  } catch {
    return 'about:blank';
  }
};
