import React from 'react';

/**
 * @file ModalOverlay.jsx
 * @description A shared backdrop/overlay container used by modals to dim the page background and capture click-outside close actions.
 */

/**
 * Shared Modal Overlay Wrapper
 *
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Controls the visibility of the overlay
 * @param {Function} props.onClose - Callback triggered when clicking on the backdrop area
 * @param {React.ReactNode} props.children - Inner modal content to wrap
 * @returns {React.ReactElement|null} The overlay component or null if not open
 */
export function ModalOverlay({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-surface-border/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in fade-in-50 zoom-in-95 duration-200"
      >
        {children}
      </div>
    </div>
  );
}
