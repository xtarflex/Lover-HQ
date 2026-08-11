export function getSafeUrl(url) {
  if (!url) return '#';
  try {
    const parsedUrl = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    );
    const safeProtocols = ['http:', 'https:', 'blob:', 'mailto:', 'tel:'];
    if (safeProtocols.includes(parsedUrl.protocol)) {
      return url;
    }
    return '#';
  } catch {
    // ignore error
    return '#';
  }
}
