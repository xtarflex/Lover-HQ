/**
 * @file notification.js
 * @description Core utility for handling device haptic feedback (vibrations)
 * and system-level browser push notifications. Respects user-configured settings.
 */

/**
 * Triggers a double haptic vibration buzz on the device.
 * Respects the user's haptics preference in localStorage.
 *
 * @returns {boolean} True if vibration was triggered successfully, false otherwise.
 */
export function triggerBuzz() {
  const hapticsEnabled = localStorage.getItem('preferences_haptics_enabled') !== 'false';
  if (!hapticsEnabled) return false;

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      // Perform a double haptic pulse (100ms buzz, 50ms pause, 100ms buzz)
      navigator.vibrate([100, 50, 100]);
      return true;
    } catch (err) {
      console.warn('Haptic vibration failed:', err);
    }
  }
  return false;
}

/**
 * Spawns a browser system-level push notification if the document is hidden/backgrounded.
 * Respects the user's push notifications preference in localStorage.
 *
 * @param {string} title - Title of the push notification.
 * @param {string} body - Body content/description of the notification.
 * @returns {Promise<Notification|null>} Resolves with the created Notification instance, or null.
 */
export async function triggerPush(title, body) {
  const pushEnabled = localStorage.getItem('preferences_push_enabled') !== 'false';
  if (!pushEnabled) return null;

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  // Only trigger a push notification if the app is currently in the background
  if (document.visibilityState === 'visible') {
    return null;
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico', // fallback to root favicon if present
        badge: '/favicon.ico',
      });
      return notification;
    }
  } catch (err) {
    console.error('Failed to trigger push notification:', err);
  }
  return null;
}
