/**
 * @file WordChainSetup.jsx
 * @description Pre-game lobby configuration panel for Word Chain.
 * The host (iGoFirst) can customise game mode, timer, scoring system, and word
 * length constraints. The guest sees read-only previews of the current settings
 * and waits for the host to start the game.
 */

import React from 'react';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import GlassDropdown from '../../../../components/GlassDropdown';

/** @type {Array<{value: string, label: string}>} Min-word-length dropdown options. */
const MIN_LENGTH_OPTIONS = [
  { value: 'none', label: 'No Limit' },
  { value: '3', label: '3 Letters' },
  { value: '4', label: '4 Letters' },
  { value: '5', label: '5 Letters' },
];

/** @type {Array<{value: string, label: string}>} Max-word-length dropdown options. */
const MAX_LENGTH_OPTIONS = [
  { value: 'none', label: 'No Limit' },
  { value: '6', label: '6 Letters' },
  { value: '8', label: '8 Letters' },
  { value: '10', label: '10 Letters' },
];

/**
 * Word Chain lobby setup screen.
 *
 * @param {object} props
 * @param {boolean} props.iGoFirst - Whether the local user is the host (configures settings).
 * @param {object|null} props.partner - Partner profile object (used for display name).
 * @param {object} props.settings - Current game settings object.
 * @param {string} props.settings.mode - Game mode: `'classic'` | `'panic'`.
 * @param {number} props.settings.timerLimit - Turn timer in seconds.
 * @param {string} props.settings.scoring - Scoring mode: `'none'` | `'points_race'`.
 * @param {string} props.settings.minLength - Minimum word length: `'none'` or a numeric string.
 * @param {string} props.settings.maxLength - Maximum word length: `'none'` or a numeric string.
 * @param {Function} props.handleSettingChange - Callback invoked with the updated settings object.
 * @param {Function} props.handleStartGame - Callback invoked when the host clicks "Start Game".
 * @returns {React.ReactElement}
 */
export default function WordChainSetup({
  iGoFirst,
  partner,
  settings,
  handleSettingChange,
  handleStartGame,
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-md bg-surface/60 backdrop-blur-xl border border-surface-border rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative animate-slide-up">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-extrabold text-text-main">Word Chain Setup</h3>
          <p className="text-sm text-text-muted">
            {iGoFirst
              ? 'Customize the rules for your match!'
              : `Waiting for ${partner?.name || 'partner'} to start the game...`}
          </p>
        </div>

        <div className="space-y-4">
          {/* Game Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Game Mode
            </label>
            {iGoFirst ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSettingChange({ ...settings, mode: 'classic' })}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    settings.mode === 'classic'
                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                      : 'bg-surface border-surface-border text-text-muted hover:text-text-main'
                  }`}
                >
                  Classic
                </button>
                <button
                  onClick={() => handleSettingChange({ ...settings, mode: 'panic' })}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    settings.mode === 'panic'
                      ? 'bg-primary/10 border-primary text-primary shadow-sm animate-pulse'
                      : 'bg-surface border-surface-border text-text-muted hover:text-text-main'
                  }`}
                >
                  Panic Mode ⚡
                </button>
              </div>
            ) : (
              <div className="px-4 py-2 bg-surface/40 border border-surface-border/50 rounded-xl text-sm text-text-main font-semibold">
                {settings.mode === 'classic'
                  ? 'Classic'
                  : 'Panic Mode ⚡ (Timer decreases per turn)'}
              </div>
            )}
          </div>

          {/* Turn Timer (Classic mode only) */}
          {settings.mode === 'classic' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Turn Timer
              </label>
              {iGoFirst ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {[15, 30, 45, 60].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleSettingChange({ ...settings, timerLimit: t })}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        settings.timerLimit === t
                          ? 'bg-primary/10 border-primary text-primary shadow-sm'
                          : 'bg-surface border-surface-border text-text-muted hover:text-text-main'
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-2 bg-surface/40 border border-surface-border/50 rounded-xl text-sm text-text-main font-semibold">
                  {settings.timerLimit} seconds
                </div>
              )}
            </div>
          )}

          {/* Scoring System */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Scoring System
            </label>
            {iGoFirst ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSettingChange({ ...settings, scoring: 'none' })}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    settings.scoring === 'none'
                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                      : 'bg-surface border-surface-border text-text-muted hover:text-text-main'
                  }`}
                >
                  Classic Survival
                </button>
                <button
                  onClick={() => handleSettingChange({ ...settings, scoring: 'points_race' })}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    settings.scoring === 'points_race'
                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                      : 'bg-surface border-surface-border text-text-muted hover:text-text-main'
                  }`}
                >
                  Points Race (First to 50)
                </button>
              </div>
            ) : (
              <div className="px-4 py-2 bg-surface/40 border border-surface-border/50 rounded-xl text-sm text-text-main font-semibold">
                {settings.scoring === 'none'
                  ? 'Classic Survival (No points)'
                  : 'Points Race (First to 50 pts)'}
              </div>
            )}
          </div>

          {/* Word Length */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Min Word Length
              </label>
              {iGoFirst ? (
                <GlassDropdown
                  value={settings.minLength}
                  onChange={(val) => handleSettingChange({ ...settings, minLength: val })}
                  options={MIN_LENGTH_OPTIONS}
                  size="sm"
                />
              ) : (
                <div className="px-3 py-2 bg-surface/40 border border-surface-border/50 rounded-xl text-xs text-text-main font-semibold">
                  {settings.minLength === 'none' ? 'No Limit' : `${settings.minLength} Letters`}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Max Word Length
              </label>
              {iGoFirst ? (
                <GlassDropdown
                  value={settings.maxLength}
                  onChange={(val) => handleSettingChange({ ...settings, maxLength: val })}
                  options={MAX_LENGTH_OPTIONS}
                  size="sm"
                />
              ) : (
                <div className="px-3 py-2 bg-surface/40 border border-surface-border/50 rounded-xl text-xs text-text-main font-semibold">
                  {settings.maxLength === 'none' ? 'No Limit' : `${settings.maxLength} Letters`}
                </div>
              )}
            </div>
          </div>
        </div>

        {iGoFirst ? (
          <button
            onClick={handleStartGame}
            className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-extrabold rounded-2xl transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95 text-sm uppercase tracking-widest"
          >
            Start Game
          </button>
        ) : (
          <div className="flex items-center justify-center gap-3 py-4 text-xs text-text-muted font-bold italic">
            <LoadingSpinner size="xs" />
            <span>Waiting for settings configuration...</span>
          </div>
        )}
      </div>
    </div>
  );
}
