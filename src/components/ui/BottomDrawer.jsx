import React, { useEffect, useRef } from 'react';

/**
 * @file BottomDrawer.jsx
 * @description A modern, accessible slide-up bottom sheet wrapper using the native HTML5 <dialog> element.
 * Integrates with CSS transitions, @starting-style animations, and backdrop blurs.
 */

/**
 * Modern Native Bottom Sheet Drawer Wrapper
 *
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Controls the visibility state of the drawer
 * @param {Function} props.onClose - Callback triggered when the drawer is dismissed or closed
 * @param {React.ReactNode} props.children - Inner drawer content to wrap
 * @returns {React.ReactElement} The dialog component wrapper
 */
export default function BottomDrawer({ isOpen, onClose, children }) {
  const dialogRef = useRef(null);

  // Sync React state with the native <dialog> show/hide methods
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        // Prevent body scroll when drawer is open
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (dialog.open) {
        dialog.close();
        // Restore body scroll when drawer is closed
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
      className="bottom-drawer"
    >
      <div className="bg-surface/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-x border-surface-border/60 dark:border-slate-800/80 rounded-t-3xl w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] md:max-h-[90vh]">
        {/* Decorative grab handle for sheet drawer feel */}
        <div className="w-12 h-1.5 bg-text-muted/20 dark:bg-slate-700 rounded-full mx-auto my-3 shrink-0" />

        {children}
      </div>
    </dialog>
  );
}
