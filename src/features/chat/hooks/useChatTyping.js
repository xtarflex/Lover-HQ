/**
 * @file useChatTyping.js
 * @description Custom hook that manages the real-time typing indicator state for the
 * Lover-HQ chat feature. Responsibilities:
 * - Subscribes to the partner's typing broadcasts via a dedicated Supabase channel or passed channel ref.
 * - Tracks local typing state and broadcasts it to the partner with a 2-second auto-clear.
 * - Exposes `partnerIsTyping` state and `handleInputChange` for the input field.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Manages typing indicator state: partner broadcast subscription and local typing timeout.
 * Supports flexible signature options:
 * - `useChatTyping(coupleKey, userId, setNewMessageText)`
 * - `useChatTyping(userId, partnerId, setNewMessageText, typingChannelRef)`
 * - `useChatTyping({ coupleKey, userId, partnerId, setNewMessageText, typingChannelRef })`
 *
 * @param {any} arg1
 * @param {any} [arg2]
 * @param {any} [arg3]
 * @param {any} [arg4]
 * @returns {{ partnerIsTyping: boolean, isTypingLocal: React.MutableRefObject, broadcastTypingStatus: Function, handleInputChange: Function, handlePartnerTypingBroadcast: Function }}
 */
export function useChatTyping(arg1, arg2, arg3, arg4) {
  let coupleKey = null;
  let userId = null;
  let partnerId = null;
  let setNewMessageText = null;
  let typingChannelRef = null;

  if (typeof arg3 === 'function') {
    if (arg4 !== undefined) {
      userId = arg1;
      partnerId = arg2;
      setNewMessageText = arg3;
      typingChannelRef = arg4;
    } else {
      coupleKey = arg1;
      userId = arg2;
      setNewMessageText = arg3;
    }
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    ({ coupleKey, userId, partnerId, setNewMessageText, typingChannelRef } = arg1);
  } else {
    coupleKey = arg1;
    userId = arg2;
  }

  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const isTypingLocal = useRef(false);
  const typingTimeoutRef = useRef(null);
  const internalChannelRef = useRef(null);

  const activeChannelRef = typingChannelRef || internalChannelRef;

  // Manage dedicated typing channel subscription if not provided externally
  useEffect(() => {
    if (!coupleKey || typingChannelRef) return;

    const channel = supabase
      .channel(`typing:${coupleKey}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload?.payload?.userId && payload.payload.userId !== userId) {
          setPartnerIsTyping(!!payload.payload.isTyping);
        }
      })
      .subscribe();

    internalChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleKey, userId, typingChannelRef]);

  /**
   * Broadcasts the current typing status to the partner via the active typing channel.
   *
   * @param {boolean} isTyping - Whether the local user is currently typing.
   * @returns {void}
   */
  const broadcastTypingStatus = useCallback(
    (isTyping) => {
      if (!activeChannelRef || !activeChannelRef.current) return;
      try {
        activeChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId, isTyping },
        });
      } catch (err) {
        console.error('Failed to send typing status:', err);
      }
    },
    [userId, activeChannelRef]
  );

  /**
   * Handles text input changes: updates message text, broadcasts typing start,
   * and auto-clears the typing indicator after 2 seconds of inactivity.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} e - Input change event.
   * @returns {void}
   */
  const handleInputChange = useCallback(
    (e) => {
      if (setNewMessageText) {
        setNewMessageText(e.target.value);
      }

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
   * Registers the partner typing broadcast listener on an external typing channel.
   *
   * @param {{ payload: { userId: string, isTyping: boolean } }} payload - Broadcast payload.
   * @returns {void}
   */
  const handlePartnerTypingBroadcast = useCallback(
    (payload) => {
      const payloadUserId = payload?.payload?.userId;
      const targetPartnerId = partnerId || PARTNER_FALLBACK_LOOKUP(userId);
      if (
        payloadUserId &&
        payloadUserId !== userId &&
        (!targetPartnerId || payloadUserId === targetPartnerId)
      ) {
        setPartnerIsTyping(!!payload.payload.isTyping);
      }
    },
    [userId, partnerId]
  );

  return {
    partnerIsTyping,
    isTypingLocal,
    broadcastTypingStatus,
    handleInputChange,
    handlePartnerTypingBroadcast,
  };
}

function PARTNER_FALLBACK_LOOKUP() {
  return null;
}
