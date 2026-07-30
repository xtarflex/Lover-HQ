/* eslint-disable no-undef */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusic } from '../../../contexts/MusicContext';
import { useAppContext } from '../../../contexts/AppContext';
import { Trash2, Plus, ListMusic, BookmarkPlus, CheckCircle2 } from 'lucide-react';
import { Play } from '../../../lib/icons';
import { ChevronUp, ChevronDown, GripVertical, Music } from 'lucide-react';
import { getTrackArtwork } from '../lib/musicUtils';
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
 * @returns {React.ReactElement} The FloatingQueuePanel component.
 */
export default function FloatingQueuePanel({ isVisible, onOpenAddModal, onSaveAsPlaylist }) {
  const { user, partner } = useAppContext();
  const { queue, currentTrack, isPlaying, playTrackById, removeFromActiveQueue, reorderQueue } =
    useMusic();

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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
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
            <div className="flex items-center gap-2">
              {/* Save as Playlist */}
              <button
                onClick={handleSaveAsPlaylist}
                aria-label="Save queue as playlist"
                className="flex items-center gap-1 text-[10px] font-bold text-white/60 hover:text-white/90 transition-colors"
              >
                {saveConfirmed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <BookmarkPlus className="w-3.5 h-3.5" />
                )}
              </button>
              {/* Add song */}
              <button
                onClick={onOpenAddModal}
                aria-label="Add song to library"
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white/80 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
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
                const isCurrent = currentTrack?.id === track.id;
                const artworkUrl = getTrackArtwork(track);
                const avatar = resolveUploaderAvatar(track.added_by);
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
                    onClick={() => playTrackById(track.id, 0)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && playTrackById(track.id, 0)}
                    aria-pressed={isCurrent}
                    aria-label={`${track.title}${isCurrent ? ', now playing' : ''}`}
                    className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 cursor-pointer transition-all duration-200
                      ${
                        isCurrent
                          ? 'bg-white/12 border border-white/15'
                          : 'hover:bg-white/8 border border-transparent'
                      }
                      ${isDragTarget ? 'border-pink-400/40 scale-[1.01]' : ''}`}
                  >
                    {/* Drag grip */}
                    <div className="text-white/20 group-hover:text-white/40 cursor-grab touch-none flex-shrink-0">
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
                          className={`w-full h-full object-cover ${track.source === 'youtube' ? 'scale-[1.33]' : ''}`}
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
                        className={`text-[11px] font-semibold truncate ${isCurrent ? 'text-white' : 'text-white/75'}`}
                      >
                        {track.title}
                      </p>
                      <p className="text-[10px] text-white/40 truncate">
                        {track.artist || 'Unknown Artist'}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {avatar && (
                        <img
                          src={avatar}
                          alt="Added by"
                          className="w-4 h-4 rounded-full object-cover border border-white/10"
                        />
                      )}
                      <div className="flex flex-col">
                        <button
                          disabled={index === 0}
                          onClick={(e) => handleMoveUp(index, e)}
                          aria-label={`Move ${track.title} up`}
                          className="text-white/40 hover:text-white/80 disabled:opacity-20 transition-colors"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={index === queue.length - 1}
                          onClick={(e) => handleMoveDown(index, e)}
                          aria-label={`Move ${track.title} down`}
                          className="text-white/40 hover:text-white/80 disabled:opacity-20 transition-colors"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromActiveQueue(track.queue_row_id);
                        }}
                        aria-label={`Remove ${track.title} from queue`}
                        className="p-1 text-white/30 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
