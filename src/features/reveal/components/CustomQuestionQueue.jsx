/**
 * @file CustomQuestionQueue.jsx
 * @description Component for creating custom Reveal questions and
 * scheduling them for upcoming days.
 */

import React from 'react';
import { Plus, Check } from 'lucide-react';
import GlassDropdown from '../../../components/GlassDropdown';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

/**
 * Renders the "Add Custom Q" panel, which contains:
 * - A form to create a new custom question with a category selector.
 * - A scrollable queue of existing custom questions with a "Tomorrow" scheduling button
 *   for any that have not yet been scheduled.
 *
 * @param {{
 *   customQuestions: Array,
 *   newQuestionText: string,
 *   setNewQuestionText: Function,
 *   newQuestionCategory: string,
 *   setNewQuestionCategory: Function,
 *   creatingQuestion: boolean,
 *   onSubmit: Function,
 *   onScheduleNext: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function CustomQuestionQueue({
  customQuestions,
  newQuestionText,
  setNewQuestionText,
  newQuestionCategory,
  setNewQuestionCategory,
  creatingQuestion,
  onSubmit,
  onScheduleNext,
}) {
  return (
    <div className="md:col-span-1 bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800/80 p-5 rounded-3xl shadow-xl flex flex-col justify-between min-h-[320px]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-main text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-primary" />
            Add Custom Q
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary">
            Queue Size: {customQuestions.length}
          </span>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Question Text
            </label>
            <textarea
              required
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="e.g. What is our signature travel snack?"
              className="w-full min-h-[80px] p-3 bg-slate-950/5 border border-surface-border dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs text-text-main font-medium resize-none leading-relaxed"
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Category
            </label>
            <GlassDropdown
              value={newQuestionCategory}
              options={[
                { value: 'general', label: 'General' },
                { value: 'romance', label: 'Romance' },
                { value: 'future', label: 'Future' },
                { value: 'fun', label: 'Fun' },
                { value: 'deep', label: 'Deep' },
              ]}
              onChange={setNewQuestionCategory}
              size="sm"
            />
          </div>

          <button
            type="submit"
            disabled={creatingQuestion || !newQuestionText.trim()}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
          >
            {creatingQuestion ? (
              <LoadingSpinner size="sm" className="text-primary w-4.5 h-4.5" />
            ) : (
              <Check className="w-4.5 h-4.5 text-primary" />
            )}
            Add to Rotation
          </button>
        </form>

        {customQuestions.length > 0 && (
          <div className="mt-6 border-t border-surface-border/20 pt-4 animate-fade-in">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Question Queue
            </label>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
              {customQuestions.map((q) => {
                const isScheduled = q.scheduled_for_date !== null;
                return (
                  <div
                    key={q.id}
                    className="p-2 rounded-xl bg-slate-950/10 dark:bg-white/5 border border-surface-border/45 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate flex-1">
                      <p className="font-semibold text-text-main truncate">
                        &quot;{q.content}&quot;
                      </p>
                      <p className="text-[9px] text-text-muted mt-0.5">
                        {isScheduled
                          ? `Scheduled: ${q.scheduled_for_date}`
                          : `Category: ${q.category}`}
                      </p>
                    </div>
                    {!isScheduled && (
                      <button
                        onClick={() => onScheduleNext(q.id)}
                        className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[9px] font-extrabold uppercase transition-all shrink-0"
                      >
                        Tomorrow
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
