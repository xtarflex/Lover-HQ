/**
 * @file StepName.jsx
 * @description Onboarding Step 1: Asks the user for their display name.
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Renders the first onboarding step where the user enters their display name.
 *
 * @param {{ name: string, setName: Function, onNext: Function }} props
 * @param {string} props.name - Current value of the name input.
 * @param {Function} props.setName - Setter for the name value.
 * @param {Function} props.onNext - Callback to advance to the next step.
 * @returns {React.ReactElement}
 */
export default function StepName({ name, setName, onNext }) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <span className="text-primary font-semibold tracking-tighter text-sm uppercase">
          01 / 05
        </span>
        <h2 className="font-heading text-4xl md:text-5xl leading-tight font-bold text-text-main">
          First, what should we call you?
        </h2>
      </div>
      <div className="border-b-2 border-surface-border focus-within:border-primary transition-colors py-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full bg-transparent text-2xl md:text-3xl placeholder-text-muted/50 text-text-main focus:outline-none"
          autoFocus
        />
      </div>
      <button
        type="button"
        onClick={() => {
          if (name.trim()) onNext();
        }}
        disabled={!name.trim()}
        className="bg-text-main text-background hover-heart-scale px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest flex items-center space-x-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <span className="relative z-10">Continue</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
      </button>
    </div>
  );
}
