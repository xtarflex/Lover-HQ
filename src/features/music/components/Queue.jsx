import React, { useState } from 'react';
import { useMusic } from '../../../contexts/MusicContext';
import { useAppContext } from '../../../contexts/AppContext';
import { Trash2 } from '../../../lib/icons';
import { ChevronUp, ChevronDown, Plus, Play, GripVertical, Music } from 'lucide-react';
import { getTrackArtwork } from '../lib/musicUtils';
import GradientAvatar from '../../../components/ui/GradientAvatar';
import EqBars from '../../../components/ui/EqBars';

/** Illustrated SVG empty state for an empty queue. */
const EmptyQueueIllustration = () => (
  <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-slate-600" aria-hidden="true">
    <rect x="20" y="30" width="80" height="12" rx="6" fill="currentColor" opacity="0.3" />
    <rect x="20" y="48" width="60" height="12" rx="6" fill="currentColor" opacity="0.2" />
    <rect x="20" y="66" width="70" height="12" rx="6" fill="currentColor" opacity="0.15" />
    <circle cx="95" cy="25" r="14" fill="currentColor" opacity="0.15" />
    <path d="M90 20 L100 25 L90 30Z" fill="currentColor" opacity="0.5" />
  </svg>
);

/** Skeleton row shown while queue is loading. */
const SkeletonRow = () => (
  <div className="border border-surface-border/30 rounded-xl p-3 flex items-center space-x-3 animate-pulse">
    <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-slate-800/60 rounded-full w-3/4" />
      <div className="h-2.5 bg-slate-800/40 rounded-full w-1/2" />
    </div>
  </div>
);

/**
 * Queue panel component. Displays the shared tracklist, allows both partners
 * to add, delete, and reorder tracks with drag-and-drop and button controls.
 *
 * @param {Object} props
 * @param {Function} props.onOpenAddModal - Callback to open the Add Track modal.
 * @returns {React.ReactElement} The Queue component.
 */
