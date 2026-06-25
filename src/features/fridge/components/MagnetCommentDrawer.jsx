/**
 * @file MagnetCommentDrawer.jsx
 * @description Glassmorphic bottom-sheet/side-panel drawer for threaded comments
 * and emoji reactions on a single fridge magnet.
 *
 * Data management is delegated to {@link useMagnetComments}.
 * Keyboard height tracking is delegated to {@link useKeyboardHeight}.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Send, MessageSquare, Clock, Smile, Check, CheckCheck } from 'lucide-react';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ANIMATED_EMOJIS, getEmojiCdnUrl } from './emojiData';
import { useMagnetComments } from '../hooks/useMagnetComments';
import { useKeyboardHeight } from '../../../hooks/useKeyboardHeight';

/**
 * Magnet Comment Drawer component.
 *
 * Renders a slide-up bottom sheet on mobile or a slide-in side panel on desktop.
 * Displays threaded comments, emoji reaction chips, and an input composer.
 *
 * @param {object} props
 * @param {object|null} props.item - The active magnet item or null if closed.
 * @param {Function} props.onClose - Callback to close the drawer.
 * @param {string} props.userId - ID of the logged-in user.
 * @param {object|null} props.partner - Partner profile object.
 * @param {string|null} props.partnerLastSeen - ISO string of partner's last seen timestamp.
 * @param {boolean} props.isPartnerInFridge - Whether the partner is currently in the Fridge view.
 * @param {Function} props.onUpdateReactions - Callback `(itemId, newReactions) => void`.
 * @param {Function} [props.onPlaySound] - Optional callback to play UI sound effects.
 * @returns {React.ReactElement}
 */
