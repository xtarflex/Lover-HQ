import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkForUpdates,
  clearAppCacheAndReload,
  initServiceWorkerUpdateListener,
} from './serviceWorkerManager';

describe('serviceWorkerManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkForUpdates', () => {
    it('returns unsupported message when serviceWorker is not in navigator', async () => {
      const originalNavigator = globalThis.navigator;
      // @ts-ignore
      delete globalThis.navigator.serviceWorker;

      const result = await checkForUpdates();
      expect(result.hasUpdate).toBe(false);
      expect(result.message).toContain('not supported');

      globalThis.navigator = originalNavigator;
    });

    it('returns latest version message when no updates are waiting or installing', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      const mockRegistration = {
        update: mockUpdate,
        waiting: null,
        installing: null,
      };

      // @ts-ignore
      globalThis.navigator.serviceWorker = {
        getRegistration: vi.fn().mockResolvedValue(mockRegistration),
      };

      const result = await checkForUpdates();
      expect(mockUpdate).toHaveBeenCalled();
      expect(result.hasUpdate).toBe(false);
      expect(result.message).toContain('latest version');
    });

    it('detects when an update is waiting', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      const mockRegistration = {
        update: mockUpdate,
        waiting: {},
        installing: null,
      };

      // @ts-ignore
      globalThis.navigator.serviceWorker = {
        getRegistration: vi.fn().mockResolvedValue(mockRegistration),
      };

      const result = await checkForUpdates();
      expect(result.hasUpdate).toBe(true);
      expect(result.message).toContain('ready to install');
    });
  });

  describe('clearAppCacheAndReload', () => {
    it('deletes caches, unregisters registrations, and reloads window', async () => {
      const mockCacheDelete = vi.fn().mockResolvedValue(true);
      const mockCaches = {
        keys: vi.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
        delete: mockCacheDelete,
      };
      // @ts-ignore
      globalThis.caches = mockCaches;

      const mockUnregister = vi.fn().mockResolvedValue(true);
      // @ts-ignore
      globalThis.navigator.serviceWorker = {
        getRegistrations: vi.fn().mockResolvedValue([{ unregister: mockUnregister }]),
      };

      const mockReload = vi.fn();
      // @ts-ignore
      delete window.location;
      // @ts-ignore
      window.location = { reload: mockReload };

      await clearAppCacheAndReload();

      expect(mockCacheDelete).toHaveBeenCalledWith('cache-v1');
      expect(mockCacheDelete).toHaveBeenCalledWith('cache-v2');
      expect(mockUnregister).toHaveBeenCalled();
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('initServiceWorkerUpdateListener', () => {
    it('registers event listeners and returns clean teardown function', () => {
      const addEventSpy = vi.spyOn(document, 'addEventListener');
      const removeEventSpy = vi.spyOn(document, 'removeEventListener');
      const windowAddSpy = vi.spyOn(window, 'addEventListener');
      const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');

      // @ts-ignore
      globalThis.navigator.serviceWorker = {
        getRegistration: vi.fn().mockResolvedValue(null),
      };

      const cleanup = initServiceWorkerUpdateListener();
      expect(addEventSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(windowAddSpy).toHaveBeenCalledWith('vite:preloadError', expect.any(Function));

      cleanup();
      expect(removeEventSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(windowRemoveSpy).toHaveBeenCalledWith('vite:preloadError', expect.any(Function));
    });
  });
});
