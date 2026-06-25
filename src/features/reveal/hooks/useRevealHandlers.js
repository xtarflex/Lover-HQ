/**
 * @file useRevealHandlers.js
 * @description Hook that bundles all user-interaction event handlers for the
 * Reveal Q&A feature (answer submission, custom questions, scheduling,
 * favorites, reactions, comments, and nudging).
 */

import { useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Returns a collection of stable event-handler callbacks for the Reveal feature.
 *
 * @param {{
 *   userId: string,
 *   partnerId: string,
 *   partner: Object,
 *   dailyQuestion: Object | null,
 *   userAnswerInput: string,
 *   setUserAnswerInput: Function,
 *   setSubmittingAnswer: Function,
 *   newQuestionText: string,
 *   setNewQuestionText: Function,
 *   newQuestionCategory: string,
 *   setCreatingQuestion: Function,
 *   newCommentTexts: Object,
 *   setNewCommentTexts: Function,
 *   setUserAnswer: Function,
 *   setPartnerAnswer: Function,
 *   customQuestions: Array,
 *   setCustomQuestions: Function,
 *   setArchiveMemories: Function,
 *   setArchiveComments: Function,
 *   setFavorites: Function,
 *   setRevealedToday: Function,
 *   setShowConfetti: Function,
 *   setNudgeShaking: Function,
 *   setMessage: Function,
 *   fetchData: Function,
 *   favorites: Set,
 *   partnerAnswer: Object | null,
 * }} params
 * @returns {{
 *   handleSubmitAnswer: Function,
 *   handleCreateCustomQuestion: Function,
 *   handleScheduleNext: Function,
 *   handleToggleFavorite: Function,
 *   handleToggleReaction: Function,
 *   handleAddComment: Function,
 *   handleNudgePartner: Function,
 * }}
 */
export function useRevealHandlers({
  userId,
  partner,
  dailyQuestion,
  userAnswerInput,
  setUserAnswerInput,
  setSubmittingAnswer,
  newQuestionText,
  setNewQuestionText,
  newQuestionCategory,
  setCreatingQuestion,
  newCommentTexts,
  setNewCommentTexts,
  setUserAnswer,
  setPartnerAnswer,
  customQuestions,
  setCustomQuestions,
  setArchiveMemories,
  setArchiveComments,
  setFavorites,
  setRevealedToday,
  setShowConfetti,
  setNudgeShaking,
  setMessage,
  fetchData,
  favorites,
  partnerAnswer,
}) {
  const syncRevealOffline = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const queue = JSON.parse(localStorage.getItem('reveal_offline_queue') || '[]');
      if (queue.length === 0) return;

      const remaining = [];
      for (const action of queue) {
        try {
          if (action.type === 'answer') {
            await supabase.from('reveal_answers').insert(action.data);
          } else if (action.type === 'custom_question') {
            await supabase.from('reveal_questions').insert(action.data);
          }
        } catch (err) {
          console.error('Failed to sync offline reveal action:', err);
          remaining.push(action);
        }
      }
      localStorage.setItem('reveal_offline_queue', JSON.stringify(remaining));

      // If we synced successfully, refresh data to get correct IDs/states
      if (queue.length > remaining.length) {
        fetchData();
      }
    } catch (e) {
      console.error('Failed to sync reveal offline queue:', e);
    }
  }, [fetchData]);

  useEffect(() => {
    window.addEventListener('online', syncRevealOffline);
    const timer = setTimeout(() => {
      syncRevealOffline();
    }, 500);
    return () => {
      window.removeEventListener('online', syncRevealOffline);
      clearTimeout(timer);
    };
  }, [syncRevealOffline]);

  /**
   * Submits the user's answer for today's daily question.
   * Triggers confetti + reveal if the partner has already answered.
   *
   * @param {React.FormEvent} e
   * @returns {Promise<void>}
   */
  const handleSubmitAnswer = useCallback(
    async (e) => {
      e.preventDefault();
      if (!userAnswerInput.trim() || !dailyQuestion) return;
      setSubmittingAnswer(true);

      const answerText = userAnswerInput.trim();
      const ansPayload = {
        question_id: dailyQuestion.question_id,
        user_id: userId,
        answer: answerText,
      };

      const mockAns = {
        id: `offline-${Date.now()}`,
        ...ansPayload,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      setUserAnswer(mockAns);
      setUserAnswerInput('');

      // Check offline state
      if (!navigator.onLine) {
        try {
          const queue = JSON.parse(localStorage.getItem('reveal_offline_queue') || '[]');
          queue.push({ type: 'answer', data: ansPayload });
          localStorage.setItem('reveal_offline_queue', JSON.stringify(queue));
          localStorage.setItem('reveal_user_answer_cache', JSON.stringify(mockAns));

          setMessage({
            type: 'success',
            text: 'Answer saved offline! Will sync when connection returns.',
          });
          if (partnerAnswer) {
            setRevealedToday(true);
          }
        } catch (err) {
          console.error('Failed to queue offline answer:', err);
        } finally {
          setSubmittingAnswer(false);
        }
        return;
      }

      try {
        const { data: ans, error } = await supabase
          .from('reveal_answers')
          .insert(ansPayload)
          .select()
          .single();
        if (error) throw error;
        setUserAnswer(ans);
        localStorage.setItem('reveal_user_answer_cache', JSON.stringify(ans));
        setMessage({ type: 'success', text: 'Answer submitted! Your partner is next.' });
        if (partnerAnswer) {
          setRevealedToday(true);
          setShowConfetti(true);
          fetchData();
        }
      } catch (err) {
        console.error('Submit answer error:', err);
        setMessage({ type: 'error', text: 'Failed to submit answer: ' + err.message });
      } finally {
        setSubmittingAnswer(false);
      }
    },
    [
      userId,
      dailyQuestion,
      userAnswerInput,
      setUserAnswerInput,
      setSubmittingAnswer,
      setUserAnswer,
      setMessage,
      partnerAnswer,
      setRevealedToday,
      setShowConfetti,
      fetchData,
    ]
  );

  /**
   * Creates a new custom question and prepends it to the local queue.
   *
   * @param {React.FormEvent} e
   * @returns {Promise<void>}
   */
  const handleCreateCustomQuestion = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newQuestionText.trim()) return;
      setCreatingQuestion(true);

      const questionText = newQuestionText.trim();
      const qPayload = {
        user_id: userId,
        content: questionText,
        category: newQuestionCategory,
      };

      const mockQ = {
        id: `offline-${Date.now()}`,
        ...qPayload,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      setCustomQuestions((prev) => [mockQ, ...prev]);
      setNewQuestionText('');

      if (!navigator.onLine) {
        try {
          const queue = JSON.parse(localStorage.getItem('reveal_offline_queue') || '[]');
          queue.push({ type: 'custom_question', data: qPayload });
          localStorage.setItem('reveal_offline_queue', JSON.stringify(queue));

          const cachedCustomQ = JSON.parse(
            localStorage.getItem('reveal_custom_questions_cache') || '[]'
          );
          localStorage.setItem(
            'reveal_custom_questions_cache',
            JSON.stringify([mockQ, ...cachedCustomQ])
          );

          setMessage({
            type: 'success',
            text: 'Question saved offline! Will sync when connection returns.',
          });
        } catch (err) {
          console.error('Failed to queue offline custom question:', err);
        } finally {
          setCreatingQuestion(false);
        }
        return;
      }

      try {
        const { data: newQ, error } = await supabase
          .from('reveal_questions')
          .insert(qPayload)
          .select()
          .single();
        if (error) throw error;
        setCustomQuestions((prev) => [newQ, ...prev]);
        setMessage({ type: 'success', text: 'Custom question added to rotation queue!' });
      } catch (err) {
        console.error('Create custom question failed:', err);
        setMessage({ type: 'error', text: 'Failed to create question: ' + err.message });
      } finally {
        setCreatingQuestion(false);
      }
    },
    [
      userId,
      newQuestionText,
      newQuestionCategory,
      setCreatingQuestion,
      setCustomQuestions,
      setNewQuestionText,
      setMessage,
    ]
  );

  /**
   * Schedules a custom question for tomorrow's date.
   *
   * @param {string} qId - The custom question row ID.
   * @returns {Promise<void>}
   */
  const handleScheduleNext = useCallback(
    async (qId) => {
      try {
        const scheduledDates = new Set(
          (customQuestions || [])
            .map((q) => q.scheduled_for_date)
            .filter(Boolean)
        );

        const t = new Date();
        let daysOffset = 1;
        let targetStr;
        do {
          const targetDate = new Date(t);
          targetDate.setDate(t.getDate() + daysOffset);
          targetStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
          daysOffset++;
        } while (scheduledDates.has(targetStr));

        const { error } = await supabase
          .from('reveal_questions')
          .update({ scheduled_for_date: targetStr })
          .eq('id', qId);
        if (error) throw error;
        setCustomQuestions((prev) =>
          prev.map((q) => (q.id === qId ? { ...q, scheduled_for_date: targetStr } : q))
        );
        setMessage({ type: 'success', text: `Scheduled for question on ${targetStr}!` });
      } catch (err) {
        console.error('Scheduling failed:', err);
        setMessage({ type: 'error', text: 'Failed to schedule question: ' + err.message });
      }
    },
    [customQuestions, setCustomQuestions, setMessage]
  );

  /**
   * Toggles a question's starred/favorite status for the current user.
   *
   * @param {string} questionId
   * @returns {Promise<void>}
   */
  const handleToggleFavorite = useCallback(
    async (questionId) => {
      const isFav = favorites.has(questionId);
      try {
        if (isFav) {
          await supabase
            .from('reveal_favorites')
            .delete()
            .eq('user_id', userId)
            .eq('question_id', questionId);
          setFavorites((prev) => {
            const n = new Set(prev);
            n.delete(questionId);
            return n;
          });
        } else {
          await supabase
            .from('reveal_favorites')
            .insert({ user_id: userId, question_id: questionId });
          setFavorites((prev) => {
            const n = new Set(prev);
            n.add(questionId);
            return n;
          });
        }
      } catch (err) {
        console.error('Toggle favorite failed:', err);
      }
    },
    [userId, favorites, setFavorites]
  );

  /**
   * Toggles an emoji reaction on an answer (persisted to Supabase).
   *
   * @param {Object} answer - The answer row object.
   * @param {string} emojiChar - The emoji character string.
   * @returns {Promise<void>}
   */
  const handleToggleReaction = useCallback(
    async (answer, emojiChar) => {
      const current = { ...(answer.reactions || {}) };
      const list = current[emojiChar] ? [...current[emojiChar]] : [];
      const newReactions = list.includes(userId)
        ? { ...current, [emojiChar]: list.filter((id) => id !== userId) }
        : { ...current, [emojiChar]: [...list, userId] };
      try {
        const { error } = await supabase
          .from('reveal_answers')
          .update({ reactions: newReactions })
          .eq('id', answer.id);
        if (error) throw error;
        if (answer.question_id === dailyQuestion?.question_id) {
          answer.user_id === userId
            ? setUserAnswer((p) => ({ ...p, reactions: newReactions }))
            : setPartnerAnswer((p) => ({ ...p, reactions: newReactions }));
        }
        setArchiveMemories((prev) =>
          prev.map((m) =>
            m.question_id !== answer.question_id
              ? m
              : {
                  ...m,
                  user: m.user?.id === answer.id ? { ...m.user, reactions: newReactions } : m.user,
                  partner:
                    m.partner?.id === answer.id
                      ? { ...m.partner, reactions: newReactions }
                      : m.partner,
                }
          )
        );
      } catch (err) {
        console.error('Toggle reaction failed:', err);
      }
    },
    [userId, dailyQuestion, setUserAnswer, setPartnerAnswer, setArchiveMemories]
  );

  /**
   * Submits a new comment for a past Q&A and updates local state.
   *
   * @param {string} questionId
   * @returns {Promise<void>}
   */
  const handleAddComment = useCallback(
    async (questionId) => {
      const text = newCommentTexts[questionId];
      if (!text?.trim()) return;
      try {
        const { data: newC, error } = await supabase
          .from('reveal_comments')
          .insert({ question_id: questionId, user_id: userId, content: text.trim() })
          .select()
          .single();
        if (error) throw error;
        setNewCommentTexts((prev) => ({ ...prev, [questionId]: '' }));
        setArchiveComments((prev) => {
          const l = prev[questionId] || [];
          if (l.some((c) => c.id === newC.id)) return prev;
          return { ...prev, [questionId]: [...l, newC] };
        });
      } catch (err) {
        console.error('Add comment failed:', err);
      }
    },
    [userId, newCommentTexts, setNewCommentTexts, setArchiveComments]
  );

  /**
   * Triggers a shake animation on the question card and shows a nudge notification.
   *
   * @returns {void}
   */
  const handleNudgePartner = useCallback(() => {
    setNudgeShaking(true);
    setTimeout(() => setNudgeShaking(false), 800);
    setMessage({
      type: 'info',
      text: `Nudged ${partner?.name || 'partner'}! They will receive a shake indicator.`,
    });
  }, [partner, setNudgeShaking, setMessage]);

  return {
    handleSubmitAnswer,
    handleCreateCustomQuestion,
    handleScheduleNext,
    handleToggleFavorite,
    handleToggleReaction,
    handleAddComment,
    handleNudgePartner,
  };
}
