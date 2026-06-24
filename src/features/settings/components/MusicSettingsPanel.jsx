/**
 * @file MusicSettingsPanel.jsx
 * @description Settings panel for Music Room features:
 * crossfade transition parameters.
 */

import React from 'react';
import { useMusic } from '../../../contexts/MusicContext';
import { Sliders } from 'lucide-react';

/**
 * MusicSettingsPanel component.
 * Configures the shared Music Room preferences.
 *
 * @returns {React.ReactElement} The settings panel.
 */
export default function MusicSettingsPanel() {
  const music = useMusic();

  if (!music) {
    return (
      <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border text-center text-xs text-text-muted">
        Music player context is unavailable.
      </div>
    );
  }

  const { crossfadeDuration, setCrossfadeDuration } = music;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-text-main">Music Room Settings</h3>
        <p className="text-xs text-text-muted mt-1">Configure shared music player preferences.</p>
      </div>

      <div className="space-y-4">
        {/* Crossfade parameter */}
        <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border space-y-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-text-main">Crossfade Transition</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Set the overlap duration in seconds when transitioning from one track to another. High
            values create a smoother fade.
          </p>
          <div className="flex items-center justify-between space-x-4 pt-1">
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={crossfadeDuration}
              onChange={(e) => setCrossfadeDuration(parseInt(e.target.value))}
              aria-label="Crossfade duration in seconds"
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <span className="font-mono text-xs text-text-main bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded-lg min-w-[36px] text-center">
              {crossfadeDuration}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
