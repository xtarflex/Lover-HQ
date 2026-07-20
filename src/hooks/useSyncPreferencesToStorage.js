/**
 * @file useSyncPreferencesToStorage.js
 * @description Custom React hook that synchronises a preferences object from the
 * database into both the global AppContext store and the browser's localStorage.
 * Extracted from App.jsx to keep the root component focused on routing concerns.
 */

import { useEffect } from 'react';

/**
 * @description Synchronises the provided preferences object with the AppContext
 * store and with localStorage keys consumed by individual feature modules.
 *
 * The hook runs whenever `prefs` changes (i.e. after a database fetch or
 * real-time update). Each localStorage write is guarded by a presence/value
 * check so that missing fields never overwrite existing storage entries with
 * `undefined` or `"undefined"`.
 *
 * @param {object|null} prefs - The preferences object returned by
 *   {@link usePreferences}. When `null` (e.g. before the first fetch completes),
 *   the hook is a no-op.
 * @param {React.Dispatch<{type: string, payload: *}>} dispatch - The AppContext
 *   dispatch function used to commit the preferences to the global store via the
 *   `SET_PREFERENCES` action.
 * @returns {void} This hook has no return value.
 */
export function useSyncPreferencesToStorage(prefs, dispatch) {
  useEffect(() => {
    if (!prefs) return;

    // Commit the full preferences object to the global AppContext store
    dispatch({ type: 'SET_PREFERENCES', payload: prefs });

    // ── localStorage mirrors ────────────────────────────────────────────────
    // Each feature module reads these keys on startup to avoid a round-trip
    // to the database before preferences are fetched.

    if (prefs.theme) {
      localStorage.setItem('theme', prefs.theme);
    }

    if (prefs.sound_muted !== undefined) {
      localStorage.setItem('fridge_sound_muted', prefs.sound_muted.toString());
    }

    if (prefs.grid_snapping !== undefined) {
      localStorage.setItem('fridge_grid_snapping', prefs.grid_snapping.toString());
    }

    if (prefs.fridge_background) {
      localStorage.setItem('fridge_background', prefs.fridge_background);
    }

    if (prefs.fridge_note_font) {
      localStorage.setItem('fridge_note_font', prefs.fridge_note_font);
    }

    if (prefs.auto_compact_days !== undefined) {
      localStorage.setItem(
        'fridge_auto_compact_days',
        prefs.auto_compact_days === null ? 'off' : prefs.auto_compact_days.toString()
      );
    }

    if (prefs.push_notifications_enabled !== undefined) {
      localStorage.setItem('preferences_push_enabled', prefs.push_notifications_enabled.toString());
    }
  }, [prefs, dispatch]);
}
