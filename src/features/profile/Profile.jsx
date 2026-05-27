import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext, useAppDispatch } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import {
  getFridgeItemsCount,
  getFridgeItemsBeforeCutoff,
  deleteFridgeMedia,
  deleteFridgeItemsBeforeCutoff,
} from '../../services/fridge';
import { Notification } from '../../components/Notification';
import Avatar from '../../components/Avatar';
import avatarManifest from '../../assets/avatars_manifest.json';
import {
  User,
  LogOut,
  Heart,
  Calendar,
  Phone,
  Sparkles,
  Database,
  ArrowLeft,
  Info,
  Check,
  ShieldAlert,
  Loader,
  Pencil,
  Volume2,
  VolumeX,
  Grid,
} from 'lucide-react';
import GlassDropdown from '../../components/GlassDropdown';

/**
 * Settings dashboard displaying profile preferences, partner connection details,
 * and refrigerator auto-compaction management.
 *
 * @returns {React.ReactElement} The Profile component.
 */
export default function Profile() {
  const { user, partner, presence } = useAppContext();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const userId = user?.id;
  const partnerId = partner?.id;
  const editTarget = partner || user;

  // Profile Form States (bound to partner if paired, or user if unpaired)
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');

  // Sync edit target details on mount or target change
  useEffect(() => {
    if (editTarget) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(editTarget.name || '');

      setAvatarUrl(editTarget.avatar_url || '');

      setPhone(editTarget.phone_number || '');

      setBirthday(editTarget.birthday || '');
    }
  }, [editTarget]);

  // Compaction States
  const [compactDays, setCompactDays] = useState(
    localStorage.getItem('fridge_auto_compact_days') || '90'
  );
  const [stats, setStats] = useState({ totalItems: null });

  // UI States
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [compacting, setCompacting] = useState(false);
  const [message, setMessage] = useState(null);

  // Whiteboard Board Preferences States
  const [soundMuted, setSoundMuted] = useState(
    () => localStorage.getItem('fridge_sound_muted') === 'true'
  );
  const [gridSnapping, setGridSnapping] = useState(
    () => localStorage.getItem('fridge_grid_snapping') === 'true'
  );
  const [boardBg, setBoardBg] = useState(
    () => localStorage.getItem('fridge_background') || 'metallic'
  );
  const [noteFont, setNoteFont] = useState(
    () => localStorage.getItem('fridge_note_font') || 'handwriting'
  );
  const [defaultNoteColor, setDefaultNoteColor] = useState(
    () => localStorage.getItem('fridge_default_note_color') || 'yellow'
  );

  const handlePreferenceChange = (key, value, setter, successMessage) => {
    localStorage.setItem(key, value.toString());
    setter(value);
    setMessage({ type: 'success', text: successMessage });
  };

  // Fetch fridge statistics
  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await getFridgeItemsCount(userId, partnerId);
      setStats({ totalItems: count });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [userId, partnerId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchStats]);

  useEffect(() => {
    const checkHashAndScroll = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      if (hash === '#fridge-settings' || params.get('tab') === 'fridge') {
        const element = document.getElementById('fridge-settings');
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }
      }
    };
    checkHashAndScroll();
  }, []);

  /**
   * Save user/partner profile changes to Supabase database and update AppContext.
   *
   * @param {React.FormEvent} e - Form submit event
   * @returns {Promise<void>}
   */
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
          phone_number: phone.trim() || null,
          birthday: birthday || null,
        })
        .eq('id', targetId);

      if (updateError) throw updateError;

      if (partner) {
        dispatch({
          type: 'SET_PARTNER',
          payload: {
            ...partner,
            name: name.trim(),
            avatar_url: avatarUrl,
            phone_number: phone.trim() || null,
            birthday: birthday || null,
          },
        });
        setMessage({ type: 'success', text: "Partner's profile updated successfully!" });
      } else {
        dispatch({
          type: 'SET_USER',
          payload: {
            ...user,
            name: name.trim(),
            avatar_url: avatarUrl,
            phone_number: phone.trim() || null,
            birthday: birthday || null,
          },
        });
        setMessage({ type: 'success', text: 'Profile preferences updated successfully!' });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Failed to update profile: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Update the local storage auto-compaction configuration.
   *
   * @param {string} days - Number of days threshold or 'off'
   */
  const handleCompactDaysChange = (days) => {
    setCompactDays(days);
    localStorage.setItem('fridge_auto_compact_days', days);
    setMessage({
      type: 'success',
      text: `Auto-compaction set to ${days === 'off' ? 'Off' : `${days} Days`}`,
    });
  };

  /**
   * Perform manual database and storage compaction immediately.
   *
   * @returns {Promise<void>}
   */
  const handleManualCompaction = async () => {
    if (!userId) return;
    if (compactDays === 'off') {
      setMessage({
        type: 'info',
        text: 'Auto-compaction is currently turned off. Please select a threshold first.',
      });
      return;
    }
    const days = parseInt(compactDays, 10);
    if (isNaN(days)) return;

    setCompacting(true);
    setMessage(null);

    const cutOffDate = new Date();
    cutOffDate.setDate(cutOffDate.getDate() - days);
    const cutOffIso = cutOffDate.toISOString();

    try {
      const userIds = partnerId ? [userId, partnerId] : [userId];

      // Find items to delete to clean up storage
      const itemsToDelete = await getFridgeItemsBeforeCutoff(userIds, cutOffIso);

      let deletedFilesCount = 0;
      if (itemsToDelete && itemsToDelete.length > 0) {
        // Delete associated files from storage
        const filePathsToDelete = [];
        for (const item of itemsToDelete) {
          let fileUrl = null;
          if (item.type === 'photo') {
            fileUrl = item.content;
          } else if (item.type === 'voice') {
            try {
              const parsed = JSON.parse(item.content);
              fileUrl = parsed.url;
            } catch {
              // Ignore invalid JSON parsing format
            }
          }

          if (fileUrl) {
            const parts = fileUrl.split('/fridge-media/');
            const filePath = parts.length > 1 ? decodeURIComponent(parts[1]) : null;
            if (filePath) {
              filePathsToDelete.push(filePath);
            }
          }
        }

        if (filePathsToDelete.length > 0) {
          try {
            await deleteFridgeMedia(filePathsToDelete);
            deletedFilesCount = filePathsToDelete.length;
          } catch (storageError) {
            console.error('Storage deletion warning:', storageError);
          }
        }

        // Delete from database
        await deleteFridgeItemsBeforeCutoff(userIds, cutOffIso);

        setMessage({
          type: 'success',
          text: `Cleaned up ${itemsToDelete.length} items and ${deletedFilesCount} media assets.`,
        });
      } else {
        setMessage({
          type: 'info',
          text: 'Fridge is already optimized! No old items found.',
        });
      }

      await fetchStats();
    } catch (err) {
      console.error('Manual compaction error:', err);
      setMessage({ type: 'error', text: 'Failed to run compaction: ' + err.message });
    } finally {
      setCompacting(false);
    }
  };

  /**
   * Log out of the application and reset AppContext states.
   *
   * @returns {Promise<void>}
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      dispatch({ type: 'RESET_STATE' });
      navigate('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
      setMessage({ type: 'error', text: 'Logout failed. Please try again.' });
    }
  };

  const compactionOptions = [
    { value: 'off', label: 'Off (Keep all history)' },
    { value: '30', label: '30 Days' },
    { value: '60', label: '60 Days' },
    { value: '90', label: '90 Days (Recommended)' },
    { value: '180', label: '180 Days' },
  ];

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
          <span className="text-xs font-bold uppercase tracking-widest">Premium Account</span>
        </div>
      </div>

      {/* Profile Card Header */}
      <div className="text-center">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-text-main">
          Settings & Preferences
        </h1>
        <p className="text-text-muted text-sm mt-2">
          Manage your personal preferences, partner status, and fridge settings.
        </p>
      </div>

      {/* SECTION 1: Shared Profiles */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-extrabold tracking-tight text-text-main flex items-center gap-2 border-b border-surface-border dark:border-slate-800 pb-2">
          <User className="w-5 h-5 text-primary" />
          Shared Profiles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Your Profile (Always Read-only if paired, Editable if unpaired) */}
          {partner ? (
            <div className="bg-surface/40 dark:bg-slate-900/20 backdrop-blur-xl border border-surface-border dark:border-slate-800/60 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-main text-base">Your Profile</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-text-muted">
                  <Info className="w-3.5 h-3.5" />
                  Editable by your partner
                </span>
              </div>

              <div className="flex flex-col items-center justify-center space-y-3 py-2">
                <Avatar src={user?.avatar_url} fallback="👤" isOnline={true} size="xl" />
                <span className="text-xs text-text-muted font-semibold">Your Display Avatar</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-4 h-4 text-text-muted/60" />
                    <input
                      type="text"
                      disabled
                      value={user?.name || ''}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-950/20 border border-surface-border dark:border-slate-800 rounded-2xl text-text-muted font-semibold cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Info className="absolute left-4 top-3.5 w-4 h-4 text-text-muted/60" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || 'N/A'}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-950/20 border border-surface-border dark:border-slate-800 rounded-2xl text-text-muted font-semibold cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-4 h-4 text-text-muted/60" />
                    <input
                      type="text"
                      disabled
                      value={user?.phone_number || 'N/A'}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-950/20 border border-surface-border dark:border-slate-800 rounded-2xl text-text-muted font-semibold cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Birthday
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-text-muted/60" />
                    <input
                      type="text"
                      disabled
                      value={user?.birthday || 'N/A'}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-950/20 border border-surface-border dark:border-slate-800 rounded-2xl text-text-muted font-semibold cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSaveProfile}
              className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-main text-base">Your Profile</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  Editable by you
                </span>
              </div>

              <div className="flex flex-col items-center justify-center space-y-3 py-2">
                <div className="relative cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
                  <Avatar src={avatarUrl} fallback="👤" isOnline={true} size="xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center shadow-lg border-2 border-background z-20 transition-transform active:scale-90">
                    <Pencil className="w-4 h-4 text-white" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Change Avatar Profile
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
                      className="w-full pl-12 pr-4 py-3 bg-white/5 dark:bg-slate-950/50 border border-surface-border dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-main transition-all font-semibold"
                      placeholder="e.g. Sunny"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Info className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || 'N/A'}
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 dark:bg-slate-950/50 border border-surface-border dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-main transition-all font-semibold"
                      placeholder="e.g. +234 803 123 4567"
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
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 dark:bg-slate-950/50 border border-surface-border dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-main transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save Profile Preferences
              </button>
            </form>
          )}

          {/* Card 2: Partner's Profile (when paired) or CTA card (when unpaired) */}
          {partner ? (
            <form
              onSubmit={handleSaveProfile}
              className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-main text-base">Partner&apos;s Profile</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  Editable by you
                </span>
              </div>

              <div className="flex flex-col items-center justify-center space-y-3 py-2">
                <div className="relative cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
                  <Avatar src={avatarUrl} fallback="👤" isOnline={true} size="xl" />
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
                    Partner Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 dark:bg-slate-950/50 border border-surface-border dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-main transition-all font-semibold"
                      placeholder="e.g. Partner Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Partner Email Address
                  </label>
                  <div className="relative">
                    <Info className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      disabled
                      value={partner?.email || 'N/A'}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-950/20 border border-surface-border dark:border-slate-800 rounded-2xl text-text-muted font-semibold cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Partner Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 dark:bg-slate-950/50 border border-surface-border dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-main transition-all font-semibold"
                      placeholder="e.g. +234 803 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Partner Birthday
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 dark:bg-slate-950/50 border border-surface-border dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-main transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save Partner&apos;s Profile
              </button>
            </form>
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
        </div>
      </div>

      {/* Heart Connection Widget (Only visible when paired) */}
      {partner && (
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
      )}

      {/* SECTION 2: Fridge Settings */}
      <div id="fridge-settings" className="space-y-4">
        <h2 className="font-heading text-xl font-extrabold tracking-tight text-text-main flex items-center gap-2 border-b border-surface-border dark:border-slate-800 pb-2">
          <Database className="w-5 h-5 text-primary" />
          Fridge Settings
        </h2>

        <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
          <div className="space-y-2">
            <h3 className="font-heading text-base font-bold text-text-main">
              Fridge Auto-Compaction
            </h3>
            <p className="text-text-muted text-xs leading-relaxed">
              Optimize your refrigerator fridge performance and space. Auto-compaction runs on load,
              silently removing pinned items and associated storage media files older than your
              chosen threshold.
            </p>
          </div>

          {/* Select Threshold */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Auto-Compaction Threshold
              </label>
              <GlassDropdown
                value={compactDays}
                options={compactionOptions}
                onChange={handleCompactDaysChange}
                size="md"
              />
            </div>

            {/* Compaction Statistics Grid */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-white/5 dark:bg-slate-950/20 border border-surface-border/50 dark:border-slate-800/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                <Database className="w-5 h-5 text-secondary mb-1.5" />
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Total Items
                </span>
                <span className="text-xl font-extrabold text-text-main mt-1">
                  {stats.totalItems !== null ? stats.totalItems : '...'}
                </span>
              </div>
              <div className="bg-white/5 dark:bg-slate-950/20 border border-surface-border/50 dark:border-slate-800/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                <Info className="w-5 h-5 text-primary mb-1.5" />
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Threshold
                </span>
                <span className="text-sm font-bold text-text-main mt-1.5 capitalize">
                  {compactDays === 'off' ? 'Disabled' : `${compactDays} Days`}
                </span>
              </div>
            </div>

            {/* Manual Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleManualCompaction}
                disabled={compacting || compactDays === 'off'}
                className="w-full py-3.5 bg-slate-900 dark:bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {compacting ? (
                  <Loader className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <Database className="w-4 h-4 text-primary" />
                )}
                Run Compaction Now
              </button>
              {compactDays === 'off' && (
                <p className="text-[10px] text-yellow-500 font-medium text-center mt-2 flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Enable threshold to run manual or auto
                  compaction
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2b: Whiteboard & Magnet Preferences */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-extrabold tracking-tight text-text-main flex items-center gap-2 border-b border-surface-border dark:border-slate-800 pb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Board Preferences
        </h2>

        <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Toggles */}
            <div className="space-y-4">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-surface-border/30">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                    {soundMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-green-400" />
                    )}
                    Board Sound Effects
                  </span>
                  <span className="text-[10px] text-text-muted">Play rustling and pin sounds</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handlePreferenceChange(
                      'fridge_sound_muted',
                      !soundMuted,
                      setSoundMuted,
                      `Sound effects ${!soundMuted ? 'muted' : 'enabled'}`
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    !soundMuted ? 'bg-primary' : 'bg-slate-700/50'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      !soundMuted ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Grid Snapping Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-surface-border/30">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-primary" />
                    Grid Snapping
                  </span>
                  <span className="text-[10px] text-text-muted">
                    Align magnets to a grid automatically
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handlePreferenceChange(
                      'fridge_grid_snapping',
                      !gridSnapping,
                      setGridSnapping,
                      `Grid snapping ${!gridSnapping ? 'enabled' : 'disabled'}`
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    gridSnapping ? 'bg-primary' : 'bg-slate-700/50'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      gridSnapping ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>


              {/* Note Font Preference */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Default Note Font
                </label>
                <GlassDropdown
                  value={noteFont}
                  options={[
                    { value: 'handwriting', label: 'Playful (Caveat)' },
                    { value: 'kalam', label: 'Classic Marker (Kalam)' },
                    { value: 'patrick', label: 'Neat Handwriting (Patrick Hand)' },
                    { value: 'sans', label: 'Clean Sans-Serif (Inter)' },
                    { value: 'serif', label: 'Elegant Serif' },
                    { value: 'mono', label: 'Technical Monospace' },
                  ]}
                  onChange={(val) =>
                    handlePreferenceChange(
                      'fridge_note_font',
                      val,
                      setNoteFont,
                      `Note font updated`
                    )
                  }
                  size="md"
                />
              </div>
            </div>

            {/* Column 2: Visual Selection */}
            <div className="space-y-4">
              {/* Whiteboard Background selection */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Whiteboard Background
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'metallic', label: 'Metallic', desc: 'Original' },
                    { id: 'dotted', label: 'Dotted', desc: 'Slate grid' },
                    { id: 'image', label: 'Doodle Board', desc: 'Sketch bg' },
                  ].map((bgOpt) => (
                    <button
                      key={bgOpt.id}
                      type="button"
                      onClick={() =>
                        handlePreferenceChange(
                          'fridge_background',
                          bgOpt.id,
                          setBoardBg,
                          `Whiteboard background set to ${bgOpt.label}`
                        )
                      }
                      className={`p-3 rounded-2xl border text-center flex flex-col justify-center gap-1 transition-all ${
                        boardBg === bgOpt.id
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20 scale-102'
                          : 'border-surface-border/40 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold text-text-main">{bgOpt.label}</span>
                      <span className="text-[9px] text-text-muted">{bgOpt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Note Color picker (8 colors) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Default Sticky Note Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'yellow', name: 'Yellow', bg: 'bg-[#fef08a] text-[#854d0e]' },
                    { id: 'pink', name: 'Pink', bg: 'bg-[#fbcfe8] text-[#9d174d]' },
                    { id: 'blue', name: 'Blue', bg: 'bg-[#bfdbfe] text-[#1e40af]' },
                    { id: 'green', name: 'Green', bg: 'bg-[#bbf7d0] text-[#166534]' },
                    { id: 'purple', name: 'Purple', bg: 'bg-[#e9d5ff] text-[#6b21a8]' },
                    { id: 'orange', name: 'Orange', bg: 'bg-[#ffedd5] text-[#9a3412]' },
                    { id: 'teal', name: 'Teal', bg: 'bg-[#ccfbf1] text-[#115e59]' },
                    { id: 'lavender', name: 'Lavender', bg: 'bg-[#e0e7ff] text-[#3730a3]' },
                  ].map((colorOpt) => (
                    <button
                      key={colorOpt.id}
                      type="button"
                      onClick={() =>
                        handlePreferenceChange(
                          'fridge_default_note_color',
                          colorOpt.id,
                          setDefaultNoteColor,
                          `Default note color set to ${colorOpt.name}`
                        )
                      }
                      className={`p-2.5 rounded-xl border text-center flex items-center justify-center text-[10px] font-bold transition-all ${colorOpt.bg} ${
                        defaultNoteColor === colorOpt.id
                          ? 'border-primary scale-105 ring-2 ring-primary/30'
                          : 'border-transparent hover:scale-102'
                      }`}
                    >
                      {colorOpt.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Danger Zone */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-extrabold tracking-tight text-text-main flex items-center gap-2 border-b border-surface-border dark:border-slate-800 pb-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          System Actions
        </h2>

        <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h3 className="font-heading text-sm font-bold text-text-main">Danger Zone</h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Sign out of your active session on Lover-HQ.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 whitespace-nowrap self-stretch md:self-auto justify-center"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </div>

      {/* Avatar Picker Modal Overlay */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                Select Avatar Preset
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
      <Notification message={message?.text} onClose={() => setMessage(null)} />
    </div>
  );
}
