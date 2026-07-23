/**
 * @file ReferencedItemPreview.jsx
 * @description Tagged fridge reference item preview bar shown above chat input.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { X } from 'lucide-react';

/**
 * ReferencedItemPreview component.
 *
 * @param {{
 *   referencedItem: object|null,
 *   setReferencedItem: Function
 * }} props
 * @returns {React.ReactElement|null}
 */
export function ReferencedItemPreview({ referencedItem, setReferencedItem }) {
  if (!referencedItem) return null;

  let itemContentText = '';
  if (referencedItem.type === 'note') {
    try {
      itemContentText = JSON.parse(referencedItem.content).text || referencedItem.content;
    } catch {
      itemContentText = referencedItem.content;
    }
  } else {
    itemContentText = `Uploaded ${referencedItem.type}`;
  }

  return (
    <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between text-xs animate-slide-up">
      <div className="flex items-center space-x-2 truncate">
        <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px] shrink-0 font-bold font-sans">
          {referencedItem.type[0].toUpperCase()}
        </div>
        <div className="truncate">
          <span className="text-gray-300 font-bold block text-[10px] uppercase tracking-wider">
            Referencing Fridge {referencedItem.type}
          </span>
          <p className="truncate text-text-muted mt-0.5 font-medium">{itemContentText}</p>
        </div>
      </div>
      <button
        onClick={() => setReferencedItem(null)}
        className="text-text-muted hover:text-text-main p-1 shrink-0 ml-2"
        aria-label="Remove reference"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
