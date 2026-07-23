/**
 * @file useChatTyping.js
 * @description Custom hook that manages the real-time typing indicator state for the
 * Lover-HQ chat feature. Responsibilities:
 * - Subscribes to the partner's typing broadcasts via the shared typing channel ref.
 * - Tracks local typing state and broadcasts it to the partner with a 2-second auto-clear.
 * - Exposes `partnerIsTyping` state and `handleInputChange` for the input field.
 */

import { useState, useRef, useCallback } from 'react';

/**
 * Manages typing indicator state: partner broadcast subscription and local typing timeout.
 *
 * @param {string|null} userId - The current user's ID.
 * @param {string|null} partnerId - The partner's user ID.
 * @param {Function} setNewMessageText - State setter for the message input value.
 * @param {React.MutableRefObject} typingChannelRef - Ref to the shared Supabase typing channel.
 * @returns {{ partnerIsTyping: boolean, isTypingLocal: React.MutableRefObject, broadcastTypingStatus: Function, handleInputChange: Function }}
 */
export function useChatTyping(userId, partnerId, setNewMessageText, typingChannelRef) {
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const isTypingLocal = useRef(false);
  const typingTimeoutRef = useRef(null);

  /**
   * Broadcasts the current typing status to the partner via the shared typing channel.
   *
   * @param {boolean} isTyping - Whether the local user is currently typing.
   * @returns {void}
   */
  const broadcastTypingStatus = useCallback(
    (isTyping) => {
      if (!typingChannelRef.current) return;
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping },
      });
    },
    [userId, typingChannelRef]
  );

  /**
   * Handles text input changes: updates message text, broadcasts typing start,
   * and auto-clears the typing indicator after 2 seconds of inactivity.
   *
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - The change event from the textarea.
   * @returns {void}
   */
  const handleInputChange = useCallback(
    (e) => {
      setNewMessageText(e.target.value);

      if (!isTypingLocal.current) {
        isTypingLocal.current = true;
        broadcastTypingStatus(true);
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingLocal.current = false;
        broadcastTypingStatus(false);
      }, 2000);
    },
    [broadcastTypingStatus, setNewMessageText]
  );

  /**
   * Registers the partner typing broadcast listener on the typing channel.
   * Must be called once the typingChannelRef is subscribed.
   * Returns a handler to be passed to the channel's `.on('broadcast', { event: 'typing' }, handler)`.
   *
   * @param {{ payload: { userId: string, isTyping: boolean } }} payload - Broadcast payload.
   * @returns {void}
   */
  const handlePartnerTypingBroadcast = useCallback(
    (payload) => {
      if (payload.payload.userId === partnerId) {
        setPartnerIsTyping(payload.payload.isTyping);
      }
    },
    [partnerId]
  );

  return {
    partnerIsTyping,
    isTypingLocal,
    broadcastTypingStatus,
    handleInputChange,
    handlePartnerTypingBroadcast,
  };
}
