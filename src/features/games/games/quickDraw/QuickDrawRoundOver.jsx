/**
 * @file QuickDrawRoundOver.jsx
 * @description Overlay panel displayed between rounds in Quick Draw.
 * Shows the round result (correct guess or time-out), reveals the target word,
 * displays the running match score, and offers a "Next Round" or "See Final
 * Results" call-to-action.
 */

import React from 'react';

/**
 * Round-over overlay rendered when a drawing round ends (either by a correct
 * guess or by the timer expiring) but the match itself is still ongoing.
 *
 * @param {object} props
 * @param {string|null} props.winner - The userId of the round winner, or null on timeout.
 * @param {string} props.userId - The local user's ID.
 * @param {string} props.partnerId - The partner's ID.
 * @param {object|null} props.partner - Partner profile object (used for display name).
 * @param {object|null} props.user - Local user profile object (used for display name).
 * @param {string} props.targetWord - The word that was being drawn this round.
 * @param {number} props.currentRound - The 1-based index of the round just completed.
 * @param {number} props.maxRounds - The total number of rounds in the match.
 * @param {object} props.scores - Map of `{ [userId]: number }` cumulative match points.
 * @param {Function} props.handleNextRound - Callback to advance to the next round.
 * @returns {React.ReactElement}
 */
export default function QuickDrawRoundOver({
  winner,
  userId,
  partnerId,
  partner,
  user,
  targetWord,
  currentRound,
  maxRounds,
  scores,
  handleNextRound,
}) {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-[340px] text-center space-y-6 shadow-2xl">
        <div className="space-y-2">
          {winner ? (
            <>
              <p className="text-3xl font-extrabold text-primary animate-pulse">
                {winner === userId ? 'You Got It! 🎉' : 'Word Guessed! 👏'}
              </p>
              <p className="text-sm text-text-muted">
                {winner === userId
                  ? `You guessed the word correctly!`
                  : `${partner?.name || 'Partner'} guessed the word correctly!`}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-extrabold text-rose-500">Time&apos;s Up! ⏰</p>
              <p className="text-sm text-text-muted">
                Neither player guessed the word in time.
              </p>
            </>
          )}

          <div className="mt-4 p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
            <span className="text-xs text-text-muted uppercase tracking-widest block font-semibold">
              The word was
            </span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{targetWord}</span>
          </div>
        </div>

        {/* Scores */}
        <div className="border-t border-b border-slate-800 py-4 space-y-2">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
            Match Score (Round {currentRound}/{maxRounds})
          </p>
          <div className="flex justify-between items-center px-4">
            <div className="text-left">
              <p className="text-sm font-semibold text-text-main">{user?.name || 'You'}</p>
              <p className="text-xl font-extrabold text-primary">{scores[userId]} pts</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-text-main">
                {partner?.name || 'Partner'}
              </p>
              <p className="text-xl font-extrabold text-primary">{scores[partnerId]} pts</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleNextRound}
          className="w-full py-3 bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20"
        >
          {currentRound < maxRounds
            ? `Next Round (Round ${currentRound + 1}/${maxRounds})`
            : 'See Final Results'}
        </button>
      </div>
    </div>
  );
}
