/* eslint-disable */
/**
 * @file useRevealData.js
 * @description Hook managing all Supabase data-fetching and real-time
 * subscriptions for the Reveal Q&A feature.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { getCoupleSeed } from './useDailyQuestion';
import promptsData from '../prompts.json';

/**
 * Hook that fetches all Reveal data from Supabase and sets up real-time
 * subscriptions for live answer and comment updates.
 *
 * @param {{
 *   userId: string,
 *   partnerId: string,
 *   coupleKey: string,
 *   todayStr: string,
 *   initializeDailyQuestion: Function
 * }} params
 * @returns {{
 *   dailyQuestion: Object | null,
 *   userAnswer: Object | null,
 *   setUserAnswer: Function,
 *   partnerAnswer: Object | null,
 *   setPartnerAnswer: Function,
 *   customQuestions: Array,
 *   setCustomQuestions: Function,
 *   archiveMemories: Array,
 *   setArchiveMemories: Function,
 *   archiveComments: Object,
 *   setArchiveComments: Function,
 *   favorites: Set,
 *   setFavorites: Function,
 *   revealedToday: boolean,
 *   setRevealedToday: Function,
 *   loading: boolean,
 *   message: Object | null,
 *   setMessage: Function,
 *   fetchData: Function
 * }}
 */
