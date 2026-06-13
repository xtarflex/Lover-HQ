import React from 'react';
import { useMusic } from '../../../contexts/MusicContext';
import { useAppContext } from '../../../contexts/AppContext';
import { Trash2 } from '../../../lib/icons';
import { ChevronUp, ChevronDown, Disc, Tv, Plus, Play, GripVertical } from 'lucide-react';

/**
 * Queue panel component. Displays the shared tracklist queue,
 * allows both partners to add, delete, and reorder tracks (via up/down keys
 * or drag and drop interactions).
 *
 * @param {Object} props
 * @param {Function} props.onOpenAddModal - Callback to trigger Add Track Modal opening.
 * @returns {React.ReactElement} The Queue component.
 */
export default function Queue({ onOpenAddModal }) {
  const { user, partner } = useAppContext();
  const { queue, currentTrack, playTrackById, removeFromQueue, reorderQueue } = useMusic();

  // Helper to get partner's avatar
  const getUploaderAvatar = (addedById) => {
    if (user && addedById === user.id) {
      return user.avatar_url;
    }
    if (partner && addedById === partner.id) {
      return partner.avatar_url;
    }
    return null;
  };

  // Move item up in index
  const handleMoveUp = (index, e) => {
    e.stopPropagation();
    if (index === 0) return;
    const newQueue = [...queue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[index - 1];
    newQueue[index - 1] = temp;
    reorderQueue(newQueue);
  };

  // Move item down in index
  const handleMoveDown = (index, e) => {
    e.stopPropagation();
    if (index === queue.length - 1) return;
    const newQueue = [...queue];
    const temp = newQueue[index];
    newQueue[index] = newQueue[index + 1];
    newQueue[index + 1] = temp;
    reorderQueue(newQueue);
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const newQueue = [...queue];
    const [removed] = newQueue.splice(sourceIndex, 1);
    newQueue.splice(targetIndex, 0, removed);
    reorderQueue(newQueue);
  };

  return (
    <div className="bg-surface/40 backdrop-blur-lg border border-surface-border rounded-2xl p-5 flex flex-col shadow-2xl w-full max-w-md mx-auto h-[480px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-border/60 mb-3 flex-shrink-0">
        <h3 className="font-rounded font-bold text-text-main text-base flex items-center space-x-2">
          <span>Shared Queue</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-text-muted">
            {queue.length} {queue.length === 1 ? 'song' : 'songs'}
          </span>
        </h3>
        <button
          onClick={onOpenAddModal}
          className="flex items-center space-x-1 bg-primary hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-full text-xs transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Song</span>
        </button>
      </div>

      {/* Queue items list */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <p className="text-sm text-text-muted">No songs in the queue yet.</p>
            <p className="text-xs text-text-muted/60 mt-1">
              Add custom audio or YouTube links to jam together!
            </p>
          </div>
        ) : (
          queue.map((track, index) => {
            const isCurrent = currentTrack && currentTrack.id === track.id;
            const uploaderAvatar = getUploaderAvatar(track.added_by);

            return (
              <div
                key={track.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => playTrackById(track.id, 0)}
                className={`group border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all duration-300 ${
                  isCurrent
                    ? 'bg-primary/10 border-primary/40 shadow-inner'
                    : 'bg-slate-900/40 border-surface-border hover:bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {/* Left Side: Drag handle, play overlay, and song details */}
                <div className="flex items-center space-x-2.5 overflow-hidden flex-1 min-w-0">
                  {/* Drag Handle fallback */}
                  <div className="text-slate-600 group-hover:text-slate-400 cursor-grab active:cursor-grabbing p-0.5 hidden sm:block">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Play/Source Indicator */}
                  <div className="w-8 h-8 rounded-lg bg-slate-950/80 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {isCurrent ? (
                      <span className="flex space-x-0.5 items-end h-3.5">
                        <span
                          className="w-0.5 bg-primary rounded-full animate-[pulse-ring_1s_infinite_alternate]"
                          style={{ height: '100%' }}
                        />
                        <span
                          className="w-0.5 bg-primary rounded-full animate-[pulse-ring_0.8s_infinite_alternate_0.2s]"
                          style={{ height: '70%' }}
                        />
                        <span
                          className="w-0.5 bg-primary rounded-full animate-[pulse-ring_1.2s_infinite_alternate_0.1s]"
                          style={{ height: '85%' }}
                        />
                      </span>
                    ) : (
                      <>
                        <div className="group-hover:hidden text-text-muted">
                          {track.source === 'upload' ? (
                            <Disc className="w-4 h-4" />
                          ) : (
                            <Tv className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <Play className="w-3.5 h-3.5 text-primary fill-primary hidden group-hover:block ml-0.5" />
                      </>
                    )}
                  </div>

                  {/* Text details */}
                  <div className="flex flex-col min-w-0 overflow-hidden">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-primary font-rounded' : 'text-text-main'
                      }`}
                    >
                      {track.title}
                    </span>
                    <span className="text-xs text-text-muted truncate">
                      {track.artist || 'Unknown Artist'}
                    </span>
                  </div>
                </div>

                {/* Right Side: Reordering arrows, Mini Avatar, Delete button */}
                <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                  {/* Uploader mini avatar */}
                  <div className="w-5 h-5 rounded-full border border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center">
                    {uploaderAvatar ? (
                      <img
                        src={uploaderAvatar}
                        alt="Queuer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Disc className="w-3 h-3 text-slate-500" />
                    )}
                  </div>

                  {/* Reordering Up/Down controls (Accessible fallback) */}
                  <div className="flex flex-col">
                    <button
                      disabled={index === 0}
                      onClick={(e) => handleMoveUp(index, e)}
                      className="text-text-muted hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-text-muted"
                      title="Move track up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === queue.length - 1}
                      onClick={(e) => handleMoveDown(index, e)}
                      className="text-text-muted hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-text-muted"
                      title="Move track down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(track.id);
                    }}
                    className="p-1.5 text-text-muted hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Remove from queue"
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
