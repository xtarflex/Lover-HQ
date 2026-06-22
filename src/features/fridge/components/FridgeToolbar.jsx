/**
 * @file FridgeToolbar.jsx
 * @description Top overlay toolbar for the Fridge board canvas,
 * containing view controls: clean mode, edit mode, zoom, snapping, and settings.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Trash2, Settings, Grid } from 'lucide-react';
import { FridgeIcon } from '../../../lib/icons';
import GlassDropdown from '../../../components/GlassDropdown';

/**
 * Top overlay toolbar for the Fridge board canvas.
 *
 * Renders the title card on the left and a horizontally-scrollable view-controls
 * strip on the right. Left/right scroll-gradient overlays are shown based on
 * the current scroll position of the inner toolbar element.
 *
 * @param {{
 *   hideOld: boolean,
 *   setHideOld: Function,
 *   cleanThreshold: number,
 *   setCleanThreshold: Function,
 *   isEditMode: boolean,
 *   setIsEditMode: Function,
 *   zoom: number,
 *   zoomIn: Function,
 *   zoomOut: Function,
 *   resetZoom: Function,
 *   isSnappingEnabled: boolean,
 *   toggleSnapping: Function,
 *   toolbarRef: React.RefObject<HTMLElement>,
 *   showLeftScrollGrad: boolean,
 *   showRightScrollGrad: boolean,
 * }} props
 * @returns {React.ReactElement}
 */
export default function FridgeToolbar({
  hideOld,
  setHideOld,
  cleanThreshold,
  setCleanThreshold,
  isEditMode,
  setIsEditMode,
  zoom,
  zoomIn,
  zoomOut,
  resetZoom,
  isSnappingEnabled,
  toggleSnapping,
  toolbarRef,
  showLeftScrollGrad,
  showRightScrollGrad,
}) {
  return (
    <div className="absolute top-4 left-4 right-4 z-40 pointer-events-none flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Title and Tagline */}
      <div className="pointer-events-auto bg-surface/75 backdrop-blur-md border border-surface-border/40 rounded-xl p-2.5 shadow-md self-start max-w-[200px] sm:max-w-xs">
        <h2 className="text-sm font-bold text-text-main flex items-center gap-1.5">
          <FridgeIcon className="w-4 h-4 text-primary" />
          Our Fridge
        </h2>
        <p className="text-[10px] text-text-muted mt-0.5">Pin notes, photos, and voice messages.</p>
      </div>

      {/* View Controls Toolbar Wrapper with Scroll Gradients */}
      <div className="pointer-events-auto self-start sm:self-auto relative max-w-full rounded-xl overflow-hidden flex items-center">
        {/* Left scroll indicator gradient */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
            showLeftScrollGrad ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Right scroll indicator gradient */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 via-slate-950/60 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
            showRightScrollGrad ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          ref={toolbarRef}
          className="flex items-center flex-nowrap whitespace-nowrap gap-1.5 bg-surface/75 backdrop-blur-md border border-surface-border/40 p-1.5 rounded-xl shadow-md max-w-full overflow-x-auto scrollbar-none"
        >
          {/* Declutter Toggle & Dropdown */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={() => setHideOld(!hideOld)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                hideOld
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-text-muted hover:text-text-main hover:bg-white/5 border border-transparent'
              }`}
              title={hideOld ? 'Show All Messages' : 'Hide Messages Older Than Threshold'}
            >
              {hideOld ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {hideOld ? 'Recent Only' : 'Clean Fridge'}
            </button>

            {hideOld && (
              <div className="ml-1.5 flex-shrink-0">
                <GlassDropdown
                  value={cleanThreshold}
                  options={[
                    { value: 3, label: '3 days' },
                    { value: 7, label: '7 days' },
                    { value: 14, label: '14 days' },
                    { value: 30, label: '30 days' },
                  ]}
                  onChange={setCleanThreshold}
                  size="sm"
                  align="right"
                />
              </div>
            )}
          </div>

          {/* Edit Mode Toggle */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              isEditMode
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-text-muted hover:text-text-main hover:bg-white/5 border border-transparent'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isEditMode ? 'Done' : 'Edit'}
          </button>

          {/* Settings Route Link */}
          <Link
            to="/settings?tab=fridge"
            className="p-1.5 text-text-muted hover:text-text-main rounded-md hover:bg-white/5 transition-colors flex-shrink-0"
            title="General Fridge Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>

          {/* Grid Snapping Toggle */}
          <button
            onClick={toggleSnapping}
            className={`p-1.5 rounded-md hover:bg-white/5 transition-colors flex-shrink-0 ${
              isSnappingEnabled ? 'text-primary' : 'text-text-muted hover:text-text-main'
            }`}
            title={isSnappingEnabled ? 'Disable Grid Snapping' : 'Enable Grid Snapping'}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Divider */}
          <div className="w-[1px] h-5 bg-surface-border/80 mx-0.5 flex-shrink-0" />

          {/* Zoom Buttons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={zoomOut}
              className="p-1 text-text-muted hover:text-text-main rounded-md hover:bg-white/5 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-text-muted min-w-[28px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1 text-text-muted hover:text-text-main rounded-md hover:bg-white/5 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1 text-text-muted hover:text-text-main rounded-md hover:bg-white/5 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
