/**
 * @file RevealSettingsPanel.jsx
 * @description Settings panel for the Reveal Q&A feature:
 * daily reminder toggle, custom question frequency selector, and answer nudges.
 */

import React from 'react';
import { Bell, Sparkles, Smartphone } from 'lucide-react';
import GlassDropdown from '../../../components/GlassDropdown';

/**
 * @param {{
 *   revealReminders: boolean,
 *   onToggleReminders: Function,
 *   customQuestionFreq: string,
 *   onChangeFreq: Function,
 *   revealNudges: boolean,
 *   onToggleNudges: Function,
 *   pushEnabled: boolean,
 * }} props
 * @returns {React.ReactElement}
 */
export default function RevealSettingsPanel({
  revealReminders,
  onToggleReminders,
  customQuestionFreq,
  onChangeFreq,
  revealNudges,
  onToggleNudges,
  pushEnabled,
}) {
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
        <div
          className={`flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border transition-opacity duration-200 ${!pushEnabled ? 'opacity-60' : ''}`}
        >
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-primary" />
              Daily Q&A Reminders
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              {!pushEnabled
                ? 'Enable Push Notifications under App Preferences to turn this on.'
                : "Get notified when today's new question is active."}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            disabled={!pushEnabled}
            aria-checked={revealReminders}
            aria-label="Toggle Daily Q&A Reminders"
            onClick={onToggleReminders}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!pushEnabled ? 'cursor-not-allowed bg-surface-border/50' : revealReminders ? 'bg-primary' : 'bg-surface-border'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${revealReminders && pushEnabled ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Receive Answer Nudges Toggle */}
        <div
          className={`flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border transition-opacity duration-200 ${!pushEnabled ? 'opacity-60' : ''}`}
        >
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-primary" />
              Receive Answer Nudges
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              {!pushEnabled
                ? 'Enable Push Notifications under App Preferences to turn this on.'
                : "Vibrate and alert when your partner nudges you to answer today's question."}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            disabled={!pushEnabled}
            aria-checked={revealNudges}
            aria-label="Toggle Receive Answer Nudges"
            onClick={onToggleNudges}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!pushEnabled ? 'cursor-not-allowed bg-surface-border/50' : revealNudges ? 'bg-primary' : 'bg-surface-border'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${revealNudges && pushEnabled ? 'translate-x-5' : 'translate-x-0'}`}
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
              onChange={onChangeFreq}
              size="md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
