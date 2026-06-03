/**
 * @file useRevealFilters.js
 * @description Hook that derives the filtered archive memory list and the
 * question-detail resolver for the Reveal Q&A feature.
 */

import { useMemo, useCallback } from 'react';
import promptsData from '../prompts.json';

/**
 * Provides a question-detail resolver and a filtered/sorted archive list
 * derived from the current search, category, and tab filter state.
 *
 * @param {{
 *   archiveMemories: Array,
 *   customQuestions: Array,
 *   searchQuery: string,
 *   activeCategoryFilter: string,
 *   activeArchiveTab: string,
 *   favorites: Set,
 * }} params
 * @returns {{
 *   getQuestionDetails: (qId: string) => { content: string, category: string },
 *   filteredMemories: Array,
 * }}
 */
export function useRevealFilters({
  archiveMemories,
  customQuestions,
  searchQuery,
  activeCategoryFilter,
  activeArchiveTab,
  favorites,
}) {
  /**
   * Returns the content and category for a given question ID string.
   * Handles both `default-` prefixed built-in prompts and `custom-` prefixed user questions.
   *
   * @param {string} qId - The question ID string.
   * @returns {{ content: string, category: string }}
   */
  const getQuestionDetails = useCallback(
    (qId) => {
      if (qId.startsWith('default-')) {
        const defaultQ = promptsData.find((p) => p.id === qId.replace('default-', ''));
        return {
          content: defaultQ?.content ?? 'Relationship Question',
          category: defaultQ?.category ?? 'general',
        };
      }
      const customQ = customQuestions.find((q) => `custom-${q.id}` === qId);
      return {
        content: customQ?.content ?? 'Custom Relationship Question',
        category: 'custom',
      };
    },
    [customQuestions]
  );

  /**
   * Memoized list of archive memories filtered by search query, category, and tab.
   *
   * @type {Array}
   */
  const filteredMemories = useMemo(
    () =>
      archiveMemories.filter((m) => {
        const q = getQuestionDetails(m.question_id);
        if (activeCategoryFilter !== 'all' && q.category !== activeCategoryFilter) return false;
        if (searchQuery.trim()) {
          const s = searchQuery.toLowerCase();
          if (
            !q.content.toLowerCase().includes(s) &&
            !m.user?.answer.toLowerCase().includes(s) &&
            !m.partner?.answer.toLowerCase().includes(s)
          )
            return false;
        }
        if (activeArchiveTab === 'favorites' && !favorites.has(m.question_id)) return false;
        return true;
      }),
    [archiveMemories, activeCategoryFilter, searchQuery, activeArchiveTab, favorites, getQuestionDetails]
  );

  return { getQuestionDetails, filteredMemories };
}
