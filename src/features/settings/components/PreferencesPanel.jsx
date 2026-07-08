/* eslint-disable */
/**
 * @file PreferencesPanel.jsx
 * @description Settings panel for app-wide preferences: sound effects,
 * visual theme, push notification controls, haptics, and game preferences.
 */

import React from 'react';
import { Bell, Volume2, VolumeX, Smartphone } from 'lucide-react';

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
}) {
  /**
   * Toggles push notifications and requests permissions if enabled.
   */
  const handlePushToggle = async () => {
    onTogglePush();
    // Request permission if they are turning it on
    if (!pushEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
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

        {/* Theme Placeholder */}
        <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border">
          <div className="flex flex-col mb-3">
            <span className="text-sm font-bold text-text-main">Theme Mode</span>
            <span className="text-xs text-text-muted">Choose your preferred visual style.</span>
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
      </div>
    </div>
  );
}
