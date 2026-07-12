/**
 * @file GameSettingsPanel.jsx
 * @description Settings panel for active multiplayer games features:
 * auto-join invitations and floating emoji/presets reactions.
 */

import React from 'react';
import { Gamepad2, Smile } from 'lucide-react';

/**
 * @param {{
 *   autoJoinInvites: boolean,
 *   onToggleAutoJoin: Function,
 *   gameReactions: boolean,
 *   onToggleGameReactions: Function,
 *   pushEnabled: boolean,
 * }} props
 * @returns {React.ReactElement}
 */
export default function GameSettingsPanel({
  autoJoinInvites,
  onToggleAutoJoin,
  gameReactions,
  onToggleGameReactions,
  pushEnabled,
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-text-main">Game Room Settings</h3>
        <p className="text-xs text-text-muted mt-1">
          Configure multiplayer invitations and in-game reaction preferences.
        </p>
      </div>

      <div className="space-y-4">
        {/* Auto-Join Toggle */}
        <div
          className={`flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border transition-opacity duration-200 ${!pushEnabled ? 'opacity-60' : ''}`}
        >
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              Auto-Join Game Invites
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              {!pushEnabled
                ? 'Enable Push Notifications under App Preferences to turn this on.'
                : 'Automatically join game invites without displaying confirmation popups.'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            disabled={!pushEnabled}
            aria-checked={autoJoinInvites}
            aria-label="Toggle Auto-Join Game Invites"
            onClick={onToggleAutoJoin}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!pushEnabled ? 'cursor-not-allowed bg-surface-border/50' : autoJoinInvites ? 'bg-primary' : 'bg-surface-border'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${autoJoinInvites && pushEnabled ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* In-Game Reactions Toggle */}
        <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-main flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-pink-400" />
              In-Game Reactions & Presets
            </span>
            <span className="text-xs text-text-muted mt-0.5">
              Enable floating emojis and quick chat messages during gameplay.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={gameReactions}
            aria-label="Toggle In-Game Reactions & Presets"
            onClick={onToggleGameReactions}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${gameReactions ? 'bg-primary' : 'bg-surface-border'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${gameReactions ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
