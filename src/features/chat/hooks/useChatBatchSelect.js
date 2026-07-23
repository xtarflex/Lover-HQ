/**
 * @file useChatBatchSelect.js
 * @description Custom hook that manages batch/multi-select mode state for the
 * Lover-HQ chat feature. Responsibilities:
 * - Tracks whether selection mode is active.
 * - Maintains the Set of selected message IDs.
 * - Exposes toggle and clear actions.
 */

import { useState, useCallback } from 'react';

/**
 * Manages multi-select mode: selection mode toggle, per-message select/deselect, and clear.
 *
 * @returns {{ isSelectionMode: boolean, selectedMessageIds: Set<string>, toggleSelectionMode: Function, toggleSelectMessage: Function, clearSelection: Function }}
 */
export function useChatBatchSelect() {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());

  /**
   * Toggles selection mode on or off.
   * Clears the selection set when disabling.
   *
   * @returns {void}
   */
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelectedMessageIds(new Set());
      }
      return !prev;
    });
  }, []);

  /**
   * Adds or removes a message ID from the selection set.
   *
   * @param {string} id - The message ID to toggle.
   * @returns {void}
   */
  const toggleSelectMessage = useCallback((id) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Exits selection mode and clears all selected message IDs.
   *
   * @returns {void}
   */
  const clearSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  }, []);

  return {
    isSelectionMode,
    selectedMessageIds,
    toggleSelectionMode,
    toggleSelectMessage,
    clearSelection,
  };
}
