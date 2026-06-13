/**
 * @file DailyQuestionCard.jsx
 * @description Today's daily question panel for the Reveal Q&A feature.
 * Renders the question text, user answer form, blinded partner panel,
 * emoji reactions, nudge button, and the reveal overlay.
 */

import React from 'react';
import { Lock, Unlock, Calendar, Check, Plus } from 'lucide-react';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

/**
 * Renders the "today's question" card including both answer panels,
 * emoji reactions, the nudge button, and the reveal overlay.
 *
 * @param {{
 *   dailyQuestion: Object,
 *   userAnswer: Object | null,
 *   partnerAnswer: Object | null,
 *   revealedToday: boolean,
 *   setRevealedToday: Function,
 *   userAnswerInput: string,
 *   setUserAnswerInput: Function,
 *   submittingAnswer: boolean,
 *   nudgeShaking: boolean,
 *   userId: string,
 *   partner: Object,
 *   onSubmitAnswer: Function,
 *   onToggleReaction: Function,
 *   onNudgePartner: Function,
 *   onReveal: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function DailyQuestionCard({
  dailyQuestion,
  userAnswer,
  partnerAnswer,
  revealedToday,
  userAnswerInput,
  setUserAnswerInput,
  submittingAnswer,
  nudgeShaking,
  userId,
  partner,
  onSubmitAnswer,
  onToggleReaction,
  onNudgePartner,
  onReveal,
}) {
  return (
    <div
      className={`bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800/80 rounded-3xl shadow-xl p-6 md:p-8 space-y-6 relative overflow-hidden transition-all duration-300 ${
        nudgeShaking ? 'animate-shake' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full tracking-wider">
          {dailyQuestion.category} Question
        </span>
        <div className="flex items-center gap-1.5 text-text-muted text-xs font-semibold">
          <Calendar className="w-4 h-4 text-primary/70" />
          <span>Today</span>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-text-main text-center leading-snug px-2">
        &quot;{dailyQuestion.content}&quot;
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* User Panel */}
        <div className="bg-surface/50 border border-surface-border/50 rounded-2xl p-5 flex flex-col justify-between min-h-[200px]">
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
              Your Answer
            </h3>
            {userAnswer ? (
              <p className="text-sm font-medium text-text-main leading-relaxed">
                {userAnswer.answer}
              </p>
            ) : (
              <form onSubmit={onSubmitAnswer} className="space-y-4">
                <textarea
                  required
                  value={userAnswerInput}
                  onChange={(e) => setUserAnswerInput(e.target.value)}
                  placeholder="Write your secret answer here..."
                  className="w-full min-h-[100px] p-3.5 bg-slate-950/5 border border-surface-border dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-text-main font-medium resize-none leading-relaxed"
                  maxLength={300}
                />
                <button
                  type="submit"
                  disabled={submittingAnswer || !userAnswerInput.trim()}
                  className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {submittingAnswer ? (
                    <LoadingSpinner size="xs" className="text-white" />
                  ) : (
                    <Check className="w-4.5 h-4.5" />
                  )}
                  Submit Secret Answer
                </button>
              </form>
            )}
          </div>

          {userAnswer && (
            <div className="flex gap-2 mt-4 border-t border-surface-border/30 pt-3">
              {['❤️', '😂', '🔥', '✨', '🥺'].map((emoji) => {
                const list = userAnswer.reactions?.[emoji] || [];
                const reacted = list.includes(userId);
                return (
                  <button
                    key={emoji}
                    onClick={() => onToggleReaction(userAnswer, emoji)}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm relative transition-all ${
                      reacted
                        ? 'bg-primary/10 border-primary'
                        : 'bg-transparent border-surface-border hover:bg-surface/50'
                    }`}
                  >
                    <span>{emoji}</span>
                    {list.length > 0 && (
                      <span className={`absolute -top-1 -right-1 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border shadow-sm ${
                        reacted
                          ? 'bg-primary border-primary text-white'
                          : 'bg-slate-700 border-slate-600 text-gray-200'
                      }`}>
                        {list.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Partner Panel (BLIND STATE) */}
        <div className="bg-surface/50 border border-surface-border/50 rounded-2xl p-5 flex flex-col justify-between min-h-[200px] relative overflow-hidden">
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
              {partner?.name || 'Partner'}&apos;s Answer
            </h3>

            {revealedToday && partnerAnswer ? (
              <p className="text-sm font-medium text-text-main leading-relaxed animate-fade-in">
                {partnerAnswer.answer}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                {partnerAnswer ? (
                  <>
                    <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-main">They have submitted!</p>
                      <p className="text-[10px] text-text-muted mt-1">
                        {userAnswer
                          ? 'Tap below to reveal!'
                          : 'Write your answer to unlock what they said.'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      <Lock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-main">Answer Locked</p>
                      <p className="text-[10px] text-text-muted mt-1">
                        Waiting for them to submit their secret answer.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action buttons or Reactions */}
          {revealedToday && partnerAnswer ? (
            <div className="flex gap-2 mt-4 border-t border-surface-border/30 pt-3">
              {['❤️', '😂', '🔥', '✨', '🥺'].map((emoji) => {
                const list = partnerAnswer.reactions?.[emoji] || [];
                const reacted = list.includes(userId);
                return (
                  <button
                    key={emoji}
                    onClick={() => onToggleReaction(partnerAnswer, emoji)}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm relative transition-all ${
                      reacted
                        ? 'bg-primary/10 border-primary'
                        : 'bg-transparent border-surface-border hover:bg-surface/50'
                    }`}
                  >
                    <span>{emoji}</span>
                    {list.length > 0 && (
                      <span className={`absolute -top-1 -right-1 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border shadow-sm ${
                        reacted
                          ? 'bg-primary border-primary text-white'
                          : 'bg-slate-700 border-slate-600 text-gray-200'
                      }`}>
                        {list.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            userAnswer &&
            !partnerAnswer && (
              <button
                onClick={onNudgePartner}
                className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-primary rotate-45" />
                Send Answer Nudge
              </button>
            )
          )}
        </div>
      </div>

      {/* Reveal Trigger Overlay */}
      {userAnswer && partnerAnswer && !revealedToday && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in duration-300">
          <div className="w-14 h-14 bg-primary/20 border border-primary/50 text-primary rounded-full flex items-center justify-center shadow-lg">
            <Unlock className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Both Answers Submitted!</h3>
            <p className="text-xs text-text-muted/80 mt-1 max-w-xs">
              Unlock today&apos;s daily thoughts to reveal what you both wrote.
            </p>
          </div>
          <button
            onClick={onReveal}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 scale-102 transition-transform active:scale-98"
          >
            Reveal Answers
          </button>
        </div>
      )}
    </div>
  );
}
