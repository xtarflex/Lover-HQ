import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusic } from '../../../contexts/MusicContext';
import { useAppContext } from '../../../contexts/AppContext';
import {
  Trash2,
  Plus,
  ListMusic,
  BookmarkPlus,
  CheckCircle2,
  X,
  Repeat,
  Repeat1,
  GripVertical,
  Music,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Play } from '../../../lib/icons';
import { getTrackArtwork, isYouTubeThumbnail } from '../lib/musicUtils';
import GradientAvatar from '../../../components/ui/GradientAvatar';
import EqBars from '../../../components/ui/EqBars';

/**
 * @file src/features/music/components/FloatingQueuePanel.jsx
 * @description Floating glassmorphic queue panel anchored to the bottom-right
 * of the Now Playing face. Sized to 50vh × 65vw, leaving the visualizer
 * visible in the upper-left. Slides in/out with framer-motion.
 */

/**
 * FloatingQueuePanel component. Shows the active playback queue as a compact
 * floating panel with drag-to-reorder, delete, and a "Save as Playlist" action.
 *
 * @param {Object} props
 * @param {boolean} props.isVisible - Whether the panel is shown.
 * @param {Function} props.onOpenAddModal - Opens the Add Track modal.
 * @param {Function} props.onSaveAsPlaylist - Triggers save-queue-as-playlist flow.
 * @param {Function} [props.onClose] - Closes the floating queue panel.
 * @returns {React.ReactElement} The FloatingQueuePanel component.
 */
