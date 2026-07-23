/**
 * @file usePinnedMessage.js
 * @description Custom hook that manages the pinned message state for the Lover-HQ chat feature.
 * Responsibilities:
 * - Resolves the pinned message from localStorage on messages load / change.
 * - Listens to the custom `resolve-pinned-message` window event dispatched when
 *   the typing channel receives `pin_message` / `unpin_message` broadcasts.
 * - Exposes `pinnedMessage` and `setPinnedMessage` to the parent orchestrator.
 */

import { useState, useEffect } from 'react';

/**
 * Manages pinned message state: localStorage resolution and custom event subscription.
 *
 * @param {string|null} coupleKey - Sorted, joined user+partner ID key (e.g. "uuid1_uuid2").
 * @param {Array} messages - The current messages array (used to resolve the pinned message object).
 * @returns {{ pinnedMessage: object|null, setPinnedMessage: Function }}
 */
export function usePinnedMessage(coupleKey, messages) {
  const [pinnedMessage, setPinnedMessage] = useState(null);

  // Resolve pinned message when messages load/change or on the custom window event
  useEffect(() => {
    if (!coupleKey || messages.length === 0) return;

    const resolvePin = () => {
      const storedId = localStorage.getItem(`pinned_msg_${coupleKey}`);
      if (storedId) {
        const found = messages.find((m) => m.id === storedId);
        if (found) {
          setPinnedMessage(found);
        }
      }
    };

    resolvePin();

    window.addEventListener('resolve-pinned-message', resolvePin);
    return () => window.removeEventListener('resolve-pinned-message', resolvePin);
  }, [messages, coupleKey]);

  return { pinnedMessage, setPinnedMessage };
}
