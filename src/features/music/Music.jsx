import React, { useState } from 'react';
import MusicPlayer from './components/MusicPlayer';
import Queue from './components/Queue';
import AddTrackModal from './components/AddTrackModal';

/** Inline SVG music note — replaces raw emoji in heading (fix #41). */
const MusicNoteIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6 text-primary"
    aria-hidden="true"
  >
    <path
      d="M14.3187 2.50498C13.0514 2.35716 11.8489 3.10033 11.4144 4.29989C11.3165 4.57023 11.2821 4.86251 11.266 5.16888C11.2539 5.40001 11.2509 5.67552 11.2503 6L11.25 6.45499V14.5359C10.4003 13.7384 9.25721 13.25 8 13.25C5.37665 13.25 3.25 15.3766 3.25 18C3.25 20.6234 5.37665 22.75 8 22.75C10.6234 22.75 12.75 20.6234 12.75 18V9.21059C12.8548 9.26646 12.9683 9.32316 13.0927 9.38527L15.8002 10.739C16.2185 10.9481 16.5589 11.1183 16.8378 11.2399C17.119 11.3625 17.3958 11.4625 17.6814 11.4958C18.9486 11.6436 20.1511 10.9004 20.5856 9.70089C20.6836 9.43055 20.7179 9.13826 20.7341 8.83189C20.75 8.52806 20.75 8.14752 20.75 7.67988L20.7501 7.59705C20.7502 7.2493 20.7503 6.97726 20.701 6.71946C20.574 6.05585 20.2071 5.46223 19.6704 5.05185L19.2185 4.77088L16.1999 3.26179C15.7816 3.05264 15.4412 2.88244 15.1623 2.76086C14.8811 2.63826 14.6043 2.53829 14.3187 2.50498Z"
      fill="currentColor"
    />
  </svg>
);

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
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold font-rounded text-text-main flex items-center justify-center gap-2">
          <MusicNoteIcon />
          <span>Music Room</span>
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Listen to custom uploads and YouTube videos in real-time, together.
        </p>
      </div>

      {/* Responsive layout: side-by-side on large screens, stacked on small */}
      <div className="w-full flex flex-col space-y-6 lg:flex-row lg:space-x-6 lg:space-y-0 lg:items-start lg:justify-center px-2">
        <div className="w-full max-w-md lg:flex-shrink-0">
          <MusicPlayer />
        </div>
        <div className="w-full max-w-md lg:flex-shrink-0">
          <Queue onOpenAddModal={() => setIsAddModalOpen(true)} />
        </div>
      </div>

      <AddTrackModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
