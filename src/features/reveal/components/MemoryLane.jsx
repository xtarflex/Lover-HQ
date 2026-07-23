/* eslint-disable */
/**
 * @file MemoryLane.jsx
 * @description Archive section for the Reveal Q&A feature.
 * Displays past answered questions with filtering, favorites, reactions, and comments.
 */

import React from 'react';
import { Heart, Search, Send, MessageSquare, ChevronRight, Star, X } from 'lucide-react';
import BottomDrawer from '../../../components/ui/BottomDrawer';

/**
 * Renders the Memory Lane archive panel, including:
 * - A search input and category filter pills
 * - Timeline / Starred tab switcher
 * - A scrollable list of past Q&A memory cards with collapsible answers,
 *   emoji reactions, and a threaded comment section per card.
 *
 * @param {{
 *   filteredMemories: Array,
 *   archiveComments: Object,
 *   newCommentTexts: Object,
 *   setNewCommentTexts: Function,
 *   favorites: Set,
 *   expandedMemoryId: string | null,
 *   setExpandedMemoryId: Function,
 *   searchQuery: string,
 *   setSearchQuery: Function,
 *   activeCategoryFilter: string,
 *   setActiveCategoryFilter: Function,
 *   activeArchiveTab: string,
 *   setActiveArchiveTab: Function,
 *   getQuestionDetails: Function,
 *   userId: string,
 *   partner: Object,
 *   onToggleFavorite: Function,
 *   onToggleReaction: Function,
 *   onAddComment: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function MemoryLane({
  filteredMemories,
  archiveComments,
  newCommentTexts,
  setNewCommentTexts,
  favorites,
  expandedMemoryId,
  setExpandedMemoryId,
  searchQuery,
  setSearchQuery,
  activeCategoryFilter,
  setActiveCategoryFilter,
  activeArchiveTab,
  setActiveArchiveTab,
  getQuestionDetails,
  userId,
  partner,
  onToggleFavorite,
  onToggleReaction,
  onAddComment,
}) {
  return (
    <div className="md:col-span-2 bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800/80 p-5 rounded-3xl shadow-xl flex flex-col min-h-[320px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 border-b border-surface-border/20 pb-4">
        <div>
          <h3 className="font-bold text-text-main text-sm flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            Memory Lane
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">Chronology of past Q&amp;A unlocks.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-48">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
            <Search className="h-4 w-4 text-text-muted" />
          </span>
          <input
            id="search-answers-input"
            name="searchAnswers"
            aria-label="Search answers"
            type="text"
            placeholder="Search answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950/5 border border-surface-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-text-main placeholder:text-text-muted/40 transition-all"
          />
        </div>
      </div>

      {/* Timeline vs Favorites Tabs */}
      <div className="flex gap-2 mb-4 border-b border-surface-border/10 pb-3">
        {[
          { id: 'timeline', label: 'Timeline' },
          { id: 'favorites', label: 'Starred' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveArchiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeArchiveTab === tab.id
                ? 'bg-primary/20 text-primary border border-primary/10 shadow-sm'
                : 'text-text-muted hover:text-text-main border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Categories Horizontal filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-none">
        {['all', 'romance', 'future', 'fun', 'deep', 'custom'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategoryFilter(cat)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-all border ${
              activeCategoryFilter === cat
                ? 'bg-slate-900 border-slate-800 text-white shadow-sm'
                : 'bg-white/5 border-surface-border/20 text-text-muted hover:text-text-main hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List of Archive Memories */}
      <div className="flex-1 overflow-y-auto max-h-[400px] pr-1 space-y-4 custom-scrollbar">
        {filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-text-muted h-full">
            <MessageSquare className="w-8 h-8 text-slate-800 mb-2 animate-bounce" />
            <p className="text-xs font-bold">No memories matched</p>
            <p className="text-[10px] text-text-muted/60 mt-1 max-w-[200px]">
              Submit today&apos;s answer and double check your filter criteria.
            </p>
          </div>
        ) : (
          filteredMemories.map((mem) => {
            const q = getQuestionDetails(mem.question_id);
            const isStarred = favorites.has(mem.question_id);

            return (
              <div
                key={mem.question_id}
                className="border border-surface-border/50 dark:border-slate-800 bg-white/5 hover:bg-white/10 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
              >
                {/* Header Panel */}
                <div
                  onClick={() => setExpandedMemoryId(mem.question_id)}
                  className="p-4 flex items-center justify-between cursor-pointer"
                >
                  <div className="space-y-1.5 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full">
                        {q.category}
                      </span>
                      <span className="text-[9px] text-text-muted font-mono">
                        {new Date(mem.date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-text-main leading-snug">
                      &quot;{q.content}&quot;
                    </h4>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      aria-label={isStarred ? 'Remove from starred' : 'Add to starred'}
                      onClick={() => onToggleFavorite(mem.question_id)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isStarred
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                          : 'border-transparent text-text-muted hover:text-text-main'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-500' : ''}`} />
                    </button>
                    <button
                      aria-label="View memory details"
                      onClick={() => setExpandedMemoryId(mem.question_id)}
                      className="p-1.5 rounded-lg border border-transparent text-text-muted hover:text-text-main hover:bg-white/5 transition-all"
                    >
                      <ChevronRight className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Drawer for Selected Memory Details */}
      {(() => {
        const selectedMemory = filteredMemories.find((mem) => mem.question_id === expandedMemoryId);
        const q = selectedMemory ? getQuestionDetails(selectedMemory.question_id) : null;
        const commentsList = selectedMemory ? (archiveComments[selectedMemory.question_id] || []) : [];

        return (
          <BottomDrawer isOpen={!!selectedMemory} onClose={() => setExpandedMemoryId(null)}>
            {selectedMemory && q && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Drawer Header */}
                <div className="px-5 pb-3 border-b border-surface-border/20 dark:border-slate-800/80 flex items-center justify-between shrink-0">
                  <div className="space-y-1 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full">
                        {q.category}
                      </span>
                      <span className="text-[9px] text-text-muted font-mono">
                        {new Date(selectedMemory.date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-text-main leading-snug">
                      &quot;{q.content}&quot;
                    </h4>
                  </div>
                  <button
                    aria-label="Close memory details"
                    onClick={() => setExpandedMemoryId(null)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-white/5 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                  {/* Symmetrical Answers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* User Answer */}
                    <div className="bg-slate-950/20 dark:bg-slate-950/40 p-4 rounded-2xl border border-surface-border/30 dark:border-slate-800/80 flex flex-col gap-1.5 shadow-sm">
                      <span className="block text-[9px] font-bold text-text-muted uppercase tracking-wider">
                        Your Answer
                      </span>
                      <p className="text-xs font-semibold text-text-main leading-relaxed whitespace-pre-line">
                        {selectedMemory.user?.answer || 'No answer recorded.'}
                      </p>
                    </div>
                    {/* Partner Answer */}
                    <div className="bg-slate-950/20 dark:bg-slate-950/40 p-4 rounded-2xl border border-surface-border/30 dark:border-slate-800/80 flex flex-col gap-1.5 shadow-sm">
                      <span className="block text-[9px] font-bold text-text-muted uppercase tracking-wider">
                        {partner?.name || 'Partner'}&apos;s Answer
                      </span>
                      <p className="text-xs font-semibold text-text-main leading-relaxed whitespace-pre-line">
                        {selectedMemory.partner?.answer || 'No answer recorded.'}
                      </p>
                    </div>
                  </div>

                  {/* Comments/Conversation Board */}
                  <div className="space-y-3">
                    <span className="block text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      Conversation thread ({commentsList.length})
                    </span>

                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                      {commentsList.length === 0 ? (
                        <p className="text-[10px] text-text-muted/65 italic px-1 py-2">
                          No replies yet. Start a discussion below!
                        </p>
                      ) : (
                        commentsList.map((com) => {
                          const isMe = com.user_id === userId;
                          return (
                            <div
                              key={com.id}
                              className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed shadow-sm ${
                                isMe
                                  ? 'bg-primary/10 border border-primary/20 text-text-main ml-auto'
                                  : 'bg-white/5 dark:bg-slate-950/45 border border-surface-border/40 dark:border-slate-800/60 text-text-main mr-auto'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-6 mb-1">
                                <span className="text-[8px] font-extrabold text-primary">
                                  {isMe ? 'You' : partner?.name || 'Partner'}
                                </span>
                                <span className="text-[8px] text-text-muted/65 font-mono">
                                  {new Date(com.created_at).toLocaleTimeString([], {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="font-semibold text-text-main leading-relaxed">
                                {com.content}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Add Comment Input sticky at the bottom */}
                <div className="p-4 border-t border-surface-border/20 dark:border-slate-800/80 bg-surface/95 dark:bg-slate-900/95 flex gap-2 items-center shrink-0">
                  <input
                    id={`add-comment-input-${selectedMemory.question_id}`}
                    name="newComment"
                    aria-label="Add a comment"
                    type="text"
                    value={newCommentTexts[selectedMemory.question_id] || ''}
                    onChange={(e) =>
                      setNewCommentTexts((prev) => ({
                        ...prev,
                        [selectedMemory.question_id]: e.target.value,
                      }))
                    }
                    placeholder="Write a message..."
                    className="flex-grow bg-slate-950/20 dark:bg-slate-950/40 border border-surface-border/60 dark:border-slate-800/80 text-text-main placeholder:text-text-muted/40 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
                    maxLength={200}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (newCommentTexts[selectedMemory.question_id] || '').trim()) {
                        onAddComment(selectedMemory.question_id);
                      }
                    }}
                  />
                  <button
                    aria-label="Send comment"
                    onClick={() => onAddComment(selectedMemory.question_id)}
                    disabled={!(newCommentTexts[selectedMemory.question_id] || '').trim()}
                    className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white p-2 rounded-xl transition-all shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </BottomDrawer>
        );
      })()}
    </div>
  );
}
