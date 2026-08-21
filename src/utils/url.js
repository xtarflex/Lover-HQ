export function getSafeUrl(url) {
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:', 'data:'];
    if (safeProtocols.includes(parsed.protocol)) {
      return url;
    }
    return 'about:blank';
  } catch {
    return 'about:blank';
  }
}
