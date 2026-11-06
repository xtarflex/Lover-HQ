/* eslint-disable */
/**
 * @file PreferencesPanel.jsx
 * @description Settings panel for app-wide preferences: sound effects,
 * visual theme, push notification controls, haptics, and game preferences.
 */

import React from 'react';
import { Bell, Volume2, VolumeX, Smartphone, Gamepad2, Smile, Sparkles } from 'lucide-react';
import MoodSelector from './MoodSelector';

/**
 * @param {{
 *   soundMuted: boolean,
 *   onToggleSound: Function,
 *   pushEnabled: boolean,
 *   onTogglePush: Function,
 *   hapticsEnabled: boolean,
 *   onToggleHaptics: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function PreferencesPanel({
  soundMuted,
  onToggleSound,
  pushEnabled,
  onTogglePush,
  hapticsEnabled,
  onToggleHaptics,
  activeTheme = 'dark',
  onChangeTheme,
  autoJoinInvites = false,
  onToggleAutoJoin,
  gameReactions = true,
  onToggleGameReactions,
  mood = 'happy',
  onSelectMood,
}) {
  /**
   * Toggles push notifications and requests permissions if enabled.
   */
  const handlePushToggle = async () => {
    if (pushEnabled) {
      // Turning it off is always allowed
      onTogglePush();
      return;
    }

    // Turning it on: check browser permissions
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'denied') {
        alert(
          'Notification permission is blocked. Please click the 🔒 icon in your browser address bar to reset permissions. 🔓'
        );
        return;
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert(
            'Notification permission was not granted. If you change your mind, you can enable it by clicking the 🔒 icon in your browser address bar. 🔓'
          );
          return; // Don't enable if they didn't grant permission
        }
      }
    }
    onTogglePush();
  };

  /**
   * Toggles haptics and triggers a test buzz if enabled.
   */
  const handleHapticsToggle = () => {
    onToggleHaptics();
    // Buzz test
    if (
      !hapticsEnabled &&
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function'
    ) {
      try {
        navigator.vibrate([100]);
      } catch (err) {
        // ignore vibrate restrictions
      }
    }
  };

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
            role="switch"
            aria-checked={!soundMuted}
            aria-label="Toggle App Sound Effects"
            onClick={onToggleSound}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!soundMuted ? 'bg-primary' : 'bg-surface-border'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${!soundMuted ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Visual Theme Selection */}
        <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border">
          <div className="flex flex-col mb-3">
            <span className="text-sm font-bold text-text-main">Theme Mode</span>
            <span className="text-xs text-text-muted">Choose your preferred visual style.</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onChangeTheme?.('light')}
              className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                activeTheme === 'light'
                  ? 'bg-primary/20 text-primary border-primary/50 shadow-sm'
                  : 'bg-surface-border/50 text-text-muted border-transparent hover:bg-surface-border'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme?.('dark')}
              className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                activeTheme === 'dark'
                  ? 'bg-primary/20 text-primary border-primary/50 shadow-sm'
                  : 'bg-surface-border/50 text-text-muted border-transparent hover:bg-surface-border'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme?.('system')}
              className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                activeTheme === 'system'
                  ? 'bg-primary/20 text-primary border-primary/50 shadow-sm'
                  : 'bg-surface-border/50 text-text-muted border-transparent hover:bg-surface-border'
              }`}
            >
              System
            </button>
          </div>
        </div>

        {/* Notifications Toggle */}
        <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-primary" />
              Push Notifications
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              Alerts for game invites and reveal nudges when in background.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pushEnabled}
            aria-label="Toggle Push Notifications"
            onClick={handlePushToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pushEnabled ? 'bg-primary' : 'bg-surface-border'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${pushEnabled ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Haptics Toggle */}
        <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-secondary" />
              Haptic Feedback (Vibration)
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              Vibrate phone for real-time nudges and invites.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hapticsEnabled}
            aria-label="Toggle Haptic Feedback (Vibration)"
            onClick={handleHapticsToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hapticsEnabled ? 'bg-primary' : 'bg-surface-border'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${hapticsEnabled ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
        {/* Auto-Join Game Invites */}
        {onToggleAutoJoin && (
          <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-purple-400" />
                Auto-Join Game Invites
              </span>
              <span className="text-xs text-text-muted mt-0.5">
                Automatically enter games when your partner invites you.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoJoinInvites}
              aria-label="Toggle Auto-Join Game Invites"
              onClick={onToggleAutoJoin}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoJoinInvites ? 'bg-primary' : 'bg-surface-border'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${autoJoinInvites ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        )}

        {/* In-Game Reactions */}
        {onToggleGameReactions && (
          <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-pink-400" />
                In-Game Reactions & Presets
              </span>
              <span className="text-xs text-text-muted mt-0.5">
                Show floating reactions and quick messages during gameplay.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={gameReactions}
              aria-label="Toggle In-Game Reactions and Presets"
              onClick={onToggleGameReactions}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${gameReactions ? 'bg-primary' : 'bg-surface-border'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${gameReactions ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        )}

        {/* Mood & Status Selector */}
        {onSelectMood && (
          <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                Your Mood Status
              </span>
              <span className="text-xs text-text-muted">Live with partner</span>
            </div>
            <MoodSelector currentMood={mood} onSelectMood={onSelectMood} />
          </div>
        )}
      </div>
    </div>
  );
}
