/**
 * @file GameHeader.jsx
 * @description Shared game header shown at the top of every active game.
 * Displays both players' avatars, scores, a countdown timer, and a back button.
 * Inspired by the Carrom/Pool mockup aesthetic from GH issue #14.
 */

import React from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import Avatar from '../../../components/Avatar';

/**
 * Top bar for an active game session.
 *
 * @param {object} props
 * @param {string} props.gameName - Display name of the current game.
 * @param {object} props.user - Current user object.
 * @param {object} props.partner - Partner user object.
 * @param {boolean} props.isMyTurn - Whether it's the current user's turn.
 * @param {number} props.userScore - Current user's score.
 * @param {number} props.partnerScore - Partner's score.
 * @param {number} [props.timeLeft] - Seconds remaining (omit to hide timer).
 * @param {Function} props.onBack - Called when the back button is pressed.
 */
export default function GameHeader({
  gameName,
  user,
  partner,
  isMyTurn,
  userScore = 0,
  partnerScore = 0,
  timeLeft,
  onBack,
  activeUserBubble = '',
  activePartnerBubble = '',
  userEmojis = [],
  partnerEmojis = [],
}) {
  return (
    <div className="w-full bg-surface/80 backdrop-blur-lg border-b border-surface-border/60 px-4 py-3 flex items-center justify-between gap-2 z-10 relative">
      {/* Back button */}
      <button
        onClick={onBack}
        aria-label="Back to lobby"
        className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/10 transition-all flex-shrink-0"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Player A (You) */}
      <div
        className={`flex flex-col items-center gap-1 min-w-[60px] relative transition-all ${
          isMyTurn ? 'opacity-100 scale-105' : 'opacity-50 scale-95'
        }`}
      >
        {/* Floating Emojis */}
        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 pointer-events-none w-16 h-24 overflow-visible flex items-end justify-center">
          {userEmojis.map((item) => (
            <span
              key={item.id}
              style={{ left: `${item.xOffset}%` }}
              className="absolute text-xl animate-float-up pointer-events-none"
            >
              {item.emoji}
            </span>
          ))}
        </div>

        <div className="relative">
          <Avatar src={user?.avatar_url} fallback="👤" size="sm" isOnline={true} />
          {isMyTurn && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background animate-pulse" />
          )}
        </div>
        <span className="text-[10px] font-bold text-text-muted truncate max-w-[56px] text-center">
          You
        </span>
        <span className="text-lg font-extrabold text-text-main leading-none">{userScore}</span>

        {/* Chat Bubble */}
        {activeUserBubble && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-brand-surface border border-primary/30 text-white text-[11px] font-bold px-2 py-1 rounded-xl shadow-lg whitespace-nowrap z-40 animate-slide-down-fade">
            {activeUserBubble}
          </div>
        )}
      </div>

      {/* Centre: game name + timer */}
      <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">
          {gameName}
        </span>
        {timeLeft !== undefined && (
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-extrabold transition-colors ${
              timeLeft <= 10
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-surface/60 text-text-main border border-surface-border/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {timeLeft}s
          </div>
        )}
        <span
          className={`text-[10px] font-bold uppercase tracking-wide ${
            isMyTurn ? 'text-primary' : 'text-text-muted'
          }`}
        >
          {isMyTurn ? 'Your turn' : `${partner?.name || 'Partner'}'s turn`}
        </span>
      </div>

      {/* Player B (Partner) */}
      <div
        className={`flex flex-col items-center gap-1 min-w-[60px] relative transition-all ${
          !isMyTurn ? 'opacity-100 scale-105' : 'opacity-50 scale-95'
        }`}
      >
        {/* Floating Emojis */}
        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 pointer-events-none w-16 h-24 overflow-visible flex items-end justify-center">
          {partnerEmojis.map((item) => (
            <span
              key={item.id}
              style={{ left: `${item.xOffset}%` }}
              className="absolute text-xl animate-float-up pointer-events-none"
            >
              {item.emoji}
            </span>
          ))}
        </div>

        <div className="relative">
          <Avatar src={partner?.avatar_url} fallback="👤" size="sm" isOnline={true} />
          {!isMyTurn && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-background animate-pulse" />
          )}
        </div>
        <span className="text-[10px] font-bold text-text-muted truncate max-w-[56px] text-center">
          {partner?.name || 'Partner'}
        </span>
        <span className="text-lg font-extrabold text-text-main leading-none">{partnerScore}</span>

        {/* Chat Bubble */}
        {activePartnerBubble && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-brand-surface border border-secondary/30 text-white text-[11px] font-bold px-2 py-1 rounded-xl shadow-lg whitespace-nowrap z-40 animate-slide-down-fade">
            {activePartnerBubble}
          </div>
        )}
      </div>

      {/* Spacer to balance back button */}
      <div className="w-9 flex-shrink-0" />
    </div>
  );
}
