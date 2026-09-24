import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to manage offline queuing and synchronization.
 * Handles creations, updates, and deletions for offline caching support.
 *
 * @param {string} storageKey - The base key for localStorage.
 * @param {Function} syncCallback - Async callback to perform sync. Signature: async (type, payload) => result.
 * @param {Function} [onSyncSuccess] - Callback when an item is successfully synced. Signature: (type, id, result) => void.
 * @returns {object} The hook state and utility functions.
 */
export function useOfflineQueue(storageKey, syncCallback, onSyncSuccess) {
  const [offlineItems, setOfflineItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`${storageKey}_offline_queue`) || '[]');
    } catch {
      return [];
    }
  });

  const onSyncSuccessRef = useRef(onSyncSuccess);
  useEffect(() => {
    onSyncSuccessRef.current = onSyncSuccess;
  }, [onSyncSuccess]);

  const isSyncingRef = useRef(false);

  const queueKey = `${storageKey}_offline_queue`;
  const updatesKey = `${storageKey}_offline_updates_queue`;
  const deletionsKey = `${storageKey}_offline_deletions_queue`;

  /**
   * Adds an item to the offline creation queue.
   *
   * @param {object} item - The item to be created offline.
   */
  const addOfflineItem = useCallback(
    (item) => {
      try {
        const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
        queue.push(item);
        localStorage.setItem(queueKey, JSON.stringify(queue));
        setOfflineItems(queue);
      } catch (e) {
        console.error(`Failed to add offline item for ${storageKey}:`, e);
      }
    },
    [queueKey, storageKey]
  );

  /**
   * Removes an item from the offline creation queue (e.g. if it is deleted before syncing).
   *
   * @param {string|number} id - The temporary ID of the item to be removed.
   */
  const removeOfflineItem = useCallback(
    (id) => {
      try {
        const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
        const filtered = queue.filter((item) => item.id !== id);
        localStorage.setItem(queueKey, JSON.stringify(filtered));
        setOfflineItems(filtered);
      } catch (e) {
        console.error(`Failed to remove offline item for ${storageKey}:`, e);
      }
    },
    [queueKey, storageKey]
  );

  /**
   * Adds or updates a pending movement/update in the offline updates queue.
   *
   * @param {object} update - The update payload (must include 'id').
   */
  const addOfflineUpdate = useCallback(
    (update) => {
      try {
        const queue = JSON.parse(localStorage.getItem(updatesKey) || '[]');
        const filtered = queue.filter((item) => item.id !== update.id);
        filtered.push(update);
        localStorage.setItem(updatesKey, JSON.stringify(filtered));
      } catch (e) {
        console.error(`Failed to add offline update for ${storageKey}:`, e);
      }
    },
    [updatesKey, storageKey]
  );

  /**
   * Adds an item ID to the offline deletions queue.
   *
   * @param {string|number} id - The ID of the item to delete.
   */
  const addOfflineDeletion = useCallback(
    (id) => {
      try {
        const queue = JSON.parse(localStorage.getItem(deletionsKey) || '[]');
        queue.push(id);
        localStorage.setItem(deletionsKey, JSON.stringify(queue));
      } catch (e) {
        console.error(`Failed to add offline deletion for ${storageKey}:`, e);
      }
    },
    [deletionsKey, storageKey]
  );

  /**
   * Iterates through the creation, update, and deletion queues and syncs them to the database.
   * Employs an in-flight concurrency lock and atomic reconciliation to prevent race conditions.
   */
  const syncOfflineQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      // 1. Sync creations
      let creations = [];
      try {
        creations = JSON.parse(localStorage.getItem(queueKey) || '[]');
      } catch (e) {
        console.error(`Failed to read creations queue for ${storageKey}:`, e);
      }

      if (creations.length > 0) {
        console.log(`Syncing ${creations.length} offline creations for ${storageKey}...`);
        const successfulCreationIds = new Set();
        for (const item of creations) {
          try {
            const syncedData = await syncCallback('create', item);
            successfulCreationIds.add(item.id);
            if (onSyncSuccessRef.current) {
              onSyncSuccessRef.current('create', item.id, syncedData);
            }
          } catch (err) {
            console.error(`Failed to sync queued creation for ${storageKey}:`, err);
          }
        }

        // Atomic reconciliation: preserve any items queued while network calls were in-flight
        try {
          const freshQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
          const remaining = freshQueue.filter((item) => !successfulCreationIds.has(item.id));
          localStorage.setItem(queueKey, JSON.stringify(remaining));
          setOfflineItems(remaining);
        } catch (e) {
          console.error(`Failed to update remaining creations for ${storageKey}:`, e);
        }
      }

      // 2. Sync updates
      let updates = [];
      try {
        updates = JSON.parse(localStorage.getItem(updatesKey) || '[]');
      } catch (e) {
        console.error(`Failed to read updates queue for ${storageKey}:`, e);
      }

      if (updates.length > 0) {
        console.log(`Syncing ${updates.length} offline updates for ${storageKey}...`);
        const successfulUpdateIds = new Set();
        for (const update of updates) {
          try {
            await syncCallback('update', update);
            successfulUpdateIds.add(update.id);
            if (onSyncSuccessRef.current) {
              onSyncSuccessRef.current('update', update.id, update);
            }
          } catch (err) {
            console.error(`Failed to sync queued update for ${storageKey}:`, err);
          }
        }

        // Atomic reconciliation: preserve any updates queued while network calls were in-flight
        try {
          const freshUpdates = JSON.parse(localStorage.getItem(updatesKey) || '[]');
          const remaining = freshUpdates.filter((u) => !successfulUpdateIds.has(u.id));
          localStorage.setItem(updatesKey, JSON.stringify(remaining));
        } catch (e) {
          console.error(`Failed to update remaining updates for ${storageKey}:`, e);
        }
      }

      // 3. Sync deletions
      let deletions = [];
      try {
        deletions = JSON.parse(localStorage.getItem(deletionsKey) || '[]');
      } catch (e) {
        console.error(`Failed to read deletions queue for ${storageKey}:`, e);
      }

      if (deletions.length > 0) {
        console.log(`Syncing ${deletions.length} offline deletions for ${storageKey}...`);
        const successfulDeletionIds = new Set();
        for (const id of deletions) {
          try {
            await syncCallback('delete', id);
            successfulDeletionIds.add(id);
            if (onSyncSuccessRef.current) {
              onSyncSuccessRef.current('delete', id, null);
            }
          } catch (err) {
            console.error(`Failed to sync queued deletion for ${storageKey}:`, err);
          }
        }

        // Atomic reconciliation: preserve any deletions queued while network calls were in-flight
        try {
          const freshDeletions = JSON.parse(localStorage.getItem(deletionsKey) || '[]');
          const remaining = freshDeletions.filter((id) => !successfulDeletionIds.has(id));
          localStorage.setItem(deletionsKey, JSON.stringify(remaining));
        } catch (e) {
          console.error(`Failed to update remaining deletions for ${storageKey}:`, e);
        }
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [queueKey, updatesKey, deletionsKey, storageKey, syncCallback]);

  // Sync on mount and listen to window online events
  useEffect(() => {
    const timer = setTimeout(() => {
      syncOfflineQueue();
    }, 0);
    window.addEventListener('online', syncOfflineQueue);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', syncOfflineQueue);
    };
  }, [syncOfflineQueue]);

  return {
    offlineItems,
    addOfflineItem,
    removeOfflineItem,
    addOfflineUpdate,
    addOfflineDeletion,
    syncOfflineQueue,
  };
}
