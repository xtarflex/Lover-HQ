/**
 * @file usePinnedMessage.js
 * @description Custom hook that manages the pinned message state for the Lover-HQ chat feature.
 * Responsibilities:
 * - Resolves the pinned message from localStorage on messages load / change.
 * - Manages pin / unpin actions and updates state & localStorage.
 * - Exposes `pinnedMessage`, `setPinnedMessage`, `handlePinMessage`, and `handleUnpinMessage`.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Manages pinned message state: localStorage resolution and action handlers.
 * Supports flexible signature:
 * - `usePinnedMessage(coupleKey, messages)`
 * - `usePinnedMessage({ coupleKey, messages, setMessages })`
 *
 * @param {string|object|null} coupleKeyOrOptions - Sorted couple key string or options object.
 * @param {Array} [messagesArr] - The current messages array.
 * @returns {{ pinnedMessage: object|null, setPinnedMessage: Function, handlePinMessage: Function, handleUnpinMessage: Function }}
 */
export function usePinnedMessage(coupleKeyOrOptions, messagesArr) {
  let coupleKey = null;
  let messages = [];

  if (typeof coupleKeyOrOptions === 'object' && coupleKeyOrOptions !== null) {
    ({ coupleKey, messages } = coupleKeyOrOptions);
  } else {
    coupleKey = coupleKeyOrOptions;
    messages = messagesArr;
  }

  const [pinnedMessage, setPinnedMessage] = useState(null);

  // Resolve pinned message when messages load/change or on custom event

  useEffect(() => {
    const list = Array.isArray(messages) ? messages : [];
    if (!coupleKey || list.length === 0) return;

    const resolvePin = () => {
      const storedId = localStorage.getItem(`pinned_msg_${coupleKey}`);
      if (storedId) {
        const found = list.find((m) => m?.id === storedId);
        if (found) {
          setPinnedMessage(found);
        }
      }
    };

    resolvePin();

    window.addEventListener('resolve-pinned-message', resolvePin);
    return () => window.removeEventListener('resolve-pinned-message', resolvePin);
  }, [messages, coupleKey]);

  const handlePinMessage = useCallback(
    (msg) => {
      if (!coupleKey || !msg?.id) return;
      try {
        localStorage.setItem(`pinned_msg_${coupleKey}`, msg.id);
        setPinnedMessage(msg);
      } catch (err) {
        console.error('Failed to pin message:', err);
      }
    },
    [coupleKey]
  );

  const handleUnpinMessage = useCallback(() => {
    if (!coupleKey) return;
    try {
      localStorage.removeItem(`pinned_msg_${coupleKey}`);
      setPinnedMessage(null);
    } catch (err) {
      console.error('Failed to unpin message:', err);
    }
  }, [coupleKey]);

  return { pinnedMessage, setPinnedMessage, handlePinMessage, handleUnpinMessage };
}
