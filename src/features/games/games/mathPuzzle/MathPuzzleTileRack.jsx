/**
 * @file MathPuzzleTileRack.jsx
 * @description Draggable/clickable tile rack for CrossMath numbers pool.
 */

import React from 'react';

/**
 * @param {object} props
 * @param {Array<{id: string, value: number, isPlaced: boolean}>} props.tiles - Tiles in the rack.
 * @param {string|null} props.selectedTileId - ID of currently selected tile.
 * @param {function(string): void} props.onSelectTile - Callback when tile is selected.
 * @param {function(React.DragEvent, string): void} props.onDragStart - Drag start handler.
 * @param {function(object, object): void} [props.onTouchStart] - Touch start handler.
 * @param {function(object): void} [props.onDragOverRack] - Drag over rack callback.
 * @param {function(object): void} [props.onDropRack] - Drop on rack callback.
 * @returns {React.ReactElement}
 */
export default function MathPuzzleTileRack({
  tiles,
  selectedTileId,
  onSelectTile,
  onDragStart,
  onTouchStart,
  onDragOverRack,
  onDropRack,
}) {
  return (
    <div className="math-rack-container">
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
        Tap a number, then tap an empty slot
      </p>
      <div
        className="math-rack"
        role="listbox"
        aria-label="Available number tiles"
        onDragOver={onDragOverRack}
        onDrop={onDropRack}
      >
        {tiles.map((tile) => {
          const isSelected = selectedTileId === tile.id;

          return (
            <div
              key={tile.id}
              draggable={!tile.isPlaced}
              onDragStart={(e) => !tile.isPlaced && onDragStart(e, tile.id)}
              onTouchStart={(e) => !tile.isPlaced && onTouchStart && onTouchStart(e, tile)}
              onClick={() => !tile.isPlaced && onSelectTile(tile.id)}
              className={`rack-number-tile ${tile.isPlaced ? 'disabled' : ''} ${
                isSelected ? 'selected' : ''
              } cursor-grab active:cursor-grabbing`}
              style={{
                cursor: tile.isPlaced ? 'not-allowed' : 'grab',
              }}
              role="option"
              aria-selected={isSelected}
              aria-disabled={tile.isPlaced}
            >
              {!tile.isPlaced && tile.value}
            </div>
          );
        })}
      </div>
    </div>
  );
}
