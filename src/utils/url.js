export const sanitizeUrl = (url, fallback = '#') => {
  if (!url) return fallback;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(url, base);
    if (['http:', 'https:', 'blob:', 'data:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return url;
    }
    return fallback;
  } catch {
    return fallback;
  }
};
