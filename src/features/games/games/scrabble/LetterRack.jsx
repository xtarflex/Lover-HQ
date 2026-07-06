/**
 * @file LetterRack.jsx
 * @description Letter rack component displaying the player's current hand of tiles.
 */

import React from 'react';
import { getLetterScore } from './utils/tileBag';

/**
 * @param {object} props
 * @param {string[]} props.rack - Array of letters in the rack.
 * @param {number|null} props.selectedTileIndex - Index of the currently selected tile, if any.
 * @param {function(number): void} props.onSelectTile - Callback invoked when a rack tile is tapped.
 * @param {function(object, number): void} [props.onDragStartTile] - Desktop drag start callback.
 * @param {function(object, number): void} [props.onTouchStartTile] - Mobile touch start callback.
 * @returns {React.ReactElement}
 */
export default function LetterRack({
  rack,
  selectedTileIndex,
  onSelectTile,
  onDragStartTile,
  onTouchStartTile,
}) {
  // Pad the rack to 7 slots so the layout is stable
  const paddedRack = [...rack];
  while (paddedRack.length < 7) {
    paddedRack.push(null);
  }

  return (
    <div className="scrabble-rack" role="toolbar" aria-label="Letter rack">
      {paddedRack.map((letter, index) => (
        <div key={index} className="rack-tile-wrapper">
          {letter !== null && (
            <button
              id={`scrabble-rack-tile-${index}`}
              aria-label={`Letter ${letter}, score ${getLetterScore(letter)}`}
              onClick={() => onSelectTile(index)}
              draggable
              onDragStart={(e) => onDragStartTile && onDragStartTile(e, index)}
              onTouchStart={(e) => onTouchStartTile && onTouchStartTile(e, index)}
              className={`rack-tile ${selectedTileIndex === index ? 'selected' : ''} cursor-grab active:cursor-grabbing`}
            >
              {letter}
              <span className="tile-score">{getLetterScore(letter)}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
