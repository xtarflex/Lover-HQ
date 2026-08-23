export const getSafeUrl = (url) => {
  if (!url) return undefined;
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    const protocol = parsed.protocol.toLowerCase();
    if (['http:', 'https:', 'mailto:', 'tel:', 'blob:', 'data:'].includes(protocol)) {
      return url;
    }
    return undefined;
  } catch {
    return undefined;
  }
};
