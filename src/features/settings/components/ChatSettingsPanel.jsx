/**
 * @file ChatSettingsPanel.jsx
 * @description Premium Chat Room Settings Control Hub.
 * Features:
 * - Live interactive chat bubble & wallpaper previewer.
 * - Multi-preset chat wallpaper theme customizer.
 * - Animated sticker playback mode (Infinite Loop vs Battery Saver 2-Cycles).
 * - Typography scale & message bubble density preferences.
 * - Sound effects and heartbeat haptic pulse feedback controls.
 */

import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Check,
  Zap,
  Repeat,
  Type,
  Volume2,
  VolumeX,
  Vibrate,
  Eye,
} from 'lucide-react';

/**
 * Wallpaper style mappings for live preview thumbnail backgrounds.
 */
const WALLPAPER_PRESETS = [
  {
    id: 'doodle',
    label: 'Classic Doodle',
    desc: 'Soft sketch backdrop pattern',
    previewBg: 'bg-slate-900 border-slate-800',
    style: {
      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.95)), url('/board-chat-bg.png')`,
      backgroundSize: 'cover',
    },
  },
  {
    id: 'midnight',
    label: 'Sleek Midnight',
    desc: 'Minimal obsidian dark gradient',
    previewBg: 'bg-slate-950 border-slate-900',
    style: {
      background: 'linear-gradient(to bottom, #0b0f19, #020617)',
    },
  },
  {
    id: 'sunset',
    label: 'Romantic Sunset',
    desc: 'Deep indigo & rose aurora',
    previewBg: 'bg-gradient-to-r from-indigo-900 via-purple-950 to-pink-950',
    style: {
      background: 'linear-gradient(to bottom right, #1e1b4b, #3b0764, #500724)',
    },
  },
  {
    id: 'neon',
    label: 'Neon Cyberpunk',
    desc: 'Glowing indigo grid matrix',
    previewBg: 'bg-slate-950 border-indigo-950/40',
    style: {
      background:
        'linear-gradient(rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.92)), linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)',
      backgroundSize: '100% 100%, 24px 24px, 24px 24px',
    },
  },
  {
    id: 'emerald',
    label: 'Emerald Oasis',
    desc: 'Lush dark forest velvet',
    previewBg: 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950',
    style: {
      background: 'linear-gradient(to bottom right, #064e3b, #022c22, #0f172a)',
    },
  },
  {
    id: 'starlight',
    label: 'Starlight Velvet',
    desc: 'Cosmic purple nightscape',
    previewBg: 'bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950',
    style: {
      background: 'linear-gradient(to bottom right, #0f172a, #1e1b4b, #311042)',
    },
  },
];

/**
 * Message density & font size preset configurations.
 */
const DENSITY_OPTIONS = [
  { id: 'compact', label: 'Compact', desc: '13px text, minimal padding', badge: 'Aa' },
  { id: 'balanced', label: 'Balanced', desc: '14px text, standard padding', badge: 'Aa+' },
  { id: 'comfortable', label: 'Comfortable', desc: '16px text, generous padding', badge: 'AA' },
];

/**
 * ChatSettingsPanel component.
 *
 * @returns {React.ReactElement} The chat settings panel.
 */
export default function ChatSettingsPanel() {
  const [chatBg, setChatBg] = useState(() => {
    if (typeof window === 'undefined') return 'doodle';
    return localStorage.getItem('chat_background_preset') || 'doodle';
  });

  const [playbackMode, setPlaybackMode] = useState(() => {
    if (typeof window === 'undefined') return 'infinite';
    return localStorage.getItem('sticker_playback_mode') || 'infinite';
  });

  const [densityScale, setDensityScale] = useState(() => {
    if (typeof window === 'undefined') return 'balanced';
    return localStorage.getItem('chat_density_scale') || 'balanced';
  });

  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('chat_sound_enabled') !== 'false';
  });

  const [isHapticsEnabled, setIsHapticsEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('chat_haptics_enabled') !== 'false';
  });

  const handleBgChange = (presetId) => {
    setChatBg(presetId);
    localStorage.setItem('chat_background_preset', presetId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('preference_change', {
          detail: { key: 'chat_background_preset', value: presetId },
        })
      );
    }
  };

  const handlePlaybackModeChange = (mode) => {
    setPlaybackMode(mode);
    localStorage.setItem('sticker_playback_mode', mode);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('preference_change', {
          detail: { key: 'sticker_playback_mode', value: mode },
        })
      );
    }
  };

  const handleDensityChange = (scaleId) => {
    setDensityScale(scaleId);
    localStorage.setItem('chat_density_scale', scaleId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('preference_change', {
          detail: { key: 'chat_density_scale', value: scaleId },
        })
      );
    }
  };

  const handleToggleSound = () => {
    const newValue = !isSoundEnabled;
    setIsSoundEnabled(newValue);
    localStorage.setItem('chat_sound_enabled', String(newValue));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('preference_change', {
          detail: { key: 'chat_sound_enabled', value: String(newValue) },
        })
      );
    }
  };

  const handleToggleHaptics = () => {
    const newValue = !isHapticsEnabled;
    setIsHapticsEnabled(newValue);
    localStorage.setItem('chat_haptics_enabled', String(newValue));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('preference_change', {
          detail: { key: 'chat_haptics_enabled', value: String(newValue) },
        })
      );
    }
  };

  const currentPresetStyle =
    WALLPAPER_PRESETS.find((p) => p.id === chatBg)?.style || WALLPAPER_PRESETS[0].style;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Title */}
      <div>
        <h3 className="text-xl font-extrabold tracking-tight text-text-main flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Chat Room Customization
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Personalize your chat atmosphere, wallpaper backdrop, sticker animation performance, and
          typography scale.
        </p>
      </div>

      {/* 1. Live Interactive Chat Atmosphere Preview */}
      <div className="p-4 bg-surface/60 backdrop-blur-xl rounded-3xl border border-surface-border space-y-3 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-text-main uppercase tracking-wider">
              Live Atmosphere Preview
            </span>
          </div>
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            Real-time Sample
          </span>
        </div>

        {/* Live Mock Chat Container */}
        <div
          className="w-full rounded-2xl p-4 transition-all duration-500 border border-white/10 relative shadow-inner overflow-hidden"
          style={currentPresetStyle}
        >
          <div className="space-y-3">
            {/* Incoming Partner Bubble */}
            <div className="flex items-end space-x-2 max-w-[80%]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-xs font-bold text-white shadow-md">
                ❤️
              </div>
              <div className="bg-slate-900/90 border border-slate-700/60 text-slate-100 rounded-2xl rounded-bl-none p-3 shadow-md backdrop-blur-md">
                <p
                  className={`leading-relaxed ${
                    densityScale === 'compact'
                      ? 'text-xs'
                      : densityScale === 'comfortable'
                        ? 'text-base'
                        : 'text-sm'
                  }`}
                >
                  Loving this chat vibe! 💖
                </p>
                <span className="text-[9px] text-slate-400 mt-1 block text-right">10:42 AM</span>
              </div>
            </div>

            {/* Outgoing User Bubble */}
            <div className="flex items-end justify-end space-x-2 ml-auto max-w-[80%]">
              <div className="bg-primary/95 text-white rounded-2xl rounded-br-none p-3 shadow-md backdrop-blur-md">
                <p
                  className={`leading-relaxed ${
                    densityScale === 'compact'
                      ? 'text-xs'
                      : densityScale === 'comfortable'
                        ? 'text-base'
                        : 'text-sm'
                  }`}
                >
                  It looks super clean and cozy! ✨
                </p>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  <span className="text-[9px] text-white/70">10:43 AM</span>
                  <Check className="w-3 h-3 text-white/90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Wallpaper Customizer */}
      <div className="p-5 bg-surface/60 backdrop-blur-xl rounded-3xl border border-surface-border space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-text-main">Chat Wallpaper Presets</span>
          </div>
          <span className="text-xs text-text-muted">Saved automatically</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Select a ambient background wallpaper for your personal chat window.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {WALLPAPER_PRESETS.map((preset) => {
            const isSelected = chatBg === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleBgChange(preset.id)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all group ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30 scale-[1.02] shadow-md'
                    : 'border-surface-border/50 bg-white/5 hover:bg-white/10 hover:border-surface-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-text-main block">{preset.label}</span>
                    <span className="text-[10px] text-text-muted mt-0.5 block line-clamp-1">
                      {preset.desc}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </div>

                {/* Preset Visual Swatch Thumbnail */}
                <div
                  className={`w-full h-12 rounded-xl border border-white/10 overflow-hidden shadow-inner transition-transform group-hover:scale-[1.02] ${preset.previewBg}`}
                  style={preset.style}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sticker Animation Dynamics & Performance */}
      <div className="p-5 bg-surface/60 backdrop-blur-xl rounded-3xl border border-surface-border space-y-4 shadow-lg">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-text-main">Sticker & Animation Controls</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Configure how animated stickers behave during playback in your message thread.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Continuous Loop Option */}
          <button
            type="button"
            onClick={() => handlePlaybackModeChange('infinite')}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
              playbackMode === 'infinite'
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30 scale-[1.01] shadow-md'
                : 'border-surface-border/50 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Repeat className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-text-main">Continuous Loop</span>
              </div>
              {playbackMode === 'infinite' && (
                <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted leading-normal">
              Stickers loop smoothly while visible in viewport, pausing when scrolled offscreen.
            </p>
          </button>

          {/* Battery Saver Option */}
          <button
            type="button"
            onClick={() => handlePlaybackModeChange('two_cycles')}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
              playbackMode === 'two_cycles'
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30 scale-[1.01] shadow-md'
                : 'border-surface-border/50 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-text-main">Battery Saver</span>
              </div>
              {playbackMode === 'two_cycles' && (
                <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted leading-normal">
              Pauses sticker animation after ~3.5 seconds to maximize device battery efficiency.
            </p>
          </button>
        </div>
      </div>

      {/* 4. Typography Scale & Message Density */}
      <div className="p-5 bg-surface/60 backdrop-blur-xl rounded-3xl border border-surface-border space-y-4 shadow-lg">
        <div className="flex items-center space-x-2">
          <Type className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-text-main">Message Layout & Density</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Adjust message font sizing and bubble spacing for comfortable reading.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {DENSITY_OPTIONS.map((option) => {
            const isSelected = densityScale === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleDensityChange(option.id)}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30 scale-[1.02] shadow-md'
                    : 'border-surface-border/50 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="text-xs font-extrabold text-primary bg-primary/20 px-2 py-0.5 rounded-md">
                  {option.badge}
                </span>
                <span className="text-xs font-bold text-text-main block">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Sound & Haptics Control */}
      <div className="p-5 bg-surface/60 backdrop-blur-xl rounded-3xl border border-surface-border space-y-4 shadow-lg">
        <div className="flex items-center space-x-2">
          <Vibrate className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-text-main">Audio & Haptic Feedback</span>
        </div>

        <div className="space-y-3 pt-1">
          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-surface-border/40">
            <div className="flex items-center space-x-3">
              {isSoundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-text-muted" />
              )}
              <div>
                <span className="text-xs font-bold text-text-main block">
                  Message Sound Effects
                </span>
                <span className="text-[10px] text-text-muted block">
                  Play audio chime when sending or receiving messages
                </span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isSoundEnabled}
              aria-label="Toggle Message Sound Effects"
              onClick={handleToggleSound}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isSoundEnabled ? 'bg-primary' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                  isSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Heartbeat Haptics Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-surface-border/40">
            <div className="flex items-center space-x-3">
              <Vibrate className="w-4 h-4 text-pink-400" />
              <div>
                <span className="text-xs font-bold text-text-main block">
                  Heartbeat Haptic Vibration
                </span>
                <span className="text-[10px] text-text-muted block">
                  Pulse haptic vibration on heart sticker taps (Mobile)
                </span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isHapticsEnabled}
              aria-label="Toggle Heartbeat Haptic Vibration"
              onClick={handleToggleHaptics}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isHapticsEnabled ? 'bg-primary' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                  isHapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
