export const sanitizeUrl = (url) => {
  if (!url) return '#';
  try {
    const parsedUrl = new URL(url, window.location.origin);
    if (['http:', 'https:'].includes(parsedUrl.protocol)) {
      return parsedUrl.href;
    }
  } catch {
    // Ignore invalid URLs
  }
  return '#';
};
