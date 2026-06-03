/**
 * @file useRevealData.js
 * @description Hook managing all Supabase data-fetching and real-time
 * subscriptions for the Reveal Q&A feature.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

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

      // 2. Fetch Custom Questions List
      const { data: customQ, error: customError } = await supabase
        .from('reveal_questions')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.${partnerId}`)
        .order('created_at', { ascending: false });

      if (customError) throw customError;
      setCustomQuestions(customQ || []);

      // 3. Fetch Favorites
      const { data: favs, error: favsError } = await supabase
        .from('reveal_favorites')
        .select('question_id')
        .eq('user_id', userId);

      if (favsError) throw favsError;
      setFavorites(new Set((favs || []).map((f) => f.question_id)));

      // 4. Fetch Answers for today's question
      if (dailyRow) {
        const { data: todayAns, error: ansError } = await supabase
          .from('reveal_answers')
          .select('*')
          .eq('question_id', dailyRow.question_id);

        if (ansError) throw ansError;
        const userA = todayAns?.find((a) => a.user_id === userId) || null;
        const partnerA = todayAns?.find((a) => a.user_id === partnerId) || null;

        setUserAnswer(userA);
        setPartnerAnswer(partnerA);

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

      // 6. Fetch Comments for all archive items
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

        const commentsMap = {};
        commentsList?.forEach((c) => {
          if (!commentsMap[c.question_id]) commentsMap[c.question_id] = [];
          commentsMap[c.question_id].push(c);
        });
        setArchiveComments(commentsMap);
      }
    } catch (err) {
      console.error('Fetch reveal data failed:', err);
      setMessage({ type: 'error', text: 'Failed to sync Q&A board: ' + err.message });
    } finally {
      setLoading(false);
    }
  }, [userId, partnerId, coupleKey, todayStr, initializeDailyQuestion]);

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

    // Listen for answer changes (revealing when partner submits)
    answerSubscriptionRef.current = supabase
      .channel('public:reveal_answers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reveal_answers' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const answer = payload.new;
            if (answer.user_id === partnerId) {
              setPartnerAnswer(answer);
            } else if (answer.user_id === userId) {
              setUserAnswer(answer);
            }
          }
        }
      )
      .subscribe();

    // Listen for Q&A comments
    commentSubscriptionRef.current = supabase
      .channel('public:reveal_comments')
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
