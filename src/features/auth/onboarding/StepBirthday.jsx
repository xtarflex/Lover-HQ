/**
 * @file StepBirthday.jsx
 * @description Onboarding Step 3: Asks for the user's birthday.
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * Renders the third onboarding step where the user provides their birthday.
 *
 * @param {{ birthday: string, setBirthday: Function, onBack: Function, onNext: Function }} props
 * @param {string} props.birthday - Current birthday value (ISO date string or empty).
 * @param {Function} props.setBirthday - Setter for the birthday value.
 * @param {Function} props.onBack - Callback to go to the previous step.
 * @param {Function} props.onNext - Callback to advance to the next step.
 * @returns {React.ReactElement}
 */
export default function StepBirthday({ birthday, setBirthday, onBack, onNext }) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <span className="text-primary font-semibold tracking-tighter text-sm uppercase">
          03 / 05
        </span>
        <h2 className="font-heading text-4xl md:text-5xl leading-tight font-bold text-text-main">
          When is your special day?
        </h2>
      </div>
      <div className="space-y-6">
        <div className="border-b-2 border-surface-border focus-within:border-primary transition-colors py-4 group">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted group-focus-within:text-primary transition-colors block mb-2">
            Your Birthday
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full bg-transparent text-xl md:text-2xl text-text-main focus:outline-none"
            autoFocus
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onBack}
          className="p-4 rounded-full border border-surface-border hover:border-text-muted text-text-main transition-colors relative z-10 bg-background"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="bg-text-main text-background hover-heart-scale flex-grow py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all group"
        >
          <span className="relative z-10">Next</span>
        </button>
      </div>
    </div>
  );
}
