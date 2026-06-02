import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext, useAppDispatch } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../components/Notification';
import Avatar from '../../components/Avatar';
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
  Loader,
  Pencil,
  Clock,
  Smile,
  Search,
  Coffee,
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
                      <Loader className="w-4 h-4 animate-spin" />
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
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 border border-primary/20 p-8 rounded-3xl shadow-xl flex flex-col justify-between items-center text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary relative z-10">
            <Heart className="w-8 h-8 fill-current text-red-500" />
          </div>

          <div className="space-y-2 relative z-10 max-w-sm">
            <h3 className="font-heading text-xl font-extrabold text-text-main">
              Find Your Partner
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Lover-HQ is best enjoyed by two. Share sticky notes, photos, voice notes, and
              real-time fridge settings by linking up with your partner.
            </p>
          </div>

          <button
            onClick={() => navigate('/onboarding')}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2 relative z-10 hover-heart-scale"
          >
            <Sparkles className="w-4 h-4" />
            Complete Pairing Now
          </button>
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
