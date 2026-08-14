export function sanitizeUrl(url) {
  if (!url) return '#';
  try {
    const parsedUrl = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    const allowedProtocols = ['http:', 'https:', 'blob:', 'data:', 'mailto:', 'tel:'];
    if (allowedProtocols.includes(parsedUrl.protocol)) {
      return url;
    }
    return '#';
  } catch {
    // ignore error
    return '#';
  }
}
