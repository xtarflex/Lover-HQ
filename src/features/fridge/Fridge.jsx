/**
 * @file Fridge.jsx
 * @description Fridge board – collaborative interactive canvas where couples can
 * pin sticky notes, photos, voice memos, and animated emoji magnets.
 *
 * Business logic is delegated to dedicated hooks:
 *   - {@link useFridgeSync}           – Supabase data / realtime / caching
 *   - {@link useFridgeAudio}          – Web Audio sound effects
 *   - {@link useFridgeZoom}           – Zoom state + pinch-to-zoom gestures
 *   - {@link useOffscreenIndicators}  – Off-screen unread item arrows
 *   - {@link useOfflineQueue}         – Optimistic offline mutation queue
 *
 * UI sections are delegated to:
 *   - {@link FridgeToolbar}   – Title card + view controls strip
 *   - {@link FridgeSpeedDial} – Floating-action-button speed dial
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronsRight } from 'lucide-react';
import {
  createFridgeItem,
  updateFridgeItem,
  deleteFridgeItem,
  deleteFridgeMedia,
  updateFridgeItemReactions,
} from '../../services/fridge';
import { useAppContext } from '../../contexts/AppContext';
import FridgeItem from './components/FridgeItem';
import { NoteModal } from './components/NoteModal';
import { PhotoModal } from './components/PhotoModal';
import { VoiceModal } from './components/VoiceModal';
import EmojiPickerModal from './components/EmojiPickerModal';
import MagnetCommentDrawer from './components/MagnetCommentDrawer';
import FridgeToolbar from './components/FridgeToolbar';
import FridgeSpeedDial from './components/FridgeSpeedDial';
import { Notification } from '../../components/Notification';
import { FridgeIcon } from '../../lib/icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { useFridgeSync } from './hooks/useFridgeSync';
import { useFridgeAudio } from './hooks/useFridgeAudio';
import { useFridgeZoom } from './hooks/useFridgeZoom';
import { useOffscreenIndicators } from './hooks/useOffscreenIndicators';

/**
 * Fridge component representing a collaborative, interactive whiteboard.
 * Allows users to place, drag, zoom, and organise notes, photos, and voice
 * recording magnets.
 *
 * @returns {React.ReactElement} The Fridge page component.
 */
