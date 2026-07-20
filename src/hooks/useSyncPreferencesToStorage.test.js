/**
 * @file useSyncPreferencesToStorage.test.js
 * @description Vitest unit tests for the {@link useSyncPreferencesToStorage} hook.
 * Verifies that the hook correctly dispatches SET_PREFERENCES to the AppContext
 * store and writes each expected key to localStorage when preferences change.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSyncPreferencesToStorage } from './useSyncPreferencesToStorage';

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a fresh mock dispatch spy and a localStorage spy map.
 *
 * @returns {{ dispatch: import('vitest').MockInstance }} Mock dispatch.
 */
function createMocks() {
  return { dispatch: vi.fn() };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useSyncPreferencesToStorage', () => {
  beforeEach(() => {
    // Provide a fresh in-memory localStorage for each test
    vi.stubGlobal('localStorage', {
      store: {},
      setItem(key, value) {
        this.store[key] = String(value);
      },
      getItem(key) {
        return this.store[key] ?? null;
      },
      removeItem(key) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('does nothing when prefs is null', () => {
    const { dispatch } = createMocks();
    renderHook(() => useSyncPreferencesToStorage(null, dispatch));
    expect(dispatch).not.toHaveBeenCalled();
    expect(localStorage.store).toEqual({});
  });

  it('dispatches SET_PREFERENCES with the prefs object', () => {
    const { dispatch } = createMocks();
    const prefs = { theme: 'dark' };
    renderHook(() => useSyncPreferencesToStorage(prefs, dispatch));
    expect(dispatch).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_PREFERENCES', payload: prefs });
  });

  it('writes theme to localStorage when present', () => {
    const { dispatch } = createMocks();
    renderHook(() => useSyncPreferencesToStorage({ theme: 'dark' }, dispatch));
    expect(localStorage.store['theme']).toBe('dark');
  });

  it('does NOT write theme when absent', () => {
    const { dispatch } = createMocks();
    renderHook(() => useSyncPreferencesToStorage({ sound_muted: false }, dispatch));
    expect(localStorage.store['theme']).toBeUndefined();
  });

  it('writes fridge_sound_muted as a string', () => {
    const { dispatch } = createMocks();
    renderHook(() => useSyncPreferencesToStorage({ sound_muted: true }, dispatch));
    expect(localStorage.store['fridge_sound_muted']).toBe('true');
    renderHook(() => useSyncPreferencesToStorage({ sound_muted: false }, dispatch));
    expect(localStorage.store['fridge_sound_muted']).toBe('false');
  });

  it('writes fridge_grid_snapping as a string', () => {
    const { dispatch } = createMocks();
    renderHook(() => useSyncPreferencesToStorage({ grid_snapping: true }, dispatch));
    expect(localStorage.store['fridge_grid_snapping']).toBe('true');
  });

  it('writes fridge_background when present', () => {
    const { dispatch } = createMocks();
    renderHook(() => useSyncPreferencesToStorage({ fridge_background: 'hearts' }, dispatch));
    expect(localStorage.store['fridge_background']).toBe('hearts');
  });

  it('writes fridge_note_font when present', () => {
    const { dispatch } = createMocks();
    renderHook(() => useSyncPreferencesToStorage({ fridge_note_font: 'cursive' }, dispatch));
    expect(localStorage.store['fridge_note_font']).toBe('cursive');
  });

  it('writes fridge_auto_compact_days as "off" when null', () => {
    const { dispatch } = createMocks();
    renderHook(() => useSyncPreferencesToStorage({ auto_compact_days: null }, dispatch));
    expect(localStorage.store['fridge_auto_compact_days']).toBe('off');
  });

  it('writes fridge_auto_compact_days as a string when numeric', () => {
    const { dispatch } = createMocks();
    renderHook(() => useSyncPreferencesToStorage({ auto_compact_days: 7 }, dispatch));
    expect(localStorage.store['fridge_auto_compact_days']).toBe('7');
  });

  it('writes preferences_push_enabled as a string', () => {
    const { dispatch } = createMocks();
    renderHook(() => useSyncPreferencesToStorage({ push_notifications_enabled: true }, dispatch));
    expect(localStorage.store['preferences_push_enabled']).toBe('true');
    renderHook(() => useSyncPreferencesToStorage({ push_notifications_enabled: false }, dispatch));
    expect(localStorage.store['preferences_push_enabled']).toBe('false');
  });

  it('writes all keys simultaneously when all prefs are present', () => {
    const { dispatch } = createMocks();
    const prefs = {
      theme: 'light',
      sound_muted: false,
      grid_snapping: true,
      fridge_background: 'roses',
      fridge_note_font: 'serif',
      auto_compact_days: 14,
      push_notifications_enabled: false,
    };
    renderHook(() => useSyncPreferencesToStorage(prefs, dispatch));

    expect(localStorage.store['theme']).toBe('light');
    expect(localStorage.store['fridge_sound_muted']).toBe('false');
    expect(localStorage.store['fridge_grid_snapping']).toBe('true');
    expect(localStorage.store['fridge_background']).toBe('roses');
    expect(localStorage.store['fridge_note_font']).toBe('serif');
    expect(localStorage.store['fridge_auto_compact_days']).toBe('14');
    expect(localStorage.store['preferences_push_enabled']).toBe('false');
    expect(dispatch).toHaveBeenCalledOnce();
  });

  it('re-runs on prefs change and updates localStorage', () => {
    const { dispatch } = createMocks();
    const { rerender } = renderHook(({ prefs }) => useSyncPreferencesToStorage(prefs, dispatch), {
      initialProps: { prefs: { theme: 'dark' } },
    });
    expect(localStorage.store['theme']).toBe('dark');

    rerender({ prefs: { theme: 'light' } });
    expect(localStorage.store['theme']).toBe('light');
    expect(dispatch).toHaveBeenCalledTimes(2);
  });
});
