/**
 * @file time.js
 * @description Shared time and date formatting utilities extracted from Chat.jsx.
 * Provides helpers for formatting audio durations and ISO date strings.
 */

/**
 * Formats a duration in seconds to a `m:ss` string for audio playback display.
 *
 * @param {number} time - Duration in seconds.
 * @returns {string} Formatted time string, e.g. `"3:05"`. Returns `"0:00"` for NaN input.
 */
export const formatAudioTime = (time) => {
  if (isNaN(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

/**
 * Formats an ISO date string to a locale-aware short date + time string
 * for display in fridge item subtexts (e.g. "Jul 23, 04:30 AM").
 *
 * @param {string} dateStr - ISO 8601 date string.
 * @returns {string} Locale-formatted date string.
 */
export const formatChatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
