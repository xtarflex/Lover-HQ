/**
 * @file FridgeItem.jsx
 * @description Draggable fridge magnet item rendered on the collaborative Fridge canvas.
 * Supports four content types: `note`, `photo`, `voice`, and `emoji`. Items can be
 * freely positioned, deleted, edited (notes only), commented on, and reacted to.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Play, Pause, Trash2, Pencil, Check, CheckCheck, Clock, MessageSquare } from 'lucide-react';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ANIMATED_EMOJIS, getEmojiCdnUrl } from './emojiData';

// Map color IDs to CSS styles (8 options)
const NOTE_COLOR_MAP = {
  yellow: 'bg-[#fef08a] text-[#854d0e] border-[#fde047]',
  pink: 'bg-[#fbcfe8] text-[#9d174d] border-[#f9a8d4]',
  blue: 'bg-[#bfdbfe] text-[#1e40af] border-[#93c5fd]',
  green: 'bg-[#bbf7d0] text-[#166534] border-[#86efac]',
  purple: 'bg-[#e9d5ff] text-[#6b21a8] border-[#d8b4fe]',
  orange: 'bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]',
  teal: 'bg-[#ccfbf1] text-[#115e59] border-[#99f6e4]',
  lavender: 'bg-[#e0e7ff] text-[#3730a3] border-[#c7d2fe]',
};

/**
 * Deterministic rotation based on item ID (stays same on reload)
 */
/**
 * Returns a deterministic rotation angle (between −3° and +3°) derived from the
 * item's ID so that each magnet has a stable tilt that persists across reloads.
 *
 * @param {string} id - The item's unique database ID.
 * @returns {number} A rotation angle in degrees.
 */
const getRotationAngle = (id) => {
  if (!id) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (hash % 7) - 3; // rotation between -3deg and +3deg
};

