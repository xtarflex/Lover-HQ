/**
 * @file Settings.jsx
 * @description Main Settings page component.
 * Manages global state for all settings categories and delegates rendering
 * to focused sub-panel components.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useAppDispatch } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../components/Notification';
import avatarManifest from '../../assets/avatars_manifest.json';
import {
  User,
  Paintbrush,
  Database,
  Terminal,
  Search,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import {
  getFridgeItemsCount,
  getFridgeItemsBeforeCutoff,
  deleteFridgeMedia,
  deleteFridgeItemsBeforeCutoff,
} from '../../services/fridge';

import SettingsSidebar from './components/SettingsSidebar';
import AccountPanel from './components/AccountPanel';
import PreferencesPanel from './components/PreferencesPanel';
import FridgeSettingsPanel from './components/FridgeSettingsPanel';
import RevealSettingsPanel from './components/RevealSettingsPanel';
import DataManagementPanel from './components/DataManagementPanel';

/**
 * Main Settings page. Owns all settings state and handler functions,
 * then passes them down to the appropriate panel components.
 *
 * @returns {React.ReactElement}
 */
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
  const [pushEnabled, setPushEnabled] = useState(
    () => localStorage.getItem('preferences_push_enabled') !== 'false'
  );
  const [hapticsEnabled, setHapticsEnabled] = useState(
    () => localStorage.getItem('preferences_haptics_enabled') !== 'false'
  );
  const [autoJoinInvites, setAutoJoinInvites] = useState(
    () => localStorage.getItem('preferences_auto_join_games') === 'true'
  );
  const [revealNudges, setRevealNudges] = useState(
    () => localStorage.getItem('reveal_allow_nudges') !== 'false'
  );
  const [gameReactions, setGameReactions] = useState(
    () => localStorage.getItem('preferences_game_reactions_enabled') !== 'false'
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

  /**
   * Persists a preference to localStorage and updates local state.
   *
   * @param {string} key - localStorage key.
   * @param {*} value - New value to store.
   * @param {Function} setter - React state setter for the preference.
   * @param {string|null} successMessage - Optional toast message to show on success.
   */
  const handlePreferenceChange = (key, value, setter, successMessage) => {
    localStorage.setItem(key, value.toString());
    setter(value);
    if (successMessage) setMessage({ type: 'success', text: successMessage });
  };

  /**
   * Updates the auto-compaction threshold in localStorage and state.
   *
   * @param {string} val - Selected threshold value.
   */
  const handleCompactDaysChange = (val) => {
    handlePreferenceChange(
      'fridge_auto_compact_days',
      val,
      setCompactDays,
      'Auto-compaction threshold updated'
    );
  };

  /**
   * Synchronizes queued offline profile updates with Supabase once the client is online.
   *
   * @returns {Promise<void>}
   */
  const syncProfileOffline = useCallback(async () => {
    if (!navigator.onLine || !userId) return;
    try {
      const pendingUpdate = localStorage.getItem('profile_offline_queue');
      if (!pendingUpdate) return;
      const profileData = JSON.parse(pendingUpdate);

      const { error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', userId);

      if (error) throw error;

      localStorage.removeItem('profile_offline_queue');
      console.log('Profile changes synced online.');
    } catch (err) {
      console.error('Failed to sync offline profile:', err);
    }
  }, [userId]);

  useEffect(() => {
    window.addEventListener('online', syncProfileOffline);
    const timer = setTimeout(() => {
      syncProfileOffline();
    }, 500);
    return () => {
      window.removeEventListener('online', syncProfileOffline);
      clearTimeout(timer);
    };
  }, [syncProfileOffline]);

  /**
   * Saves the user's profile changes to the database and updates global state.
   *
   * @param {React.FormEvent} e - Form submission event.
   * @returns {Promise<void>}
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setMessage(null);

    const updatedData = {
      name: name.trim(),
      avatar_url: avatarUrl,
      phone_number: phone.trim() || null,
      birthday: birthday || null,
    };

    const updatedUser = {
      ...user,
      ...updatedData,
    };

    // Optimistic update
    dispatch({
      type: 'SET_USER',
      payload: updatedUser,
    });
    localStorage.setItem('lover_hq_user', JSON.stringify(updatedUser));

    if (!navigator.onLine) {
      try {
        localStorage.setItem('profile_offline_queue', JSON.stringify(updatedData));
        setMessage({ type: 'success', text: 'Profile updated offline! Will sync when connection returns.' });
      } catch (err) {
        console.error('Failed to queue offline profile update:', err);
        setMessage({ type: 'error', text: 'Failed to save profile offline.' });
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update(updatedData)
        .eq('id', userId);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Profile preferences updated successfully!' });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Failed to update profile: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Runs a manual fridge compaction pass, removing items older than the
   * configured threshold and cleaning up associated media from storage.
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

      const itemsToDelete = await getFridgeItemsBeforeCutoff(userIds, cutOffIso);

      let deletedFilesCount = 0;
      if (itemsToDelete && itemsToDelete.length > 0) {
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
   * Signs the user out and redirects to the auth page.
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

  /**
   * Selects a settings category and switches to the detail view on mobile.
   *
   * @param {string} id - The category ID to activate.
   */
  const selectCategory = (id) => {
    setActiveCategory(id);
    setIsMobileDetailView(true);
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
        <SettingsSidebar
          filteredCategories={filteredCategories}
          activeCategory={activeCategory}
          isMobileDetailView={isMobileDetailView}
          onSelectCategory={selectCategory}
          onLogout={handleLogout}
        />

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
            <div className="w-16" />
          </div>

          <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
            {activeCategory === 'account' && (
              <AccountPanel
                name={name}
                setName={setName}
                avatarUrl={avatarUrl}
                phone={phone}
                setPhone={setPhone}
                birthday={birthday}
                setBirthday={setBirthday}
                user={user}
                saving={saving}
                onSubmit={handleSaveProfile}
                onOpenAvatarPicker={() => setShowAvatarPicker(true)}
              />
            )}
            {activeCategory === 'preferences' && (
              <PreferencesPanel
                soundMuted={soundMuted}
                onToggleSound={() =>
                  handlePreferenceChange('fridge_sound_muted', !soundMuted, setSoundMuted, null)
                }
                pushEnabled={pushEnabled}
                onTogglePush={() =>
                  handlePreferenceChange('preferences_push_enabled', !pushEnabled, setPushEnabled, null)
                }
                hapticsEnabled={hapticsEnabled}
                onToggleHaptics={() =>
                  handlePreferenceChange('preferences_haptics_enabled', !hapticsEnabled, setHapticsEnabled, null)
                }
                autoJoinInvites={autoJoinInvites}
                onToggleAutoJoin={() =>
                  handlePreferenceChange('preferences_auto_join_games', !autoJoinInvites, setAutoJoinInvites, null)
                }
                gameReactions={gameReactions}
                onToggleGameReactions={() =>
                  handlePreferenceChange('preferences_game_reactions_enabled', !gameReactions, setGameReactions, null)
                }
              />
            )}
            {activeCategory === 'fridge' && (
              <FridgeSettingsPanel
                compactDays={compactDays}
                onCompactDaysChange={handleCompactDaysChange}
                compactionOptions={compactionOptions}
                stats={stats}
                compacting={compacting}
                onManualCompaction={handleManualCompaction}
                gridSnapping={gridSnapping}
                onToggleGridSnapping={() =>
                  handlePreferenceChange(
                    'fridge_grid_snapping',
                    !gridSnapping,
                    setGridSnapping,
                    null
                  )
                }
                boardBg={boardBg}
                onChangeBoardBg={(val) =>
                  handlePreferenceChange('fridge_background', val, setBoardBg, null)
                }
                defaultNoteColor={defaultNoteColor}
                onChangeNoteColor={(val) =>
                  handlePreferenceChange(
                    'fridge_default_note_color',
                    val,
                    setDefaultNoteColor,
                    null
                  )
                }
                noteFont={noteFont}
                onChangeNoteFont={(val) =>
                  handlePreferenceChange('fridge_note_font', val, setNoteFont, null)
                }
              />
            )}
            {activeCategory === 'reveal' && (
              <RevealSettingsPanel
                revealReminders={revealReminders}
                onToggleReminders={() =>
                  handlePreferenceChange(
                    'reveal_reminders_enabled',
                    !revealReminders,
                    setRevealReminders,
                    null
                  )
                }
                customQuestionFreq={customQuestionFreq}
                onChangeFreq={(val) =>
                  handlePreferenceChange(
                    'reveal_custom_question_freq',
                    val,
                    setCustomQuestionFreq,
                    'Custom question frequency updated'
                  )
                }
                revealNudges={revealNudges}
                onToggleNudges={() =>
                  handlePreferenceChange(
                    'reveal_allow_nudges',
                    !revealNudges,
                    setRevealNudges,
                    null
                  )
                }
              />
            )}
            {activeCategory === 'data' && (
              <DataManagementPanel onLogout={handleLogout} />
            )}
          </div>
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
