/**
 * @file FridgeSettingsPanel.jsx
 * @description Settings panel for Fridge Board configuration:
 * auto-compaction threshold, background style, note colors, fonts, and grid snapping.
 */

import React from 'react';
import { Database, Paintbrush, Grid, ShieldAlert } from 'lucide-react';
import GlassDropdown from '../../../components/GlassDropdown';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

/**
 * @param {{
 *   compactDays: string,
 *   onCompactDaysChange: Function,
 *   compactionOptions: Array<{value: string, label: string}>,
 *   stats: { totalItems: number | null },
 *   compacting: boolean,
 *   onManualCompaction: Function,
 *   gridSnapping: boolean,
 *   onToggleGridSnapping: Function,
 *   boardBg: string,
 *   onChangeBoardBg: Function,
 *   defaultNoteColor: string,
 *   onChangeNoteColor: Function,
 *   noteFont: string,
 *   onChangeNoteFont: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function FridgeSettingsPanel({
  compactDays,
  onCompactDaysChange,
  compactionOptions,
  stats,
  compacting,
  onManualCompaction,
  gridSnapping,
  onToggleGridSnapping,
  boardBg,
  onChangeBoardBg,
  defaultNoteColor,
  onChangeNoteColor,
  noteFont,
  onChangeNoteFont,
}) {
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
              onChange={onCompactDaysChange}
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
            onClick={onManualCompaction}
            disabled={compacting || compactDays === 'off'}
            className="w-full py-3.5 bg-slate-900 dark:bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {compacting ? (
              <LoadingSpinner size="xs" className="text-primary" />
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
              onClick={onToggleGridSnapping}
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
                onClick={() => onChangeBoardBg(bgOpt.id)}
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
                onClick={() => onChangeNoteColor(colorOpt.id)}
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
            onChange={onChangeNoteFont}
            size="md"
          />
        </div>
      </div>
    </div>
  );
}
