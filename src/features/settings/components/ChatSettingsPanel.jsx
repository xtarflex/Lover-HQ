/**
 * @file ChatSettingsPanel.jsx
 * @description Settings panel for Chat Room features:
 * wallpaper selection.
 */

import React, { useState } from 'react';
import { Palette } from 'lucide-react';

/**
 * ChatSettingsPanel component.
 * Configures the Chat Room preferences.
 *
 * @returns {React.ReactElement} The settings panel.
 */
export default function ChatSettingsPanel() {
  const [chatBg, setChatBg] = useState(() => {
    if (typeof window === 'undefined') return 'doodle';
    return localStorage.getItem('chat_background_preset') || 'doodle';
  });

  const handleBgChange = (presetId) => {
    setChatBg(presetId);
    localStorage.setItem('chat_background_preset', presetId);
  };

  const presets = [
    {
      id: 'doodle',
      label: 'Classic Doodle',
      desc: 'Sketch background pattern',
      bg: 'bg-slate-900 border-slate-800',
    },
    {
      id: 'midnight',
      label: 'Sleek Midnight',
      desc: 'Minimal solid dark gradient',
      bg: 'bg-slate-950 border-slate-900',
    },
    {
      id: 'sunset',
      label: 'Romantic Sunset',
      desc: 'Indigo to pink/purple gradient',
      bg: 'bg-gradient-to-r from-indigo-900 via-purple-950 to-pink-950',
    },
    { id: 'neon', label: 'Neon Grid', bg: 'bg-slate-950 border-indigo-950/40' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-text-main">Chat Settings</h3>
        <p className="text-xs text-text-muted mt-1">Configure your chat layout and appearance.</p>
      </div>

      <div className="space-y-4">
        {/* Chat Wallpaper Customizer */}
        <div className="p-4 bg-surface/50 rounded-2xl border border-surface-border space-y-4">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-text-main">Chat Wallpaper</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Choose a wallpaper background preset for your chat window. Your choice will be saved and
            persisted.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {presets.map((bgOpt) => (
              <button
                key={bgOpt.id}
                type="button"
                onClick={() => handleBgChange(bgOpt.id)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
                  chatBg === bgOpt.id
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/20 scale-[1.02]'
                    : 'border-surface-border/40 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-text-main block">{bgOpt.label}</span>
                  {bgOpt.desc && (
                    <span className="text-[10px] text-text-muted mt-0.5 block">{bgOpt.desc}</span>
                  )}
                </div>
                <div className={`w-full h-10 rounded-xl border border-white/10 ${bgOpt.bg}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