export default function Queue({ onOpenAddModal }) {
  const { user, partner } = useAppContext();
  const { queue, currentTrack, isPlaying, playTrackById, removeFromQueue, reorderQueue } = useMusic();
  const [isLoading] = useState(false); // set true briefly on first mount if needed
  const [dragOverIndex, setDragOverIndex] = useState(null);

  /**
   * Returns avatar URL for the user who added a track.
   *
   * @param {string} addedById - UUID of the user who added the track.
   * @returns {string|null} Avatar URL or null.
   */
  const getUploaderAvatar = (addedById) => {
    if (user && addedById === user.id) return user.avatar_url;
    if (partner && addedById === partner.id) return partner.avatar_url;
    return null;
  };

  /**
   * Moves a track one position upward.
   *
   * @param {number} index - Current index of the track.
   * @param {React.SyntheticEvent} e - Click event.
   */
  const handleMoveUp = (index, e) => {
    e.stopPropagation();
    if (index === 0) return;
    const newQueue = [...queue];
    [newQueue[index], newQueue[index - 1]] = [newQueue[index - 1], newQueue[index]];
    reorderQueue(newQueue);
  };

  /**
   * Moves a track one position downward.
   *
   * @param {number} index - Current index of the track.
   * @param {React.SyntheticEvent} e - Click event.
   */
  const handleMoveDown = (index, e) => {
    e.stopPropagation();
    if (index === queue.length - 1) return;
    const newQueue = [...queue];
    [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    reorderQueue(newQueue);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => setDragOverIndex(null);

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;
    const newQueue = [...queue];
    const [removed] = newQueue.splice(sourceIndex, 1);
    newQueue.splice(targetIndex, 0, removed);
    reorderQueue(newQueue);
  };

  return (
    <div className="music-glass-card rounded-2xl p-5 flex flex-col shadow-2xl w-full max-w-md mx-auto h-[480px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-border/60 mb-3 flex-shrink-0">
        <h3 className="font-rounded font-bold text-text-main text-base flex items-center space-x-2">
          <span>Shared Queue</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-text-muted">
            {queue.length} {queue.length === 1 ? 'song' : 'songs'}
          </span>
        </h3>
        <button
          id="queue-add-btn"
          onClick={onOpenAddModal}
          aria-label="Add song to queue"
          className="flex items-center space-x-1 bg-primary hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-full text-xs transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Song</span>
        </button>
      </div>

      {/* Track list */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-2">
        {isLoading ? (
          // Skeleton loading state
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : queue.length === 0 ? (
          // Illustrated empty state
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 space-y-3">
            <EmptyQueueIllustration />
            <p className="text-sm font-semibold text-text-muted">Queue is empty</p>
            <p className="text-xs text-text-muted/60">
              Add custom audio or YouTube links to jam together!
            </p>
          </div>
        ) : (
          queue.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;
            const artworkUrl = getTrackArtwork(track);
            const uploaderAvatar = getUploaderAvatar(track.added_by);
            const isDragTarget = dragOverIndex === index;

            return (
              <div
                key={track.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => playTrackById(track.id, 0)}
                role="button"
                tabIndex={0}
                aria-pressed={isCurrent}
                aria-label={`${track.title} by ${track.artist || 'Unknown Artist'}${isCurrent ? ', now playing' : ''}`}
                onKeyDown={(e) => e.key === 'Enter' && playTrackById(track.id, 0)}
                className={`queue-item group border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all duration-300 ${
                  isCurrent
                    ? 'bg-primary/10 border-primary/40 shadow-inner now-playing-pulse'
                    : 'bg-slate-900/40 border-surface-border hover:bg-slate-900/60 hover:border-slate-700'
                } ${isDragTarget ? 'border-primary/60 scale-[1.01]' : ''}`}
              >
                {/* Left: grip + artwork + text */}
                <div className="flex items-center space-x-2.5 overflow-hidden flex-1 min-w-0">
                  {/* Touch-friendly drag grip */}
                  <div
                    className="text-slate-600 group-hover:text-slate-400 cursor-grab active:cursor-grabbing p-1 touch-none"
                    aria-hidden="true"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* 32×32 track artwork thumbnail */}
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden relative bg-slate-950">
                    {isCurrent && isPlaying ? (
                      <div className="w-full h-full flex items-center justify-center bg-primary/20">
                        <EqBars size="sm" color="text-primary" paused={false} />
                      </div>
                    ) : artworkUrl ? (
                      <img
                        src={artworkUrl}
                        alt=""
                        className={`w-full h-full object-cover group-hover:opacity-70 transition-opacity ${
                          track?.source === 'youtube' ? 'scale-[1.33]' : ''
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full group-hover:opacity-70 transition-opacity">
                        <GradientAvatar seed={track.title} size={32} />
                      </div>
                    )}
                    {/* Play icon overlay on hover for non-current tracks */}
                    {!isCurrent && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                      </div>
                    )}
                  </div>

                  {/* Title & artist */}
                  <div className="flex flex-col min-w-0 overflow-hidden">
                    <span className={`text-sm font-semibold truncate ${isCurrent ? 'text-primary font-rounded' : 'text-text-main'}`}>
                      {track.title}
                    </span>
                    <span className="text-xs text-text-muted truncate">
                      {track.artist || 'Unknown Artist'}
                    </span>
                  </div>
                </div>

                {/* Right: uploader avatar + reorder + delete */}
                <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                  {/* Uploader avatar */}
                  <div className="w-5 h-5 rounded-full border border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {uploaderAvatar ? (
                      <img src={uploaderAvatar} alt="Added by" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-3 h-3 text-slate-500" />
                    )}
                  </div>

                  {/* Reorder buttons */}
                  <div className="flex flex-col">
                    <button
                      disabled={index === 0}
                      onClick={(e) => handleMoveUp(index, e)}
                      aria-label={`Move ${track.title} up`}
                      className="text-text-muted hover:text-primary transition-colors disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === queue.length - 1}
                      onClick={(e) => handleMoveDown(index, e)}
                      aria-label={`Move ${track.title} down`}
                      className="text-text-muted hover:text-primary transition-colors disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromQueue(track.id); }}
                    aria-label={`Remove ${track.title} from queue`}
                    className="p-1.5 text-text-muted hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
