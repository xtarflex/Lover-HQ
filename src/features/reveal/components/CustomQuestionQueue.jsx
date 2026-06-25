/**
 * @file CustomQuestionQueue.jsx
 * @description Component for creating custom Reveal questions and
 * scheduling them for upcoming days with advanced queue management.
 */

import React, { useState } from 'react';
import { Plus, Check, Search, Edit3, Trash2, Calendar, CalendarOff, X } from 'lucide-react';
import GlassDropdown from '../../../components/GlassDropdown';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

/**
 * Renders the "Add Custom Q" panel, which contains:
 * - A form to create a new custom question with a category selector.
 * - A searchable, collapsible queue of existing custom questions.
 * - Options to edit, delete, schedule (for tomorrow or custom date), and unschedule questions.
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
 *   onDeleteCustomQuestion: Function,
 *   onUnscheduleCustomQuestion: Function,
 *   onSetCustomDate: Function,
 *   onEditCustomQuestion: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function CustomQuestionQueue({
  customQuestions = [],
  newQuestionText,
  setNewQuestionText,
  newQuestionCategory,
  setNewQuestionCategory,
  creatingQuestion,
  onSubmit,
  onScheduleNext,
  onDeleteCustomQuestion,
  onUnscheduleCustomQuestion,
  onSetCustomDate,
  onEditCustomQuestion,
}) {
  const [showAll, setShowAll] = useState(false);
  const [queueSearch, setQueueSearch] = useState('');
  const [editingQId, setEditingQId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('general');

  // Filter custom questions by search query
  const filteredQuestions = customQuestions.filter((q) => {
    const searchLower = queueSearch.toLowerCase();
    const contentMatch = q.content?.toLowerCase().includes(searchLower);
    const categoryMatch = q.category?.toLowerCase().includes(searchLower);
    return contentMatch || categoryMatch;
  });

  // Decide how many custom questions to display
  const displayedQuestions = showAll ? filteredQuestions : filteredQuestions.slice(0, 3);

  // Today's local date string for the calendar input min boundary
  const todayDateStr = new Date().toISOString().split('T')[0];

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

        {/* 1. Create New Question Form */}
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
              <LoadingSpinner size="xs" className="text-primary" />
            ) : (
              <Check className="w-4.5 h-4.5 text-primary" />
            )}
            Add to Rotation Pool
          </button>
        </form>

        {/* 2. Search & List Section */}
        {customQuestions.length > 0 && (
          <div className="mt-6 border-t border-surface-border/20 pt-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Question Queue
              </label>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="Search custom questions..."
                className="w-full pl-9 pr-8 py-1.5 bg-slate-950/20 border border-surface-border dark:border-slate-800/85 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-[10px] text-text-main font-medium placeholder-text-muted/65"
              />
              {queueSearch && (
                <button
                  type="button"
                  onClick={() => setQueueSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Queue List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {displayedQuestions.map((q) => {
                const isScheduled = q.scheduled_for_date !== null;
                const isEditing = editingQId === q.id;

                if (isEditing) {
                  return (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl bg-slate-950/20 dark:bg-white/5 border border-primary/20 space-y-3 animate-fade-in"
                    >
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full min-h-[50px] p-2 bg-slate-950/10 border border-surface-border dark:border-slate-800 rounded-lg text-[11px] text-text-main focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        maxLength={120}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <GlassDropdown
                          value={editCategory}
                          options={[
                            { value: 'general', label: 'General' },
                            { value: 'romance', label: 'Romance' },
                            { value: 'future', label: 'Future' },
                            { value: 'fun', label: 'Fun' },
                            { value: 'deep', label: 'Deep' },
                          ]}
                          onChange={setEditCategory}
                          size="sm"
                        />
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingQId(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (editContent.trim()) {
                                await onEditCustomQuestion(q.id, editContent.trim(), editCategory);
                                setEditingQId(null);
                              }
                            }}
                            className="px-2 py-1 bg-primary hover:bg-primary-hover text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={q.id}
                    className="p-2 rounded-xl bg-slate-950/10 dark:bg-white/5 border border-surface-border/45 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate flex-1 min-w-0">
                      <p className="font-semibold text-text-main truncate" title={q.content}>
                        &quot;{q.content}&quot;
                      </p>
                      <p className="text-[9px] text-text-muted mt-0.5">
                        {isScheduled
                          ? `Scheduled: ${q.scheduled_for_date}`
                          : `Category: ${q.category}`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQId(q.id);
                          setEditContent(q.content);
                          setEditCategory(q.category);
                        }}
                        className="p-1 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-main transition-all"
                        title="Edit question"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Scheduling Controls */}
                      {isScheduled ? (
                        <button
                          type="button"
                          onClick={() => onUnscheduleCustomQuestion(q.id)}
                          className="p-1 hover:bg-white/10 rounded-lg text-red-500/80 hover:text-red-500 transition-all animate-fade-in"
                          title="Remove from schedule"
                        >
                          <CalendarOff className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <>
                          {/* Tomorrow Quick Schedule */}
                          <button
                            type="button"
                            onClick={() => onScheduleNext(q.id)}
                            className="px-1.5 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary rounded text-[9px] font-extrabold uppercase transition-all"
                            title="Schedule for next available date"
                          >
                            Auto
                          </button>

                          {/* Custom Date Picker */}
                          <div className="relative">
                            <button
                              type="button"
                              className="p-1 hover:bg-white/10 rounded-lg text-text-muted hover:text-primary transition-all"
                              title="Choose custom date"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="date"
                              min={todayDateStr}
                              onChange={(e) => {
                                if (e.target.value) {
                                  onSetCustomDate(q.id, e.target.value);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </div>
                        </>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => onDeleteCustomQuestion(q.id)}
                        className="p-1 hover:bg-red-500/10 rounded-lg text-text-muted hover:text-red-500 transition-all"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredQuestions.length === 0 && (
                <p className="text-center text-[10px] text-text-muted py-4">
                  No matching questions found.
                </p>
              )}
            </div>

            {/* Load More/Less Toggle */}
            {filteredQuestions.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="mt-3 w-full text-center py-1 text-primary hover:underline text-[10px] font-extrabold uppercase tracking-wider transition-all"
              >
                {showAll ? 'Show Less' : `Show All (${filteredQuestions.length})`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
