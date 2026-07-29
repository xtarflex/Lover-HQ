/* eslint-disable no-unused-vars, react/no-unescaped-entities */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Library,
  BookOpen,
  Music,
  Trash2,
  BookmarkPlus,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { useMusic } from '../../../contexts/MusicContext';
import { useAppContext } from '../../../contexts/AppContext';
import { getTrackArtwork } from '../lib/musicUtils';
import GradientAvatar from '../../../components/ui/GradientAvatar';
import EqBars from '../../../components/ui/EqBars';
import FlipPillToggle from './FlipPillToggle';

/**
 * @file src/features/music/components/CollectionManagementFace.jsx
 * @description Face 2 of the 3D music card — Collection Management.
 * Exposes a dual-tab architecture (Library | Playlists) with directional slide transitions.
 * Library tab shows all tracks saved to music_library. Tapping a track injects it into
 * the active queue and flips back to Face 1. Playlists tab is fully implemented.
 */

/** @type {Object} Slide-in/out animation variants for tab transitions. */
const tabVariants = {
  enterFromRight: { x: '100%', opacity: 0 },
  enterFromLeft: { x: '-100%', opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitToLeft: { x: '-100%', opacity: 0 },
  exitToRight: { x: '100%', opacity: 0 },
};

/**
 * CollectionManagementFace component — Face 2 of the 3D music card.
 *
 * @param {Object} props
 * @param {boolean} props.isFlipped - Whether this face is currently visible.
 * @param {Function} props.onFlip - Triggers flip back to Face 1.
 * @param {Function} props.onOpenAddModal - Opens the Add Track modal.
 * @returns {React.ReactElement} The CollectionManagementFace component.
 */
export default function CollectionManagementFace({ isFlipped, onFlip, onOpenAddModal }) {
  const { user } = useAppContext();
  const {
    library,
    queue,
    currentTrack,
    isPlaying,
    accentColor,
    injectTrackIntoQueue,
    removeFromLibrary,
    playlists,
    saveQueueAsPlaylist,
    loadPlaylist,
    deletePlaylist,
  } = useMusic();

  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'playlists'
  const [prevTab, setPrevTab] = useState(null);
  const [savePlaylistName, setSavePlaylistName] = useState('');
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);

  /**
   * Switches the active tab with a direction-aware slide animation.
   *
   * @param {'library'|'playlists'} tab - The tab to switch to.
   */
  const handleTabSwitch = (tab) => {
    if (tab === activeTab) return;
    setPrevTab(activeTab);
    setActiveTab(tab);
  };

  /**
   * Determines the enter animation direction based on the tab order.
   *
   * @param {'library'|'playlists'} tab - The tab rendering.
   * @returns {string} The framer-motion variant key.
   */
  const resolveEnterVariant = (tab) => {
    if (!prevTab) return 'center';
    const order = ['library', 'playlists'];
    return order.indexOf(tab) > order.indexOf(prevTab) ? 'enterFromRight' : 'enterFromLeft';
  };

  /**
   * Resolves the exit animation direction based on tab order.
   *
   * @param {'library'|'playlists'} tab - The tab exiting.
   * @returns {string} The framer-motion variant key.
   */
  const resolveExitVariant = (tab) => {
    const order = ['library', 'playlists'];
    return order.indexOf(tab) < order.indexOf(activeTab) ? 'exitToLeft' : 'exitToRight';
  };

  /**
   * Injects a library track into the active queue and flips back to Now Playing.
   *
   * @param {string} libraryTrackId - The ID of the track in music_library.
   */
  const handleTrackSelect = (libraryTrackId) => {
    injectTrackIntoQueue(libraryTrackId, 'append');
    onFlip();
  };

  /**
   * Saves the current active queue as a named playlist.
   */
  const handleSavePlaylist = async () => {
    if (!savePlaylistName.trim() || queue.length === 0) return;
    setIsSavingPlaylist(true);
    await saveQueueAsPlaylist(savePlaylistName.trim());
    setSavePlaylistName('');
    setShowNameInput(false);
    setIsSavingPlaylist(false);
  };

  const accentStyle = accentColor ? { '--music-accent': accentColor } : {};

  return (
    <div
      className="face-collection-management bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col"
      style={accentStyle}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8 flex-shrink-0">
        <h2 className="text-base font-bold text-white font-rounded">Collection</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            aria-label="Add track to library"
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/18 text-white/80 hover:text-white rounded-full px-3 py-1.5 text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Track
          </button>
          <FlipPillToggle isFlipped={isFlipped} onFlip={onFlip} accentColor={accentColor} />
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-white/8 flex-shrink-0 px-5 gap-6">
        {[
          { id: 'library', label: 'Library', icon: Library },
          { id: 'playlists', label: 'Playlists', icon: BookOpen },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabSwitch(id)}
            className={`flex items-center gap-1.5 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === id
                ? 'border-pink-400 text-white'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {id === 'library' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/40">
                {library?.length ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div className="collection-tab-viewport flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            className="absolute inset-0 overflow-y-auto custom-scrollbar"
            variants={tabVariants}
            initial={resolveEnterVariant(activeTab)}
            animate="center"
            exit={resolveExitVariant(activeTab)}
            transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
          >
            {/* ── Library Tab ───────────────────────────────────────────── */}
            {activeTab === 'library' && (
              <div className="p-3 space-y-1.5">
                {!library || library.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <Music className="w-12 h-12 text-white/15" />
                    <p className="text-sm font-semibold text-white/40 font-rounded">
                      Your library is empty
                    </p>
                    <p className="text-xs text-white/25 max-w-[200px]">
                      Add tracks using the button above — they're saved here permanently for both of
                      you.
                    </p>
                  </div>
                ) : (
                  library.map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const artworkUrl = getTrackArtwork(track);

                    return (
                      <div
                        key={track.id}
                        onClick={() => handleTrackSelect(track.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleTrackSelect(track.id)}
                        aria-label={`Play ${track.title}`}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                          isCurrent
                            ? 'bg-white/10 border border-white/15'
                            : 'hover:bg-white/6 border border-transparent'
                        }`}
                      >
                        {/* Artwork */}
                        <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-slate-800 relative">
                          {isCurrent && isPlaying ? (
                            <div className="w-full h-full flex items-center justify-center bg-pink-500/20">
                              <EqBars size="sm" color="text-pink-400" paused={false} />
                            </div>
                          ) : artworkUrl ? (
                            <img
                              src={artworkUrl}
                              alt=""
                              className={`w-full h-full object-cover ${
                                track.source === 'youtube' ? 'scale-[1.33]' : ''
                              }`}
                            />
                          ) : (
                            <GradientAvatar seed={track.title} size={40} />
                          )}
                          {!isCurrent && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            </div>
                          )}
                        </div>

                        {/* Track info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isCurrent ? 'text-white' : 'text-white/80'
                            }`}
                          >
                            {track.title}
                          </p>
                          <p className="text-xs text-white/40 truncate">
                            {track.artist || 'Unknown Artist'}
                          </p>
                        </div>

                        {/* Delete from library */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromLibrary(track.id);
                          }}
                          aria-label={`Remove ${track.title} from library`}
                          className="p-1.5 text-white/20 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Playlists Tab ──────────────────────────────────────────── */}
            {activeTab === 'playlists' && (
              <div className="p-4 space-y-4">
                {/* Save queue as playlist */}
                <div className="bg-white/5 border border-white/8 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <BookmarkPlus className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-bold text-white/80">Save Queue as Playlist</span>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    Snapshot the current queue ({queue.length} track{queue.length !== 1 ? 's' : ''})
                    as a named playlist you can revisit any time.
                  </p>
                  {showNameInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={savePlaylistName}
                        onChange={(e) => setSavePlaylistName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSavePlaylist()}
                        placeholder="e.g. Sunday Morning Vibes"
                        autoFocus
                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-pink-400 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                      />
                      <button
                        onClick={handleSavePlaylist}
                        disabled={
                          !savePlaylistName.trim() || isSavingPlaylist || queue.length === 0
                        }
                        className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs px-3 py-2 rounded-xl disabled:opacity-40 transition-colors"
                      >
                        {isSavingPlaylist ? '…' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNameInput(true)}
                      disabled={queue.length === 0}
                      className="w-full flex items-center justify-center gap-1.5 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/20 text-pink-300 text-xs font-bold rounded-xl py-2 transition-all disabled:opacity-40"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      Save Current Queue
                    </button>
                  )}
                </div>

                {/* Saved playlists list */}
                {!playlists || playlists.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <BookOpen className="w-10 h-10 text-white/10" />
                    <p className="text-sm font-semibold text-white/30 font-rounded">
                      No playlists yet
                    </p>
                    <p className="text-xs text-white/20">
                      Save your first queue above to create a playlist.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-1">
                      Saved Playlists
                    </p>
                    {playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className="group flex items-center gap-3 rounded-xl px-3 py-3 bg-white/5 border border-white/8 hover:bg-white/10 transition-all cursor-pointer"
                        onClick={() => {
                          loadPlaylist(playlist.id);
                          onFlip();
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && (loadPlaylist(playlist.id), onFlip())
                        }
                        aria-label={`Load playlist ${playlist.name}`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500/30 to-violet-500/30 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-pink-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white/85 truncate">
                            {playlist.name}
                          </p>
                          <p className="text-xs text-white/35">
                            {playlist.track_ids?.length ?? 0} tracks
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePlaylist(playlist.id);
                          }}
                          aria-label={`Delete playlist ${playlist.name}`}
                          className="p-1.5 text-white/20 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
