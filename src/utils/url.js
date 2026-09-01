export const getSafeUrl = (url, fallback = '#') => {
  if (!url) return fallback;
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    const safeProtocols = ['http:', 'https:', 'blob:', 'data:', 'mailto:', 'tel:'];
    if (safeProtocols.includes(parsed.protocol)) {
      return url;
    }
    return fallback;
  } catch {
    return fallback;
  }
};
