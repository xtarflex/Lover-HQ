/**
 * @file src/features/music/lib/musicEngine.js
 * @description Pure utility helper functions for the Music Room feature,
 * enabling modular testing of YouTube parsing, metadata extraction, and time formatting.
 */

/**
 * Extracts the 11-character YouTube video ID from various YouTube URL formats.
 *
 * @param {string} url - The YouTube URL.
 * @returns {string|null} The 11-character video ID, or null if invalid.
 */
export function extractYoutubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Parses a filename to extract default Title and Artist metadata.
 * Cleans up extensions, underscores, and hyphens.
 *
 * @param {string} filename - The full name of the uploaded file.
 * @returns {{ title: string, artist: string }} The parsed metadata.
 */
export function parseFilenameMetadata(filename) {
  if (!filename) return { title: '', artist: '' };

  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

  if (nameWithoutExt.includes(' - ')) {
    const parts = nameWithoutExt.split(' - ');
    return {
      artist: parts[0].trim(),
      title: parts[1].trim(),
    };
  } else {
    const cleanedTitle = nameWithoutExt
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: cleanedTitle.trim(),
      artist: '',
    };
  }
}

/**
 * Formats duration in seconds into a mm:ss readable track timestamp.
 *
 * @param {number} timeInSecs - The time in seconds.
 * @returns {string} The formatted timestamp.
 */
export function formatTime(timeInSecs) {
  if (isNaN(timeInSecs) || timeInSecs === null) return '0:00';
  const mins = Math.floor(timeInSecs / 60);
  const secs = Math.floor(timeInSecs % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
