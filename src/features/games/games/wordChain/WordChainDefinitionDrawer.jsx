/**
 * @file WordChainDefinitionDrawer.jsx
 * @description Bottom-sheet drawer that displays the dictionary definition of a
 * word that was played in the Word Chain. Renders a modal backdrop that closes
 * the drawer on tap-outside, the word title, its part of speech, its letter-point
 * value, and the definition body (or a loading spinner while fetching).
 */

import React, { useState, useRef, useEffect } from 'react';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';

/**
 * Word definition bottom-sheet drawer.
 *
 * @param {object} props
 * @param {object} props.selectedDefinitionWord - The chain entry whose definition is shown.
 * @param {string} props.selectedDefinitionWord.word - The word string.
 * @param {string} [props.selectedDefinitionWord.definition] - Pre-fetched definition (may be empty).
 * @param {string} [props.selectedDefinitionWord.partOfSpeech] - Pre-fetched part of speech.
 * @param {string} props.drawerDefinition - The resolved definition text to display.
 * @param {string} props.drawerPartOfSpeech - The resolved part-of-speech label to display.
 * @param {boolean} props.drawerLoading - Whether a definition fetch is in progress.
 * @param {Function} props.calculateLetterPoints - Function that returns the point value of a word.
 * @param {Function} props.onClose - Callback invoked to close the drawer.
 * @returns {React.ReactElement}
 */
export default function WordChainDefinitionDrawer({
  selectedDefinitionWord,
  drawerDefinition,
  drawerPartOfSpeech,
  drawerLoading,
  calculateLetterPoints,
  onClose,
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const containerRef = useRef(null);

  // Reset drag offset when selected word changes
  useEffect(() => {
    setDragOffset(0);
    setIsDragging(false);
  }, [selectedDefinitionWord]);

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

    const containerHeight = containerRef.current?.getBoundingClientRect().height || 300;
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
  const handlePointerCancel = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <div
      className="absolute inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-end justify-center transition-all animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        className="w-full max-w-md bg-surface/95 backdrop-blur-xl border-t border-surface-border rounded-t-3xl p-6 pb-8 space-y-4 shadow-2xl relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="w-12 h-1.5 bg-text-muted/20 rounded-full mx-auto mb-2 cursor-grab active:cursor-grabbing touch-none select-none"
        />

        {/* Word title + part-of-speech badge */}
        <div className="flex items-baseline justify-between">
          <h4 className="text-2xl font-extrabold text-primary capitalize">
            {selectedDefinitionWord.word}
          </h4>
          <span className="text-xs text-text-muted italic bg-surface border border-surface-border px-2 py-0.5 rounded-md uppercase tracking-wider font-semibold">
            {drawerLoading ? 'loading' : drawerPartOfSpeech || 'unknown'}
          </span>
        </div>

        {/* Point value */}
        <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
          <span>Word value:</span>
          <span className="text-primary font-extrabold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full text-xs">
            +{calculateLetterPoints(selectedDefinitionWord.word)} pts
          </span>
        </div>

        <hr className="border-surface-border/50" />

        {/* Definition body */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
            Definition
          </span>
          {drawerLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <p className="text-sm text-text-main leading-relaxed">
              {drawerDefinition || 'No definition available.'}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-surface hover:bg-surface-hover border border-surface-border text-text-main font-bold rounded-2xl transition-colors text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
