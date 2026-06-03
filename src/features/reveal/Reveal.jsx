import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Heart,
  Sparkles,
  Search,
  Lock,
  Unlock,
  Send,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronUp,
  Star,
  Check,
  Plus,
  Loader,
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../components/Notification';
import GlassDropdown from '../../components/GlassDropdown';
import promptsData from './prompts.json';

/**
 * @file Reveal.jsx
 * @description Stateful blind Q&A feature screen. Synchronizes daily questions, blurs partner answers,
 * triggers confetti, hosts custom questions scheduling, and maintains an archive (Memory Lane).
 */

/**
 * Computes a stable, unique numeric seed for a couple based on their user IDs.
 */
const getCoupleSeed = (uid1, uid2) => {
  const combined = [uid1, uid2].sort().join('');
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export default function Reveal() {
  const { user, partner } = useAppContext();
  const userId = user?.id;
  const partnerId = partner?.id;

  // Stable couple identifier used for daily active question entries
  const coupleKey = useMemo(() => {
    if (!userId || !partnerId) return null;
    return [userId, partnerId].sort()[0];
  }, [userId, partnerId]);

  // Today's Date String in local timezone (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // --- Core State ---
  const [dailyQuestion, setDailyQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [partnerAnswer, setPartnerAnswer] = useState(null);
  const [userAnswerInput, setUserAnswerInput] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const [customQuestions, setCustomQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState('general');
  const [creatingQuestion, setCreatingQuestion] = useState(false);

  const [archiveMemories, setArchiveMemories] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [archiveComments, setArchiveComments] = useState({}); // mapped by question_id -> list of comments
  const [expandedMemoryId, setExpandedMemoryId] = useState(null);
  const [newCommentTexts, setNewCommentTexts] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [activeArchiveTab, setActiveArchiveTab] = useState('timeline'); // 'timeline' or 'favorites'

  const [nudgeShaking, setNudgeShaking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealedToday, setRevealedToday] = useState(false);

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const confettiCanvasRef = useRef(null);
  const commentSubscriptionRef = useRef(null);
  const answerSubscriptionRef = useRef(null);

  // --- Confetti Animation ---
  useEffect(() => {
    if (!showConfetti || !confettiCanvasRef.current) return;
    const canvas = confettiCanvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ec4899', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
    const particles = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
    }));

    let animationFrameId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 5;

        if (p.y < canvas.height) {
          active = true;
        } else {
          // Recycle
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (active) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    const stopTimer = setTimeout(() => {
      setShowConfetti(false);
      cancelAnimationFrame(animationFrameId);
    }, 4000);

    return () => {
      clearTimeout(stopTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showConfetti]);

  // --- Real-time Subscriptions ---
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

  // --- Fetch Initial Data ---
  // --- Daily Question Initialization Logic ---
  const initializeDailyQuestion = useCallback(async () => {
    // 1. Check if there is a custom question manually scheduled for today
    const { data: scheduled, error: schedError } = await supabase
      .from('reveal_questions')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.${partnerId}`)
      .eq('scheduled_for_date', todayStr)
      .maybeSingle();

    if (!schedError && scheduled) {
      // Create active question row
      const newDaily = {
        user_id: coupleKey,
        question_id: `custom-${scheduled.id}`,
        content: scheduled.content,
        category: scheduled.category || 'general',
        active_date: todayStr,
      };

      const { data: inserted, error: insError } = await supabase
        .from('reveal_daily_question')
        .insert(newDaily)
        .select()
        .single();

      if (!insError) return inserted;
    }

    // 2. Query configurations settings to see if custom questions are mixed automatically
    const mixFreq = parseInt(localStorage.getItem('reveal_custom_question_freq') || '25', 10);
    const shouldTryCustom = mixFreq > 0 && Math.random() * 100 < mixFreq;

    if (shouldTryCustom) {
      // Find an unscheduled/unused custom question
      const { data: unusedCustoms } = await supabase
        .from('reveal_questions')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.${partnerId}`)
        .is('scheduled_for_date', null)
        .limit(10);

      if (unusedCustoms && unusedCustoms.length > 0) {
        // Pick one randomly
        const selected = unusedCustoms[Math.floor(Math.random() * unusedCustoms.length)];

        // Mark it as scheduled so it isn't picked again
        await supabase
          .from('reveal_questions')
          .update({ scheduled_for_date: todayStr })
          .eq('id', selected.id);

        const newDaily = {
          user_id: coupleKey,
          question_id: `custom-${selected.id}`,
          content: selected.content,
          category: selected.category || 'general',
          active_date: todayStr,
        };

        const { data: inserted, error: insError } = await supabase
          .from('reveal_daily_question')
          .insert(newDaily)
          .select()
          .single();

        if (!insError) return inserted;
      }
    }

    // 3. Fallback: Select stable default question using couple seed
    const coupleSeed = getCoupleSeed(userId, partnerId);
    const todayObj = new Date();
    const dayOfYear = Math.floor((todayObj - new Date(todayObj.getFullYear(), 0, 0)) / 86400000);
    const promptIndex = (dayOfYear + coupleSeed) % promptsData.length;
    const selectedPrompt = promptsData[promptIndex];

    const newDaily = {
      user_id: coupleKey,
      question_id: `default-${selectedPrompt.id}`,
      content: selectedPrompt.content,
      category: selectedPrompt.category,
      active_date: todayStr,
    };

    const { data: inserted, error: insError } = await supabase
      .from('reveal_daily_question')
      .insert(newDaily)
      .select()
      .single();

    if (insError) {
      // In case of race condition (partner already created the row just now)
      const { data: existing } = await supabase
        .from('reveal_daily_question')
        .select('*')
        .eq('user_id', coupleKey)
        .eq('active_date', todayStr)
        .single();
      if (existing) return existing;
      throw insError;
    }

    return inserted;
  }, [userId, partnerId, coupleKey, todayStr]);

  // --- Fetch Initial Data ---
  const fetchData = useCallback(async () => {
    if (!userId || !partnerId || !coupleKey) return;
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

  // --- Submit Daily Answer ---
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!userAnswerInput.trim() || !dailyQuestion) return;

    setSubmittingAnswer(true);
    try {
      const { data: ans, error: ansError } = await supabase
        .from('reveal_answers')
        .insert({
          question_id: dailyQuestion.question_id,
          user_id: userId,
          answer: userAnswerInput.trim(),
        })
        .select()
        .single();

      if (ansError) throw ansError;
      setUserAnswer(ans);
      setUserAnswerInput('');
      setMessage({ type: 'success', text: 'Answer submitted! Your partner is next.' });

      // Check if partner has already answered to trigger immediate reveal celebration
      if (partnerAnswer) {
        setRevealedToday(true);
        setShowConfetti(true);
        // Refresh archive list
        fetchData();
      }
    } catch (err) {
      console.error('Submit answer error:', err);
      setMessage({ type: 'error', text: 'Failed to submit answer: ' + err.message });
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // --- Add Custom Question ---
  const handleCreateCustomQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    setCreatingQuestion(true);
    try {
      const { data: newQ, error: newQError } = await supabase
        .from('reveal_questions')
        .insert({
          user_id: userId,
          content: newQuestionText.trim(),
          category: newQuestionCategory,
        })
        .select()
        .single();

      if (newQError) throw newQError;
      setCustomQuestions((prev) => [newQ, ...prev]);
      setNewQuestionText('');
      setMessage({ type: 'success', text: 'Custom question added to rotation queue!' });
    } catch (err) {
      console.error('Create custom question failed:', err);
      setMessage({ type: 'error', text: 'Failed to create question: ' + err.message });
    } finally {
      setCreatingQuestion(false);
    }
  };

  // --- Manual Question Scheduling ("Set as Next Question") ---
  const handleScheduleNext = async (qId) => {
    try {
      // Calculate tomorrow's date string
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      // Update question schedule
      const { error: updateError } = await supabase
        .from('reveal_questions')
        .update({ scheduled_for_date: tomStr })
        .eq('id', qId);

      if (updateError) throw updateError;

      // Refresh list locally
      setCustomQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, scheduled_for_date: tomStr } : q))
      );

      setMessage({ type: 'success', text: `Scheduled for tomorrow's question (${tomStr})!` });
    } catch (err) {
      console.error('Scheduling failed:', err);
      setMessage({ type: 'error', text: 'Failed to schedule question: ' + err.message });
    }
  };

  // --- Favoriting / Starring Q&As ---
  const handleToggleFavorite = async (questionId) => {
    const isFav = favorites.has(questionId);
    try {
      if (isFav) {
        await supabase
          .from('reveal_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('question_id', questionId);

        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(questionId);
          return next;
        });
      } else {
        await supabase
          .from('reveal_favorites')
          .insert({ user_id: userId, question_id: questionId });

        setFavorites((prev) => {
          const next = new Set(prev);
          next.add(questionId);
          return next;
        });
      }
    } catch (err) {
      console.error('Toggle favorite failed:', err);
    }
  };

  // --- Emoji Reactions on Answers ---
  const handleToggleReaction = async (answer, emojiChar) => {
    const currentReactions = { ...(answer.reactions || {}) };
    const userList = currentReactions[emojiChar] ? [...currentReactions[emojiChar]] : [];

    let newReactions;
    if (userList.includes(userId)) {
      newReactions = {
        ...currentReactions,
        [emojiChar]: userList.filter((uid) => uid !== userId),
      };
    } else {
      newReactions = {
        ...currentReactions,
        [emojiChar]: [...userList, userId],
      };
    }

    try {
      const { error: updateError } = await supabase
        .from('reveal_answers')
        .update({ reactions: newReactions })
        .eq('id', answer.id);

      if (updateError) throw updateError;

      // Update state locally for today's answer
      if (answer.question_id === dailyQuestion?.question_id) {
        if (answer.user_id === userId) {
          setUserAnswer((prev) => ({ ...prev, reactions: newReactions }));
        } else {
          setPartnerAnswer((prev) => ({ ...prev, reactions: newReactions }));
        }
      }

      // Update state locally for archive list
      setArchiveMemories((prev) =>
        prev.map((m) => {
          if (m.question_id === answer.question_id) {
            return {
              ...m,
              user: m.user?.id === answer.id ? { ...m.user, reactions: newReactions } : m.user,
              partner:
                m.partner?.id === answer.id ? { ...m.partner, reactions: newReactions } : m.partner,
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.error('Toggle reaction failed:', err);
    }
  };

  // --- Threaded Comments on Past Q&As ---
  const handleAddComment = async (questionId) => {
    const text = newCommentTexts[questionId];
    if (!text?.trim()) return;

    try {
      const { data: newC, error: cError } = await supabase
        .from('reveal_comments')
        .insert({
          question_id: questionId,
          user_id: userId,
          content: text.trim(),
        })
        .select()
        .single();

      if (cError) throw cError;

      // Clear comment text box
      setNewCommentTexts((prev) => ({ ...prev, [questionId]: '' }));

      // Add locally immediately (will also sync via subscription fallback)
      setArchiveComments((prev) => {
        const list = prev[questionId] || [];
        if (list.some((c) => c.id === newC.id)) return prev;
        return {
          ...prev,
          [questionId]: [...list, newC],
        };
      });
    } catch (err) {
      console.error('Add comment failed:', err);
    }
  };

  // --- Partner Nudging ---
  const handleNudgePartner = () => {
    setNudgeShaking(true);
    setTimeout(() => setNudgeShaking(false), 800);
    setMessage({
      type: 'info',
      text: `Nudged ${partner?.name || 'partner'}! They will receive a shake indicator.`,
    });
  };

  // --- Helper: Resolve Question details for Archive ---
  const getQuestionDetails = useCallback(
    (qId) => {
      if (qId.startsWith('default-')) {
        const index = qId.replace('default-', '');
        const defaultQ = promptsData.find((p) => p.id === index);
        return {
          content: defaultQ ? defaultQ.content : 'Relationship Question',
          category: defaultQ ? defaultQ.category : 'general',
        };
      }
      // Search in custom questions
      const customQ = customQuestions.find((q) => `custom-${q.id}` === qId);
      return {
        content: customQ ? customQ.content : 'Custom Relationship Question',
        category: 'custom',
      };
    },
    [customQuestions]
  );

  // --- Filters on Archive ---
  const filteredMemories = useMemo(() => {
    return archiveMemories.filter((m) => {
      const q = getQuestionDetails(m.question_id);

      // Category filter
      if (activeCategoryFilter !== 'all' && q.category !== activeCategoryFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const contentMatch = q.content.toLowerCase().includes(query);
        const userAnsMatch = m.user?.answer.toLowerCase().includes(query);
        const partnerAnsMatch = m.partner?.answer.toLowerCase().includes(query);
        if (!contentMatch && !userAnsMatch && !partnerAnsMatch) {
          return false;
        }
      }

      // Tab filter
      if (activeArchiveTab === 'favorites' && !favorites.has(m.question_id)) {
        return false;
      }

      return true;
    });
  }, [
    archiveMemories,
    activeCategoryFilter,
    searchQuery,
    activeArchiveTab,
    favorites,
    getQuestionDetails,
  ]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-text-muted">Loading daily Reveal...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-2 pb-24 px-4 animate-fade-in space-y-8 relative">
      {/* Confetti Canvas */}
      {showConfetti && (
        <canvas
          ref={confettiCanvasRef}
          className="fixed inset-0 pointer-events-none z-[100] w-full h-full"
        />
      )}

      {/* Heading */}
      <div className="text-center relative">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest">Daily Reveal</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-text-main mt-2">
          Blind Q&A
        </h1>
        <p className="text-text-muted text-sm mt-2">
          Answer today&apos;s question blindly. Both must respond to unlock the reveal!
        </p>
      </div>

      {/* --- TODAY'S QUESTION SECTION --- */}
      {dailyQuestion && (
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
                  <form onSubmit={handleSubmitAnswer} className="space-y-4">
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
                        <Loader className="w-4.5 h-4.5 animate-spin" />
                      ) : (
                        <Check className="w-4.5 h-4.5" />
                      )}
                      Submit Secret Answer
                    </button>
                  </form>
                )}
              </div>

              {userAnswer && (
                <div className="flex gap-1.5 mt-4 border-t border-surface-border/30 pt-3">
                  {['❤️', '😂', '🔥', '✨', '🥺'].map((emoji) => {
                    const list = userAnswer.reactions?.[emoji] || [];
                    const reacted = list.includes(userId);
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(userAnswer, emoji)}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-all ${
                          reacted
                            ? 'bg-primary/10 border-primary'
                            : 'bg-transparent border-surface-border hover:bg-surface/50'
                        }`}
                      >
                        {emoji}
                        {list.length > 0 && (
                          <span className="text-[9px] font-bold ml-0.5">{list.length}</span>
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
                <div className="flex gap-1.5 mt-4 border-t border-surface-border/30 pt-3">
                  {['❤️', '😂', '🔥', '✨', '🥺'].map((emoji) => {
                    const list = partnerAnswer.reactions?.[emoji] || [];
                    const reacted = list.includes(userId);
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(partnerAnswer, emoji)}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-all ${
                          reacted
                            ? 'bg-primary/10 border-primary'
                            : 'bg-transparent border-surface-border hover:bg-surface/50'
                        }`}
                      >
                        {emoji}
                        {list.length > 0 && (
                          <span className="text-[9px] font-bold ml-0.5">{list.length}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                userAnswer &&
                !partnerAnswer && (
                  <button
                    onClick={handleNudgePartner}
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
                onClick={() => {
                  setRevealedToday(true);
                  setShowConfetti(true);
                }}
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 scale-102 transition-transform active:scale-98"
              >
                Reveal Answers
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- ADD CUSTOM QUESTION AND TABS BAR --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Custom Question Panel */}
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

            <form onSubmit={handleCreateCustomQuestion} className="space-y-4">
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
                  <Loader className="w-4.5 h-4.5 animate-spin text-primary" />
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
                            onClick={() => handleScheduleNext(q.id)}
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

        {/* --- ARCHIVE SECTION (MEMORY LANE) --- */}
        <div className="md:col-span-2 bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800/80 p-5 rounded-3xl shadow-xl flex flex-col min-h-[320px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 border-b border-surface-border/20 pb-4">
            <div>
              <h3 className="font-bold text-text-main text-sm flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                Memory Lane
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">Chronology of past Q&A unlocks.</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <Search className="h-4 w-4 text-text-muted" />
              </span>
              <input
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
                const isExpanded = expandedMemoryId === mem.question_id;
                const isStarred = favorites.has(mem.question_id);
                const commentsList = archiveComments[mem.question_id] || [];

                return (
                  <div
                    key={mem.question_id}
                    className="border border-surface-border/50 dark:border-slate-800 bg-white/5 hover:bg-white/10/20 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
                  >
                    {/* Header Panel */}
                    <div
                      onClick={() => setExpandedMemoryId(isExpanded ? null : mem.question_id)}
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
                          onClick={() => handleToggleFavorite(mem.question_id)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isStarred
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                              : 'border-transparent text-text-muted hover:text-text-main'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => setExpandedMemoryId(isExpanded ? null : mem.question_id)}
                          className="p-1 text-text-muted hover:text-text-main"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable answers / Comments Panel */}
                    {isExpanded && (
                      <div className="border-t border-surface-border/30 p-4 space-y-4 bg-slate-950/20 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* User Answer */}
                          <div className="bg-surface/40 p-3.5 rounded-xl border border-surface-border/30">
                            <span className="block text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                              Your Answer
                            </span>
                            <p className="text-xs font-semibold text-text-main leading-relaxed">
                              {mem.user?.answer || 'No answer recorded.'}
                            </p>
                          </div>
                          {/* Partner Answer */}
                          <div className="bg-surface/40 p-3.5 rounded-xl border border-surface-border/30">
                            <span className="block text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                              {partner?.name || 'Partner'}&apos;s Answer
                            </span>
                            <p className="text-xs font-semibold text-text-main leading-relaxed">
                              {mem.partner?.answer || 'No answer recorded.'}
                            </p>
                          </div>
                        </div>

                        {/* Expandable comments board */}
                        <div className="border-t border-surface-border/20 pt-4 space-y-3">
                          <span className="block text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-primary" />
                            Conversation thread ({commentsList.length})
                          </span>

                          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
                            {commentsList.length === 0 ? (
                              <p className="text-[10px] text-text-muted/60 italic px-1">
                                No replies yet. Start a discussion below!
                              </p>
                            ) : (
                              commentsList.map((com) => {
                                const isMe = com.user_id === userId;
                                return (
                                  <div
                                    key={com.id}
                                    className={`p-2 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                                      isMe
                                        ? 'bg-primary/10 border border-primary/20 text-text-main ml-auto'
                                        : 'bg-surface border border-surface-border/50 text-text-main mr-auto'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-6 mb-0.5">
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
                                    <p className="font-medium text-text-main leading-relaxed">
                                      {com.content}
                                    </p>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Add Comment Input */}
                          <div className="flex gap-2 items-center mt-2">
                            <input
                              type="text"
                              value={newCommentTexts[mem.question_id] || ''}
                              onChange={(e) =>
                                setNewCommentTexts((prev) => ({
                                  ...prev,
                                  [mem.question_id]: e.target.value,
                                }))
                              }
                              placeholder="Write a message..."
                              className="flex-grow bg-slate-900 border border-surface-border/50 text-text-main placeholder:text-text-muted/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
                              maxLength={200}
                            />
                            <button
                              onClick={() => handleAddComment(mem.question_id)}
                              disabled={!(newCommentTexts[mem.question_id] || '').trim()}
                              className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white p-2 rounded-xl transition-all shadow"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Triggering dynamic toast notifications */}
      <Notification message={message?.text} onClose={() => setMessage(null)} type={message?.type} />
    </div>
  );
}
