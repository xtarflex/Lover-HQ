export const sanitizeUrl = (url) => {
  if (!url) return 'about:blank';
  try {
    const parsed = new URL(url, window.location.origin);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    // ignore error
    return 'about:blank';
  }
  return 'about:blank';
};
