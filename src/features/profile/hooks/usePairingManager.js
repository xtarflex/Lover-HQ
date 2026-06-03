/**
 * @file usePairingManager.js
 * @description Hook encapsulating all partner pairing, reconnection, and
 * unpairing state and actions for the Profile page.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Manages all pairing-related state and async operations for the Profile page.
 *
 * @param {{ user: Object, partner: Object, dispatch: Function, setMessage: Function }} params
 * @returns {{
 *   history: Array,
 *   incomingRequests: Array,
 *   outgoingRequests: Array,
 *   showUnpairModal: boolean,
 *   setShowUnpairModal: Function,
 *   deleteSharedChoice: boolean,
 *   setDeleteSharedChoice: Function,
 *   inputPairingCode: string,
 *   setInputPairingCode: Function,
 *   pairCodeLoading: boolean,
 *   saving: boolean,
 *   handleSendReconnect: Function,
 *   handleAcceptReconnect: Function,
 *   handleDeclineReconnect: Function,
 *   handleCancelRequest: Function,
 *   handleUnpair: Function,
 *   handleGenerateCode: Function,
 *   handleEnterCode: Function,
 * }}
 */
export function usePairingManager({ user, partner, dispatch, setMessage }) {
  const [history, setHistory] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [showUnpairModal, setShowUnpairModal] = useState(false);
  const [deleteSharedChoice, setDeleteSharedChoice] = useState(false);
  const [inputPairingCode, setInputPairingCode] = useState('');
  const [pairCodeLoading, setPairCodeLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Fetches pairing history and pending reconnect requests for the current user.
   *
   * @returns {Promise<void>}
   */
  const fetchHistoryAndRequests = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Fetch pairing history
      const { data: histData, error: histError } = await supabase
        .from('pairing_history')
        .select('*')
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

      if (histError) throw histError;

      // Extract unique past partner IDs (exclude current user)
      const pastPartnerIds = [
        ...new Set(
          (histData || []).map((row) => (row.user_a_id === user.id ? row.user_b_id : row.user_a_id))
        ),
      ];

      if (pastPartnerIds.length > 0) {
        // Fetch profiles of past partners
        const { data: profiles, error: profError } = await supabase.rpc('get_public_profiles', {
          user_ids: pastPartnerIds,
        });

        if (profError) throw profError;
        setHistory(profiles || []);
      } else {
        setHistory([]);
      }

      // 2. Fetch incoming requests
      const { data: incoming, error: incError } = await supabase
        .from('reconnect_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (!incError && incoming?.length > 0) {
        const senderIds = incoming.map((r) => r.sender_id);
        const { data: senders } = await supabase.rpc('get_public_profiles', {
          user_ids: senderIds,
        });

        const mappedIncoming = incoming.map((req) => ({
          ...req,
          sender: senders?.find((s) => s.id === req.sender_id) || {
            id: req.sender_id,
            name: 'Unknown User',
            avatar_url: '',
          },
        }));
        setIncomingRequests(mappedIncoming);
      } else {
        setIncomingRequests([]);
      }

      // 3. Fetch outgoing requests
      const { data: outgoing, error: outError } = await supabase
        .from('reconnect_requests')
        .select('*')
        .eq('sender_id', user.id)
        .eq('status', 'pending');

      if (!outError && outgoing?.length > 0) {
        const receiverIds = outgoing.map((r) => r.receiver_id);
        const { data: receivers } = await supabase.rpc('get_public_profiles', {
          user_ids: receiverIds,
        });

        const mappedOutgoing = outgoing.map((req) => ({
          ...req,
          receiver: receivers?.find((r) => r.id === req.receiver_id) || {
            id: req.receiver_id,
            name: 'Unknown User',
            avatar_url: '',
          },
        }));
        setOutgoingRequests(mappedOutgoing);
      } else {
        setOutgoingRequests([]);
      }
    } catch (err) {
      console.error('Error fetching history or requests:', err);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!partner) {
      const timer = setTimeout(() => {
        if (active) {
          fetchHistoryAndRequests();
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [partner, fetchHistoryAndRequests]);

  /**
   * Sends a reconnect request to a past partner.
   *
   * @param {string} receiverId - The ID of the user to send the request to.
   * @returns {Promise<void>}
   */
  const handleSendReconnect = async (receiverId) => {
    try {
      const { error } = await supabase
        .from('reconnect_requests')
        .insert({ sender_id: user.id, receiver_id: receiverId, status: 'pending' });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Reconnection request sent!' });
      fetchHistoryAndRequests();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to send request: ' + err.message });
    }
  };

  /**
   * Accepts an incoming reconnect request, links the partner, and updates global state.
   *
   * @param {Object} request - The reconnect request object.
   * @returns {Promise<void>}
   */
  const handleAcceptReconnect = async (request) => {
    try {
      // 1. Link partner
      const { error: linkError } = await supabase
        .from('users')
        .update({ partner_id: request.sender_id })
        .eq('id', user.id);

      if (linkError) throw linkError;

      // 2. Clear request
      await supabase.from('reconnect_requests').delete().eq('id', request.id);

      // 3. Fetch partner profile
      const { data: partnerProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', request.sender_id)
        .single();

      dispatch({ type: 'SET_PARTNER', payload: partnerProfile });
      dispatch({ type: 'SET_PAIRING_STATUS', payload: 'paired' });
      setMessage({ type: 'success', text: 'You are now re-paired!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to accept reconnect request: ' + err.message });
    }
  };

  /**
   * Declines an incoming reconnect request by deleting it.
   *
   * @param {string} requestId - The ID of the reconnect request.
   * @returns {Promise<void>}
   */
  const handleDeclineReconnect = async (requestId) => {
    try {
      const { error } = await supabase.from('reconnect_requests').delete().eq('id', requestId);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Request declined.' });
      fetchHistoryAndRequests();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Cancels an outgoing reconnect request by deleting it.
   *
   * @param {string} requestId - The ID of the reconnect request to cancel.
   * @returns {Promise<void>}
   */
  const handleCancelRequest = async (requestId) => {
    try {
      const { error } = await supabase.from('reconnect_requests').delete().eq('id', requestId);

      if (error) throw error;
      fetchHistoryAndRequests();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Unpairs the current user from their partner via an RPC call.
   *
   * @returns {Promise<void>}
   */
  const handleUnpair = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.rpc('unpair_user_and_clean_data', {
        delete_shared: deleteSharedChoice,
      });

      if (error) throw error;

      dispatch({ type: 'SET_PARTNER', payload: null });
      dispatch({ type: 'SET_PAIRING_STATUS', payload: 'unpaired' });
      setShowUnpairModal(false);
      setMessage({ type: 'success', text: 'Successfully unpaired.' });
    } catch (err) {
      console.error('Unpairing failed:', err);
      setMessage({ type: 'error', text: 'Unpairing failed: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Generates a new 6-digit pairing code for the current user and stores it in the database.
   *
   * @returns {Promise<void>}
   */
  const handleGenerateCode = async () => {
    setPairCodeLoading(true);
    try {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const code = Math.floor(100000 + (array[0] / 4294967296) * 900000).toString();

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase
        .from('users')
        .update({
          pairing_code: code,
          pairing_code_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      dispatch({
        type: 'SET_USER',
        payload: { ...user, pairing_code: code, pairing_code_expires_at: expiresAt.toISOString() },
      });
      dispatch({ type: 'SET_PAIRING_STATUS', payload: 'pending' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to generate code: ' + err.message });
    } finally {
      setPairCodeLoading(false);
    }
  };

  /**
   * Attempts to pair with a partner using the entered 6-digit code.
   *
   * @param {React.FormEvent} [e] - The optional form submit event.
   * @returns {Promise<void>}
   */
  const handleEnterCode = async (e) => {
    e?.preventDefault();
    if (inputPairingCode.length !== 6) return;

    setPairCodeLoading(true);
    try {
      const { data: partners, error: findError } = await supabase.rpc('get_user_by_pairing_code', {
        input_code: inputPairingCode,
      });

      const foundPartner = partners?.[0];

      if (findError || !foundPartner) {
        throw new Error('Invalid or expired pairing code. Please check and try again.');
      }

      if (foundPartner.id === user.id) {
        throw new Error("You can't pair with yourself!");
      }

      const { error: linkError } = await supabase
        .from('users')
        .update({ partner_id: foundPartner.id, pairing_code: null, pairing_code_expires_at: null })
        .eq('id', user.id);

      if (linkError) throw linkError;

      dispatch({ type: 'SET_PARTNER', payload: foundPartner });
      dispatch({ type: 'SET_PAIRING_STATUS', payload: 'paired' });
      setMessage({ type: 'success', text: 'You are now paired!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPairCodeLoading(false);
    }
  };

  return {
    history,
    incomingRequests,
    outgoingRequests,
    showUnpairModal,
    setShowUnpairModal,
    deleteSharedChoice,
    setDeleteSharedChoice,
    inputPairingCode,
    setInputPairingCode,
    pairCodeLoading,
    saving,
    handleSendReconnect,
    handleAcceptReconnect,
    handleDeclineReconnect,
    handleCancelRequest,
    handleUnpair,
    handleGenerateCode,
    handleEnterCode,
  };
}
