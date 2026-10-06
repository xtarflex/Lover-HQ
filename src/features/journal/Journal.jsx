/**
 * @file Journal.jsx
 * @description Shared timeline and journal milestones coming soon experience for Lover-HQ.
 * Features an interactive turning parchment page animation, milestone memory teasers,
 * and a prompt to suggest shared timeline memories.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Heart, Calendar, Bookmark, ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';

/**
 * Animated Journal feature teaser and coming-soon experience.
 *
 * @returns {React.ReactElement}
 */
export default function Journal() {
  const navigate = useNavigate();
  const { partner } = useAppContext();
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      title: 'Our Timeline & Milestones',
      subtitle: 'Where every moment becomes an unforgettable chapter.',
      highlight: 'First Chapter',
      date: 'Beginnings',
      quote: '"We loved with a love that was more than love."',
    },
    {
      title: 'Little Shared Notes',
      subtitle: 'Memories of late night talks, inside jokes, and sweet reminders.',
      highlight: 'Shared Whispers',
      date: 'Growing Together',
      quote: '"In all the world, there is no heart for me like yours."',
    },
    {
      title: 'Vault of Togetherness',
      subtitle: 'Photos, travel pins, and audio journals preserved forever.',
      highlight: 'Forever Bound',
      date: 'Next Chapter',
      quote: '"Whatever our souls are made of, yours and mine are the same."',
    },
  ];

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % pages.length);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + pages.length) % pages.length);
  };

  const currentStory = pages[currentPage];

  return (
    <div className="min-h-full flex flex-col items-center justify-between pb-12 pt-2 px-4 max-w-lg mx-auto text-text-main select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-main transition-colors px-3 py-1.5 rounded-full bg-surface/50 border border-surface-border backdrop-blur-md"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
          <Bookmark className="w-3.5 h-3.5" />
          <span>Milestones</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6 w-full">
        <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-rose-400">
          Shared Memory Book
        </p>
        <h1 className="text-2xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-amber-200 to-rose-300">
          Couples Journal
        </h1>
        <p className="text-xs text-text-muted mt-1">
          A private, timeless vault for your relationship milestones & thoughts
        </p>
      </div>

      {/* Animated Parchment Journal Book */}
      <div className="relative w-full aspect-[4/3] rounded-3xl p-6 bg-gradient-to-br from-amber-50/10 via-amber-100/5 to-rose-950/20 border-2 border-amber-500/30 shadow-2xl backdrop-blur-xl flex flex-col justify-between overflow-hidden">
        {/* Vintage corner accents */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-400/40 rounded-tl" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-400/40 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-400/40 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-400/40 rounded-br" />

        {/* Page Content with Slide Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, rotateY: -15, scale: 0.98 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: 15, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col justify-between h-full"
          >
            <div>
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {currentStory.date}
                </span>
                <span className="text-[10px] text-text-muted font-mono">
                  Page {currentPage + 1} of {pages.length}
                </span>
              </div>

              <h2 className="text-lg font-heading font-bold text-amber-100">
                {currentStory.title}
              </h2>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">
                {currentStory.subtitle}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 my-2">
              <p className="font-handwriting text-base text-amber-200/90 text-center italic">
                {currentStory.quote}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
                <span className="text-[10px] text-rose-300 font-medium">
                  {currentStory.highlight}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  className="p-1 rounded-full bg-surface/50 border border-surface-border hover:bg-surface text-text-muted hover:text-text-main"
                  aria-label="Previous Page"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextPage}
                  className="p-1 rounded-full bg-surface/50 border border-surface-border hover:bg-surface text-text-muted hover:text-text-main"
                  aria-label="Next Page"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Highlights Grid */}
      <div className="w-full grid grid-cols-2 gap-3 mt-6">
        <div className="p-3.5 rounded-2xl bg-surface/40 border border-surface-border backdrop-blur-sm flex flex-col gap-1">
          <span className="text-xs font-bold text-rose-400">Milestone Memories</span>
          <p className="text-[11px] text-text-muted">
            Pin anniversaries, favorite dates, and unforgettable trips together.
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-surface/40 border border-surface-border backdrop-blur-sm flex flex-col gap-1">
          <span className="text-xs font-bold text-amber-400">Time Capsule</span>
          <p className="text-[11px] text-text-muted">
            Seal notes to unlock on future special dates and relationship milestones.
          </p>
        </div>
      </div>

      {/* Partner Prompt Action */}
      <div className="w-full mt-6">
        <button
          onClick={() => navigate('/fridge')}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/80 to-rose-500/80 hover:from-amber-500 hover:to-rose-500 text-white font-semibold text-xs transition-all duration-200 shadow-md shadow-rose-950/20 flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>Leave a First Note for {partner?.name || 'Partner'} on Fridge</span>
        </button>
      </div>
    </div>
  );
}
