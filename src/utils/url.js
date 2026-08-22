export function getSafeUrl(url) {
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
    // ignore error
    return '#';
  }
  return '#';
}
