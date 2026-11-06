/**
 * @file MoodSelector.jsx
 * @description Interactive Mood Changer & Status component for couples.
 * Allows users to choose and communicate their current mood in real time.
 */

import React from 'react';
import { Check } from 'lucide-react';

/**
 * Standard mood options available across Lover-HQ.
 * Each entry provides an identifier, user-friendly label, emoji,
 * descriptive context, and color styling tokens.
 */
export const MOOD_OPTIONS = [
  {
    id: 'happy',
    label: 'Happy',
    emoji: '😊',
    desc: 'Feeling joyful & bright',
    activeClass: 'border-amber-400 bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/30',
  },
  {
    id: 'romantic',
    label: 'Romantic',
    emoji: '💕',
    desc: 'Loving & thinking of you',
    activeClass: 'border-rose-400 bg-rose-400/10 text-rose-400 ring-1 ring-rose-400/30',
  },
  {
    id: 'playful',
    label: 'Playful',
    emoji: '😜',
    desc: 'Ready for fun & games',
    activeClass: 'border-purple-400 bg-purple-400/10 text-purple-400 ring-1 ring-purple-400/30',
  },
  {
    id: 'cozy',
    label: 'Cozy',
    emoji: '☕',
    desc: 'Warm, relaxed & content',
    activeClass: 'border-orange-400 bg-orange-400/10 text-orange-400 ring-1 ring-orange-400/30',
  },
  {
    id: 'missing_you',
    label: 'Missing You',
    emoji: '🥺',
    desc: 'Wishing you were here',
    activeClass: 'border-sky-400 bg-sky-400/10 text-sky-400 ring-1 ring-sky-400/30',
  },
  {
    id: 'sleepy',
    label: 'Sleepy',
    emoji: '😴',
    desc: 'Tired & winding down',
    activeClass: 'border-indigo-400 bg-indigo-400/10 text-indigo-400 ring-1 ring-indigo-400/30',
  },
  {
    id: 'stressed',
    label: 'Stressed',
    emoji: '💆',
    desc: 'Need a hug & some love',
    activeClass: 'border-emerald-400 bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/30',
  },
];

/**
 * Returns the matching mood configuration object by id, falling back to 'happy'.
 *
 * @param {string} [id] - The mood identifier.
 * @returns {object} The mood configuration object.
 */
export const getMoodById = (id) => {
  const normalized = (id || '').toLowerCase().replace(/[\s-]/g, '_');
  return MOOD_OPTIONS.find((m) => m.id === normalized) || MOOD_OPTIONS[0];
};

/**
 * MoodSelector component.
 *
 * @param {object} props
 * @param {string} props.currentMood - The currently selected mood identifier.
 * @param {(moodId: string) => void} props.onSelectMood - Callback when a mood is selected.
 * @param {boolean} [props.isCompact=false] - Whether to render a compact pill row.
 * @returns {React.ReactElement}
 */
export default function MoodSelector({ currentMood = 'happy', onSelectMood, isCompact = false }) {
  const activeMood = getMoodById(currentMood);

  if (isCompact) {
    return (
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select mood">
        {MOOD_OPTIONS.map((mood) => {
          const isSelected = activeMood.id === mood.id;
          return (
            <button
              key={mood.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectMood?.(mood.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 active:scale-95 ${
                isSelected
                  ? mood.activeClass + ' shadow-sm'
                  : 'bg-white/5 border-surface-border/50 text-text-muted hover:text-text-main hover:bg-white/10'
              }`}
            >
              <span className="text-sm">{mood.emoji}</span>
              <span>{mood.label}</span>
              {isSelected && <Check className="w-3 h-3 ml-0.5" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Select mood">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {MOOD_OPTIONS.map((mood) => {
          const isSelected = activeMood.id === mood.id;
          return (
            <button
              key={mood.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectMood?.(mood.id)}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all duration-200 relative group active:scale-95 ${
                isSelected
                  ? mood.activeClass + ' shadow-md'
                  : 'bg-surface/50 border-surface-border text-text-main hover:border-primary/50 hover:bg-surface/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {mood.emoji}
                </span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <div>
                <span className="block text-xs font-bold leading-tight">{mood.label}</span>
                <span className="block text-[10px] text-text-muted leading-tight mt-0.5">
                  {mood.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
