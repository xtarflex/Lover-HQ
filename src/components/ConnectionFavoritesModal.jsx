/**
 * @file ConnectionFavoritesModal.jsx
 * @description Quick-access relationship status and favorites modal triggered by the Heart action
 * in the Lover-HQ Top Navigation Bar.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Sparkles, Calendar, Music, Gamepad2 } from 'lucide-react';
import { useAppContext, useAppDispatch } from '../contexts/AppContext';

/**
 * Modal displaying relationship status, favorites, and intimate connection metrics.
 *
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close callback
 * @returns {React.ReactElement}
 */
export function ConnectionFavoritesModal({ isOpen, onClose }) {
  const { user, partner, presence } = useAppContext();
  const dispatch = useAppDispatch();
  const [pulseSent, setPulseSent] = useState(false);

  // Compute days together (based on user creation date or fallback)
  const calculateDaysTogether = () => {
    if (!user?.created_at) return 42;
    const created = new Date(user.created_at);
    const now = new Date();
    const diff = Math.max(1, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
    return diff;
  };

  const daysTogether = calculateDaysTogether();

  const handleSendHeartPulse = () => {
    setPulseSent(true);
    dispatch({
      type: 'SET_GLOBAL_NOTIFICATION',
      payload: {
        message: `Heart pulse sent to ${partner?.name || 'your partner'}! 💕`,
        type: 'success',
      },
    });
    setTimeout(() => {
      setPulseSent(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-sm bg-surface/95 border-2 border-primary/20 rounded-3xl shadow-2xl p-6 backdrop-blur-2xl overflow-hidden select-none"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-text-muted hover:text-text-main hover:bg-surface-border/50 transition-colors"
              aria-label="Close favorites modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Relationship Milestone */}
            <div className="text-center pt-2 pb-4">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5 shadow-lg shadow-rose-500/30 flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                  <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
                </div>
              </motion.div>

              <h2 className="text-xl font-heading font-bold text-text-main">
                {partner ? `${user?.name || 'You'} & ${partner.name}` : 'Lover HQ Hub'}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mt-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>{daysTogether} Days of Love</span>
              </div>
            </div>

            {/* Connection Status Pill */}
            <div className="p-3.5 rounded-2xl bg-surface-border/30 border border-surface-border mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    presence?.partner === 'online'
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                      : 'bg-gray-500'
                  }`}
                />
                <div>
                  <p className="text-xs font-bold text-text-main">{partner?.name || 'Partner'}</p>
                  <p className="text-[11px] text-text-muted">
                    {presence?.partner === 'online'
                      ? `Active in ${presence.partnerRoom || 'Lover-HQ'}`
                      : 'Resting offline'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Paired
              </span>
            </div>

            {/* Shared Favorites Highlights */}
            <div className="space-y-2 mb-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-1">
                Shared Favorites
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-surface/50 border border-surface-border flex items-center gap-2">
                  <Music className="w-4 h-4 text-secondary shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] text-text-muted">Top Song</p>
                    <p className="font-semibold text-text-main truncate">Our Anthem</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-surface/50 border border-surface-border flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] text-text-muted">Favorite Game</p>
                    <p className="font-semibold text-text-main truncate">Word Chain</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Send Warm Pulse Action */}
            <button
              onClick={handleSendHeartPulse}
              disabled={pulseSent}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
                pulseSent
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:opacity-95 shadow-rose-500/25 active:scale-98'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{pulseSent ? 'Heart Pulse Sent! 💕' : 'Send Warm Heart Pulse'}</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
