import React, { useEffect, useRef } from 'react';

/**
 * @file ModalOverlay.jsx
 * @description A modern, accessible modal overlay wrapper using the native HTML5 <dialog> element.
 * Integrates with CSS transitions and @starting-style animations.
 */

/**
 * Modern Native Modal Overlay Wrapper
 *
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Controls the visibility state of the modal dialog
 * @param {Function} props.onClose - Callback triggered when the dialog is dismissed or closed
 * @param {React.ReactNode} props.children - Inner modal content to wrap
 * @returns {React.ReactElement} The dialog component wrapper
 */
export function ModalOverlay({ isOpen, onClose, children }) {
  const dialogRef = useRef(null);

  // Sync React state with the native <dialog> show/hide methods
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (dialog.open) {
        dialog.close();
        // Restore body scroll when modal is closed
        document.body.style.overflow = '';
      }
    }

    // Clean up scroll lock on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /**
   * Handle native Esc key or dismiss events.
   * Prevents default browser close behavior so that closing goes through the React state cycle.
   *
   * @param {Event} e - Native cancel event
   */
  const handleCancel = (e) => {
    e.preventDefault();
    if (onClose) onClose();
  };

  /**
   * Click handler to detect backdrop click.
   * In HTML5 <dialog>, clicks on the backdrop target the dialog element itself.
   *
   * @param {React.MouseEvent} e - Mouse click event
   */
  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current && onClose) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="native-modal"
    >
      <div className="bg-surface border border-surface-border/60 rounded-2xl w-full shadow-2xl overflow-hidden relative m-4">
        {children}
      </div>
    </dialog>
  );
}
