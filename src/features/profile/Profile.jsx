import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext, useAppDispatch } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../components/Notification';
import Avatar from '../../components/Avatar';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import avatarManifest from '../../assets/avatars_manifest.json';
import {
  User,
  Heart,
  Calendar,
  Phone,
  Sparkles,
  ArrowLeft,
  Info,
  Check,
  Pencil,
  Clock,
  Smile,
  Search,
  Coffee,
  X,
  Copy,
} from 'lucide-react';

export default function Profile() {
  const { user, partner, presence } = useAppContext();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const editTarget = partner;

  // Partner Profile Form States (only editable by the user for their partner)
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (editTarget) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(editTarget.name || '');

      setAvatarUrl(editTarget.avatar_url || '');
    }
  }, [editTarget]);

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // --- Reconnection & Unpairing State ---
  const [history, setHistory] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [showUnpairModal, setShowUnpairModal] = useState(false);
  const [deleteSharedChoice, setDeleteSharedChoice] = useState(false);
  const [inputPairingCode, setInputPairingCode] = useState('');
  const [pairCodeLoading, setPairCodeLoading] = useState(false);

  const fetchHistoryAndRequests = async () => {
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
        const { data: profiles, error: profError } = await supabase
          .rpc('get_public_profiles', { user_ids: pastPartnerIds });

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
        const { data: senders } = await supabase
          .rpc('get_public_profiles', { user_ids: senderIds });

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
        const { data: receivers } = await supabase
          .rpc('get_public_profiles', { user_ids: receiverIds });

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
  };

  useEffect(() => {
    if (!partner) {
      fetchHistoryAndRequests();
    }
  }, [user?.id, partner]);

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

  const handleCancelRequest = async (requestId) => {
    try {
      const { error } = await supabase.from('reconnect_requests').delete().eq('id', requestId);

      if (error) throw error;
      fetchHistoryAndRequests();
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleEnterCode = async (e) => {
    e?.preventDefault();
    if (inputPairingCode.length !== 6) return;

    setPairCodeLoading(true);
    try {
      const { data: partners, error: findError } = await supabase.rpc('get_user_by_pairing_code', {
        input_code: inputPairingCode,
      });

      const partner = partners?.[0];

      if (findError || !partner) {
        throw new Error('Invalid or expired pairing code. Please check and try again.');
      }

      if (partner.id === user.id) {
        throw new Error("You can't pair with yourself!");
      }

      const { error: linkError } = await supabase
        .from('users')
        .update({ partner_id: partner.id, pairing_code: null, pairing_code_expires_at: null })
        .eq('id', user.id);

      if (linkError) throw linkError;

      dispatch({ type: 'SET_PARTNER', payload: partner });
      dispatch({ type: 'SET_PAIRING_STATUS', payload: 'paired' });
      setMessage({ type: 'success', text: 'You are now paired!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPairCodeLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const targetId = editTarget?.id;
    if (!targetId) return;
    setSaving(true);
    setMessage(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          avatar_url: avatarUrl,
        })
        .eq('id', targetId);

      if (updateError) throw updateError;

      dispatch({
        type: 'SET_PARTNER',
        payload: {
          ...partner,
          name: name.trim(),
          avatar_url: avatarUrl,
        },
      });
      setMessage({ type: 'success', text: "Partner's profile updated successfully!" });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Failed to update profile: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const calculateDaysUntil = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setFullYear(today.getFullYear());
    if (targetDate < today) {
      targetDate.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = Math.abs(targetDate - today);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const birthdayCountdown = partner?.birthday ? calculateDaysUntil(partner.birthday) : null;

  return (
    <div className="max-w-4xl mx-auto pt-2 pb-24 px-4 animate-slide-up space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/home"
          className="text-text-muted hover:text-text-main flex items-center gap-1.5 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Partner Profile</span>
        </div>
      </div>

      <div className="text-center">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-text-main">
          {partner ? partner.name : 'Find Your Partner'}
        </h1>
        <p className="text-text-muted text-sm mt-2">
          {partner
            ? 'Your beautiful connection, at a glance.'
            : 'Link up with your partner to share the space.'}
        </p>
      </div>

      {partner ? (
        <>
          {/* Heart Connection Widget */}
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-5 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-6 relative z-10">
              <Avatar src={user?.avatar_url} fallback="👤" isOnline={true} size="md" />
              <div
                className={`text-secondary flex items-center justify-center ${presence?.partner === 'online' ? 'animate-pulse-slow' : ''}`}
              >
                <Heart className="fill-current w-6 h-6 text-red-500" />
              </div>
              <Avatar src={partner.avatar_url} fallback="👤" isOnline={true} size="md" />
            </div>
            <p className="text-xs font-semibold text-text-muted mt-3">
              You are beautifully linked with{' '}
              <span className="text-primary font-bold">{partner.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Editable Details */}
            <div className="md:col-span-5 space-y-6">
              <form
                onSubmit={handleSaveProfile}
                className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-text-main text-base">Their Details</h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
                    <Pencil className="w-3.5 h-3.5" />
                    Editable by you
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center space-y-3 py-2">
                  <div
                    className="relative cursor-pointer"
                    onClick={() => setShowAvatarPicker(true)}
                  >
                    <Avatar
                      src={avatarUrl}
                      fallback="👤"
                      isOnline={presence?.partner === 'online'}
                      size="xl"
                    />
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center shadow-lg border-2 border-background z-20 transition-transform active:scale-90">
                      <Pencil className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(true)}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Change Partner Avatar
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      Display Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 dark:bg-slate-950/50 border border-surface-border dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main transition-all font-semibold"
                        placeholder="e.g. Partner Name"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-xl font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <LoadingSpinner size="sm" className="text-white" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              </form>

              {/* Status & Connection Widget */}
              <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <h3 className="font-bold text-text-main text-base">Connection Status</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-surface-border/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-secondary" />
                      <span className="text-sm font-semibold text-text-main">Status</span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-md ${presence?.partner === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}
                    >
                      {presence?.partner === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  {presence?.partner === 'online' && presence?.partnerRoom && (
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-surface-border/50">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-text-main">Location</span>
                      </div>
                      <span className="text-xs font-bold text-primary">{presence.partnerRoom}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-surface-border/50">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-text-main">Current Mood</span>
                    </div>
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      {/* We will add actual mood selection later in TopBar or a modal */}
                      <Smile className="w-3.5 h-3.5" /> Happy
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Read-only Data */}
            <div className="md:col-span-7 space-y-6">
              <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-text-main text-base">Personal Info</h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-text-muted">
                    <Info className="w-3.5 h-3.5" />
                    Read-only
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Info className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
                      <input
                        type="email"
                        disabled
                        value={partner.email || 'N/A'}
                        className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-950/20 border border-surface-border dark:border-slate-800 rounded-2xl text-text-muted font-semibold cursor-not-allowed opacity-80"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        disabled
                        value={partner.phone_number || 'Not provided'}
                        className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-950/20 border border-surface-border dark:border-slate-800 rounded-2xl text-text-muted font-semibold cursor-not-allowed opacity-80"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      Birthday
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        disabled
                        value={partner.birthday || 'Not provided'}
                        className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-950/20 border border-surface-border dark:border-slate-800 rounded-2xl text-text-muted font-semibold cursor-not-allowed opacity-80"
                      />
                    </div>
                    {birthdayCountdown !== null && (
                      <p className="text-xs text-primary mt-2 font-semibold flex items-center gap-1.5 ml-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {birthdayCountdown === 0
                          ? "It's their birthday today!"
                          : `${birthdayCountdown} days until their birthday`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div>
                  <h3 className="font-bold text-text-main text-base">Quick Actions</h3>
                  <p className="text-xs text-text-muted mt-1">
                    Send a quick nudge or answer a daily reveal.
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => navigate('/reveal')}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    Go to Reveal
                  </button>
                  <button
                    onClick={() => navigate('/fridge')}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-text-main border border-white/10 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    Leave a Note
                  </button>
                </div>
              </div>

              {/* Danger Zone: Unpair Action */}
              <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div>
                  <h3 className="font-bold text-red-500 text-base">Danger Zone</h3>
                  <p className="text-xs text-text-muted mt-1">
                    Disconnect from your partner. You can reconnect later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUnpairModal(true)}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center whitespace-nowrap shadow-md hover:brightness-110 active:scale-[0.98]"
                >
                  Unpair Partner
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-slide-up w-full">
          {/* Left Column: Code Exchange */}
          <div className="md:col-span-6 space-y-6">
            {/* Generate Code Box */}
            <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
              <h3 className="font-bold text-text-main text-base">Invite Your Partner</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Generate a temporary connection code to send to your partner. It expires in 24 hours.
              </p>

              {user?.pairing_code ? (
                <div className="text-center w-full flex flex-col items-center pt-2 space-y-3">
                  <div className="text-3xl font-mono font-bold tracking-[0.3em] text-primary bg-white/5 border border-surface-border/50 px-6 py-3 rounded-2xl shadow-inner w-full select-all">
                    {user.pairing_code}
                  </div>
                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(user.pairing_code);
                        setMessage({ type: 'success', text: 'Pairing code copied!' });
                      }}
                      className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-text-main text-xs font-bold rounded-xl border border-white/5 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Copy Code</span>
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const shareUrl = window.location.origin + '/auth?pair=' + user.pairing_code;
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: 'Join me on Lover-HQ',
                              text: 'Use my code to pair our accounts!',
                              url: shareUrl,
                            });
                          } catch (err) {
                            if (err.name !== 'AbortError') {
                              navigator.clipboard.writeText(shareUrl);
                              setMessage({ type: 'success', text: 'Share link copied!' });
                            }
                          }
                        } else {
                          navigator.clipboard.writeText(shareUrl);
                          setMessage({ type: 'success', text: 'Share link copied!' });
                        }
                      }}
                      className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Share Link
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={pairCodeLoading}
                  className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {pairCodeLoading ? <LoadingSpinner size="sm" className="text-white" /> : <Sparkles className="w-4 h-4" />}
                  Generate Pairing Code
                </button>
              )}
            </div>

            {/* Enter Code Box */}
            <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
              <h3 className="font-bold text-text-main text-base">Enter Their Code</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Have an invitation code from your partner? Enter it here to complete the pairing.
              </p>

              <form onSubmit={handleEnterCode} className="space-y-4">
                <input
                  type="text"
                  maxLength="6"
                  required
                  value={inputPairingCode}
                  onChange={(e) => setInputPairingCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-white/5 border border-surface-border dark:border-slate-800 rounded-xl text-center text-xl font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary text-text-main transition-all"
                  placeholder="000000"
                />
                <button
                  type="submit"
                  disabled={pairCodeLoading || inputPairingCode.length !== 6}
                  className="w-full py-3 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center"
                >
                  {pairCodeLoading ? <LoadingSpinner size="sm" className="text-white" /> : 'Connect'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: History & Requests */}
          <div className="md:col-span-6 space-y-6">
            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-6 rounded-3xl shadow-xl space-y-4">
                <h3 className="font-bold text-text-main text-base flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
                  Incoming Reconnect Invites
                </h3>
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between bg-surface/80 border border-surface-border/50 p-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Avatar src={req.sender?.avatar_url} size="sm" fallback="👤" />
                        <span className="text-sm font-semibold text-text-main">{req.sender?.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptReconnect(req)}
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
                          title="Accept"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeclineReconnect(req.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors flex items-center justify-center"
                          title="Decline"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
              <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <h3 className="font-bold text-text-main text-base">Sent Reconnect Invites</h3>
                <div className="space-y-3">
                  {outgoingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between bg-white/5 border border-surface-border/50 p-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Avatar src={req.receiver?.avatar_url} size="sm" fallback="👤" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-text-main">{req.receiver?.name}</span>
                          <span className="text-[10px] text-primary animate-pulse">Waiting for partner...</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        className="text-xs text-text-muted hover:text-red-500 font-bold px-3 py-1.5 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Connections History */}
            <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <h3 className="font-bold text-text-main text-base">Previous Connections</h3>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((prev) => {
                    const isRequested = outgoingRequests.some((req) => req.receiver_id === prev.id);
                    return (
                      <div key={prev.id} className="flex items-center justify-between bg-white/5 border border-surface-border/50 p-3 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Avatar src={prev.avatar_url} size="sm" fallback="👤" />
                          <span className="text-sm font-semibold text-text-main">{prev.name}</span>
                        </div>
                        <button
                          disabled={isRequested}
                          onClick={() => handleSendReconnect(prev.id)}
                          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                            isRequested
                              ? 'bg-white/5 text-text-muted cursor-not-allowed border border-white/5'
                              : 'bg-primary hover:bg-primary-hover text-white shadow-md'
                          }`}
                        >
                          {isRequested ? 'Requested' : 'Reconnect'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-text-muted italic leading-relaxed py-2">
                  No previous pairings recorded. Connect with a code above to start your history!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unpair Confirmation Modal */}
      {showUnpairModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                <Heart className="w-5 h-5 text-red-500" />
                Unpair Relationship?
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                This will disconnect your account from <span className="text-primary font-semibold">{partner?.name}</span>. You can reconnect anytime with a code or through connection history.
              </p>
            </div>

            {/* Choice */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={deleteSharedChoice}
                  onChange={(e) => setDeleteSharedChoice(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-red-500 bg-slate-800 border-slate-700 focus:ring-red-500 focus:ring-2 focus:ring-offset-slate-900"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                    Delete shared data
                  </span>
                  <span className="text-xs text-text-muted leading-relaxed">
                    Permanently delete all Fridge notes/media and Daily Reveal answers created together.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleUnpair}
                disabled={saving}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {saving && <LoadingSpinner size="sm" className="text-white" />}
                Unpair Now
              </button>
              <button
                type="button"
                onClick={() => setShowUnpairModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Picker Modal Overlay */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                Select Avatar
              </h3>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="text-text-muted hover:text-text-main text-xs font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar">
              <div className="grid grid-cols-4 gap-3 p-1">
                {avatarManifest.map((opt) => (
                  <button
                    key={opt.url}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(opt.url);
                      setShowAvatarPicker(false);
                    }}
                    className={`aspect-square rounded-full transition-all flex items-center justify-center border-2 overflow-hidden bg-brand-surface ${
                      avatarUrl === opt.url
                        ? 'border-primary bg-primary/10 scale-110 shadow-md z-10'
                        : 'border-slate-800 hover:border-text-muted hover:scale-105'
                    }`}
                  >
                    <img
                      src={opt.url}
                      alt={opt.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <Notification message={message?.text} onClose={() => setMessage(null)} type={message?.type} />
    </div>
  );
}
