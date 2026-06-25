/**
 * @file Reveal.jsx
 * @description Stateful blind Q&A feature screen. Synchronizes daily questions, blurs partner answers,
 * triggers confetti, hosts custom questions scheduling, and maintains an archive (Memory Lane).
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Notification } from '../../components/Notification';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useDailyQuestion } from './hooks/useDailyQuestion';
import { useRevealData } from './hooks/useRevealData';
import { useRevealFilters } from './hooks/useRevealFilters';
import { useRevealHandlers } from './hooks/useRevealHandlers';
import ConfettiCanvas from './components/ConfettiCanvas';
import DailyQuestionCard from './components/DailyQuestionCard';
import MemoryLane from './components/MemoryLane';
import CustomQuestionQueue from './components/CustomQuestionQueue';

/**
 * Main Reveal screen component. Wires together data hooks, handler hooks,
 * and sub-components to render the full Reveal Q&A feature.
 *
 * @returns {React.ReactElement}
 */
export default function Reveal() {
  const { user, partner } = useAppContext();
  const userId = user?.id;
  const partnerId = partner?.id;
  const navigate = useNavigate();

  /** Stable couple identifier – the lexicographically first of the two user IDs. */
  const coupleKey = useMemo(() => {
    if (!userId || !partnerId) return null;
    return [userId, partnerId].sort()[0];
  }, [userId, partnerId]);

  /** Today's date string in local timezone (YYYY-MM-DD). */
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // --- UI-only state ---
  const [userAnswerInput, setUserAnswerInput] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState('general');
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [expandedMemoryId, setExpandedMemoryId] = useState(null);
  const [newCommentTexts, setNewCommentTexts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [activeArchiveTab, setActiveArchiveTab] = useState('timeline');
  const [nudgeShaking, setNudgeShaking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // --- Data hooks ---
  const { initializeDailyQuestion } = useDailyQuestion({ userId, partnerId, coupleKey, todayStr });

  const {
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
  } = useRevealData({ userId, partnerId, coupleKey, todayStr, initializeDailyQuestion });

  // --- Filter / resolver hook ---
  const { getQuestionDetails, filteredMemories } = useRevealFilters({
    archiveMemories,
    customQuestions,
    searchQuery,
    activeCategoryFilter,
    activeArchiveTab,
    favorites,
  });

  // --- Event handler hook ---
  const {
    handleSubmitAnswer,
    handleCreateCustomQuestion,
    handleScheduleNext,
    handleToggleFavorite,
    handleToggleReaction,
    handleAddComment,
    handleNudgePartner,
  } = useRevealHandlers({
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
  });

  // --- Guards ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <LoadingSpinner size="md" />
        <span className="text-sm font-semibold text-text-muted">Loading daily Reveal...</span>
      </div>
    );
  }

  if (!partnerId) {
    return (
      <div className="max-w-md mx-auto pt-16 pb-24 px-4 flex flex-col items-center text-center space-y-6 animate-slide-up">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <Heart className="w-8 h-8 fill-current text-red-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-extrabold text-text-main">Pairing Required</h2>
          <p className="text-sm text-text-muted max-w-xs mx-auto leading-relaxed">
            The Daily Reveal is a blind Q&amp;A game built for two. Link up with your partner to
            unlock daily prompts, check their answers, and share comments!
          </p>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all hover-heart-scale"
        >
          Go to Partner Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-2 pb-24 px-4 animate-fade-in space-y-8 relative">
      <ConfettiCanvas active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Heading */}
      <div className="text-center relative">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest">Daily Reveal</span>
        </div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-text-main mt-2">
          Blind Q&amp;A
        </h1>
        <p className="text-text-muted text-sm mt-2">
          Answer today&apos;s question blindly. Both must respond to unlock the reveal!
        </p>
      </div>

      {/* Today's Question */}
      {dailyQuestion && (
        <DailyQuestionCard
          dailyQuestion={dailyQuestion}
          userAnswer={userAnswer}
          partnerAnswer={partnerAnswer}
          revealedToday={revealedToday}
          userAnswerInput={userAnswerInput}
          setUserAnswerInput={setUserAnswerInput}
          submittingAnswer={submittingAnswer}
          nudgeShaking={nudgeShaking}
          userId={userId}
          partner={partner}
          onSubmitAnswer={handleSubmitAnswer}
          onToggleReaction={handleToggleReaction}
          onNudgePartner={handleNudgePartner}
          onReveal={() => {
            setRevealedToday(true);
            setShowConfetti(true);
          }}
        />
      )}

      {/* Custom Question Panel + Memory Lane */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <CustomQuestionQueue
          customQuestions={customQuestions}
          newQuestionText={newQuestionText}
          setNewQuestionText={setNewQuestionText}
          newQuestionCategory={newQuestionCategory}
          setNewQuestionCategory={setNewQuestionCategory}
          creatingQuestion={creatingQuestion}
          onSubmit={handleCreateCustomQuestion}
          onScheduleNext={handleScheduleNext}
        />
        <MemoryLane
          filteredMemories={filteredMemories}
          archiveComments={archiveComments}
          newCommentTexts={newCommentTexts}
          setNewCommentTexts={setNewCommentTexts}
          favorites={favorites}
          expandedMemoryId={expandedMemoryId}
          setExpandedMemoryId={setExpandedMemoryId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeCategoryFilter={activeCategoryFilter}
          setActiveCategoryFilter={setActiveCategoryFilter}
          activeArchiveTab={activeArchiveTab}
          setActiveArchiveTab={setActiveArchiveTab}
          getQuestionDetails={getQuestionDetails}
          userId={userId}
          partner={partner}
          onToggleFavorite={handleToggleFavorite}
          onToggleReaction={handleToggleReaction}
          onAddComment={handleAddComment}
        />
      </div>

      <Notification message={message?.text} onClose={() => setMessage(null)} type={message?.type} />
    </div>
  );
}
