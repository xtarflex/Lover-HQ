/* eslint-disable */
/**
 * @file GameHeader.jsx
 * @description Shared game header shown at the top of every active game.
 * Displays both players' avatars, scores, a countdown timer, and a back button.
 * Inspired by the Carrom/Pool mockup aesthetic from GH issue #14.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Info, X } from 'lucide-react';
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
  const [showRules, setShowRules] = useState(false);

  const getRulesData = () => {
    const name = gameName?.toLowerCase() || '';
    if (name.includes('word')) {
      return {
        title: 'Word Chain Rules',
        rules: [
          'Submit words where each word starts with the last letter of the previous word (e.g., apple → elephant → tree).',
          'Words must be real English dictionary words. Repeated words are not allowed.',
          'Scoring: Words score points based on letter rarity (like Scrabble). In Points Race, reach 50 points first to win.',
          'Panic Mode: The timer limit decreases by 2 seconds per turn, down to a minimum of 5 seconds!',
        ],
      };
    } else if (name.includes('draw') || name.includes('quick')) {
      return {
        title: 'Quick Draw Rules',
        rules: [
          'Players alternate roles as Drawer and Guesser across multiple rounds.',
          'Drawer: Select/input a target word and draw it on the canvas using colors, brush sizes, and the eraser.',
          'Guesser: Watch the drawing stream in real time and type guesses into the chat input.',
          'Scoring: A correct guess awards 10 points to the Guesser and 5 points to the Drawer.',
        ],
      };
    } else if (name.includes('scrabble')) {
      return {
        title: 'Classic Scrabble Rules',
        rules: [
          'Place letters from your rack onto the grid to form valid words.',
          'First word must cover the center star. Subsequent words must connect to existing ones.',
          'Turns are limited to 30 seconds. Pass, swap tiles, or play a word to finish your turn.',
          'The game ends if there are 4 consecutive passes or if the tile bag is empty and one player has used all rack tiles.',
        ],
      };
    } else if (name.includes('math') || name.includes('crossmath')) {
      return {
        title: 'CrossMath Race Rules',
        rules: [
          'Place number tiles into empty slots to solve all math equations simultaneously.',
          'Equations are computed strictly from Left to Right and Top to Bottom (no PEMDAS priority).',
          'You are racing in real-time. The first player to reach 100% correct board completion wins!',
        ],
      };
    } else {
      // Default to Tic-Tac-Toe
      return {
        title: 'Tic-Tac-Toe Rules',
        rules: [
          'Take turns placing X (Host) or O (Guest) on the 3x3 grid.',
          'Form a line of 3 symbols horizontally, vertically, or diagonally to win the round.',
          'If all cells are filled without a 3-in-a-row line, the round ends in a draw.',
        ],
      };
    }
  };

  return (
    <div className="w-full bg-surface/80 backdrop-blur-lg border-b border-surface-border/60 z-10 relative flex flex-col">
      {/* Top Toolbar: Back Button + Game Title + Info + Timer */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border/30">
        <button
          onClick={onBack}
          aria-label="Back to lobby"
          className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/10 transition-all flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-text-muted">
            {gameName}
          </span>
          <button
            onClick={() => setShowRules(true)}
            aria-label="How to play"
            className="p-1 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
            title="How to play"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-end min-w-[40px]">
        </div>
      </div>

      {/* Bottom Match Board: Player Cards + VS Split */}
      <div className="flex items-center justify-between px-6 py-3 max-w-lg mx-auto w-full gap-4">
        {/* Player 1 Card (You) */}
        <div
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface/30 border transition-all relative flex-1 min-w-0 ${
            isMyTurn
              ? 'border-primary/60 bg-primary/5 shadow-md shadow-primary/5 scale-105 z-20'
              : 'border-surface-border/40 opacity-60 scale-95 z-10'
          }`}
        >
          <div className="relative flex-shrink-0">
            <Avatar src={user?.avatar_url} fallback="👤" size="md" rounded="2xl" isOnline={true} />
            {isMyTurn && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full border-2 border-background animate-pulse z-30" />
            )}
          </div>
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider truncate">
              You
            </span>
            <span className="text-base font-extrabold text-text-main leading-none mt-1">
              {userScore}
            </span>
          </div>

          {isMyTurn && timeLeft !== undefined && (
            <div className="text-[10px] font-black text-primary px-1.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-0.5 flex-shrink-0 animate-pulse">
              <Clock className="w-3 h-3" />
              {timeLeft}s
            </div>
          )}

          {/* Chat Bubble */}
          {activeUserBubble && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-brand-surface border border-primary/30 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-lg whitespace-nowrap z-40 animate-slide-down-fade">
              {activeUserBubble}
            </div>
          )}
        </div>

        {/* Center: Turn indicator & VS Split */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 px-2 min-w-[70px]">
          <span className="text-[11px] font-black tracking-widest text-text-muted uppercase opacity-40">
            VS
          </span>
          <span
            className={`text-[9px] font-bold uppercase tracking-wide text-center mt-1 leading-tight whitespace-nowrap ${
              isMyTurn ? 'text-primary' : 'text-secondary'
            }`}
          >
            {isMyTurn ? 'Your turn' : `${partner?.name || 'Partner'}'s turn`}
          </span>
        </div>

        {/* Player 2 Card (Partner) */}
        <div
          className={`flex items-center justify-end gap-3 px-4 py-2.5 rounded-2xl bg-surface/30 border transition-all relative flex-1 min-w-0 ${
            !isMyTurn
              ? 'border-secondary/60 bg-secondary/5 shadow-md shadow-secondary/5 scale-105 z-20'
              : 'border-surface-border/40 opacity-60 scale-95 z-10'
          }`}
        >
          {!isMyTurn && timeLeft !== undefined && (
            <div className="text-[10px] font-black text-secondary px-1.5 py-0.5 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center gap-0.5 flex-shrink-0 animate-pulse">
              <Clock className="w-3 h-3" />
              {timeLeft}s
            </div>
          )}

          {/* Chat Bubble */}
          {activePartnerBubble && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-brand-surface border border-secondary/30 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-lg whitespace-nowrap z-40 animate-slide-down-fade">
              {activePartnerBubble}
            </div>
          )}

          <div className="flex flex-col justify-center min-w-0 flex-1 text-right">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider truncate">
              {partner?.name || 'Partner'}
            </span>
            <span className="text-base font-extrabold text-text-main leading-none mt-1">
              {partnerScore}
            </span>
          </div>
          <div className="relative flex-shrink-0">
            <Avatar
              src={partner?.avatar_url}
              fallback="👤"
              size="md"
              rounded="2xl"
              isOnline={true}
            />
            {!isMyTurn && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-background animate-pulse z-30" />
            )}
          </div>
        </div>
      </div>

      {/* Rules Dropdown Overlay (Transparent to allow click-outside-to-close) */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-20 z-[90] bg-transparent"
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-20 left-0 right-0 mx-auto w-full max-w-md bg-surface/95 border-b border-x border-surface-border/80 backdrop-blur-xl rounded-b-3xl rounded-t-none p-6 space-y-4 shadow-2xl z-[100]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  {getRulesData().title}
                </h4>
                <button
                  onClick={() => setShowRules(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <hr className="border-surface-border/50" />

              <ul className="space-y-3 pr-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                {getRulesData().rules.map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2.5 items-start text-xs text-text-muted leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowRules(false)}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-md shadow-primary/15 text-xs"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
