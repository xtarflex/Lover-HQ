/**
 * @file ImageLightbox.jsx
 * @description Full-screen media lightbox overlay for the Lover-HQ chat.
 * Renders photos and videos with header, download action, and close controls.
 * Extracted verbatim from Chat.jsx.
 */

import React from 'react';
import { X } from 'lucide-react';

/**
 * Full-screen lightbox overlay for shared photos and videos.
 *
 * @param {{
 *   src: string,
 *   onClose: Function,
 *   onDownload: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export function ImageLightbox({ src, onClose, onDownload }) {
  const isVideo = src.match(/\.(mp4|webm|mov|ogg|m4v)/i);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col justify-between animate-fade-in select-none">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <span className="text-xs font-bold text-gray-300">
          {isVideo ? 'Shared Video' : 'Shared Photo'}
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Close lightbox"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Media */}
      <div
        className="flex-1 flex items-center justify-center p-4 cursor-zoom-out"
        onClick={onClose}
      >
        {isVideo ? (
          <video
            src={src}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={src}
            alt="Shared details"
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 hover:scale-[1.01]"
          />
        )}
      </div>

      {/* Footer controls */}
      <div className="p-6 flex justify-center space-x-6 bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={() => onDownload(src)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full text-xs font-bold transition-all border border-white/10 flex items-center space-x-1.5"
        >
          <span>{isVideo ? 'Download Video' : 'Download Image'}</span>
        </button>
      </div>
    </div>
  );
}