export function useRevealData({ userId, partnerId, coupleKey, todayStr, initializeDailyQuestion }) {
  const [dailyQuestion, setDailyQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [partnerAnswer, setPartnerAnswer] = useState(null);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [archiveMemories, setArchiveMemories] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [archiveComments, setArchiveComments] = useState({});
  const [revealedToday, setRevealedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const commentSubscriptionRef = useRef(null);
  const answerSubscriptionRef = useRef(null);

  /**
   * Loads daily question, custom questions, favorites, today's answers,
   * the archive list, and archive comments from local storage, generating a default
   * daily question if none exists for the current day.
   *
   * @returns {void}
   */
  const loadCachedData = useCallback(() => {
    try {
      const cachedQ = localStorage.getItem('reveal_daily_question_cache');
      const cachedUserA = localStorage.getItem('reveal_user_answer_cache');
      const cachedPartnerA = localStorage.getItem('reveal_partner_answer_cache');
      const cachedCustomQ = localStorage.getItem('reveal_custom_questions_cache');
      const cachedArchive = localStorage.getItem('reveal_archive_memories_cache');
      const cachedComments = localStorage.getItem('reveal_archive_comments_cache');

      let currentQ = null;
      if (cachedQ) {
        currentQ = JSON.parse(cachedQ);
      }

      // If no daily question is cached for today, compute a seed-based default daily question offline
      if (!currentQ || currentQ.active_date !== todayStr) {
        const coupleSeed = getCoupleSeed(userId, partnerId);
        const todayObj = new Date();
        const dayOfYear = Math.floor(
          (todayObj - new Date(todayObj.getFullYear(), 0, 0)) / 86400000
        );
        const promptIndex = (dayOfYear + coupleSeed) % promptsData.length;
        const selectedPrompt = promptsData[promptIndex];
        currentQ = {
          user_id: coupleKey,
          question_id: `default-${selectedPrompt.id}`,
          content: selectedPrompt.content,
          category: selectedPrompt.category,
          active_date: todayStr,
        };
        localStorage.setItem('reveal_daily_question_cache', JSON.stringify(currentQ));
        localStorage.removeItem('reveal_user_answer_cache');
        localStorage.removeItem('reveal_partner_answer_cache');
        setUserAnswer(null);
        setPartnerAnswer(null);
        setRevealedToday(false);
      } else {
        if (cachedUserA) setUserAnswer(JSON.parse(cachedUserA));
        if (cachedPartnerA) setPartnerAnswer(JSON.parse(cachedPartnerA));
        if (cachedUserA && cachedPartnerA) setRevealedToday(true);
      }

      setDailyQuestion(currentQ);
      if (cachedCustomQ) setCustomQuestions(JSON.parse(cachedCustomQ));
      if (cachedArchive) setArchiveMemories(JSON.parse(cachedArchive));
      if (cachedComments) setArchiveComments(JSON.parse(cachedComments));
    } catch (err) {
      console.error('Error loading cached Reveal data:', err);
    }
  }, [userId, partnerId, coupleKey, todayStr]);

  /**
   * Loads daily question, custom questions, favorites, today's answers,
   * the archive list, and archive comments from Supabase.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    if (!userId || !partnerId || !coupleKey) {
      setLoading(false);
      return;
    }
    setLoading(true);

    if (!navigator.onLine) {
      loadCachedData();
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Today's Daily Question from Database
      let { data: dailyRow, error: qError } = await supabase
        .from('reveal_daily_question')
        .select('*')
        .eq('user_id', coupleKey)
        .eq('active_date', todayStr)
        .maybeSingle();

      if (qError) throw qError;

      // If daily question does not exist for today, initialize/select it
      if (!dailyRow) {
        dailyRow = await initializeDailyQuestion();
      }

      setDailyQuestion(dailyRow);
      if (dailyRow) {
        localStorage.setItem('reveal_daily_question_cache', JSON.stringify(dailyRow));
      }

      // 2. Fetch Custom Questions List
      let { data: customQ, error: customError } = await supabase
        .from('reveal_questions')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.${partnerId}`)
        .order('created_at', { ascending: false });

      if (customError) throw customError;

      // Auto-cleanup past scheduled questions that were never initialized (Option B)
      const pastScheduled = customQ?.filter(
        (q) => q.scheduled_for_date && q.scheduled_for_date < todayStr
      );

      if (pastScheduled && pastScheduled.length > 0) {
        const pastScheduledIds = pastScheduled.map((q) => `custom-${q.id}`);
        const { data: activeDailies } = await supabase
          .from('reveal_daily_question')
          .select('question_id')
          .in('question_id', pastScheduledIds);

        const activeDailyIds = new Set(activeDailies?.map((d) => d.question_id) || []);
        const missedQuestionIds = pastScheduled
          .filter((q) => !activeDailyIds.has(`custom-${q.id}`))
          .map((q) => q.id);

        if (missedQuestionIds.length > 0) {
          const { error: resetError } = await supabase
            .from('reveal_questions')
            .update({ scheduled_for_date: null })
            .in('id', missedQuestionIds);

          if (!resetError) {
            const { data: refetched } = await supabase
              .from('reveal_questions')
              .select('*')
              .or(`user_id.eq.${userId},user_id.eq.${partnerId}`)
              .order('created_at', { ascending: false });
            if (refetched) {
              customQ = refetched;
            }
          }
        }
      }

      setCustomQuestions(customQ || []);
      localStorage.setItem('reveal_custom_questions_cache', JSON.stringify(customQ || []));

      // 3. Fetch Favorites
      const { data: favs, error: favsError } = await supabase
        .from('reveal_favorites')
        .select('question_id')
        .eq('user_id', userId);

      if (favsError) throw favsError;
      setFavorites(new Set((favs || []).map((f) => f.question_id)));

      // 4. Fetch Answers for today's question
      let userA = null;
      let partnerA = null;
      if (dailyRow) {
        const { data: todayAns, error: ansError } = await supabase
          .from('reveal_answers')
          .select('*')
          .eq('question_id', dailyRow.question_id);

        if (ansError) throw ansError;
        userA = todayAns?.find((a) => a.user_id === userId) || null;
        partnerA = todayAns?.find((a) => a.user_id === partnerId) || null;

        setUserAnswer(userA);
        setPartnerAnswer(partnerA);
        localStorage.setItem('reveal_user_answer_cache', JSON.stringify(userA));
        localStorage.setItem('reveal_partner_answer_cache', JSON.stringify(partnerA));

        if (userA && partnerA) {
          setRevealedToday(true);
        }
      }

      // 5. Fetch Archive: All Q&A answers
      const { data: allAns, error: allAnsError } = await supabase
        .from('reveal_answers')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.${partnerId}`)
        .order('created_at', { ascending: false });

      if (allAnsError) throw allAnsError;

      // Group answers by question_id
      const grouped = {};
      allAns?.forEach((ans) => {
        if (!grouped[ans.question_id]) {
          grouped[ans.question_id] = {
            question_id: ans.question_id,
            user: null,
            partner: null,
            date: ans.created_at,
          };
        }
        if (ans.user_id === userId) {
          grouped[ans.question_id].user = ans;
        } else {
          grouped[ans.question_id].partner = ans;
        }
      });

      // Filter out Q&As that are today's question (if they aren't fully revealed yet)
      const archiveList = Object.values(grouped).filter((m) => {
        if (m.question_id === dailyRow?.question_id) {
          return m.user && m.partner; // only include today's if fully answered
        }
        return true;
      });

      setArchiveMemories(archiveList);
      localStorage.setItem('reveal_archive_memories_cache', JSON.stringify(archiveList));

      // 6. Fetch Comments for all archive items
      let commentsMap = {};
      if (archiveList.length > 0) {
        const { data: commentsList, error: commentsError } = await supabase
          .from('reveal_comments')
          .select('*')
          .in(
            'question_id',
            archiveList.map((m) => m.question_id)
          )
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;

        commentsList?.forEach((c) => {
          if (!commentsMap[c.question_id]) commentsMap[c.question_id] = [];
          commentsMap[c.question_id].push(c);
        });
        setArchiveComments(commentsMap);
      }
      localStorage.setItem('reveal_archive_comments_cache', JSON.stringify(commentsMap));
    } catch (err) {
      console.error('Fetch reveal data failed:', err);
      const isNetworkError =
        !navigator.onLine ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('network');
      if (isNetworkError) {
        loadCachedData();
        setMessage({ type: 'info', text: 'Viewing cached Q&A data (offline)' });
      } else {
        setMessage({ type: 'error', text: 'Failed to sync Q&A board: ' + err.message });
      }
    } finally {
      setLoading(false);
    }
  }, [userId, partnerId, coupleKey, todayStr, initializeDailyQuestion, loadCachedData]);

  // Trigger initial data load
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        fetchData();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchData]);

  // Real-time subscriptions for answer and comment changes
  useEffect(() => {
    if (!userId || !partnerId) return;

    answerSubscriptionRef.current = supabase
      .channel(`reveal_answers:${userId}_${partnerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reveal_answers' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const answer = payload.new;
            if (answer.user_id === partnerId) {
              setPartnerAnswer(answer);
              localStorage.setItem('reveal_partner_answer_cache', JSON.stringify(answer));
            } else if (answer.user_id === userId) {
              setUserAnswer(answer);
              localStorage.setItem('reveal_user_answer_cache', JSON.stringify(answer));
            }
          }
        }
      )
      .subscribe();

    // Listen for Q&A comments
    commentSubscriptionRef.current = supabase
      .channel(`reveal_comments:${userId}_${partnerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reveal_comments' },
        (payload) => {
          const newComment = payload.new;
          setArchiveComments((prev) => {
            const list = prev[newComment.question_id] || [];
            if (list.some((c) => c.id === newComment.id)) return prev;
            return {
              ...prev,
              [newComment.question_id]: [...list, newComment],
            };
          });
        }
      )
      .subscribe();

    return () => {
      if (answerSubscriptionRef.current) supabase.removeChannel(answerSubscriptionRef.current);
      if (commentSubscriptionRef.current) supabase.removeChannel(commentSubscriptionRef.current);
    };
  }, [userId, partnerId]);

  // Reactively unlock the reveal UI whenever both answers become available.
  // This covers the case where the partner's answer arrives via the real-time
  // subscription — the submitting player already calls setRevealedToday in the
  // handler, but the *watching* player only gets setPartnerAnswer updated, so
  // we must derive revealedToday from both answer states here.
  useEffect(() => {
    if (userAnswer && partnerAnswer) {
      setRevealedToday(true);
    }
  }, [userAnswer, partnerAnswer]);

  return {
    dailyQuestion,
    userAnswer,
    setUserAnswer,
    partnerAnswer,
    setPartnerAnswer,
    customQuestions,
    setCustomQuestions,
    archiveMemories,
    setArchiveMemories,
    archiveComments,
    setArchiveComments,
    favorites,
    setFavorites,
    revealedToday,
    setRevealedToday,
    loading,
    message,
    setMessage,
    fetchData,
  };
}