export default function Fridge() {
  const { user, partner, presence, pairingStatus } = useAppContext();
  const navigate = useNavigate();
  const userId = user?.id;
  const partnerId = partner?.id;
  const isPartnerInFridge = presence?.partnerRoom === 'Fridge';

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  const canvasRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const toolbarRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------

  const { playSound: playWhiteboardSound } = useFridgeAudio();

  const { zoom, zoomIn, zoomOut, resetZoom } = useFridgeZoom(scrollContainerRef);

  const { items, setItems, isLoading, error, setError, commentsCount, partnerLastSeen } =
    useFridgeSync({ userId, partnerId, pairingStatus, isPartnerInFridge });

  const { offscreenUnreadItems, scrollToItem } = useOffscreenIndicators(
    scrollContainerRef,
    items,
    zoom,
    isLoading
  );

  // ---------------------------------------------------------------------------
  // Local UI state
  // ---------------------------------------------------------------------------

  const [hideOld, setHideOld] = useState(() => localStorage.getItem('fridge_hide_old') === 'true');
  const [cleanThreshold, setCleanThreshold] = useState(() =>
    Number(localStorage.getItem('fridge_clean_threshold') || '7')
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [selectedCommentItem, setSelectedCommentItem] = useState(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);

  const [isSnappingEnabled, setIsSnappingEnabled] = useState(
    () => localStorage.getItem('fridge_grid_snapping') === 'true'
  );
  const [boardBg] = useState(() => localStorage.getItem('fridge_background') || 'metallic');
  const [noteFont] = useState(() => localStorage.getItem('fridge_note_font') || 'handwriting');
  const [magnetSize] = useState(() => localStorage.getItem('fridge_magnet_size') || 'medium');

  // Toolbar scroll-gradient indicators
  const [showLeftScrollGrad, setShowLeftScrollGrad] = useState(false);
  const [showRightScrollGrad, setShowRightScrollGrad] = useState(false);

  // Track last-visited timestamp for highlighting new items
  const [lastVisited] = useState(
    () => localStorage.getItem('last_visited_fridge') || new Date(0).toISOString()
  );

  // ---------------------------------------------------------------------------
  // Side-effects that belong in the main component
  // ---------------------------------------------------------------------------

  // Record departure timestamp
  useEffect(() => {
    return () => {
      localStorage.setItem('last_visited_fridge', new Date().toISOString());
    };
  }, []);

  // Persist settings changes
  useEffect(() => {
    localStorage.setItem('fridge_hide_old', hideOld.toString());
  }, [hideOld]);

  useEffect(() => {
    localStorage.setItem('fridge_clean_threshold', cleanThreshold.toString());
  }, [cleanThreshold]);

  // Centre viewport scroll on initial load or mount
  const centeredRef = useRef(false);
  useEffect(() => {
    if (scrollContainerRef.current && (!isLoading || items.length > 0) && !centeredRef.current) {
      const container = scrollContainerRef.current;
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
      centeredRef.current = true;
    }
  }, [isLoading, items.length]);

  // Handle zoom centering scroll adjustment
  const prevZoomRef = useRef(zoom);
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const zoomOld = prevZoomRef.current;
      const zoomNew = zoom;

      if (zoomOld !== zoomNew) {
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;

        const centerX = container.scrollLeft + viewportWidth / 2;
        const centerY = container.scrollTop + viewportHeight / 2;

        const newCenterX = centerX * (zoomNew / zoomOld);
        const newCenterY = centerY * (zoomNew / zoomOld);

        container.scrollLeft = newCenterX - viewportWidth / 2;
        container.scrollTop = newCenterY - viewportHeight / 2;
      }
    }
    prevZoomRef.current = zoom;
  }, [zoom]);

  // Handle highlight event from chat tags
  useEffect(() => {
    /**
     * Handles the 'highlight-fridge-item' custom event, scrolling the target
     * item into view and triggering a temporary flash highlight animation.
     *
     * @param {CustomEvent} e - The custom event containing the target item ID.
     * @returns {void}
     */
    const handleHighlight = (e) => {
      const itemId = e.detail?.id;
      if (!itemId) return;

      scrollToItem(itemId);

      const el = scrollContainerRef.current?.querySelector(
        `.fridge-item[data-item-id="${itemId}"]`
      );
      if (el) {
        el.classList.add('animate-pulse-gold');
        setTimeout(() => {
          el.classList.remove('animate-pulse-gold');
        }, 2000);
      }
    };

    window.addEventListener('highlight-fridge-item', handleHighlight);
    return () => {
      window.removeEventListener('highlight-fridge-item', handleHighlight);
    };
  }, [scrollToItem]);

  // Toolbar scroll-gradient detection
  const checkScroll = () => {
    if (!toolbarRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = toolbarRef.current;
    setShowLeftScrollGrad(scrollLeft > 1);
    setShowRightScrollGrad(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar || isLoading) return;

    const timer = setTimeout(checkScroll, 100);
    toolbar.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    const observer = new ResizeObserver(checkScroll);
    observer.observe(toolbar);

    return () => {
      clearTimeout(timer);
      toolbar.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [items, isLoading]);

  // ---------------------------------------------------------------------------
  // Offline queue
  // ---------------------------------------------------------------------------

  const syncCallback = useCallback(async (type, payload) => {
    if (type === 'create') {
      return await createFridgeItem({
        user_id: payload.user_id,
        type: payload.type,
        content: payload.content,
        x_position: payload.x_position,
        y_position: payload.y_position,
      });
    } else if (type === 'update') {
      const { id, ...fields } = payload;
      await updateFridgeItem(id, fields);
    } else if (type === 'delete') {
      await deleteFridgeItem(payload);
    }
  }, []);

  /**
   * Callback when an offline action is successfully synced.
   *
   * @param {'create'|'update'|'delete'} type
   * @param {string} id - Temporary offline ID.
   * @param {Object} result - The server-assigned item returned on create.
   */
  const onSyncSuccess = useCallback(
    (type, id, result) => {
      if (type === 'create') {
        setItems((prev) => prev.map((item) => (item.id === id ? result : item)));
      } else if (type === 'update') {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isPending: false, isOfflineQueue: false } : item
          )
        );
      }
    },
    [setItems]
  );

  const { addOfflineItem, removeOfflineItem, addOfflineUpdate, addOfflineDeletion } =
    useOfflineQueue('fridge', syncCallback, onSyncSuccess);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Extracts the Supabase Storage object path from a public URL.
   *
   * @param {string | null} url - Full public URL.
   * @returns {string | null} Storage path, or null.
   */
  const getStoragePathFromUrl = (url) => {
    if (!url) return null;
    const parts = url.split('/fridge-media/');
    return parts.length > 1 ? decodeURIComponent(parts[1]) : null;
  };

  /**
   * Toggles grid snapping on/off and persists the preference to localStorage.
   *
   * @returns {void}
   */
  const toggleSnapping = () => {
    setIsSnappingEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('fridge_grid_snapping', next.toString());
      return next;
    });
  };

  /**
   * Filters the active list of magnets, conditionally hiding items older than
   * `cleanThreshold` days when clean mode is active.
   *
   * @returns {Array<Object>} The filtered array of fridge items.
   */
  /**
   * Generates dynamic styling for the whiteboard canvas background.
   *
   * @returns {object} CSS style object.
   */
  const getCanvasBackgroundStyle = () => {
    if (boardBg === 'dotted') {
      return {
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      };
    }
    if (boardBg === 'image') {
      return {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url('/board-chat-bg.png')`,
        backgroundRepeat: 'repeat',
        backgroundSize: '384px',
      };
    }
    // 'metallic'
    return {
      background: `
        radial-gradient(ellipse at 50% 30%, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.95) 100%),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 40px 40px, 40px 40px',
    };
  };

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  /**
   * Optimistically updates the positions of magnets locally and pushes changes
   * to Supabase database.
   *
   * @param {string} itemId - The ID of the item being moved.
   * @param {number} newX - Percentage-based horizontal coordinate.
   * @param {number} newY - Percentage-based vertical coordinate.
   * @returns {Promise<void>}
   */
  const handlePositionChange = useCallback(
    async (itemId, newX, newY) => {
      playWhiteboardSound('pin');
      const backupItems = [...items];
      const timestamp = new Date().toISOString();

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                x_position: newX,
                y_position: newY,
                updated_at: timestamp,
                isPending: true,
              }
            : item
        )
      );

      try {
        if (!navigator.onLine) throw new Error('Offline');

        await updateFridgeItem(itemId, {
          x_position: newX,
          y_position: newY,
          updated_at: timestamp,
        });

        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, isPending: false } : item))
        );
      } catch (err) {
        console.error('Optimistic coordinate sync failed:', err);
        const isNetwork =
          !navigator.onLine ||
          err.message?.includes('Failed to fetch') ||
          err.message === 'Offline';
        if (isNetwork) {
          try {
            addOfflineUpdate({
              id: itemId,
              x_position: newX,
              y_position: newY,
              updated_at: timestamp,
            });
            setItems((prev) =>
              prev.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      x_position: newX,
                      y_position: newY,
                      updated_at: timestamp,
                      isPending: true,
                      isOfflineQueue: true,
                    }
                  : item
              )
            );
          } catch (e) {
            console.error('Failed to queue offline update:', e);
            setItems(backupItems);
          }
        } else {
          setItems(backupItems);
        }
      }
    },
    [items, setItems, playWhiteboardSound, addOfflineUpdate]
  );

  /**
   * Toggles the pinned/locked status of a fridge magnet item.
   *
   * @param {string} itemId - The ID of the item.
   * @param {boolean} isPinned - The target pinned status.
   * @returns {Promise<void>}
   */
  const handleTogglePin = useCallback(
    async (itemId, isPinned) => {
      playWhiteboardSound('pin');
      const backupItems = [...items];
      const timestamp = new Date().toISOString();

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, is_pinned: isPinned, updated_at: timestamp, isPending: true }
            : item
        )
      );

      try {
        if (!navigator.onLine) throw new Error('Offline');

        await updateFridgeItem(itemId, { is_pinned: isPinned, updated_at: timestamp });

        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, isPending: false } : item))
        );
      } catch (err) {
        console.error('Optimistic pin toggle failed:', err);
        const isNetwork =
          !navigator.onLine ||
          err.message?.includes('Failed to fetch') ||
          err.message === 'Offline';
        if (isNetwork) {
          try {
            addOfflineUpdate({
              id: itemId,
              is_pinned: isPinned,
              updated_at: timestamp,
            });
            setItems((prev) =>
              prev.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      is_pinned: isPinned,
                      updated_at: timestamp,
                      isPending: true,
                      isOfflineQueue: true,
                    }
                  : item
              )
            );
          } catch (e) {
            console.error('Failed to queue offline update:', e);
            setItems(backupItems);
          }
        } else {
          setItems(backupItems);
        }
      }
    },
    [items, setItems, playWhiteboardSound, addOfflineUpdate]
  );

  /**
   * Optimistically deletes the specified magnet item and syncs the removal in
   * Supabase database & Storage.
   *
   * @param {string} itemId - The ID of the item to delete.
   * @returns {Promise<void>}
   */
  const handleDeleteItem = useCallback(
    async (itemId) => {
      playWhiteboardSound('delete');
      const itemToDelete = items.find((i) => i.id === itemId);
      if (!itemToDelete) return;

      const backupItems = [...items];
      setItems((prev) => prev.filter((item) => item.id !== itemId));

      try {
        if (itemId.toString().startsWith('offline-')) {
          removeOfflineItem(itemId);
          return;
        }

        if (!navigator.onLine) throw new Error('Offline');

        let fileUrl = null;
        if (itemToDelete.type === 'photo') {
          fileUrl = itemToDelete.content;
        } else if (itemToDelete.type === 'voice') {
          try {
            const parsed = JSON.parse(itemToDelete.content);
            fileUrl = parsed.url;
          } catch {
            fileUrl = itemToDelete.content;
          }
        }

        if (fileUrl) {
          const filePath = getStoragePathFromUrl(fileUrl);
          if (filePath) {
            try {
              await deleteFridgeMedia([filePath]);
            } catch (storageDeleteError) {
              console.error('Storage deletion warning:', storageDeleteError);
            }
          }
        }

        await deleteFridgeItem(itemId);
      } catch (err) {
        console.error('Failed to delete item:', err);
        const isNetwork =
          !navigator.onLine ||
          err.message?.includes('Failed to fetch') ||
          err.message === 'Offline';
        if (isNetwork) {
          try {
            addOfflineDeletion(itemId);
          } catch (e) {
            console.error('Failed to queue offline deletion:', e);
            setItems(backupItems);
          }
        } else {
          setItems(backupItems);
        }
      }
    },
    [items, setItems, playWhiteboardSound, addOfflineDeletion, removeOfflineItem]
  );

  /**
   * Pins an animated emoji magnet onto the Fridge board. Supports offline
   * queueing.
   *
   * @param {string} emojiId - Selected emoji identifier (e.g. `'heart'`).
   * @returns {Promise<void>}
   */
  const handleEmojiSelect = useCallback(
    async (emojiId) => {
      playWhiteboardSound('pin');
      const timestamp = new Date().toISOString();
      const tempId = `offline-${Date.now()}`;
      const x_position = 30 + Math.random() * 40;
      const y_position = 30 + Math.random() * 40;

      if (!navigator.onLine) {
        const localItem = {
          id: tempId,
          user_id: userId,
          type: 'emoji',
          content: emojiId,
          x_position,
          y_position,
          created_at: timestamp,
          updated_at: timestamp,
          isPending: true,
          isOfflineQueue: true,
        };
        addOfflineItem(localItem);
        setItems((prev) => [...prev, localItem]);
        return;
      }

      try {
        const newItem = await createFridgeItem({
          user_id: userId,
          type: 'emoji',
          content: emojiId,
          x_position,
          y_position,
        });
        setItems((prev) => [...prev, newItem]);
      } catch (err) {
        console.error('Failed to create emoji magnet:', err);
        const isNetwork =
          !navigator.onLine ||
          err.message?.includes('Failed to fetch') ||
          err.message === 'Offline';
        if (isNetwork) {
          const localItem = {
            id: tempId,
            user_id: userId,
            type: 'emoji',
            content: emojiId,
            x_position,
            y_position,
            created_at: timestamp,
            updated_at: timestamp,
            isPending: true,
            isOfflineQueue: true,
          };
          addOfflineItem(localItem);
          setItems((prev) => [...prev, localItem]);
        } else {
          setError('Failed to pin emoji magnet.');
        }
      }
    },
    [userId, playWhiteboardSound, addOfflineItem, setItems, setError]
  );

  /**
   * Optimistically updates the reactions on a fridge item and syncs with
   * Supabase. Supports offline queueing via useOfflineQueue hook.
   *
   * @param {string} itemId - The target magnet's ID.
   * @param {object} newReactions - Updated reactions mapping.
   * @returns {Promise<void>}
   */
  const handleUpdateReactions = async (itemId, newReactions) => {
    const backupItems = [...items];
    const timestamp = new Date().toISOString();

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, reactions: newReactions, updated_at: timestamp, isPending: true }
          : item
      )
    );

    if (selectedCommentItem && selectedCommentItem.id === itemId) {
      setSelectedCommentItem((prev) => ({ ...prev, reactions: newReactions }));
    }

    try {
      if (!navigator.onLine) throw new Error('Offline');

      await updateFridgeItemReactions(itemId, newReactions);

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isPending: false } : item))
      );
    } catch (err) {
      console.error('Optimistic reaction sync failed:', err);
      const isNetwork =
        !navigator.onLine || err.message?.includes('Failed to fetch') || err.message === 'Offline';
      if (isNetwork) {
        try {
          addOfflineUpdate({ id: itemId, reactions: newReactions, updated_at: timestamp });
          setItems((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    reactions: newReactions,
                    updated_at: timestamp,
                    isPending: true,
                    isOfflineQueue: true,
                  }
                : item
            )
          );
        } catch (e) {
          console.error('Failed to queue offline reaction update:', e);
          setItems(backupItems);
        }
      } else {
        setItems(backupItems);
      }
    }
  };

  /**
   * Opens the NoteModal pre-filled with the target note content for editing.
   *
   * @param {Object} item - Note item object to edit.
   * @returns {void}
   */
  const handleEditNote = useCallback((item) => {
    let text = '';
    let color = 'yellow';
    try {
      const parsed = JSON.parse(item.content);
      text = parsed.text || '';
      color = parsed.color || 'yellow';
    } catch {
      text = item.content;
    }
    setEditingItem({ id: item.id, text, color });
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // ⚡ BOLT OPTIMIZATION: Memoize filtered items to avoid unnecessary array filtering on every render
  const filteredItems = useMemo(() => {
    if (!hideOld) return items;
    const cutOffDate = new Date();
    cutOffDate.setDate(cutOffDate.getDate() - cleanThreshold);
    return items.filter((item) => new Date(item.created_at) >= cutOffDate);
  }, [items, hideOld, cleanThreshold]);

  // ⚡ BOLT OPTIMIZATION: Instantiate Date object once outside the map loop to prevent O(N) object creation on every render
  const lastVisitedDate = useMemo(() => new Date(lastVisited), [lastVisited]);

  return (
    <div className="w-full h-full bg-slate-950 overflow-hidden relative">
      {/* Header Overlay */}
      <FridgeToolbar
        hideOld={hideOld}
        setHideOld={setHideOld}
        cleanThreshold={cleanThreshold}
        setCleanThreshold={setCleanThreshold}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        zoom={zoom}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetZoom={resetZoom}
        isSnappingEnabled={isSnappingEnabled}
        toggleSnapping={toggleSnapping}
        toolbarRef={toolbarRef}
        showLeftScrollGrad={showLeftScrollGrad}
        showRightScrollGrad={showRightScrollGrad}
      />

      {/* Main Full-Screen Fridge Viewport */}
      <div className="w-full h-full bg-slate-950 overflow-hidden relative">
        {/* Scrollable Pan Wrapper */}
        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-auto scrollbar-none relative"
          style={{ cursor: 'grab' }}
        >
          {/* Sizer wrapper to adjust scroll boundary to scaled canvas */}
          <div
            style={{
              width: `${300 * zoom}%`,
              height: `${300 * zoom}%`,
              position: 'relative',
            }}
          >
            {/* Zoomable Canvas Surface */}
            <div
              ref={canvasRef}
              className="absolute inset-0 transition-transform duration-200"
              style={{
                width: `${100 / zoom}%`,
                height: `${100 / zoom}%`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                overflow: 'hidden',
                ...getCanvasBackgroundStyle(),
              }}
            >
              {/* Subtle Metallic Brushed Highlights */}
              {boardBg === 'metallic' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none opacity-30 mix-blend-overlay" />
              )}

              {/* Empty Canvas Indicator */}
              {!isLoading && filteredItems.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
                  <FridgeIcon className="w-12 h-12 text-primary/30 mb-3" />
                  <p className="text-sm font-bold text-text-muted">Your Fridge is empty</p>
                  <p className="text-xs text-text-muted/60 mt-1 max-w-xs">
                    Tap the floating plus icon in the bottom right to pin sticky notes, photos, or
                    voice recordings.
                  </p>
                </div>
              )}

              {/* Render Draggable Items */}
              {filteredItems.map((item) => {
                const isNew =
                  new Date(item.updated_at) > lastVisitedDate && item.user_id !== userId;
                return (
                  <FridgeItem
                    key={item.id}
                    item={item}
                    containerRef={canvasRef}
                    isEditMode={isEditMode}
                    onDelete={handleDeleteItem}
                    onEdit={handleEditNote}
                    onPositionChange={handlePositionChange}
                    onTogglePin={handleTogglePin}
                    isNew={isNew}
                    userId={userId}
                    partnerLastSeen={partnerLastSeen}
                    isPartnerInFridge={isPartnerInFridge}
                    commentCount={commentsCount[item.id] || 0}
                    onOpenComments={(targetItem) => setSelectedCommentItem(targetItem)}
                    onZoomPhoto={setSelectedPhotoUrl}
                    isSnappingEnabled={isSnappingEnabled}
                    noteFont={noteFont}
                    magnetSize={magnetSize}
                  />
                );
              })}

              {/* Initial Loading Overlay */}
              {isLoading && items.length === 0 && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="flex flex-col items-center gap-3">
                    <LoadingSpinner size="md" />
                    <p className="text-xs font-semibold text-text-muted">Loading fridge items...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Offscreen Unread Indicators */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {offscreenUnreadItems.map((indicator) => (
            <button
              key={indicator.id}
              onClick={() => scrollToItem(indicator.id)}
              className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary hover:bg-primary-hover text-brand-surface flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 animate-pulse animate-duration-1000"
              style={{
                left: `${indicator.left}px`,
                top: `${indicator.top}px`,
              }}
              title="Scroll to unread item"
            >
              <ChevronsRight
                className="w-4 h-4 text-brand-surface animate-pulse"
                style={{ transform: `rotate(${indicator.angle}deg)` }}
              />
            </button>
          ))}
        </div>

        {/* Floating Action Button Speed Dial */}
        <FridgeSpeedDial
          isSpeedDialOpen={isSpeedDialOpen}
          setIsSpeedDialOpen={setIsSpeedDialOpen}
          onAddNote={() => setIsNoteOpen(true)}
          onAddPhoto={() => setIsPhotoOpen(true)}
          onAddVoice={() => setIsVoiceOpen(true)}
          onAddEmoji={() => setIsEmojiPickerOpen(true)}
          onOpenChat={() => navigate('/chat')}
        />
      </div>

      {/* Toast Notification Component */}
      <Notification message={error} onClose={() => setError(null)} />

      {/* Upload/Create Media Modals */}
      <NoteModal
        isOpen={isNoteOpen}
        onClose={() => setIsNoteOpen(false)}
        userId={userId}
        onSave={(newItem) => {
          playWhiteboardSound('pin');
          setItems((prev) => [...prev, newItem]);
        }}
        addOfflineItem={addOfflineItem}
      />

      {/* Edit Note Modal */}
      <NoteModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        userId={userId}
        editItemId={editingItem ? editingItem.id : null}
        initialText={editingItem ? editingItem.text : ''}
        initialColor={editingItem ? editingItem.color : ''}
        onSave={(updatedItem) => {
          playWhiteboardSound('pin');
          setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
          setEditingItem(null);
        }}
        addOfflineItem={addOfflineItem}
      />

      <PhotoModal
        isOpen={isPhotoOpen}
        onClose={() => setIsPhotoOpen(false)}
        userId={userId}
        onSave={(newItem) => {
          playWhiteboardSound('pin');
          setItems((prev) => [...prev, newItem]);
        }}
      />

      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        userId={userId}
        onSave={(newItem) => {
          playWhiteboardSound('pin');
          setItems((prev) => [...prev, newItem]);
        }}
      />

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelect={handleEmojiSelect}
      />

      {/* Magnet Threaded Comments bottom sheet drawer */}
      <AnimatePresence>
        {selectedCommentItem && (
          <MagnetCommentDrawer
            item={selectedCommentItem}
            onClose={() => setSelectedCommentItem(null)}
            userId={userId}
            partner={partner}
            partnerLastSeen={partnerLastSeen}
            isPartnerInFridge={isPartnerInFridge}
            onUpdateReactions={handleUpdateReactions}
            onPlaySound={playWhiteboardSound}
          />
        )}
      </AnimatePresence>

      {/* Fullscreen Photo Lightbox Modal */}
      <AnimatePresence>
        {selectedPhotoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setSelectedPhotoUrl(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhotoUrl(null)}
              className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all shadow-lg"
              title="Close preview"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Lightbox Image Container */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhotoUrl}
                alt="Enlarged preview"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