export default function MagnetCommentDrawer({
  item,
  onClose,
  userId,
  partner,
  partnerLastSeen,
  isPartnerInFridge,
  onUpdateReactions,
  onPlaySound,
}) {
  const [particles, setParticles] = useState([]);
  const [activeReactionPop, setActiveReactionPop] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const commentsEndRef = useRef(null);
  const dragControls = useDragControls();

  /**
   * Start vertical drag on mobile device.
   * Restricts dragging from starting if on desktop view.
   *
   * @param {React.PointerEvent} event - The pointer down event
   */
  const startDrag = (event) => {
    if (!isDesktop) {
      dragControls.start(event);
    }
  };

  // Delegate data management to custom hook
  const { comments, isLoading, isPartnerTyping, inputText, handleInputChange, handleSendComment } =
    useMagnetComments(item, userId);

  // Delegate keyboard height tracking to custom hook
  const { keyboardHeight, viewportHeight } = useKeyboardHeight();

  // Track desktop/mobile breakpoint
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to the latest comment
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments, isPartnerTyping]);

  /**
   * Toggles a reaction emoji on/off for the local user and triggers a particle explosion.
   *
   * @param {string} emojiId - The unique identifier of the reaction emoji.
   * @param {React.MouseEvent} event - The click event (used to compute particle origin).
   * @returns {void}
   */
  const handleToggleReaction = (emojiId, event) => {
    if (!item?.id) return;
    if (onPlaySound) onPlaySound('pop');

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;

    const currentReactions = { ...(item.reactions || {}) };
    const userList = currentReactions[emojiId] ? [...currentReactions[emojiId]] : [];

    let newReactions;
    if (userList.includes(userId)) {
      newReactions = {
        ...currentReactions,
        [emojiId]: userList.filter((uid) => uid !== userId),
      };
    } else {
      newReactions = {
        ...currentReactions,
        [emojiId]: [...userList, userId],
      };

      setActiveReactionPop(emojiId);
      setTimeout(() => setActiveReactionPop(null), 300);

      const emojiDef = ANIMATED_EMOJIS.find((e) => e.id === emojiId);
      const emojiChar = emojiDef ? emojiDef.char : '❤️';
      const newParticles = Array.from({ length: 7 }).map((_, idx) => ({
        id: `${emojiId}-${Date.now()}-${idx}`,
        char: emojiChar,
        x: clickX,
        y: clickY,
        dx: (Math.random() - 0.5) * 160,
        dy: -(Math.random() * 120 + 80),
      }));
      setParticles((prev) => [...prev, ...newParticles]);
    }

    if (onUpdateReactions) {
      onUpdateReactions(item.id, newReactions);
    }
  };

  /**
   * Removes a finished particle from the floating overlay.
   *
   * @param {string} id - The particle's unique ID.
   * @returns {void}
   */
  const removeParticle = (id) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  };

  /**
   * Returns the display name for a comment author.
   *
   * @param {string} commentUserId - The user_id stored on the comment.
   * @returns {string} 'You' for the local user, partner name otherwise.
   */
  const getCommenterName = (commentUserId) => {
    if (commentUserId === userId) return 'You';
    return partner?.name || 'Partner';
  };

  /**
   * Renders a delivery status icon for a comment sent by the local user.
   *
   * @param {object} comment - The comment object to render status for.
   * @returns {React.ReactElement|null} An icon or null if the comment is from the partner.
   */
  const renderCommentStatus = (comment) => {
    if (comment.user_id !== userId) return null;

    const isPending = comment.isPending;
    const isOffline = comment.id.toString().startsWith('offline-');

    if (isOffline) {
      return <Clock className="w-2.5 h-2.5 text-text-muted/40" title="Offline queued" />;
    }
    if (isPending) {
      return (
        <LoadingSpinner size="sm" className="w-2.5 h-2.5 text-text-muted/40" title="Sending..." />
      );
    }

    const isRead =
      isPartnerInFridge ||
      (partnerLastSeen && new Date(partnerLastSeen) >= new Date(comment.created_at));

    if (isRead) {
      return <CheckCheck className="w-3 h-3 text-primary" title="Read" />;
    }

    return <Check className="w-2.5 h-2.5 text-text-muted/40" title="Delivered" />;
  };

  if (!item) return null;

  return (
    <>
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-[60]" onClick={onClose} />

      {/* Drawer Container */}
      <motion.div
        drag={isDesktop ? false : 'y'}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        dragMomentum={false}
        onDragEnd={(event, info) => {
          if (info.offset.y > 120) {
            onClose();
          }
        }}
        initial={isDesktop ? { x: '100%', y: 0 } : { y: '100%', x: 0 }}
        animate={{ x: 0, y: 0 }}
        exit={isDesktop ? { x: '100%', y: 0 } : { y: '100%', x: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="fixed bottom-0 left-0 right-0 h-[75vh] md:h-full md:w-96 md:right-0 md:left-auto md:top-0 md:max-w-none md:mx-0 md:rounded-l-[2.5rem] md:rounded-t-none md:border-l md:border-t-0 md:border-r-0 bg-slate-900/90 backdrop-blur-xl border-t border-x border-surface-border/50 rounded-t-[2.5rem] shadow-2xl z-[70] flex flex-col overflow-hidden font-sans"
        style={
          !isDesktop
            ? {
                bottom: `${keyboardHeight}px`,
                height: `${viewportHeight * 0.75}px`,
              }
            : {}
        }
      >
        {/* Drag Handle Indicator */}
        <div
          onPointerDown={startDrag}
          className="w-12 h-1 bg-slate-700/80 rounded-full mx-auto my-3 flex-shrink-0 md:hidden cursor-grab active:cursor-grabbing touch-none select-none"
        />

        {/* Header */}
        <div className="px-5 pb-3 flex justify-between items-center border-b border-surface-border/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-text-main">Magnet Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Close comments"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emoji Reactions Tray */}
        <div className="px-5 py-3 border-b border-surface-border/20 bg-slate-950/30 flex-shrink-0">
          <div className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Smile className="w-3.5 h-3.5 text-primary/70" />
            Reactions
          </div>
          <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
            {ANIMATED_EMOJIS.map((emoji) => {
              const userList = item.reactions?.[emoji.id] || [];
              const hasReacted = userList.includes(userId);
              const count = userList.length;

              return (
                <button
                  key={emoji.id}
                  onClick={(e) => handleToggleReaction(emoji.id, e)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    hasReacted
                      ? 'bg-primary/20 text-primary border-primary/40 shadow-sm'
                      : 'bg-surface/30 text-text-muted border-surface-border/30 hover:border-text-muted/30 hover:bg-surface/60'
                  }`}
                  title={emoji.label}
                >
                  <img
                    src={getEmojiCdnUrl(emoji.code)}
                    alt={emoji.label}
                    className="w-4 h-4 object-contain pointer-events-none select-none"
                    loading="lazy"
                  />
                  {count > 0 && (
                    <motion.span
                      animate={activeReactionPop === emoji.id ? { scale: [1, 1.4, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className="font-mono text-[10px] font-bold"
                    >
                      {count}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comments Feed */}
        <div className="flex-grow relative overflow-hidden">
          {/* Background texture */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `url('/board-chat-bg.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-slate-950/75 pointer-events-none z-0" />

          {/* Scrollable feed */}
          <div className="absolute inset-0 overflow-y-auto px-5 py-4 custom-scrollbar z-10">
            <div className="flex flex-col min-h-full">
              {isLoading && comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-muted text-xs">
                  <span className="animate-pulse">Loading conversation...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-text-muted">
                  <MessageSquare className="w-8 h-8 text-slate-800 mb-2" />
                  <p className="text-xs font-bold">No replies yet</p>
                  <p className="text-[10px] text-text-muted/60 mt-1 max-w-[200px]">
                    Start a thread by writing the first message below.
                  </p>
                </div>
              ) : (
                comments.map((comment, i) => {
                  const isMe = comment.user_id === userId;
                  const prevComment = i > 0 ? comments[i - 1] : null;
                  const nextComment = i < comments.length - 1 ? comments[i + 1] : null;
                  const TIME_THRESHOLD_MS = 5 * 60 * 1000;

                  const isPrevSame =
                    prevComment &&
                    prevComment.user_id === comment.user_id &&
                    new Date(comment.created_at) - new Date(prevComment.created_at) <
                      TIME_THRESHOLD_MS;

                  const isNextSame =
                    nextComment &&
                    nextComment.user_id === comment.user_id &&
                    new Date(nextComment.created_at) - new Date(comment.created_at) <
                      TIME_THRESHOLD_MS;

                  const showSenderName = !isPrevSame;
                  const showTimestamp = !isNextSame || comment.isPending;

                  let marginTopClass = 'mt-1';
                  if (i === 0) marginTopClass = 'mt-0';
                  else if (showSenderName) marginTopClass = 'mt-4';

                  let bubbleRadiusClass = '';
                  if (isMe) {
                    if (!isPrevSame && !isNextSame)
                      bubbleRadiusClass = 'rounded-2xl rounded-br-none';
                    else if (!isPrevSame && isNextSame)
                      bubbleRadiusClass = 'rounded-2xl rounded-br-none';
                    else if (isPrevSame && isNextSame)
                      bubbleRadiusClass = 'rounded-2xl rounded-r-md';
                    else if (isPrevSame && !isNextSame)
                      bubbleRadiusClass = 'rounded-2xl rounded-tr-none';
                  } else {
                    if (!isPrevSame && !isNextSame)
                      bubbleRadiusClass = 'rounded-2xl rounded-bl-none';
                    else if (!isPrevSame && isNextSame)
                      bubbleRadiusClass = 'rounded-2xl rounded-bl-none';
                    else if (isPrevSame && isNextSame)
                      bubbleRadiusClass = 'rounded-2xl rounded-l-md';
                    else if (isPrevSame && !isNextSame)
                      bubbleRadiusClass = 'rounded-2xl rounded-tl-none';
                  }

                  return (
                    <div
                      key={comment.id}
                      className={`flex flex-col max-w-[85%] ${
                        isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                      } ${marginTopClass}`}
                    >
                      {showSenderName && (
                        <span className="text-[10px] font-bold text-text-muted mb-1 px-1">
                          {getCommenterName(comment.user_id)}
                        </span>
                      )}
                      <div
                        className={`px-3.5 py-2.5 text-xs font-medium leading-relaxed shadow ${bubbleRadiusClass} ${
                          isMe
                            ? 'bg-primary text-brand-surface'
                            : 'bg-surface border border-surface-border/20 text-text-main'
                        }`}
                      >
                        {comment.content}
                      </div>
                      {showTimestamp && (
                        <div className="flex items-center gap-1.5 text-[9px] text-text-muted/50 mt-1 px-1 font-mono">
                          <span>
                            {new Date(comment.created_at).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                          {renderCommentStatus(comment)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Partner typing indicator */}
              {isPartnerTyping && (
                <div className="flex flex-col max-w-[85%] mr-auto items-start mt-4">
                  <span className="text-[10px] font-bold text-text-muted mb-1 px-1">
                    {partner?.name || 'Partner'}
                  </span>
                  <div className="px-4 py-3 bg-surface border border-surface-border/20 rounded-2xl rounded-bl-none shadow flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              )}

              <div ref={commentsEndRef} />
            </div>
          </div>
        </div>

        {/* Input Composer */}
        <form
          onSubmit={(e) => handleSendComment(e, onPlaySound)}
          className="p-4 border-t border-surface-border/20 bg-slate-950/40 flex-shrink-0 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-grow bg-slate-900 border border-surface-border/50 text-text-main placeholder:text-text-muted/50 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            maxLength={300}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-primary hover:bg-primary-hover text-brand-surface disabled:opacity-50 disabled:hover:bg-primary p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center flex-shrink-0"
            title="Send"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </motion.div>

      {/* Floating emoji reaction particles */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              initial={{ x: particle.x, y: particle.y, opacity: 1, scale: 0.6 }}
              animate={{
                x: particle.x + particle.dx,
                y: particle.y + particle.dy,
                opacity: 0,
                scale: [0.6, 1.4, 0.8],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              onAnimationComplete={() => removeParticle(particle.id)}
              className="absolute select-none pointer-events-none text-xl"
            >
              {particle.char}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
