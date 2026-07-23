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

/**
 * Formats the partner's last seen ISO string into a friendly relative or absolute date.
 *
 * @param {string} lastSeenIso - ISO date string
 * @returns {string} Friendly last seen message
 */
export function formatLastSeen(lastSeenIso) {
  if (!lastSeenIso) return 'Last seen offline';
  const lastSeenDate = new Date(lastSeenIso);
  const diffMs = Date.now() - lastSeenDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) {
    return 'Last seen just now';
  }
  if (diffMins < 60) {
    return `Last seen ${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `Last seen ${diffHours}h ago`;
  }

  const formattedDate = lastSeenDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = lastSeenDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `Last seen ${formattedDate} at ${formattedTime}`;
}

/**
 * Formats a message creation timestamp into a short time string (e.g., "10:45 AM").
 *
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted time string
 */
export function getFormattedTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
