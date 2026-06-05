/**
 * @file ForfeitModal.jsx
 * @description Modal dialog asking users for confirmation before forfeiting
 * an active multiplayer game match.
 */

import React from 'react';
import { AlertTriangle, Flag, ArrowRight } from 'lucide-react';

/**
 * ForfeitModal component.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {Function} props.onClose - Callback to close the modal and resume the game.
 * @param {Function} props.onConfirm - Callback to forfeit the game and leave.
 * @returns {React.ReactElement|null}
 */
export default function ForfeitModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-brand-surface border border-red-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in text-center relative overflow-hidden">
        {/* Warning background glow */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-xl font-extrabold text-white tracking-tight">Forfeit Match?</h3>
        <p className="text-sm text-text-muted mt-2 px-2">
          Leaving now will count as a forfeit. Your partner will be awarded the win.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-brand-surface rounded-xl text-sm font-extrabold shadow-lg shadow-primary/15 transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02]"
          >
            <ArrowRight className="w-4 h-4" />
            Keep Playing
          </button>
          
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold border border-red-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Flag className="w-4 h-4 fill-current" />
            Yes, Forfeit Match
          </button>
        </div>
      </div>
    </div>
  );
}