export default function FridgeItem({
  item,
  containerRef,
  isEditMode,
  onDelete,
  onEdit,
  onPositionChange,
  isNew,
  userId,
  partnerLastSeen,
  isPartnerInFridge,
  commentCount = 0,
  onOpenComments,
  onZoomPhoto,
  isSnappingEnabled,
  noteFont,
  _magnetSize,
}) {
  const itemRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(null);

  // Framer Motion values to reset offset on position update
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Parse item contents
  let noteText = '';
  let noteColor = 'yellow';
  let audioUrl = '';
  let voiceDuration = 0;

  if (item.type === 'note') {
    try {
      const parsed = JSON.parse(item.content);
      noteText = parsed.text || '';
      noteColor = parsed.color || 'yellow';
    } catch {
      noteText = item.content;
    }
  } else if (item.type === 'voice') {
    try {
      const parsed = JSON.parse(item.content);
      audioUrl = parsed.url || '';
      voiceDuration = parsed.duration || 0;
    } catch {
      audioUrl = item.content;
    }
  }

  /**
   * Returns Tailwind size classes appropriate for the item's content type.
   *
   * @returns {string} Space-separated Tailwind class names.
   */
  const getSizeClasses = () => {
    if (item.type === 'note') {
      return 'w-36 h-36 md:w-40 md:h-40 p-4';
    }
    if (item.type === 'photo') {
      return 'w-32 h-40 md:w-36 md:h-44 p-2 pb-6';
    }
    if (item.type === 'voice') {
      return 'w-28 h-28 md:w-32 md:h-32 p-3';
    }
    if (item.type === 'emoji') {
      return 'w-20 h-20 md:w-24 md:h-24 p-2';
    }
    return '';
  };

  /**
   * Returns the Tailwind typography class for the note font chosen in Settings.
   *
   * @returns {string} Space-separated Tailwind class names.
   */
  const getNoteFontClass = () => {
    const font = noteFont || 'handwriting';

    if (font === 'sans') {
      return 'font-body text-xs md:text-sm';
    }
    if (font === 'serif') {
      return 'font-serif text-xs md:text-sm';
    }
    if (font === 'mono') {
      return 'font-mono text-xs md:text-sm';
    }
    if (font === 'kalam') {
      return 'font-kalam text-sm md:text-base';
    }
    if (font === 'patrick') {
      return 'font-patrick text-sm md:text-base';
    }
    // handwriting (default - Caveat)
    return 'font-handwriting text-sm md:text-lg';
  };

  /**
   * Returns the CSS line-clamp class for the note text content.
   *
   * @returns {string} A Tailwind line-clamp class name.
   */
  const getLineClampClass = () => {
    return 'line-clamp-5';
  };

  /**
   * Returns a structured object of Tailwind class strings for each badge/button
   * variant rendered on the item card (comments, delete, edit, reactions).
   *
   * @returns {{
   *   comments: string,
   *   commentsIcon: string,
   *   commentsText: string,
   *   delete: string,
   *   deleteIcon: string,
   *   edit: string,
   *   editIcon: string,
   *   reactions: string
   * }}
   */
  const getBadgeClasses = () => {
    return {
      comments:
        'absolute -top-3 -right-3 px-2 py-1 bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-full flex items-center gap-1 shadow-lg text-white hover:scale-110 active:scale-95 transition-all z-30 font-sans',
      commentsIcon: 'w-3 h-3',
      commentsText: 'text-[10px] font-bold font-mono',
      delete:
        'absolute -top-3 -right-3 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md z-[60] border border-background transition-transform active:scale-95',
      deleteIcon: 'w-3.5 h-3.5',
      edit: 'absolute -top-3 -left-3 w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md z-[60] border border-background transition-transform active:scale-95',
      editIcon: 'w-3 h-3',
      reactions:
        'absolute -bottom-3 -left-2 flex flex-wrap gap-1 max-w-[120px] pointer-events-auto cursor-pointer z-30 font-sans',
    };
  };

  const renderAudioControls = () => {
    const svgSize = 'w-14 h-14';
    const cx = 28;
    const cy = 28;
    const r = 24;
    const strokeWidth = '3.5';
    const dashArray = 150;
    const btnSize = 'w-10 h-10';
    const iconSize = 'w-4 h-4';

    return (
      <div className="flex-grow flex items-center justify-center mt-1.5 relative">
        <svg className={`${svgSize} transform -rotate-90`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            stroke="rgba(245, 158, 11, 0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            stroke="#F59E0B"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={dashArray}
            strokeDashoffset={dashArray - (dashArray * audioProgress) / 100}
            className="transition-all duration-100"
          />
        </svg>

        <button
          onClick={handlePlayToggle}
          className={`absolute ${btnSize} bg-primary hover:bg-primary-hover text-brand-surface rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md focus:outline-none`}
        >
          {isPlaying ? (
            <Pause className={`${iconSize} fill-current text-brand-surface`} />
          ) : (
            <Play className={`${iconSize} fill-current text-brand-surface ml-0.5`} />
          )}
        </button>
      </div>
    );
  };

  // Set up audio listener
  useEffect(() => {
    if (item.type === 'voice' && audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => {
        setIsPlaying(false);
        setAudioProgress(0);
      };
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
      };

      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [audioUrl, item.type]);

  // Reset Framer Motion translation coordinates when item coordinates change in database
  useEffect(() => {
    x.set(0);
    y.set(0);
  }, [item.x_position, item.y_position, x, y]);

  const handlePlayToggle = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.error('Audio play failed:', err));
    }
  };

  const handleDragEnd = (event, info) => {
    if (!containerRef.current || !info) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    // Compute the new coordinates as a percentage of the parent canvas dimensions using the absolute drag offset from Framer Motion
    const deltaX = (info.offset.x / containerRect.width) * 100;
    const deltaY = (info.offset.y / containerRect.height) * 100;

    const relativeX = item.x_position + deltaX;
    const relativeY = item.y_position + deltaY;

    // Clamp coordinates to keep elements fully within the fridge bounds
    const clampedX = Math.max(1, Math.min(85, relativeX));
    const clampedY = Math.max(1, Math.min(85, relativeY));

    let finalX = clampedX;
    let finalY = clampedY;

    if (isSnappingEnabled) {
      const gridSize = 1.0; // Fine-grained snapping in 1.0% increments
      finalX = Math.round(clampedX / gridSize) * gridSize;
      finalY = Math.round(clampedY / gridSize) * gridSize;
    }

    onPositionChange(item.id, finalX, finalY);
  };

  // Deterministic styling properties
  const rotation = getRotationAngle(item.id);
  const colorClasses = NOTE_COLOR_MAP[noteColor] || NOTE_COLOR_MAP.yellow;

  // Format recording durations nicely
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStatusIndicator = () => {
    if (item.user_id !== userId) return null;

    const isRead =
      !item.isPending &&
      (isPartnerInFridge ||
        (partnerLastSeen && new Date(partnerLastSeen) >= new Date(item.updated_at)));

    let indicatorNode;
    if (item.isOfflineQueue) {
      indicatorNode = <Clock className="w-3.5 h-3.5 text-text-muted/60" />;
    } else if (item.isPending) {
      indicatorNode = <LoadingSpinner size="sm" className="w-3 h-3 text-text-muted/60" />;
    } else if (isRead) {
      indicatorNode = <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    } else {
      indicatorNode = <Check className="w-3 h-3 text-text-muted/60" />;
    }

    const key = item.isOfflineQueue
      ? 'offline'
      : item.isPending
        ? 'pending'
        : isRead
          ? 'read'
          : 'sent';

    return (
      <motion.span
        key={key}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 450, damping: 18 }}
        className="inline-flex items-center justify-center flex-shrink-0"
      >
        {indicatorNode}
      </motion.span>
    );
  };

  const hasReactions =
    item.reactions &&
    Object.values(item.reactions).some((arr) => Array.isArray(arr) && arr.length > 0);

  return (
    <motion.div
      ref={itemRef}
      drag
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={containerRef}
      onDragEnd={handleDragEnd}
      x={x}
      y={y}
      style={{
        left: `${item.x_position}%`,
        top: `${item.y_position}%`,
        position: 'absolute',
        rotate: `${rotation}deg`,
        zIndex: isPlaying ? 90 : 10,
      }}
      whileDrag={{ scale: 1.05, zIndex: 100, rotate: `${rotation * 1.5}deg` }}
      onDoubleClick={(e) => {
        if (!isEditMode && onOpenComments) {
          e.stopPropagation();
          onOpenComments(item);
        }
      }}
      className={`fridge-item touch-none cursor-grab active:cursor-grabbing select-none transition-shadow ${
        isEditMode
          ? 'ring-2 ring-red-500/50 shadow-lg'
          : isNew
            ? 'ring-2 ring-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.4)]'
            : 'hover:shadow-md'
      }`}
      data-item-id={item.id}
      data-is-new={isNew ? 'true' : 'false'}
    >
      {/* New Indicator Badge */}
      {isNew && !isEditMode && (
        <span className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full animate-pulse border-2 border-background shadow z-30" />
      )}

      {/* Comment Badge Overlay */}
      {!isEditMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenComments) onOpenComments(item);
          }}
          className={`${getBadgeClasses().comments} ${
            commentCount > 0 ? 'opacity-100' : 'opacity-40 hover:opacity-100'
          }`}
          title={commentCount > 0 ? 'View comments' : 'Start conversation'}
        >
          <MessageSquare
            className={`${getBadgeClasses().commentsIcon} text-primary ${commentCount > 0 ? 'fill-primary/10' : ''}`}
          />
          {commentCount > 0 && (
            <span className={getBadgeClasses().commentsText}>{commentCount}</span>
          )}
        </button>
      )}

      {/* Reactions Badge Overlay */}
      {hasReactions && !isEditMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenComments) onOpenComments(item);
          }}
          className={getBadgeClasses().reactions}
        >
          {Object.entries(item.reactions)
            .filter(([_, userIds]) => Array.isArray(userIds) && userIds.length > 0)
            .map(([emojiId, userIds]) => {
              const emojiDef = ANIMATED_EMOJIS.find((e) => e.id === emojiId);
              if (!emojiDef) return null;
              return (
                <div
                  key={emojiId}
                  className="px-1.5 py-0.5 bg-slate-900/90 border border-slate-800/80 backdrop-blur-sm rounded-full flex items-center gap-1 shadow-md text-white text-[9px] font-bold font-mono hover:scale-105 transition-transform"
                >
                  <span>{emojiDef.char}</span>
                  <span>{userIds.length}</span>
                </div>
              );
            })}
        </div>
      )}

      {/* Delete/Remove Badge overlay */}
      {isEditMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className={getBadgeClasses().delete}
          title="Delete item"
        >
          <Trash2 className={getBadgeClasses().deleteIcon} />
        </button>
      )}

      {/* Edit Badge overlay (Note only) */}
      {isEditMode && item.type === 'note' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onEdit) onEdit(item);
          }}
          className={getBadgeClasses().edit}
          title="Edit note"
        >
          <Pencil className={getBadgeClasses().editIcon} />
        </button>
      )}

      {/* Render Note Variant */}
      {item.type === 'note' && (
        <div
          className={`border-b-4 rounded shadow-md flex flex-col justify-between ${getSizeClasses()} ${colorClasses}`}
        >
          <p
            className={`leading-snug overflow-hidden text-ellipsis ${getLineClampClass()} flex-grow ${getNoteFontClass()}`}
          >
            {noteText}
          </p>
          <div className="text-[8px] font-bold opacity-60 uppercase tracking-wider mt-1 flex items-center justify-end gap-1">
            <span>
              {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
            {renderStatusIndicator()}
          </div>
        </div>
      )}

      {/* Render Photo Variant */}
      {item.type === 'photo' && (
        <div
          className={`text-gray-800 border border-gray-200 rounded shadow-lg flex flex-col justify-between items-center relative bg-[#fafafa] ${getSizeClasses()}`}
        >
          {/* Small black magnetic disc at the top */}
          <div className="w-4 h-4 bg-gray-900 rounded-full shadow-inner absolute -top-2 left-1/2 -translate-x-1/2 border border-gray-700" />

          <div
            onClick={(e) => {
              e.stopPropagation();
              if (!isEditMode && onZoomPhoto) onZoomPhoto(item.content);
            }}
            className="w-full aspect-square bg-gray-200 rounded overflow-hidden mt-1 flex items-center justify-center cursor-zoom-in active:scale-[0.98] transition-transform"
          >
            <img
              src={item.content}
              alt="Magnet Polaroid"
              className="w-full h-full object-cover pointer-events-none"
              loading="lazy"
            />
          </div>

          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mt-2 flex items-center justify-center gap-1 select-none w-full font-sans">
            <span>
              {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
            {renderStatusIndicator()}
          </div>
        </div>
      )}

      {/* Render Voice Variant */}
      {item.type === 'voice' && (
        <div
          className={`bg-gradient-to-br from-brand-slate/90 to-surface border border-surface-border/80 rounded-2xl shadow-xl flex flex-col justify-between items-center relative overflow-visible ${getSizeClasses()}`}
        >
          {/* Little metallic pushpin magnet */}
          <div className="w-3 h-3 bg-red-600 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2 border border-red-800 shadow flex items-center justify-center z-10">
            <div className="w-1 h-1 bg-white/60 rounded-full" />
          </div>

          {renderAudioControls()}

          {/* Timestamp and audio duration */}
          <div className="flex items-center gap-1.5 text-[8px] font-bold text-text-muted mt-2 tracking-wider font-sans">
            <span>{formatDuration(voiceDuration || audioDuration)}</span>
            {renderStatusIndicator()}
          </div>
        </div>
      )}

      {/* Render Emoji Variant */}
      {item.type === 'emoji' && (
        <div
          className={`flex flex-col justify-between items-center relative group select-none ${getSizeClasses()}`}
        >
          <div className="w-full h-full flex items-center justify-center overflow-visible">
            {(() => {
              const emojiDef = ANIMATED_EMOJIS.find((e) => e.id === item.content);
              const imageUrl = emojiDef ? getEmojiCdnUrl(emojiDef.code) : '';
              return imageUrl ? (
                <img
                  src={imageUrl}
                  alt={emojiDef?.label || 'Emoji Magnet'}
                  className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <span className="text-4xl">{item.content}</span>
              );
            })()}
          </div>
          <div className="text-[7px] font-bold text-text-muted/40 uppercase tracking-wide mt-1 flex items-center justify-center gap-1 select-none pointer-events-none font-sans">
            {renderStatusIndicator()}
          </div>
        </div>
      )}
    </motion.div>
  );
}
