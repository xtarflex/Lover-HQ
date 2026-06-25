import React, { useState, useEffect, useRef } from 'react';

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
  const containerRef = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

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

  // Reset drag offset when drawer state changes
  /* eslint-disable react-hooks/set-state-in-effect -- Intentional: reset drag offset and state when the drawer closes */
  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setIsDragging(false);
    }
  }, [isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  /**
   * Handle pointer down event to initiate dragging.
   * Only allows dragging with left click / primary pointer.
   *
   * @param {React.PointerEvent} e - Native pointer event
   */
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    startYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  /**
   * Handle pointer move event to update drag position.
   *
   * @param {React.PointerEvent} e - Native pointer event
   */
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startYRef.current;
    // Only allow dragging downwards
    if (deltaY > 0) {
      setDragOffset(deltaY);
    } else {
      setDragOffset(0);
    }
  };

  /**
   * Handle pointer up event to finish dragging and determine if drawer should close.
   *
   * @param {React.PointerEvent} e - Native pointer event
   */
  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    const containerHeight = containerRef.current?.getBoundingClientRect().height || 400;
    const threshold = Math.min(120, containerHeight * 0.25);

    if (dragOffset > threshold) {
      if (onClose) onClose();
    }
    setDragOffset(0);
  };

  /**
   * Handle pointer cancel event to reset drag state.
   *
   * @param {React.PointerEvent} e - Native pointer event
   */
  const handlePointerCancel = (_e) => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="bottom-drawer"
    >
      <div
        ref={containerRef}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        className="bg-surface/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-x border-surface-border/60 dark:border-slate-800/80 rounded-t-3xl w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] md:max-h-[90vh]"
      >
        {/* Decorative grab handle for sheet drawer feel */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="w-12 h-1.5 bg-text-muted/20 dark:bg-slate-700 rounded-full mx-auto my-3 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
        />

        {children}
      </div>
    </dialog>
  );
}
