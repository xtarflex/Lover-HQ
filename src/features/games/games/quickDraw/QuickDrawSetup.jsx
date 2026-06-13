/**
 * @file QuickDrawSetup.jsx
 * @description Pre-game round setup panel for Quick Draw.
 * Renders the drawer's word-selection UI (suggested words, custom word input,
 * time-limit selector, and Start Drawing button) or a waiting spinner for the
 * guesser while the drawer configures the round.
 */

import React from 'react';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';

/**
 * Round setup screen rendered before a drawing round begins.
 *
 * @param {object} props
 * @param {boolean} props.iAmDrawer - Whether the local user is the drawer this round.
 * @param {number} props.currentRound - The 1-based index of the current round.
 * @param {object|null} props.partner - Partner profile object (used for display name).
 * @param {string[]} props.wordSuggestions - Three randomly chosen word suggestions.
 * @param {string} props.selectedWord - Currently highlighted suggestion (or empty string).
 * @param {Function} props.setSelectedWord - State setter for `selectedWord`.
 * @param {string} props.customWord - Value of the custom word text input.
 * @param {Function} props.setCustomWord - State setter for `customWord`.
 * @param {number} props.durationSelect - Selected round duration in seconds.
 * @param {Function} props.setDurationSelect - State setter for `durationSelect`.
 * @param {Function} props.handleStartRound - Callback that finalises setup and starts the round.
 * @returns {React.ReactElement}
 */
export default function QuickDrawSetup({
  iAmDrawer,
  currentRound,
  partner,
  wordSuggestions,
  selectedWord,
  setSelectedWord,
  customWord,
  setCustomWord,
  durationSelect,
  setDurationSelect,
  handleStartRound,
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-2 w-full max-w-[380px] mx-auto animate-slide-up">
      {iAmDrawer ? (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-white">Round {currentRound} Setup</h2>
            <p className="text-sm text-text-muted">
              Choose a word to draw or type a custom one.
            </p>
          </div>

          {/* Word suggestions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest block">
              Suggested Words
            </label>
            <div className="grid grid-cols-3 gap-2">
              {wordSuggestions.map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    setSelectedWord(w);
                    setCustomWord('');
                  }}
                  className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all ${
                    selectedWord === w && !customWord
                      ? 'bg-primary border-primary text-white'
                      : 'bg-slate-950 border-slate-800 text-text-main hover:border-slate-700'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Word Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest block">
              Or Type Custom Word
            </label>
            <input
              type="text"
              value={customWord}
              onChange={(e) => {
                setCustomWord(e.target.value);
                setSelectedWord('');
              }}
              placeholder="e.g. dragon, guitar..."
              maxLength={20}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl text-sm text-text-main placeholder-text-muted/40 transition-colors"
            />
          </div>

          {/* Time limit selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest block">
              Round Time Limit
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, 120].map((d) => (
                <button
                  key={d}
                  onClick={() => setDurationSelect(d)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    durationSelect === d
                      ? 'bg-primary border-primary text-white'
                      : 'bg-slate-950 border-slate-800 text-text-main hover:border-slate-700'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartRound}
            disabled={!selectedWord && !customWord.trim()}
            className="w-full py-4 bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-primary/20"
          >
            Start Drawing
          </button>
        </div>
      ) : (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl flex flex-col items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Round {currentRound}</h2>
            <p className="text-sm text-text-muted font-medium">
              Waiting for {partner?.name || 'partner'}...
            </p>
          </div>
          <div className="py-4">
            <LoadingSpinner size="sm" />
          </div>
          <p className="text-xs text-text-muted italic">
            You will guess the word once they start drawing!
          </p>
        </div>
      )}
    </div>
  );
}
