import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Camera,
  Mic,
  Settings,
  ChevronsRight,
  Smile,
  X,
  Grid,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  getFridgeItems,
  createFridgeItem,
  updateFridgeItem,
  deleteFridgeItem,
  getFridgeItemsBeforeCutoff,
  deleteFridgeItemsBeforeCutoff,
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
import { Notification } from '../../components/Notification';
import { FridgeIcon } from '../../lib/icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import GlassDropdown from '../../components/GlassDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

/**
 * Fridge component representing a collaborative, interactive whiteboard.
 * Allows users to place, drag, zoom, and organize notes, photos, and voice recording magnets.
 *
 * @returns {React.ReactElement} The Fridge page component.
 */
export default function Fridge() {
  const { user, partner, presence, pairingStatus } = useAppContext();
  const userId = user?.id;
  const partnerId = partner?.id;
  const isPartnerInFridge = presence?.partnerRoom === 'Fridge';

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Canvas View State
  const [zoom, setZoom] = useState(1.0);
  const [hideOld, setHideOld] = useState(false);
  const [cleanThreshold, setCleanThreshold] = useState(7); // default 7 days
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [offscreenUnreadItems, setOffscreenUnreadItems] = useState([]);
  const [partnerLastSeen, setPartnerLastSeen] = useState(null);

  // Track last visited timestamp for highlighting new items
  const [lastVisited] = useState(
    () => localStorage.getItem('last_visited_fridge') || new Date(0).toISOString()
  );

  useEffect(() => {
    return () => {
      localStorage.setItem('last_visited_fridge', new Date().toISOString());
    };
  }, []);

  // Pinch-to-Zoom Touch State
  const [touchStartDist, setTouchStartDist] = useState(0);
  const [touchStartZoom, setTouchStartZoom] = useState(1.0);

  // Modal Open State
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // note being edited: { id, text, color }
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [selectedCommentItem, setSelectedCommentItem] = useState(null);
  const [commentsCount, setCommentsCount] = useState({});
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);
  const [isMuted] = useState(() => localStorage.getItem('fridge_sound_muted') === 'true');
  const [isSnappingEnabled, setIsSnappingEnabled] = useState(
    () => localStorage.getItem('fridge_grid_snapping') === 'true'
  );
  const [boardBg] = useState(() => localStorage.getItem('fridge_background') || 'metallic');
  const [noteFont] = useState(() => localStorage.getItem('fridge_note_font') || 'handwriting');
  const [magnetSize] = useState(() => localStorage.getItem('fridge_magnet_size') || 'medium');

  const toggleSnapping = () => {
    setIsSnappingEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('fridge_grid_snapping', next.toString());
      return next;
    });
  };

  const playWhiteboardSound = useCallback(
    (type) => {
      if (isMuted) return;

      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        if (type === 'pin') {
          const playTone = (freq, delay, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
            gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + duration);
          };
          playTone(523.25, 0, 0.15); // C5
          playTone(659.25, 0.08, 0.2); // E5
        } else if (type === 'pop') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'rustle') {
          const bufferSize = ctx.sampleRate * 0.06;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1000;
          filter.Q.value = 0.5;

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          noise.start();
        } else if (type === 'delete') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch (e) {
        console.warn('Web Audio playback failed:', e);
      }
    },
    [isMuted]
  );

  const canvasRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const toolbarRef = useRef(null);

  // Scroll indicators state for View Controls Toolbar
  const [showLeftScrollGrad, setShowLeftScrollGrad] = useState(false);
  const [showRightScrollGrad, setShowRightScrollGrad] = useState(false);

  const checkScroll = () => {
    if (!toolbarRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = toolbarRef.current;
    setShowLeftScrollGrad(scrollLeft > 1);
    setShowRightScrollGrad(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar || isLoading) return;

    // Run check after render
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

  // Helper to extract storage path
  const getStoragePathFromUrl = (url) => {
    if (!url) return null;
    const parts = url.split('/fridge-media/');
    return parts.length > 1 ? decodeURIComponent(parts[1]) : null;
  };

  const syncCallback = useCallback(async (type, payload) => {
    if (type === 'create') {
      const data = await createFridgeItem({
        user_id: payload.user_id,
        type: payload.type,
        content: payload.content,
        x_position: payload.x_position,
        y_position: payload.y_position,
      });
      return data;
    } else if (type === 'update') {
      const { id, ...fields } = payload;
      await updateFridgeItem(id, fields);
    } else if (type === 'delete') {
      await deleteFridgeItem(payload);
    }
  }, []);

  /**
   * Callback when an offline action is successfully synced.
   */
  const onSyncSuccess = useCallback((type, id, result) => {
    if (type === 'create') {
      setItems((prev) => prev.map((item) => (item.id === id ? result : item)));
    } else if (type === 'update') {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isPending: false, isOfflineQueue: false } : item
        )
      );
    }
  }, []);

  const { addOfflineItem, removeOfflineItem, addOfflineUpdate, addOfflineDeletion } =
    useOfflineQueue('fridge', syncCallback, onSyncSuccess);

  const fetchCommentCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('fridge_comments').select('item_id');

      if (!error && data) {
        const counts = {};
        data.forEach((row) => {
          counts[row.item_id] = (counts[row.item_id] || 0) + 1;
        });
        setCommentsCount(counts);
      }
    } catch (err) {
      console.error('Error fetching comment counts:', err);
    }
  }, []);

  // Fetch initial fridge items with offline caching layer support
  useEffect(() => {
    const fetchItems = async () => {
      if (!userId) return;

      // If user is paired but partner is not yet loaded, wait for partnerId
      if (pairingStatus === 'paired' && !partnerId) return;

      setIsLoading(true);
      setError(null);

      // Pre-load from local storage cache for instant render/offline stability
      const cachedItems = localStorage.getItem('fridge_items_cache');
      let localQueue = [];
      try {
        localQueue = JSON.parse(localStorage.getItem('fridge_offline_queue') || '[]');
      } catch (e) {
        console.error('Error parsing offline queue:', e);
      }
      if (cachedItems) {
        try {
          setItems([...JSON.parse(cachedItems), ...localQueue]);
        } catch (e) {
          console.error('Error parsing cached items:', e);
        }
      }

      try {
        if (!navigator.onLine) {
          setIsLoading(false);
          return;
        }

        const data = await getFridgeItems(userId, partnerId);

        // Cache the fresh online items
        localStorage.setItem('fridge_items_cache', JSON.stringify(data || []));

        // Re-read local queue to merge fresh data
        let freshLocalQueue = [];
        try {
          freshLocalQueue = JSON.parse(localStorage.getItem('fridge_offline_queue') || '[]');
        } catch (e) {
          console.error(e);
        }

        setItems([...(data || []), ...freshLocalQueue]);
        await fetchCommentCounts();
      } catch (err) {
        console.error('Fetch fridge items failed:', err);
        setError('Could not load fresh fridge items. Using cached data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [userId, partnerId, pairingStatus, fetchCommentCounts]);

  // Keep local cache in sync with item changes (dragging, editing, deleting)
  useEffect(() => {
    if (!isLoading) {
      const syncedItems = items.filter(
        (item) => item.id && !item.id.toString().startsWith('offline-')
      );
      localStorage.setItem('fridge_items_cache', JSON.stringify(syncedItems));
    }
  }, [items, isLoading]);

  // Continuously update partnerLastSeen to "now" while partner is active in the Fridge
  useEffect(() => {
    if (isPartnerInFridge) {
      const timer = setTimeout(() => {
        setPartnerLastSeen(new Date().toISOString());
      }, 0);

      const interval = setInterval(() => {
        setPartnerLastSeen(new Date().toISOString());
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isPartnerInFridge]);

  // Fetch partner's initial last_seen from presence table
  useEffect(() => {
    const fetchPartnerLastSeen = async () => {
      if (!partnerId) return;
      try {
        const { data, error } = await supabase
          .from('presence')
          .select('last_seen')
          .eq('user_id', partnerId)
          .single();
        if (!error && data) {
          setPartnerLastSeen(data.last_seen);
        }
      } catch (err) {
        console.error('Error fetching partner last seen:', err);
      }
    };
    fetchPartnerLastSeen();
  }, [partnerId]);

  // Subscribe to real-time presence table changes for the partner's last_seen update
  useEffect(() => {
    if (!partnerId) return;
    const channel = supabase
      .channel('partner_presence_last_seen')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
        },
        (payload) => {
          if (payload.new && payload.new.user_id === partnerId) {
            setPartnerLastSeen(payload.new.last_seen);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId]);

  // Calculate off-screen unread items
  const updateOffscreenIndicators = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Find all unread items in the DOM
    const itemElements = container.querySelectorAll('.fridge-item[data-is-new="true"]');
    const offscreen = [];

    itemElements.forEach((el) => {
      const itemRect = el.getBoundingClientRect();
      const itemId = el.getAttribute('data-item-id');

      // Calculate center of item and center of container
      const itemCenterX = itemRect.left + itemRect.width / 2;
      const itemCenterY = itemRect.top + itemRect.height / 2;

      const isOffLeft = itemCenterX < containerRect.left;
      const isOffRight = itemCenterX > containerRect.right;
      const isOffTop = itemCenterY < containerRect.top;
      const isOffBottom = itemCenterY > containerRect.bottom;

      if (isOffLeft || isOffRight || isOffTop || isOffBottom) {
        const containerCenterX = containerRect.left + containerRect.width / 2;
        const containerCenterY = containerRect.top + containerRect.height / 2;

        const dx = itemCenterX - containerCenterX;
        const dy = itemCenterY - containerCenterY;

        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;

        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * 180) / Math.PI;

        const margin = 24; // px safety margin from border
        const W = containerRect.width - 2 * margin;
        const H = containerRect.height - 2 * margin;

        let t = Infinity;
        if (dx > 0) {
          t = Math.min(t, W / 2 / dx);
        } else if (dx < 0) {
          t = Math.min(t, -W / 2 / dx);
        }
        if (dy > 0) {
          t = Math.min(t, H / 2 / dy);
        } else if (dy < 0) {
          t = Math.min(t, -H / 2 / dy);
        }

        const x = t * dx;
        const y = t * dy;

        const left = containerRect.width / 2 + x;
        const top = containerRect.height / 2 + y;

        offscreen.push({
          id: itemId,
          left,
          top,
          angle: angleDeg,
        });
      }
    });

    setOffscreenUnreadItems(offscreen);
  };

  const scrollToItem = (itemId) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const itemElement = container.querySelector(`.fridge-item[data-item-id="${itemId}"]`);
    if (itemElement) {
      itemElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  };

  // Set up listeners for calculating offscreen unread items
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoading) return;

    // Run initial calculation with a short timeout to let layout settle
    const initialTimer = setTimeout(() => {
      updateOffscreenIndicators();
    }, 400);

    const handleScroll = () => {
      updateOffscreenIndicators();
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      clearTimeout(initialTimer);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [items, zoom, isLoading]);

  // Subscribe to real-time updates via Supabase Realtime Broadcast
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('fridge_items_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fridge_items',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new;
            if (newItem.user_id === userId || newItem.user_id === partnerId) {
              setItems((prev) => {
                if (prev.some((item) => item.id === newItem.id)) return prev;
                return [...prev, newItem];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new;
            if (updatedItem.user_id === userId || updatedItem.user_id === partnerId) {
              setItems((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setItems((prev) => prev.filter((item) => item.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, partnerId]);

  // Subscribe to real-time comment updates to update the badge counts
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('fridge_comments_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fridge_comments',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newComment = payload.new;
            setCommentsCount((prev) => ({
              ...prev,
              [newComment.item_id]: (prev[newComment.item_id] || 0) + 1,
            }));
          } else if (payload.eventType === 'DELETE') {
            // Re-fetch counts because DELETE old payload only has id (no item_id)
            fetchCommentCounts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCommentCounts]);

  // Center viewport scroll on load once items are loaded
  useEffect(() => {
    if (!isLoading && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const scrollHeight = container.scrollHeight;
      const clientWidth = container.clientWidth;
      const clientHeight = container.clientHeight;
      container.scrollLeft = (scrollWidth - clientWidth) / 2;
      container.scrollTop = (scrollHeight - clientHeight) / 2;
    }
  }, [isLoading]);

  // Run database and storage compaction on mount
  useEffect(() => {
    const runCompaction = async () => {
      if (!userId) return;
      const storedDays = localStorage.getItem('fridge_auto_compact_days') || '90';
      if (storedDays === 'off') return;

      const days = parseInt(storedDays, 10);
      if (isNaN(days)) return;

      const cutOffDate = new Date();
      cutOffDate.setDate(cutOffDate.getDate() - days);
      const cutOffIso = cutOffDate.toISOString();

      try {
        const userIds = partnerId ? [userId, partnerId] : [userId];

        // Find items that will be deleted to clean up their storage files
        const itemsToDelete = await getFridgeItemsBeforeCutoff(userIds, cutOffIso);
        if (!itemsToDelete || itemsToDelete.length === 0) return;

        // Delete associated files from storage
        const filePathsToDelete = [];
        for (const item of itemsToDelete) {
          let fileUrl = null;
          if (item.type === 'photo') {
            fileUrl = item.content;
          } else if (item.type === 'voice') {
            try {
              const parsed = JSON.parse(item.content);
              fileUrl = parsed.url;
            } catch {
              // Ignore invalid JSON parsing format
            }
          }

          if (fileUrl) {
            const filePath = getStoragePathFromUrl(fileUrl);
            if (filePath) {
              filePathsToDelete.push(filePath);
            }
          }
        }

        if (filePathsToDelete.length > 0) {
          try {
            await deleteFridgeMedia(filePathsToDelete);
          } catch (storageError) {
            console.error('Storage deletion warning:', storageError);
          }
        }

        // Delete from database
        await deleteFridgeItemsBeforeCutoff(userIds, cutOffIso);

        // Update local items state
        setItems((prev) => prev.filter((item) => new Date(item.created_at) >= cutOffDate));
      } catch (err) {
        console.error('Auto compaction error:', err);
      }
    };

    if (!isLoading) {
      runCompaction();
    }
  }, [userId, partnerId, isLoading]);

  /**
   * Optimistically updates the positions of magnets locally and pushes changes to Supabase database.
   *
   * @param {string} itemId - The ID of the item being moved.
   * @param {number} newX - Percentage-based horizontal coordinate.
   * @param {number} newY - Percentage-based vertical coordinate.
   * @returns {Promise<void>}
   */
  const handlePositionChange = async (itemId, newX, newY) => {
    playWhiteboardSound('pin');
    const backupItems = [...items];
    const timestamp = new Date().toISOString();

    // 1. Update State Optimistically with isPending: true
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, x_position: newX, y_position: newY, updated_at: timestamp, isPending: true }
          : item
      )
    );

    // 2. Sync to Supabase
    try {
      if (!navigator.onLine) {
        throw new Error('Offline');
      }

      await updateFridgeItem(itemId, {
        x_position: newX,
        y_position: newY,
        updated_at: timestamp,
      });

      // Clear pending state
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isPending: false } : item))
      );
    } catch (err) {
      console.error('Optimistic coordinate sync failed:', err);
      const isNetwork =
        !navigator.onLine || err.message?.includes('Failed to fetch') || err.message === 'Offline';
      if (isNetwork) {
        // Save to offline updates queue
        try {
          addOfflineUpdate({
            id: itemId,
            x_position: newX,
            y_position: newY,
            updated_at: timestamp,
          });

          // Mark locally as pending/offline but keep position
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
  };

  /**
   * Optimistically deletes the specified magnet item and syncs the removal in Supabase database & Storage.
   *
   * @param {string} itemId - The ID of the item to delete.
   * @returns {Promise<void>}
   */
  const handleDeleteItem = async (itemId) => {
    playWhiteboardSound('delete');
    const itemToDelete = items.find((i) => i.id === itemId);
    if (!itemToDelete) return;

    const backupItems = [...items];

    // 1. Optimistic delete local state
    setItems((prev) => prev.filter((item) => item.id !== itemId));

    // 2. Perform DB and Storage delete
    try {
      // If it's a locally queued offline item, just remove it from the offline queue
      if (itemId.toString().startsWith('offline-')) {
        removeOfflineItem(itemId);
        return;
      }

      if (!navigator.onLine) {
        throw new Error('Offline');
      }

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
        !navigator.onLine || err.message?.includes('Failed to fetch') || err.message === 'Offline';
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
  };

  /**
   * Pins an animated emoji magnet onto the Fridge board.
   * Supports offline queueing.
   *
   * @param {string} emojiId - Selected emoji identifier (e.g. 'heart')
   */
  const handleEmojiSelect = useCallback(
    async (emojiId) => {
      playWhiteboardSound('pin');
      const timestamp = new Date().toISOString();
      const tempId = `offline-${Date.now()}`;
      const x_position = 30 + Math.random() * 40;
      const y_position = 30 + Math.random() * 40;

      // Check if explicitly offline
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
    [userId, playWhiteboardSound, addOfflineItem]
  );

  /**
   * Optimistically updates the reactions on a fridge item and syncs with Supabase.
   * Supports offline queueing via useOfflineQueue hook.
   *
   * @param {string} itemId - The target magnet's ID.
   * @param {object} newReactions - The updated reactions object mapping.
   */
  const handleUpdateReactions = async (itemId, newReactions) => {
    const backupItems = [...items];
    const timestamp = new Date().toISOString();

    // 1. Update State Optimistically
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, reactions: newReactions, updated_at: timestamp, isPending: true }
          : item
      )
    );

    // Update selected comment item if open so the drawer reflects changes instantly
    if (selectedCommentItem && selectedCommentItem.id === itemId) {
      setSelectedCommentItem((prev) => ({ ...prev, reactions: newReactions }));
    }

    // 2. Sync to Supabase
    try {
      if (!navigator.onLine) {
        throw new Error('Offline');
      }

      await updateFridgeItemReactions(itemId, newReactions);

      // Clear pending state
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isPending: false } : item))
      );
    } catch (err) {
      console.error('Optimistic reaction sync failed:', err);
      const isNetwork =
        !navigator.onLine || err.message?.includes('Failed to fetch') || err.message === 'Offline';
      if (isNetwork) {
        try {
          addOfflineUpdate({
            id: itemId,
            reactions: newReactions,
            updated_at: timestamp,
          });

          // Mark locally as pending but keep reactions
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
   * Opens the NoteModal configured with target note content for editing.
   *
   * @param {Object} item - Note item object to edit
   */
  const handleEditNote = (item) => {
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
  };

  /**
   * Increments the canvas zoom level, bounded at a maximum of 150%.
   *
   * @returns {void}
   */
  const zoomIn = () => setZoom((prev) => Math.min(1.5, prev + 0.1));

  /**
   * Decrements the canvas zoom level, bounded at a minimum of 60%.
   *
   * @returns {void}
   */
  const zoomOut = () => setZoom((prev) => Math.max(0.6, prev - 0.1));

  /**
   * Resets the canvas zoom level to the default 100%.
   *
   * @returns {void}
   */
  const resetZoom = () => setZoom(1.0);

  // Mobile Pinch-to-zoom handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
      setTouchStartZoom(zoom);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / touchStartDist;
      setZoom(Math.max(0.6, Math.min(1.5, touchStartZoom * scale)));
    }
  };

  const handleTouchEnd = () => {
    setTouchStartDist(0);
  };

  /**
   * Filters the active list of magnets, conditionally hiding items older than the threshold when clean mode is active.
   *
   * @returns {Array<Object>} The filtered array of fridge items.
   */
  const getFilteredItems = () => {
    if (!hideOld) return items;
    const cutOffDate = new Date();
    cutOffDate.setDate(cutOffDate.getDate() - cleanThreshold);
    return items.filter((item) => new Date(item.created_at) >= cutOffDate);
  };

  /**
   * Generates dynamic styling for the whiteboard canvas background.
   *
   * @returns {object} The CSS styles.
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
        backgroundImage: `url('/board-chat-bg.png')`,
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

  const filteredItems = getFilteredItems();

  return (
    <div className="w-full h-full bg-slate-950 overflow-hidden relative">
      {/* Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-40 pointer-events-none flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Title and Tagline */}
        <div className="pointer-events-auto bg-surface/75 backdrop-blur-md border border-surface-border/40 rounded-xl p-2.5 shadow-md self-start max-w-[200px] sm:max-w-xs">
          <h2 className="text-sm font-bold text-text-main flex items-center gap-1.5">
            <FridgeIcon className="w-4 h-4 text-primary" />
            Our Fridge
          </h2>
          <p className="text-[10px] text-text-muted mt-0.5">
            Pin notes, photos, and voice messages.
          </p>
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
              to="/profile#fridge-settings"
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

      {/* Main Full-Screen Fridge Viewport */}
      <div className="w-full h-full bg-slate-950 overflow-hidden relative">
        {/* Scrollable Pan Wrapper */}
        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-auto scrollbar-none relative"
          style={{ cursor: 'grab' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Zoomable Canvas Surface */}
          <div
            ref={canvasRef}
            className="relative transition-transform duration-200"
            style={{
              width: '300%',
              height: '300%',
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
                new Date(item.updated_at) > new Date(lastVisited) && item.user_id !== userId;
              return (
                <FridgeItem
                  key={item.id}
                  item={item}
                  containerRef={canvasRef}
                  isEditMode={isEditMode}
                  onDelete={handleDeleteItem}
                  onEdit={handleEditNote}
                  onPositionChange={handlePositionChange}
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
            {isLoading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-3">
                  <LoadingSpinner size="md" />
                  <p className="text-xs font-semibold text-text-muted">Loading fridge items...</p>
                </div>
              </div>
            )}
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

        {/* Floating Action Button (FAB) Speed Dial */}
        <div className="absolute bottom-6 right-6 z-35 flex flex-col items-end gap-3">
          {/* Mini-speed dial buttons */}
          <AnimatePresence>
            {isSpeedDialOpen && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.06,
                    },
                  },
                  exit: {
                    transition: {
                      staggerChildren: 0.04,
                      staggerDirection: -1,
                    },
                  },
                }}
                className="flex flex-col gap-2 items-end z-40"
              >
                {/* Add Note Button */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, x: 50, scale: 0.8 },
                    visible: { opacity: 1, x: 0, scale: 1 },
                    exit: { opacity: 0, x: 50, scale: 0.8 },
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  onClick={() => {
                    setIsNoteOpen(true);
                    setIsSpeedDialOpen(false);
                  }}
                  className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-3 py-2 rounded-xl shadow-lg border border-yellow-300 text-xs transition-transform active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  Add Note
                </motion.button>

                {/* Add Photo Button */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, x: 50, scale: 0.8 },
                    visible: { opacity: 1, x: 0, scale: 1 },
                    exit: { opacity: 0, x: 50, scale: 0.8 },
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  onClick={() => {
                    setIsPhotoOpen(true);
                    setIsSpeedDialOpen(false);
                  }}
                  className="flex items-center gap-2 bg-blue-400 hover:bg-blue-500 text-gray-900 font-bold px-3 py-2 rounded-xl shadow-lg border border-blue-300 text-xs transition-transform active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  Add Photo
                </motion.button>

                {/* Add Voice Memo Button */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, x: 50, scale: 0.8 },
                    visible: { opacity: 1, x: 0, scale: 1 },
                    exit: { opacity: 0, x: 50, scale: 0.8 },
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  onClick={() => {
                    setIsVoiceOpen(true);
                    setIsSpeedDialOpen(false);
                  }}
                  className="flex items-center gap-2 bg-green-400 hover:bg-green-500 text-gray-900 font-bold px-3 py-2 rounded-xl shadow-lg border border-green-300 text-xs transition-transform active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  Add Voice Memo
                </motion.button>

                {/* Add Emoji Button */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, x: 50, scale: 0.8 },
                    visible: { opacity: 1, x: 0, scale: 1 },
                    exit: { opacity: 0, x: 50, scale: 0.8 },
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  onClick={() => {
                    setIsEmojiPickerOpen(true);
                    setIsSpeedDialOpen(false);
                  }}
                  className="flex items-center gap-2 bg-purple-400 hover:bg-purple-500 text-gray-900 font-bold px-3 py-2 rounded-xl shadow-lg border border-purple-300 text-xs transition-transform active:scale-95"
                >
                  <Smile className="w-4 h-4" />
                  Add Emoji
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core FAB Plus Button */}
          <button
            onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
            className={`w-12 h-12 bg-primary hover:bg-primary-hover text-brand-surface rounded-full flex items-center justify-center shadow-2xl border-2 border-background/25 transition-transform duration-300 ${
              isSpeedDialOpen ? 'rotate-45 bg-amber-600 hover:bg-amber-700' : 'hover:scale-105'
            }`}
          >
            <Plus className="w-6 h-6 text-brand-surface" />
          </button>
        </div>
      </div>

      {/* Toast Notification Component */}
      <Notification message={error} onClose={() => setError(null)} />

      {/* Upload/Create Media Modals */}
      {isNoteOpen && (
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
      )}

      {/* Edit Note Modal */}
      {editingItem && (
        <NoteModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          userId={userId}
          editItemId={editingItem.id}
          initialText={editingItem.text}
          initialColor={editingItem.color}
          onSave={(updatedItem) => {
            playWhiteboardSound('pin');
            setItems((prev) =>
              prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
            setEditingItem(null);
          }}
          addOfflineItem={addOfflineItem}
        />
      )}

      {isPhotoOpen && (
        <PhotoModal
          isOpen={isPhotoOpen}
          onClose={() => setIsPhotoOpen(false)}
          userId={userId}
          onSave={(newItem) => {
            playWhiteboardSound('pin');
            setItems((prev) => [...prev, newItem]);
          }}
        />
      )}

      {isVoiceOpen && (
        <VoiceModal
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          userId={userId}
          onSave={(newItem) => {
            playWhiteboardSound('pin');
            setItems((prev) => [...prev, newItem]);
          }}
        />
      )}

      {/* Emoji Picker Modal */}
      {isEmojiPickerOpen && (
        <EmojiPickerModal
          isOpen={isEmojiPickerOpen}
          onClose={() => setIsEmojiPickerOpen(false)}
          onSelect={handleEmojiSelect}
        />
      )}

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
