/**
 * @file notification.test.js
 * @description Comprehensive unit tests for haptics and push notifications.
 * Mocks localStorage, navigator, and Notification APIs to test error boundaries and permissions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerBuzz, triggerPush } from './notification.js';

describe('triggerBuzz', () => {
  let originalNavigator;

  beforeEach(() => {
    // Save original navigator
    originalNavigator = globalThis.navigator;
    // Clear localStorage preferences
    localStorage.removeItem('preferences_haptics_enabled');
  });

  afterEach(() => {
    // Restore global variables
    globalThis.navigator = originalNavigator;
    vi.restoreAllMocks();
  });

  it('returns false immediately when haptics preference is explicitly disabled', () => {
    localStorage.setItem('preferences_haptics_enabled', 'false');

    const vibrateSpy = vi.fn();
    globalThis.navigator = { vibrate: vibrateSpy };

    const result = triggerBuzz();
    expect(result).toBe(false);
    expect(vibrateSpy).not.toHaveBeenCalled();
  });

  it('triggers vibration when enabled and API is supported', () => {
    localStorage.setItem('preferences_haptics_enabled', 'true');

    const vibrateSpy = vi.fn().mockReturnValue(true);
    globalThis.navigator = { vibrate: vibrateSpy };

    const result = triggerBuzz();
    expect(result).toBe(true);
    expect(vibrateSpy).toHaveBeenCalledWith([100, 50, 100]);
  });

  it('returns false when navigator or vibrate API is missing', () => {
    // vibrate is missing
    globalThis.navigator = {};
    expect(triggerBuzz()).toBe(false);

    // navigator itself is missing/undefined
    const oldNavigator = globalThis.navigator;
    delete globalThis.navigator;
    expect(triggerBuzz()).toBe(false);
    globalThis.navigator = oldNavigator;
  });

  it('logs warning and returns false when navigator.vibrate throws an error', () => {
    localStorage.setItem('preferences_haptics_enabled', 'true');

    const vibrateSpy = vi.fn().mockImplementation(() => {
      throw new Error('Vibration not permitted by browser policy');
    });
    globalThis.navigator = { vibrate: vibrateSpy };

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = triggerBuzz();
    expect(result).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith('Haptic vibration failed:', expect.any(Error));
  });
});

describe('triggerPush', () => {
  let originalNotification;
  let originalDocumentVisibility;

  beforeEach(() => {
    // Save original values
    originalNotification = globalThis.Notification;
    originalDocumentVisibility = Object.getOwnPropertyDescriptor(document, 'visibilityState');

    // Clean up localstorage
    localStorage.removeItem('preferences_push_enabled');
  });

  afterEach(() => {
    // Restore
    globalThis.Notification = originalNotification;
    if (originalDocumentVisibility) {
      Object.defineProperty(document, 'visibilityState', originalDocumentVisibility);
    }
    vi.restoreAllMocks();
  });

  // Helper to mock document visibilityState
  const mockVisibilityState = (state) => {
    Object.defineProperty(document, 'visibilityState', {
      value: state,
      writable: true,
      configurable: true,
    });
  };

  it('returns null when push preference is disabled', async () => {
    localStorage.setItem('preferences_push_enabled', 'false');
    const result = await triggerPush('Title', 'Body');
    expect(result).toBeNull();
  });

  it('returns null when Notification API is missing in window', async () => {
    localStorage.setItem('preferences_push_enabled', 'true');
    // Remove Notification API
    delete globalThis.Notification;

    const result = await triggerPush('Title', 'Body');
    expect(result).toBeNull();
  });

  it('returns null when document is visible (foreground)', async () => {
    localStorage.setItem('preferences_push_enabled', 'true');
    mockVisibilityState('visible');

    // Mock Notification
    globalThis.Notification = vi.fn().mockImplementation(function () {});
    globalThis.Notification.permission = 'granted';

    const result = await triggerPush('Title', 'Body');
    expect(result).toBeNull();
  });

  it('requests permission and constructs notification when permission is default and granted', async () => {
    localStorage.setItem('preferences_push_enabled', 'true');
    mockVisibilityState('hidden');

    const mockRequestPermission = vi.fn().mockResolvedValue('granted');
    const mockConstructor = vi.fn().mockImplementation(function (title, options) {
      this.title = title;
      this.options = options;
    });

    // Mock Notification object
    globalThis.Notification = mockConstructor;
    globalThis.Notification.permission = 'default';
    globalThis.Notification.requestPermission = mockRequestPermission;

    const result = await triggerPush('Hello Title', 'Hello Body');

    expect(mockRequestPermission).toHaveBeenCalled();
    expect(mockConstructor).toHaveBeenCalledWith('Hello Title', {
      body: 'Hello Body',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });
    expect(result).toEqual({
      title: 'Hello Title',
      options: {
        body: 'Hello Body',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      },
    });
  });

  it('requests permission and returns null when permission is default and denied', async () => {
    localStorage.setItem('preferences_push_enabled', 'true');
    mockVisibilityState('hidden');

    const mockRequestPermission = vi.fn().mockResolvedValue('denied');
    const mockConstructor = vi.fn().mockImplementation(function () {});

    globalThis.Notification = mockConstructor;
    globalThis.Notification.permission = 'default';
    globalThis.Notification.requestPermission = mockRequestPermission;

    const result = await triggerPush('Title', 'Body');

    expect(mockRequestPermission).toHaveBeenCalled();
    expect(mockConstructor).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('does not request permission and constructs notification directly if permission is already granted', async () => {
    localStorage.setItem('preferences_push_enabled', 'true');
    mockVisibilityState('hidden');

    const mockRequestPermission = vi.fn();
    const mockConstructor = vi.fn().mockImplementation(function (title, options) {
      this.title = title;
      this.options = options;
    });

    globalThis.Notification = mockConstructor;
    globalThis.Notification.permission = 'granted';
    globalThis.Notification.requestPermission = mockRequestPermission;

    await triggerPush('Title', 'Body');

    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(mockConstructor).toHaveBeenCalledWith('Title', {
      body: 'Body',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });
  });

  it('returns null and logs error if permission request rejects or constructor throws', async () => {
    localStorage.setItem('preferences_push_enabled', 'true');
    mockVisibilityState('hidden');

    // Make Notification constructor throw
    const mockConstructor = vi.fn().mockImplementation(function () {
      throw new Error('Notification creation blocked by environment');
    });

    globalThis.Notification = mockConstructor;
    globalThis.Notification.permission = 'granted';

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await triggerPush('Title', 'Body');
    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to trigger push notification:',
      expect.any(Error)
    );
  });
});