export default function FloatingQueuePanel({
  isVisible,
  onOpenAddModal,
  onSaveAsPlaylist,
  onClose,
}) {
  const { user, partner } = useAppContext();
  const {
    queue,
    currentTrack,
    isPlaying,
    playTrackById,
    removeFromActiveQueue,
    reorderQueue,
    queueLoopMode,
    setQueueLoopMode,
  } = useMusic();

  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [saveConfirmed, setSaveConfirmed] = useState(false);

  /**
   * Returns the uploader avatar URL for a track.
   *
   * @param {string} addedById - UUID of the user who added the track.
   * @returns {string|null} Avatar URL or null.
   */
  const resolveUploaderAvatar = (addedById) => {
    if (user && addedById === user.id) return user.avatar_url;
    if (partner && addedById === partner.id) return partner.avatar_url;
    return null;
  };

  /**
   * Returns human-readable label for track uploader.
   *
   * @param {string} addedById - UUID of the user who added the track.
   * @returns {string|null} Uploader display label.
   */
  /** @param {number} index @param {React.SyntheticEvent} e */
  const handleMoveUp = (index, e) => {
    e.stopPropagation();
    if (index === 0) return;
    const next = [...queue];
    [next[index], next[index - 1]] = [next[index - 1], next[index]];
    reorderQueue(next);
  };

  /** @param {number} index @param {React.SyntheticEvent} e */
  const handleMoveDown = (index, e) => {
    e.stopPropagation();
    if (index === queue.length - 1) return;
    const next = [...queue];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    reorderQueue(next);
  };

  const resolveUploaderName = (addedById) => {
    if (user && addedById === user.id) return 'You';
    if (partner && addedById === partner.id) return partner.name || 'Partner';
    return null;
  };

  /**
   * Cycles queue loop mode: off -> all -> one -> off.
   *
   * @param {React.SyntheticEvent} [e] - Click event.
   */
  const handleCycleLoopMode = (e) => {
    e?.stopPropagation?.();
    setQueueLoopMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;
    const next = [...queue];
    const [removed] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, removed);
    reorderQueue(next);
  };

  /**
   * Handles save queue as playlist with a brief confirmation flash.
   */
  const handleSaveAsPlaylist = () => {
    onSaveAsPlaylist();
    setSaveConfirmed(true);
    setTimeout(() => setSaveConfirmed(false), 2000);
  };

  const panelRef = useRef(null);

  // Close queue panel on Escape key or click outside
  useEffect(() => {
    if (!isVisible || !onClose) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handlePointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Prevent immediate close if clicking the toggle button that opens/closes the queue
        if (e.target.closest('button[aria-label*="queue" i]')) {
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={panelRef}
          key="queue-panel"
          className="floating-queue-panel"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-white/8 flex-shrink-0">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-white/60" />
              <span className="text-xs font-bold text-white/90 font-rounded">Up Next</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">
                {queue.length}
              </span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close queue"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/70 hover:text-white transition-all ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Track list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-1">
            {queue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 gap-2">
                <Music className="w-8 h-8 text-white/20" />
                <p className="text-xs text-white/40 font-rounded">Queue is empty</p>
              </div>
            ) : (
              queue.map((track, index) => {
                const isCurrent = currentTrack?.queue_row_id
                  ? currentTrack.queue_row_id === track.queue_row_id
                  : currentTrack?.id === track.id;
                const artworkUrl = getTrackArtwork(track);
                const avatar = resolveUploaderAvatar(track.added_by);
                const uploaderName = resolveUploaderName(track.added_by);
                const isDragTarget = dragOverIndex === index;

                return (
                  <div
                    key={track.queue_row_id || track.id}
                    data-index={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => playTrackById(track.queue_row_id || track.id, 0)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && playTrackById(track.queue_row_id || track.id, 0)
                    }
                    aria-pressed={isCurrent}
                    aria-label={`${track.title}${isCurrent ? ', now playing' : ''}`}
                    className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 cursor-pointer transition-all duration-200
                      ${
                        isCurrent
                          ? 'bg-white/15 border border-white/20 shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 border border-white/5'
                      }
                      ${isDragTarget ? 'border-pink-400/40 scale-[1.01]' : ''}`}
                  >
                    {/* Desktop Drag grip */}
                    <div className="hidden md:flex text-white/25 group-hover:text-white/60 cursor-grab touch-none flex-shrink-0">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Artwork */}
                    <div className="w-7 h-7 rounded-md flex-shrink-0 overflow-hidden bg-slate-900 relative">
                      {isCurrent && isPlaying ? (
                        <div className="w-full h-full flex items-center justify-center bg-pink-500/20">
                          <EqBars size="sm" color="text-pink-400" paused={false} />
                        </div>
                      ) : artworkUrl ? (
                        <img
                          src={artworkUrl}
                          alt=""
                          className={`w-full h-full object-cover ${isYouTubeThumbnail(track, artworkUrl) ? 'scale-[1.33]' : ''}`}
                        />
                      ) : (
                        <GradientAvatar seed={track.title} size={28} />
                      )}
                      {!isCurrent && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                          <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[11px] font-semibold truncate ${isCurrent ? 'text-white' : 'text-white/85'}`}
                      >
                        {track.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40 truncate">
                        <span className="truncate">{track.artist || 'Unknown Artist'}</span>
                        {uploaderName && (
                          <>
                            <span className="text-white/20">•</span>
                            <span className="inline-flex items-center gap-1 text-white/40 text-[9px] flex-shrink-0">
                              {avatar && (
                                <img
                                  src={avatar}
                                  alt=""
                                  className="w-3 h-3 rounded-full object-cover border border-white/10"
                                />
                              )}
                              <span>{uploaderName}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Controls: Reorder buttons & Delete */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Reorder Up/Down */}
                      <div className="flex flex-col opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          disabled={index === 0}
                          onClick={(e) => handleMoveUp(index, e)}
                          aria-label={`Move ${track.title} up`}
                          className="text-white/40 hover:text-white/80 active:text-white disabled:opacity-20 p-0.5 transition-colors"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={index === queue.length - 1}
                          onClick={(e) => handleMoveDown(index, e)}
                          aria-label={`Move ${track.title} down`}
                          className="text-white/40 hover:text-white/80 active:text-white disabled:opacity-20 p-0.5 transition-colors"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromActiveQueue(track.queue_row_id);
                        }}
                        aria-label={`Remove ${track.title} from queue`}
                        className="p-1 text-white/40 hover:text-red-400 active:text-red-400 rounded-md hover:bg-red-500/10 transition-colors opacity-70 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-white/8 bg-black/25 backdrop-blur-md flex-shrink-0">
            {/* Repeat Mode Toggle */}
            <button
              onClick={handleCycleLoopMode}
              aria-label={
                queueLoopMode === 'one'
                  ? 'Repeat current track'
                  : queueLoopMode === 'all'
                    ? 'Repeat entire queue'
                    : 'Repeat off'
              }
              title={
                queueLoopMode === 'one'
                  ? 'Repeat: Current Track'
                  : queueLoopMode === 'all'
                    ? 'Repeat: Entire Queue'
                    : 'Repeat: Off'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                queueLoopMode !== 'off'
                  ? 'bg-pink-500/20 border-pink-400/40 text-pink-300'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {queueLoopMode === 'one' ? (
                <Repeat1 className="w-3.5 h-3.5 text-pink-400" />
              ) : (
                <Repeat
                  className={`w-3.5 h-3.5 ${queueLoopMode !== 'off' ? 'text-pink-400' : 'text-white/60'}`}
                />
              )}
              <span>
                {queueLoopMode === 'one'
                  ? 'Repeat Track'
                  : queueLoopMode === 'all'
                    ? 'Repeat All'
                    : 'Repeat Off'}
              </span>
            </button>

            {/* Right: Save as Playlist + Add Track */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveAsPlaylist}
                aria-label="Save queue as playlist"
                className="flex items-center gap-1 text-[11px] font-medium text-white/70 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
              >
                {saveConfirmed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <BookmarkPlus className="w-3.5 h-3.5" />
                )}
                <span>Save</span>
              </button>

              <button
                onClick={onOpenAddModal}
                aria-label="Add song to library"
                className="flex items-center gap-1 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-full px-3 py-1 text-[11px] font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
