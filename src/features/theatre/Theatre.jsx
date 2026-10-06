/**
 * @file Theatre.jsx
 * @description Theatrical co-watching space coming-soon experience for Lover-HQ.
 * Features an interactive cinema marquee, ambient curtain reveal animation,
 * and a co-watching premiere teaser.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Popcorn, Sparkles, Volume2, Play, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';

/**
 * Animated Theater feature teaser and coming-soon experience.
 *
 * @returns {React.ReactElement}
 */
export default function Theatre() {
  const navigate = useNavigate();
  const { partner } = useAppContext();
  const [curtainsOpen, setCurtainsOpen] = useState(false);

  const handleToggleCurtains = () => {
    setCurtainsOpen((prev) => !prev);
  };

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
          <Sparkles className="w-3.5 h-3.5" />
          <span>Premiere Feature</span>
        </div>
      </div>

      {/* Marquee Sign */}
      <div className="text-center mb-6 w-full">
        <div className="inline-block p-1 rounded-2xl bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-amber-500/30 shadow-lg shadow-rose-950/20">
          <div className="bg-background/90 px-6 py-2.5 rounded-xl border border-amber-500/20">
            <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-amber-400">
              Lover HQ Presents
            </p>
            <h1 className="text-2xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-300">
              Shared Cinema
            </h1>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-2">
          Synchronized video playback, ambient lighting, and intimate co-watching
        </p>
      </div>

      {/* Cinematic Stage & Interactive Velvet Curtains */}
      <div
        className="relative w-full aspect-[16/10] max-h-72 rounded-2xl overflow-hidden border-2 border-surface-border bg-slate-950 shadow-2xl flex items-center justify-center group cursor-pointer"
        onClick={handleToggleCurtains}
        role="button"
        tabIndex={0}
        aria-label="Click to open or close the cinema curtains"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleToggleCurtains();
        }}
      >
        {/* Cinema Screen Content Behind Curtains */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-rose-950/20 to-slate-950 text-center">
          <div className="relative w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-3 shadow-inner">
            <Film className="w-7 h-7 text-rose-400" />
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute inset-0 rounded-full border border-rose-400/50"
            />
          </div>
          <h2 className="text-base font-bold text-slate-100">Synchronized Watch Parties</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Watch your favorite movies together with real-time play/pause synchronization and video
            reactions.
          </p>

          <div className="flex items-center gap-3 mt-4 text-[11px] text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Popcorn className="w-3.5 h-3.5" />
            <span>Curtain Call Coming Soon</span>
          </div>
        </div>

        {/* Left Velvet Curtain */}
        <motion.div
          animate={{ x: curtainsOpen ? '-92%' : '0%' }}
          transition={{ type: 'spring', stiffness: 70, damping: 15 }}
          className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-red-950 via-rose-900 to-red-900 border-r border-rose-800/60 z-20 flex items-center justify-end pr-2 shadow-2xl"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 12px, transparent 12px, transparent 24px)',
          }}
        >
          <div className="w-1 h-16 rounded-full bg-amber-500/30" />
        </motion.div>

        {/* Right Velvet Curtain */}
        <motion.div
          animate={{ x: curtainsOpen ? '92%' : '0%' }}
          transition={{ type: 'spring', stiffness: 70, damping: 15 }}
          className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-red-950 via-rose-900 to-red-900 border-l border-rose-800/60 z-20 flex items-center justify-start pl-2 shadow-2xl"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 12px, transparent 12px, transparent 24px)',
          }}
        >
          <div className="w-1 h-16 rounded-full bg-amber-500/30" />
        </motion.div>

        {/* Curtain Pull Callout */}
        <AnimatePresence>
          {!curtainsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute z-30 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-400/40 text-[11px] font-semibold text-amber-200 flex items-center gap-1.5 pointer-events-none shadow-lg"
            >
              <Play className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>Tap to draw the curtains</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feature Teasers */}
      <div className="w-full grid grid-cols-2 gap-3 mt-6">
        <div className="p-3.5 rounded-2xl bg-surface/40 border border-surface-border backdrop-blur-sm flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-rose-400">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold">Sub-Second Sync</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Pause, rewind, and seek simultaneously so you never lose the beat together.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface/40 border border-surface-border backdrop-blur-sm flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-amber-400">
            <Volume2 className="w-4 h-4" />
            <span className="text-xs font-bold">Atmospheric Glow</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Real-time ambilight reflections bring cinematic intimacy straight to your screens.
          </p>
        </div>
      </div>

      {/* Partner Notification Action */}
      <div className="w-full mt-6">
        <button
          onClick={() => navigate('/chat')}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500/80 to-amber-500/80 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs transition-all duration-200 shadow-md shadow-rose-950/20 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Invite {partner?.name || 'Partner'} to Movie Night</span>
        </button>
      </div>
    </div>
  );
}
