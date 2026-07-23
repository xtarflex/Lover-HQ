/**
 * @file MediaPreviewSheet.jsx
 * @description Multi-image and video preview, cropping, filter options, and captioning drawer.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  VolumeX,
  Volume2,
  Crop,
  RotateCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  Plus,
  Send,
} from 'lucide-react';

/**
 * MediaPreviewSheet Component.
 */
export function MediaPreviewSheet({
  pendingMediaFiles,
  setPendingMediaFiles,
  activePreviewIndex,
  setActivePreviewIndex,
  mediaCaption,
  setMediaCaption,
  isCropping,
  setIsCropping,
  cropRect,
  cropAspectRatio,
  setCropAspectRatio,
  showFiltersDrawer,
  setShowFiltersDrawer,
  previewContainerRef,
  activeObjectUrl,
  handleToggleMuteActive,
  handleStartCropping,
  handleRotateActive,
  handleFlipActive,
  handleTouchStart,
  handleTouchEnd,
  getScaleAndDims,
  handleImageLoad,
  handleCropPointerDown,
  applyAspectRatio,
  handleSaveCrop,
  handleFilterActive,
  triggerImageSelect,
  setNaturalDims,
  handleBatchUpload,
}) {
  if (!pendingMediaFiles || pendingMediaFiles.length === 0) return null;

  return (
    <div className="absolute inset-0 bg-black z-[70] flex flex-col justify-between animate-fade-in select-none">
      {/* Header */}
      {!isCropping && (
        <div className="p-4 flex items-center justify-between bg-black z-30">
          {/* Left: Close button and file count */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setPendingMediaFiles([]);
                setActivePreviewIndex(0);
                setMediaCaption('');
                setIsCropping(false);
                setCropAspectRatio('free');
              }}
              className="w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white flex items-center justify-center transition-colors"
              aria-label="Cancel preview"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="bg-slate-900/80 text-gray-300 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              {pendingMediaFiles.length} {pendingMediaFiles.length === 1 ? 'file' : 'files'}
            </span>
          </div>

          {/* Right: Editing icons */}
          <div className="flex items-center space-x-2">
            {(() => {
              const activeItem = pendingMediaFiles[activePreviewIndex] || pendingMediaFiles[0];
              if (!activeItem) return null;

              if (activeItem.file.type.startsWith('video/')) {
                return (
                  <button
                    onClick={handleToggleMuteActive}
                    className="w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white flex items-center justify-center transition-colors"
                    title={activeItem.isMuted ? 'Unmute video' : 'Mute video'}
                  >
                    {activeItem.isMuted ? (
                      <VolumeX className="w-5 h-5 text-rose-500" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-emerald-400" />
                    )}
                  </button>
                );
              }

              return (
                <>
                  <button
                    onClick={handleStartCropping}
                    className="w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white flex items-center justify-center transition-colors"
                    title="Crop image"
                  >
                    <Crop className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleRotateActive}
                    className="w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white flex items-center justify-center transition-colors"
                    title="Rotate image"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleFlipActive}
                    className="w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white flex items-center justify-center transition-colors"
                    title="Flip image"
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Main Preview Carousel */}
      <div
        ref={previewContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 flex flex-col items-center justify-center bg-black p-4 min-h-0 relative select-none w-full"
      >
        <div className="relative flex items-center justify-center overflow-visible transition-all duration-300 w-full h-full max-h-[65vh]">
          {(() => {
            const activeItem = pendingMediaFiles[activePreviewIndex] || pendingMediaFiles[0];
            if (!activeItem) return null;

            if (activeItem.file.type.startsWith('video/')) {
              return (
                <video
                  src={URL.createObjectURL(activeItem.file)}
                  controls
                  autoPlay
                  loop
                  muted={activeItem.isMuted}
                  className="max-w-full h-auto max-h-[65vh] object-contain transition-transform duration-300 rounded-lg shadow-xl"
                />
              );
            }

            const filterStyles = {
              none: '',
              grayscale: 'grayscale(100%)',
              sepia: 'sepia(100%)',
              warm: 'sepia(30%) saturate(140%) hue-rotate(-10deg)',
              cool: 'saturate(120%) hue-rotate(10deg)',
              vintage: 'sepia(50%) contrast(85%) saturate(110%)',
            };

            const { scale, width, height } = getScaleAndDims();

            const wrapperStyle = {
              width,
              height,
              transform: `rotate(${activeItem.rotation}deg) scaleX(${activeItem.flipped ? -1 : 1}) scale(${scale})`,
              transition: 'transform 0.2s ease',
            };

            const imageStyle = {
              filter: filterStyles[activeItem.filter] || '',
              transition: 'filter 0.2s ease',
            };

            return (
              <div
                className="relative overflow-visible flex items-center justify-center"
                style={wrapperStyle}
              >
                <img
                  src={activeObjectUrl}
                  onLoad={handleImageLoad}
                  alt="Upload preview"
                  style={imageStyle}
                  className="w-full h-full object-contain select-none pointer-events-none"
                />
                {isCropping && (
                  <div
                    className="absolute border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] cursor-move select-none z-30"
                    style={{
                      left: `${cropRect.x}%`,
                      top: `${cropRect.y}%`,
                      width: `${cropRect.w}%`,
                      height: `${cropRect.h}%`,
                      boxSizing: 'border-box',
                    }}
                    onMouseDown={(e) => handleCropPointerDown(e, 'move')}
                    onTouchStart={(e) => handleCropPointerDown(e, 'move')}
                  >
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      <div className="border-r border-b border-white/35" />
                      <div className="border-r border-b border-white/35" />
                      <div className="border-b border-white/35" />
                      <div className="border-r border-b border-white/35" />
                      <div className="border-r border-b border-white/35" />
                      <div className="border-b border-white/35" />
                      <div className="border-r border-white/35" />
                      <div className="border-r border-white/35" />
                      <div className="bg-transparent" />
                    </div>

                    <div
                      className="absolute w-4 h-4 border-t-4 border-l-4 border-white -top-1.5 -left-1.5 cursor-nwse-resize z-40 bg-transparent rounded-none"
                      onMouseDown={(e) => handleCropPointerDown(e, 'top-left')}
                      onTouchStart={(e) => handleCropPointerDown(e, 'top-left')}
                    />
                    <div
                      className="absolute w-4 h-4 border-t-4 border-r-4 border-white -top-1.5 -right-1.5 cursor-nesw-resize z-40 bg-transparent rounded-none"
                      onMouseDown={(e) => handleCropPointerDown(e, 'top-right')}
                      onTouchStart={(e) => handleCropPointerDown(e, 'top-right')}
                    />
                    <div
                      className="absolute w-4 h-4 border-b-4 border-l-4 border-white -bottom-1.5 -left-1.5 cursor-nesw-resize z-40 bg-transparent rounded-none"
                      onMouseDown={(e) => handleCropPointerDown(e, 'bottom-left')}
                      onTouchStart={(e) => handleCropPointerDown(e, 'bottom-left')}
                    />
                    <div
                      className="absolute w-4 h-4 border-b-4 border-r-4 border-white -bottom-1.5 -right-1.5 cursor-nwse-resize z-40 bg-transparent rounded-none"
                      onMouseDown={(e) => handleCropPointerDown(e, 'bottom-right')}
                      onTouchStart={(e) => handleCropPointerDown(e, 'bottom-right')}
                    />
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Filters Chevron Toggle & Crop Mode UI */}
        {(() => {
          const activeItem = pendingMediaFiles[activePreviewIndex] || pendingMediaFiles[0];
          if (!activeItem) return null;

          if (isCropping) {
            return (
              <div className="w-full flex flex-col items-center space-y-4 py-4 bg-black border-t border-slate-900 z-20">
                <div className="w-full flex items-center justify-center space-x-2 px-4 overflow-x-auto scrollbar-none">
                  {['free', '1:1', '16:9', '4:3', '9:16'].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => applyAspectRatio(ratio)}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all shrink-0 ${
                        cropAspectRatio === ratio
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-slate-900/80 text-gray-400 hover:bg-slate-800'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between w-full max-w-md px-6 pt-2 pb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCropping(false);
                      setCropAspectRatio('free');
                    }}
                    className="text-gray-400 hover:text-white font-extrabold text-xs uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleRotateActive}
                    className="w-11 h-11 rounded-full bg-slate-900 hover:bg-slate-850 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-slate-800"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCrop}
                    className="text-emerald-400 hover:text-emerald-300 font-extrabold text-xs uppercase tracking-widest transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="flex flex-col items-center mt-2 z-20">
              <button
                onClick={() => setShowFiltersDrawer((prev) => !prev)}
                className="flex flex-col items-center text-gray-400 hover:text-white transition-colors"
              >
                {showFiltersDrawer ? (
                  <ChevronDown className="w-5 h-5 animate-pulse" />
                ) : (
                  <ChevronUp className="w-5 h-5 animate-pulse" />
                )}
                <span className="text-[10px] font-bold tracking-wider mt-0.5 uppercase">
                  Filters
                </span>
              </button>
            </div>
          );
        })()}

        {/* Live Filters drawer */}
        <AnimatePresence>
          {!isCropping && showFiltersDrawer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full max-w-md bg-transparent py-3 px-4 mt-2 overflow-x-auto overflow-y-hidden flex items-center justify-start space-x-4 scrollbar-none z-20"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to right, transparent, white 8%, white 92%, transparent)',
                maskImage:
                  'linear-gradient(to right, transparent, white 8%, white 92%, transparent)',
              }}
            >
              {(() => {
                const activeItem = pendingMediaFiles[activePreviewIndex] || pendingMediaFiles[0];
                if (!activeItem) return null;

                if (activeItem.file.type.startsWith('video/')) {
                  return (
                    <span className="text-[10px] text-gray-500 font-medium">
                      Filters are not supported for videos
                    </span>
                  );
                }

                const filterNames = ['none', 'grayscale', 'sepia', 'warm', 'cool', 'vintage'];
                const filterStyles = {
                  none: '',
                  grayscale: 'grayscale(100%)',
                  sepia: 'sepia(100%)',
                  warm: 'sepia(30%) saturate(140%) hover-rotate(-10deg)',
                  cool: 'saturate(120%) hue-rotate(10deg)',
                  vintage: 'sepia(50%) contrast(85%) saturate(110%)',
                };

                return filterNames.map((fName) => {
                  const filterThumbStyle = {
                    transform: `rotate(${activeItem.rotation}deg) scaleX(${activeItem.flipped ? -1 : 1})`,
                    filter: filterStyles[fName] || '',
                  };

                  return (
                    <button
                      key={`filter-card-${fName}`}
                      type="button"
                      onClick={() => handleFilterActive(fName)}
                      className="flex flex-col items-center space-y-1.5 shrink-0 hover:scale-105 active:scale-95 transition-all"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-800 hover:border-slate-700 transition-all">
                        <img
                          src={activeObjectUrl}
                          alt={fName}
                          style={filterThumbStyle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider ${
                          activeItem.filter === fName ? 'text-primary' : 'text-gray-400'
                        }`}
                      >
                        {fName === 'none' ? 'Original' : fName}
                      </span>
                    </button>
                  );
                });
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thumbnail selector row */}
        {!isCropping && (
          <div className="w-full max-w-md overflow-x-auto flex items-center space-x-2.5 py-4 px-2 mt-2 scrollbar-none">
            {pendingMediaFiles.map((item, idx) => {
              const filterStyles = {
                none: '',
                grayscale: 'grayscale(100%)',
                sepia: 'sepia(100%)',
                warm: 'sepia(30%) saturate(140%) hue-rotate(-10deg)',
                cool: 'saturate(120%) hue-rotate(10deg)',
                vintage: 'sepia(50%) contrast(85%) saturate(110%)',
              };
              const thumbStyle = {
                transform: `rotate(${item.rotation}deg) scaleX(${item.flipped ? -1 : 1})`,
                filter: filterStyles[item.filter] || '',
              };

              return (
                <div
                  key={`pending-thumb-${idx}`}
                  onClick={() => {
                    setActivePreviewIndex(idx);
                    setNaturalDims({ w: 0, h: 0 });
                  }}
                  className={`w-14 h-14 rounded-lg border shrink-0 relative group cursor-pointer ${
                    activePreviewIndex === idx
                      ? 'ring-2 ring-primary border-transparent'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                  style={{ overflow: 'visible' }}
                >
                  {item.file.type.startsWith('video/') ? (
                    <div className="relative w-full h-full">
                      <video
                        src={URL.createObjectURL(item.file)}
                        muted
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                        <Play className="w-4 h-4 text-white fill-white/60" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={URL.createObjectURL(item.file)}
                      alt="Thumbnail"
                      style={thumbStyle}
                      className="w-full h-full object-cover rounded-lg transition-transform duration-200"
                    />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingMediaFiles((prev) => {
                        const next = prev.filter((_, i) => i !== idx);
                        if (activePreviewIndex >= next.length) {
                          setActivePreviewIndex(Math.max(0, next.length - 1));
                        }
                        setNaturalDims({ w: 0, h: 0 });
                        return next;
                      });
                    }}
                    className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-500 z-10"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={triggerImageSelect}
              className="w-14 h-14 rounded-lg border border-dashed border-slate-650 hover:border-primary hover:bg-primary/5 flex items-center justify-center text-text-muted hover:text-primary transition-all shrink-0"
              aria-label="Add more media"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Caption and Send bar */}
      {!isCropping && (
        <div className="p-4 bg-slate-900 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={mediaCaption}
              onChange={(e) => setMediaCaption(e.target.value)}
              placeholder="Add a caption..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-full h-10 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-white font-medium"
            />
            <button
              onClick={handleBatchUpload}
              className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 shrink-0"
              aria-label="Send media"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
