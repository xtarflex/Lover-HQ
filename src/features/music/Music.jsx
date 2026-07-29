import React, { useState, useEffect } from 'react';
import { useMusic } from '../../contexts/MusicContext';
import AddTrackModal from './components/AddTrackModal';
import NowPlayingFace from './components/NowPlayingFace';
import CollectionManagementFace from './components/CollectionManagementFace';

/**
 * @file src/features/music/Music.jsx
 * @description Music Room feature entry point. Renders the full-viewport 3D
 * dual-sided card workspace — Face 1 (Now Playing) flips to Face 2 (Collection
 * Management) via the pill toggle. Handles cold-start logic: automatically
 * shows Face 2 and opens the AddTrackModal when the library is empty.
 */

/**
 * Music component — the root of the Music Room feature.
 * Mounts the 3D card rotator with perspective, delegates face rendering to
 * NowPlayingFace and CollectionManagementFace, and wires add/playlist modals.
 *
 * @returns {React.ReactElement} The Music component.
 */
export default function Music() {
  const { library, isCardFlipped, setIsCardFlipped, saveQueueAsPlaylist, loadPlaylist } = useMusic();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [hasColdStarted, setHasColdStarted] = useState(false);

  // ── Cold Start: empty library → show Face 2 + open AddTrackModal ──────────
  useEffect(() => {
    if (hasColdStarted) return;
    // Wait until library has been fetched (null = loading, [] = genuinely empty)
    if (library === null) return;
    if (library.length === 0) {
      setIsCardFlipped(true);
      setIsAddModalOpen(true);
    }
    setHasColdStarted(true);
  }, [library, hasColdStarted, setIsCardFlipped]);

  /**
   * Toggles between Face 1 and Face 2.
   */
  const handleFlip = () => setIsCardFlipped((prev) => !prev);

  /**
   * Triggers the save-as-playlist flow. Called by FloatingQueuePanel.
   * CollectionManagementFace handles the UI name input, so here we
   * just flip to Face 2 and activate the playlists tab.
   */
  const handleSaveAsPlaylist = () => {
    setIsCardFlipped(true);
  };

  /**
   * Loads all tracks from a saved playlist into the active queue.
   *
   * @param {string} playlistId - The ID of the playlist to load.
   */
  const handleLoadPlaylist = (playlistId) => {
    loadPlaylist(playlistId);
    setIsCardFlipped(false);
  };

  return (
    <div className="music-3d-viewport" aria-label="Music Room">
      <div className={`music-card-rotator ${isCardFlipped ? 'is-flipped' : ''}`}>
        {/* ── Face 1: Now Playing ─────────────────────────────────────────── */}
        <NowPlayingFace
          isFlipped={isCardFlipped}
          onFlip={handleFlip}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onSaveAsPlaylist={handleSaveAsPlaylist}
        />

        {/* ── Face 2: Collection Management ──────────────────────────────── */}
        <CollectionManagementFace
          isFlipped={isCardFlipped}
          onFlip={handleFlip}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onLoadPlaylist={handleLoadPlaylist}
        />
      </div>

      {/* Add Track Modal — available on both faces */}
      <AddTrackModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
