export const sanitizeUrl = (url) => {
  if (!url) return '';
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    const safeProtocols = ['http:', 'https:', 'blob:', 'data:', 'mailto:', 'tel:'];
    if (safeProtocols.includes(parsed.protocol)) {
      return url;
    }
    return 'about:blank';
  } catch {
    return 'about:blank';
  }
};
