import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useAppDispatch } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../components/Notification';
import Avatar from '../../components/Avatar';
import avatarManifest from '../../assets/avatars_manifest.json';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  User,
  LogOut,
  Bell,
  Paintbrush,
  ShieldAlert,
  Terminal,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Volume2,
  VolumeX,
  Grid,
  Check,
  Pencil,
  Sparkles,
} from 'lucide-react';
import {
  getFridgeItemsCount,
  getFridgeItemsBeforeCutoff,
  deleteFridgeMedia,
  deleteFridgeItemsBeforeCutoff,
} from '../../services/fridge';

export default function Settings() {
  const { user, partner } = useAppContext();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const userId = user?.id;
  const partnerId = partner?.id;

  // Active Category State
  const [activeCategory, setActiveCategory] = useState('account');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);

  // --- Account Settings State ---
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name || '');

      setAvatarUrl(user.avatar_url || '');

      setPhone(user.phone_number || '');

      setBirthday(user.birthday || '');
    }
  }, [user]);

  // Sync active category with URL param or hash on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['account', 'preferences', 'fridge', 'reveal', 'data'].includes(tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCategory(tab);

      setIsMobileDetailView(true);
    } else if (window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['account', 'preferences', 'fridge', 'reveal', 'data'].includes(hash)) {
        setActiveCategory(hash);

        setIsMobileDetailView(true);
      }
    }
  }, []);

  // --- Fridge Settings State ---
  const [compactDays, setCompactDays] = useState(
    localStorage.getItem('fridge_auto_compact_days') || '90'
  );
  const [stats, setStats] = useState({ totalItems: null });
  const [compacting, setCompacting] = useState(false);

  // --- Board Preferences State ---
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

  // --- Reveal Q&A Settings State ---
  const [customQuestionFreq, setCustomQuestionFreq] = useState(
    () => localStorage.getItem('reveal_custom_question_freq') || '25'
  );
  const [revealReminders, setRevealReminders] = useState(
    () => localStorage.getItem('reveal_reminders_enabled') !== 'false'
  );

  const [message, setMessage] = useState(null);

  const compactionOptions = [
    { value: 'off', label: 'Off (Keep all history)' },
    { value: '30', label: '30 Days' },
    { value: '60', label: '60 Days' },
    { value: '90', label: '90 Days (Recommended)' },
    { value: '180', label: '180 Days' },
  ];

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  const handlePreferenceChange = (key, value, setter, successMessage) => {
    localStorage.setItem(key, value.toString());
    setter(value);
    if (successMessage) setMessage({ type: 'success', text: successMessage });
  };

  const handleCompactDaysChange = (val) => {
    handlePreferenceChange(
      'fridge_auto_compact_days',
      val,
      setCompactDays,
      'Auto-compaction threshold updated'
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!userId) return;
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
        .eq('id', userId);

      if (updateError) throw updateError;

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
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Failed to update profile: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

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

  const categories = useMemo(
    () => [
      {
        id: 'account',
        label: 'Account',
        desc: 'Profile credentials, privacy, sign out',
        icon: User,
      },
      {
        id: 'preferences',
        label: 'App Preferences',
        desc: 'Theme, notifications, sound effects',
        icon: Paintbrush,
      },
      {
        id: 'fridge',
        label: 'Fridge Board',
        desc: 'Auto-compaction, board visual prefs',
        icon: Database,
      },
      {
        id: 'reveal',
        label: 'Reveal Q&A',
        desc: 'Custom question frequency, daily reminders',
        icon: Sparkles,
      },
      {
        id: 'data',
        label: 'Data Management',
        desc: 'Clear cache, export your memories',
        icon: Terminal,
      },
    ],
    []
  );

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (cat) =>
        cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const selectCategory = (id) => {
    setActiveCategory(id);
    setIsMobileDetailView(true);
  };

  const renderModule = () => {
    switch (activeCategory) {
      case 'account':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-text-main">Account Details</h3>
              <p className="text-xs text-text-muted mt-1">
                Configure user credentials, handle authentication endpoints.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-3 py-2">
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setShowAvatarPicker(true)}
                >
                  <Avatar src={avatarUrl} fallback="👤" isOnline={true} size="xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center shadow-lg border-2 border-background z-20 transition-transform active:scale-90 group-hover:scale-105">
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
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-surface/50 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-text-main"
                    placeholder="e.g. Sunny"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'N/A'}
                    className="w-full px-4 py-3 bg-surface-border/20 border border-surface-border rounded-xl text-sm text-text-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-surface/50 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-text-main"
                    placeholder="e.g. +1 555 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Birthday
                  </label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-4 py-3 bg-surface/50 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-text-main"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end border-b border-surface-border pb-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2"
                >
                  {saving ? (
                    <LoadingSpinner size="sm" className="text-white w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Profile
                </button>
              </div>
            </form>

            {/* Privacy Placeholder */}
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-text-muted" />
                Privacy Settings
              </h4>
              <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-main">Hide Profile Status</span>
                  <span className="text-xs text-text-muted mt-0.5">
                    Don&apos;t show when I am online.
                  </span>
                </div>
                <button
                  type="button"
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-surface-border"
                >
                  <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out translate-x-0" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-text-main">App Preferences</h3>
              <p className="text-xs text-text-muted mt-1">Configure your app experience.</p>
            </div>

            <div className="space-y-4">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
                    {soundMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-green-400" />
                    )}
                    Sound Effects
                  </span>
                  <span className="text-xs text-text-muted mt-0.5">
                    Play sounds for actions like dragging notes or drawing.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handlePreferenceChange('fridge_sound_muted', !soundMuted, setSoundMuted, null)
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!soundMuted ? 'bg-primary' : 'bg-surface-border'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${!soundMuted ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* Theme Placeholder */}
              <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border">
                <div className="flex flex-col mb-3">
                  <span className="text-sm font-bold text-text-main">Theme Mode</span>
                  <span className="text-xs text-text-muted">
                    Choose your preferred visual style.
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button className="py-2 px-3 bg-surface-border/50 text-text-muted border border-transparent rounded-xl text-xs font-bold transition-all hover:bg-surface-border">
                    Light
                  </button>
                  <button className="py-2 px-3 bg-primary/20 text-primary border border-primary/50 rounded-xl text-xs font-bold transition-all shadow-sm">
                    Dark
                  </button>
                  <button className="py-2 px-3 bg-surface-border/50 text-text-muted border border-transparent rounded-xl text-xs font-bold transition-all hover:bg-surface-border">
                    System
                  </button>
                </div>
              </div>

              {/* Notifications Placeholder */}
              <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-text-muted" />
                    Push Notifications
                  </span>
                  <span className="text-xs text-text-muted mt-0.5">
                    Alerts for games and daily reveals.
                  </span>
                </div>
                <button
                  type="button"
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-primary"
                >
                  <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out translate-x-5" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'fridge':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-text-main">Fridge Board Settings</h3>
              <p className="text-xs text-text-muted mt-1">
                Configure auto-compaction and visual board preferences.
              </p>
            </div>

            {/* Auto-Compaction */}
            <div className="p-4 bg-surface/50 border border-surface-border rounded-2xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Auto-Compaction
                </h4>
                <p className="text-xs text-text-muted mt-1">
                  Automatically clear old unpinned items to save space.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Threshold
                  </label>
                  <GlassDropdown
                    value={compactDays}
                    options={compactionOptions}
                    onChange={handleCompactDaysChange}
                    size="md"
                  />
                </div>
                <div className="bg-surface-border/20 border border-surface-border p-3 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted uppercase">Total Items</span>
                  <span className="text-lg font-extrabold text-primary">
                    {stats.totalItems !== null ? stats.totalItems : '...'}
                  </span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleManualCompaction}
                  disabled={compacting || compactDays === 'off'}
                  className="w-full py-3.5 bg-slate-900 dark:bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {compacting ? (
                    <LoadingSpinner size="sm" className="text-primary w-4 h-4" />
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

            {/* Board Visual Prefs */}
            <div className="p-4 bg-surface/50 border border-surface-border rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-secondary" />
                Board Preferences
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Grid Snapping Toggle */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-surface-border/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                      <Grid className="w-4 h-4 text-primary" />
                      Grid Snapping
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handlePreferenceChange(
                        'fridge_grid_snapping',
                        !gridSnapping,
                        setGridSnapping,
                        null
                      )
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${gridSnapping ? 'bg-primary' : 'bg-surface-border'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${gridSnapping ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
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
                        handlePreferenceChange('fridge_background', bgOpt.id, setBoardBg, null)
                      }
                      className={`p-2 rounded-xl border text-center flex flex-col justify-center gap-0.5 transition-all ${boardBg === bgOpt.id ? 'border-primary bg-primary/10 ring-1 ring-primary/20 scale-102' : 'border-surface-border/40 bg-white/5 hover:bg-white/10'}`}
                    >
                      <span className="text-[11px] font-bold text-text-main">{bgOpt.label}</span>
                      <span className="text-[9px] text-text-muted">{bgOpt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
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
                          null
                        )
                      }
                      className={`p-2 rounded-xl border text-center flex items-center justify-center text-[10px] font-bold transition-all ${colorOpt.bg} ${defaultNoteColor === colorOpt.id ? 'border-primary scale-105 ring-2 ring-primary/30' : 'border-transparent hover:scale-102'}`}
                    >
                      {colorOpt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
                  Default Note Font
                </label>
                <GlassDropdown
                  value={noteFont}
                  options={[
                    { value: 'handwriting', label: 'Playful (Caveat)' },
                    { value: 'kalam', label: 'Classic Marker (Kalam)' },
                    { value: 'patrick', label: 'Neat Handwriting (Patrick)' },
                    { value: 'sans', label: 'Clean Sans-Serif (Inter)' },
                    { value: 'serif', label: 'Elegant Serif' },
                    { value: 'mono', label: 'Technical Monospace' },
                  ]}
                  onChange={(val) =>
                    handlePreferenceChange('fridge_note_font', val, setNoteFont, null)
                  }
                  size="md"
                />
              </div>
            </div>
          </div>
        );
      case 'reveal':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-text-main">Reveal Q&A Settings</h3>
              <p className="text-xs text-text-muted mt-1">
                Configure your daily Q&A rotation and reminders.
              </p>
            </div>

            <div className="space-y-4">
              {/* Daily Reminder Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-primary" />
                    Daily Q&A Reminders
                  </span>
                  <span className="text-xs text-text-muted mt-0.5">
                    Get notified when today&apos;s new question is active.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handlePreferenceChange(
                      'reveal_reminders_enabled',
                      !revealReminders,
                      setRevealReminders,
                      null
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${revealReminders ? 'bg-primary' : 'bg-surface-border'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${revealReminders ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {/* Custom Question Freq */}
              <div className="p-4 bg-surface/50 border border-surface-border rounded-2xl space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    Custom Question Frequency
                  </h4>
                  <p className="text-xs text-text-muted mt-1">
                    Control how often custom questions made by you/your partner appear in the daily
                    rotation.
                  </p>
                </div>
                <div className="max-w-xs">
                  <GlassDropdown
                    value={customQuestionFreq}
                    options={[
                      { value: '0', label: 'Never (0%)' },
                      { value: '10', label: 'Rarely (10%)' },
                      { value: '25', label: 'Normal (25%)' },
                      { value: '50', label: 'Frequently (50%)' },
                      { value: '100', label: 'Always' },
                    ]}
                    onChange={(val) =>
                      handlePreferenceChange(
                        'reveal_custom_question_freq',
                        val,
                        setCustomQuestionFreq,
                        'Custom question frequency updated'
                      )
                    }
                    size="md"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6 animate-fade-in flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
            <div className="w-16 h-16 bg-surface-border/20 rounded-full flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-text-main capitalize">Data Management</h3>
            <p className="text-sm text-text-muted max-w-md mb-6">
              Manage your saved memories and app cache.
            </p>
            <div className="flex gap-4 w-full justify-center">
              <button className="px-4 py-2 bg-surface-border/50 text-text-main rounded-xl text-sm font-bold hover:bg-surface-border transition-colors">
                Clear Cache
              </button>
              <button className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-bold hover:bg-primary/30 transition-colors">
                Export Data
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto md:p-6 lg:p-8 animate-fade-in pt-4 pb-20">
      {/* Top Bar Header */}
      <header className="bg-surface/80 backdrop-blur-md md:rounded-2xl md:border border-surface-border p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-main">Settings</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Manage your account configurations and preferences.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-text-muted" />
            </span>
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-surface/50 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main placeholder:text-text-muted/50 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 bg-transparent min-h-[600px] relative overflow-hidden md:overflow-visible rounded-2xl">
        {/* Sidebar */}
        <section
          className={`col-span-1 md:col-span-4 bg-surface/60 backdrop-blur-xl md:rounded-2xl border-r md:border border-surface-border flex flex-col p-4 space-y-1 transition-transform duration-300 z-10 ${isMobileDetailView ? '-translate-x-full absolute w-full h-full md:relative md:translate-x-0' : 'translate-x-0 relative'}`}
        >
          <div className="px-2 py-1.5 mb-2">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              System Settings
            </span>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${isActive ? 'bg-primary/10 border border-primary/20 text-primary font-bold' : 'hover:bg-surface-border/30 text-text-main font-medium border border-transparent'}`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`p-2 rounded-lg ${isActive ? 'bg-primary/20 text-primary' : 'bg-surface-border/50 text-text-muted'}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="block text-sm">{cat.label}</span>
                      <span
                        className={`block text-xs mt-0.5 ${isActive ? 'text-primary/70' : 'text-text-muted font-normal'}`}
                      >
                        {cat.desc}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 md:hidden ${isActive ? 'text-primary' : 'text-text-muted'}`}
                  />
                </button>
              );
            })}
          </nav>

          <div className="border-t border-surface-border pt-4 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl transition text-sm border border-rose-500/20"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </section>

        {/* Content Detail */}
        <section
          className={`col-span-1 md:col-span-8 bg-surface/60 backdrop-blur-xl md:rounded-2xl border border-surface-border flex flex-col min-h-0 absolute inset-0 md:relative transition-transform duration-300 z-20 md:z-auto ${isMobileDetailView ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-surface-border md:hidden bg-surface">
            <button
              onClick={() => setIsMobileDetailView(false)}
              className="flex items-center space-x-1 text-primary font-bold text-sm p-1 rounded-lg hover:bg-primary/10"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Settings</span>
            </button>
            <span className="text-sm font-extrabold text-text-main capitalize">
              {activeCategory.replace('-', ' ')}
            </span>
            <div className="w-16"></div>
          </div>

          <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">{renderModule()}</div>
        </section>
      </main>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-3xl p-6 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl animate-fade-in">
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
                    className={`aspect-square rounded-full transition-all flex items-center justify-center border-2 overflow-hidden bg-brand-surface ${avatarUrl === opt.url ? 'border-primary bg-primary/10 scale-110 shadow-md z-10' : 'border-slate-800 hover:border-text-muted hover:scale-105'}`}
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
