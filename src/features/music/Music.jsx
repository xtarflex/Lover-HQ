import React, { useState } from 'react';
import MusicPlayer from './components/MusicPlayer';
import Queue from './components/Queue';
import AddTrackModal from './components/AddTrackModal';

/**
 * Music Room feature component. Coordinates presence registration,
 * page responsiveness, and mounts the active player dashboard, shared track queue,
 * and addition drawer.
 *
 * @returns {React.ReactElement} The Music component.
 */
export default function Music() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="w-full min-h-[calc(100vh-10rem)] pb-12 pt-2 flex flex-col items-center">
      {/* Header and branding */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold font-rounded text-text-main flex items-center justify-center space-x-2">
          <span>🎵</span>
          <span>Music Room</span>
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Listen to custom uploads and YouTube videos in real-time, together.
        </p>
      </div>

      {/* Responsive layout: side-by-side on large screens, stacked on small */}
      <div className="w-full flex flex-col space-y-6 lg:flex-row lg:space-x-6 lg:space-y-0 lg:items-start lg:justify-center px-2">
        {/* Playback controller */}
        <div className="w-full max-w-md lg:flex-shrink-0">
          <MusicPlayer />
        </div>

        {/* Playlist queue controller */}
        <div className="w-full max-w-md lg:flex-shrink-0">
          <Queue onOpenAddModal={() => setIsAddModalOpen(true)} />
        </div>
      </div>

      {/* Add Track Dialog */}
      <AddTrackModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
