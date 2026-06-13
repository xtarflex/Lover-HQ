/**
 * @file WordChainDefinitionDrawer.jsx
 * @description Bottom-sheet drawer that displays the dictionary definition of a
 * word that was played in the Word Chain. Renders a modal backdrop that closes
 * the drawer on tap-outside, the word title, its part of speech, its letter-point
 * value, and the definition body (or a loading spinner while fetching).
 */

import React from 'react';
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
  return (
    <div
      className="absolute inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-end justify-center transition-all animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface/95 backdrop-blur-xl border-t border-surface-border rounded-t-3xl p-6 pb-8 space-y-4 shadow-2xl relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-text-muted/20 rounded-full mx-auto mb-2" />

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
