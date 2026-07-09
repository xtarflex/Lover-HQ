/**
 * @file Chat.jsx
 * @description Dedicated, full-screen Chat screen for Lover-HQ.
 * Features:
 * - Real-time messaging synchronized via Supabase.
 * - Quoted replies/quotes with click-to-scroll to parent message.
 * - Emojis reactions tray.
 * - Photo attachment uploads.
 * - Voice notes (VN) recording and inline customized audio playback.
 * - Edit and delete messages.
 * - Tagging Fridge items as clickable reference link cards.
 * - Real-time partner typing indicators (pulsing header and side bubble).
 */
/* eslint-disable react-hooks/refs, react-hooks/immutability */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Image,
  Mic,
  Square,
  Trash2,
  Edit3,
  Smile,
  Reply,
  CheckCheck,
  Check,
  Play,
  Pause,
  X,
  Tag,
  ArrowLeft,
  Phone,
  Video,
  Copy,
  ArrowRight,
  Pin,
  FileText,
  MapPin,
  User as UserIcon,
  BarChart3,
  Camera,
  Plus,
  RotateCw,
  Sparkles,
  Crop,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useAppContext, useAppDispatch } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { getFridgeItems } from '../../services/fridge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ANIMATED_EMOJIS, getEmojiCdnUrl } from '../fridge/components/emojiData';

// Reaction emojis bank
const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

// Stable mock waveform heights (in percentages, e.g. from 20% to 100%) to represent a natural audio signal
const WAVEFORM_BARS = [
  30, 45, 60, 40, 25, 45, 75, 90, 65, 50, 35, 60, 80, 95, 70, 45, 30, 50, 70, 55, 40, 30, 45, 60,
  35,
];

/**
 * Customized Audio Player component for Chat Voice Messages.
 *
 * @param {{ src: string }} props
 * @returns {React.ReactElement}
 */
export function VoiceMessagePlayer({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.error('Audio play failed:', e));
    }
  };

  /**
   * Handles click/drag event on the waveform to seek to a specific audio position.
   *
   * @param {React.MouseEvent<HTMLDivElement>} e - The mouse event.
   * @returns {void}
   */
  const handleWaveformInteraction = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  /**
   * Handles touch events on the waveform to seek to a specific audio position on mobile devices.
   *
   * @param {React.TouchEvent<HTMLDivElement>} e - The touch event.
   * @returns {void}
   */
  const handleTouchInteraction = (e) => {
    if (!duration || !e.touches[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center space-x-3 bg-transparent border-none p-0 min-w-[200px]">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center text-primary transition-all shrink-0"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col min-w-0">
        <div
          onMouseDown={(e) => {
            handleWaveformInteraction(e);
            setIsDragging(true);
          }}
          onMouseMove={(e) => {
            if (isDragging) handleWaveformInteraction(e);
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchStart={(e) => {
            handleTouchInteraction(e);
            setIsDragging(true);
          }}
          onTouchMove={(e) => {
            if (isDragging) handleTouchInteraction(e);
          }}
          onTouchEnd={() => setIsDragging(false)}
          className="flex items-center justify-between h-8 cursor-pointer select-none py-1"
        >
          {WAVEFORM_BARS.map((height, i) => {
            const progress = duration ? currentTime / duration : 0;
            const barProgressThreshold = i / WAVEFORM_BARS.length;
            const isFilled = progress > barProgressThreshold;
            return (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`w-[3px] rounded-full transition-colors duration-150 shrink-0 ${
                  isFilled ? 'bg-primary' : 'bg-slate-700'
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[9px] text-text-muted mt-1 font-mono">
          <span>
            {isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPlaybackRate((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
            }}
            className="px-1.5 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700/60 text-gray-300 font-extrabold text-[8px] transition-colors leading-none"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Stateful Chat Screen component.
 *
 * @returns {React.ReactElement}
 */
export default function Chat() {
  const { user, partner, presence } = useAppContext();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const userId = user?.id;
  const partnerId = partner?.id;

  /** stable unique key representing couple */
  const coupleKey = useMemo(() => {
    if (!userId || !partnerId) return null;
    return [userId, partnerId].sort().join('_');
  }, [userId, partnerId]);

  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined' || !userId || !partnerId) return [];
    const key = [userId, partnerId].sort().join('_');
    try {
      const cached = localStorage.getItem(`chat_history_${key}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [newMessageText, setNewMessageText] = useState('');
  const [referencedItem, setReferencedItem] = useState(null);
  const [replyMessage, setReplyMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');

  const [fridgeItems, setFridgeItems] = useState([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Typing state indicators
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const typingChannelRef = useRef(null);
  const isTypingLocal = useRef(false);
  const typingTimeoutRef = useRef(null);

  // Partner offline last seen state
  const [partnerLastSeen, setPartnerLastSeen] = useState(() => {
    if (typeof window === 'undefined' || !partnerId) return partner?.last_seen;
    return localStorage.getItem(`partner_last_seen_${partnerId}`) || partner?.last_seen;
  });

  // Chat wallpaper customization state
  const [chatBg] = useState(() => {
    if (typeof window === 'undefined') return 'doodle';
    return localStorage.getItem('chat_background_preset') || 'doodle';
  });

  // Long-press interactions state
  const [longPressedMessage, setLongPressedMessage] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const pressTimer = useRef(null);

  // Pinned message state
  const [pinnedMessage, setPinnedMessage] = useState(null);

  // Unread messages tracking
  const mountTimeRef = useRef(0);

  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, []);

  const [lastReadTimestamp] = useState(() => {
    if (typeof window === 'undefined' || !userId || !partnerId) return 0;
    const key = [userId, partnerId].sort().join('_');
    const stored = localStorage.getItem(`last_read_chat_${key}`);
    return stored ? new Date(stored).getTime() : Date.now() - 5000;
  });

  useEffect(() => {
    if (!coupleKey) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`last_read_chat_${coupleKey}`, new Date().toISOString());
      setShowUnreadDivider(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [coupleKey]);

  // Sync messages to localStorage for offline support (limit to last 150 messages)
  useEffect(() => {
    if (coupleKey && messages.length > 0) {
      try {
        localStorage.setItem(`chat_history_${coupleKey}`, JSON.stringify(messages.slice(-150)));
      } catch (e) {
        console.error('Failed to cache chat history:', e);
      }
    }
  }, [messages, coupleKey]);

  // Sync partnerLastSeen to localStorage for offline support
  useEffect(() => {
    if (partnerId && partnerLastSeen) {
      localStorage.setItem(`partner_last_seen_${partnerId}`, partnerLastSeen);
    }
  }, [partnerLastSeen, partnerId]);

  // Cleanup active audio recorder/players and loops on unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);

  // Voice note recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordLevels, setRecordLevels] = useState([]);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);
  const [audioPreviewDuration, setAudioPreviewDuration] = useState(0);
  const [audioPreviewCurrentTime, setAudioPreviewCurrentTime] = useState(0);

  // Active voice recording timer effect
  useEffect(() => {
    if (!isRecording || isRecordingPaused) return;
    const timer = setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording, isRecordingPaused]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPreviewRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  // Custom media previews, captioning, and lightbox states
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [pendingMediaFiles, setPendingMediaFiles] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [mediaCaption, setMediaCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [cropAspectRatio, setCropAspectRatio] = useState('free');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [naturalDims, setNaturalDims] = useState({ w: 0, h: 0 });
  const previewContainerRef = useRef(null);
  const dragRef = useRef(null);

  const activeObjectUrl = useMemo(() => {
    const activeItem = pendingMediaFiles[activePreviewIndex];
    if (!activeItem || activeItem.file.type.startsWith('video/')) {
      return '';
    }
    return URL.createObjectURL(activeItem.file);
  }, [activePreviewIndex, pendingMediaFiles]);

  useEffect(() => {
    return () => {
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
      }
    };
  }, [activeObjectUrl]);

  // Batch message selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());

  // Unread messages divider visibility state
  const [showUnreadDivider, setShowUnreadDivider] = useState(true);

  // Auto-scroll to bottom of chat
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Fetch initial chat history
  const fetchChatHistory = useCallback(async () => {
    if (!coupleKey) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*, fridge_items(*)')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
      setTimeout(() => scrollToBottom('instant'), 100);
    } catch (e) {
      console.error('Failed to load chat history:', e);
    } finally {
      setLoading(false);
    }
  }, [coupleKey, scrollToBottom]);

  // Load fridge items for attachment reference selector
  const fetchFridgeItemsList = useCallback(async () => {
    if (!userId || !partnerId) return;
    try {
      const items = await getFridgeItems(userId, partnerId);
      setFridgeItems(items || []);
    } catch (e) {
      console.error('Failed to load fridge items:', e);
    }
  }, [userId, partnerId]);

  // Setup initial subscription & load history
  /* eslint-disable react-hooks/set-state-in-effect -- Intentional: fetch initial chat history and fridge items list on mount */
  useEffect(() => {
    fetchChatHistory();
    fetchFridgeItemsList();

    // Fetch initial partner last_seen value from presence table
    const fetchPartnerLastSeen = async () => {
      if (!partnerId) return;
      try {
        const { data } = await supabase
          .from('presence')
          .select('last_seen')
          .eq('user_id', partnerId)
          .single();
        if (data) {
          setPartnerLastSeen(data.last_seen);
        }
      } catch (err) {
        console.error('Failed to fetch partner last seen:', err);
      }
    };
    fetchPartnerLastSeen();

    // Subscribe to partner presence record changes for real-time last_seen updates
    const partnerPresenceChannel = supabase
      .channel(`partner_user_presence:${partnerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presence', filter: `user_id=eq.${partnerId}` },
        (payload) => {
          if (payload.new) {
            setPartnerLastSeen(payload.new.last_seen);
          }
        }
      )
      .subscribe();

    // Subscribe to chat messages
    const messageChannel = supabase
      .channel(`chat_messages:${coupleKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            let newMessage = payload.new;
            if (newMessage.fridge_item_id) {
              const { data: fridgeItem } = await supabase
                .from('fridge_items')
                .select('*')
                .eq('id', newMessage.fridge_item_id)
                .single();
              newMessage.fridge_items = fridgeItem;
            }
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            setTimeout(() => scrollToBottom('smooth'), 100);
          } else if (payload.eventType === 'UPDATE') {
            let updatedMessage = payload.new;
            if (updatedMessage.fridge_item_id) {
              const { data: fridgeItem } = await supabase
                .from('fridge_items')
                .select('*')
                .eq('id', updatedMessage.fridge_item_id)
                .single();
              updatedMessage.fridge_items = fridgeItem;
            }
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m))
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Setup typing channel
    typingChannelRef.current = supabase.channel(`chat_typing:${coupleKey}`);
    typingChannelRef.current
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId === partnerId) {
          setPartnerIsTyping(payload.payload.isTyping);
        }
      })
      .on('broadcast', { event: 'pin_message' }, (payload) => {
        const msgId = payload.payload.messageId;
        localStorage.setItem(`pinned_msg_${coupleKey}`, msgId);
        // Let the messages change useEffect resolve it
        window.dispatchEvent(new CustomEvent('resolve-pinned-message'));
      })
      .on('broadcast', { event: 'unpin_message' }, () => {
        localStorage.removeItem(`pinned_msg_${coupleKey}`);
        setPinnedMessage(null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(partnerPresenceChannel);
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current);
    };
  }, [coupleKey, partnerId, fetchChatHistory, fetchFridgeItemsList, scrollToBottom]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Resolve pinned message when messages load/change or on custom event
  useEffect(() => {
    if (!coupleKey || messages.length === 0) return;
    const resolvePin = () => {
      const storedId = localStorage.getItem(`pinned_msg_${coupleKey}`);
      if (storedId) {
        const found = messages.find((m) => m.id === storedId);
        if (found) {
          setPinnedMessage(found);
        }
      }
    };
    resolvePin();

    window.addEventListener('resolve-pinned-message', resolvePin);
    return () => window.removeEventListener('resolve-pinned-message', resolvePin);
  }, [messages, coupleKey]);

  // Broadcast typing status
  const broadcastTypingStatus = useCallback(
    (isTyping) => {
      if (!typingChannelRef.current) return;
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping },
      });
    },
    [userId]
  );

  // Monitor input field typing changes
  const handleInputChange = (e) => {
    setNewMessageText(e.target.value);

    if (!isTypingLocal.current) {
      isTypingLocal.current = true;
      broadcastTypingStatus(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingLocal.current = false;
      broadcastTypingStatus(false);
    }, 2000);
  };

  // Sends a standard chat message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const contentText = newMessageText.trim();
    if (!contentText && !referencedItem) return;

    // Reset input states immediately for instant UI responsiveness
    setNewMessageText('');
    setReferencedItem(null);
    setReplyMessage(null);

    // Stop typing indicator
    isTypingLocal.current = false;
    broadcastTypingStatus(false);
    clearTimeout(typingTimeoutRef.current);

    const payload = {
      user_id: userId,
      content: contentText || 'Attached a fridge item',
      fridge_item_id: referencedItem?.id || null,
      reply_to_message_id: replyMessage?.id || null,
    };

    try {
      const { error } = await supabase.from('messages').insert(payload);
      if (error) throw error;
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  // Triggers image select input click
  const triggerImageSelect = () => {
    imageInputRef.current?.click();
  };

  // Handles selection of one or more media files (images or videos) from local files
  const handleImageSelected = useCallback(
    (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const validFiles = files.filter(
        (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
      );
      if (validFiles.length < files.length) {
        dispatch({
          type: 'SET_GLOBAL_NOTIFICATION',
          payload: {
            message: 'Some selected files were not valid images or videos and were ignored.',
            type: 'info',
          },
        });
      }

      if (validFiles.length === 0) return;
      setPendingMediaFiles((prev) => [
        ...prev,
        ...validFiles.map((file) => ({
          file,
          rotation: 0,
          flipped: false,
          filter: 'none',
          crop: null,
          isMuted: false,
        })),
      ]);
      e.target.value = '';
    },
    [dispatch]
  );

  // Processes edited image via canvas to permanently bake cropping, rotations, flips, and filters
  const processEditedImage = (item) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.src = URL.createObjectURL(item.file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Determine source cropping parameters (in pixels)
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;

        if (item.crop) {
          sx = img.width * (item.crop.x / 100);
          sy = img.height * (item.crop.y / 100);
          sw = img.width * (item.crop.w / 100);
          sh = img.height * (item.crop.h / 100);
        }

        // Limit dimensions for compression
        const maxDim = 1200;
        let targetW = sw;
        let targetH = sh;
        if (targetW > maxDim || targetH > maxDim) {
          if (targetW > targetH) {
            targetH = Math.round((targetH * maxDim) / targetW);
            targetW = maxDim;
          } else {
            targetW = Math.round((targetW * maxDim) / targetH);
            targetH = maxDim;
          }
        }

        const isRotated = item.rotation === 90 || item.rotation === 270;
        const width = isRotated ? targetH : targetW;
        const height = isRotated ? targetW : targetH;

        canvas.width = width;
        canvas.height = height;

        const filterStyles = {
          none: 'none',
          grayscale: 'grayscale(100%)',
          sepia: 'sepia(100%)',
          warm: 'sepia(30%) saturate(140%) hue-rotate(-10deg)',
          cool: 'saturate(120%) hue-rotate(10deg)',
          vintage: 'sepia(50%) contrast(85%) saturate(110%)',
        };
        ctx.filter = filterStyles[item.filter] || 'none';

        ctx.translate(width / 2, height / 2);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.scale(item.flipped ? -1 : 1, 1);

        ctx.drawImage(img, sx, sy, sw, sh, -targetW / 2, -targetH / 2, targetW, targetH);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(img.src);
            resolve(blob);
          },
          'image/webp',
          0.85
        );
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(img.src);
        reject(err);
      };
    });
  };

  // Uploads all pending images or videos as a batch with the caption
  const handleBatchUpload = async () => {
    if (pendingMediaFiles.length === 0) return;

    const filesToUpload = [...pendingMediaFiles];
    const captionToSend = mediaCaption.trim();

    setPendingMediaFiles([]);
    setMediaCaption('');
    setActivePreviewIndex(0);
    setUploadingMedia(true);
    setUploadProgress({ current: 0, total: filesToUpload.length });

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgress({ current: i + 1, total: filesToUpload.length });
        const item = filesToUpload[i];
        const file = item.file;
        const isVideo = file.type.startsWith('video/');

        const randId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
        const sanitizedBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const ext = file.name.substring(file.name.lastIndexOf('.')) || (isVideo ? '.mp4' : '.webp');
        const filePath = `chat/${userId}/${Date.now()}_${randId}_${sanitizedBase}${isVideo ? ext : '.webp'}`;

        let processedBlob;
        if (isVideo) {
          processedBlob = file; // Upload raw video
        } else {
          processedBlob = await processEditedImage(item);
        }

        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(filePath, processedBlob, { contentType: isVideo ? file.type : 'image/webp' });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        const { error: dbError } = await supabase.from('messages').insert({
          user_id: userId,
          content:
            i === 0 && captionToSend
              ? captionToSend
              : isVideo
                ? 'Shared a video'
                : 'Shared a photo',
          media_url: publicUrl,
          media_type: isVideo ? 'video' : 'image',
          reply_to_message_id: replyMessage?.id || null,
        });

        if (dbError) throw dbError;
      }
      setReplyMessage(null);
    } catch (err) {
      console.error('Failed batch upload:', err);
      dispatch({
        type: 'SET_GLOBAL_NOTIFICATION',
        payload: { message: 'Failed to upload some media files. Please try again.', type: 'error' },
      });
    } finally {
      setUploadingMedia(false);
      setUploadProgress(null);
    }
  };

  // Starts Voice Note Recording with Real-time Waveform visualizer
  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      setRecordLevels([]);
      setIsRecordingPaused(false);
      setAudioPreviewUrl(null);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const drawWaveform = () => {
        if (!analyserRef.current || mediaRecorder.state === 'inactive') return;

        analyserRef.current.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const level = Math.min(Math.max(rms * 150, 4), 48);

        setRecordLevels((prev) => {
          const next = [level, ...prev];
          return next.slice(0, 11);
        });

        animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
      };

      animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
    } catch (err) {
      console.error('Microphone access error:', err);
      let errorMessage = 'Could not access microphone for voice recording. 🎙️';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage =
          'Microphone is blocked. Please click the 🔒 icon in your browser address bar to reset permissions. 🔓';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone found. Please connect a recording device. 🎤';
      }
      dispatch({
        type: 'SET_GLOBAL_NOTIFICATION',
        payload: { message: errorMessage, type: 'error' },
      });
    }
  };

  // Pauses current recording
  const pauseRecording = useCallback(() => {
    if (
      !isRecording ||
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== 'recording'
    ) {
      return;
    }
    mediaRecorderRef.current.pause();
    setIsRecordingPaused(true);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }
  }, [isRecording]);

  // Resumes paused recording
  const resumeRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'paused') {
      return;
    }
    mediaRecorderRef.current.resume();
    setIsRecordingPaused(false);

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const drawWaveform = () => {
      if (!analyserRef.current || mediaRecorderRef.current.state === 'inactive') return;
      analyserRef.current.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const level = Math.min(Math.max(rms * 150, 4), 48);
      setRecordLevels((prev) => [level, ...prev].slice(0, 11));
      animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
    };
    animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
  }, [isRecording]);

  // Discards current voice recording (Trash bin)
  const discardRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordLevels([]);
    setAudioPreviewUrl(null);
  }, []);

  // Stops recording and sets up preview stage
  const stopRecordingAndPreview = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(audioBlob);
      setAudioPreviewUrl(url);
      setAudioPreviewPlaying(false);
      setAudioPreviewCurrentTime(0);

      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      setIsRecording(false);
      setIsRecordingPaused(false);
    };

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    mediaRecorderRef.current.stop();
  }, [isRecording]);

  // Toggles play/pause state for recorded preview
  const handleTogglePreviewPlay = useCallback(() => {
    if (!audioPreviewUrl) return;

    if (!audioPreviewRef.current) {
      const audio = new Audio(audioPreviewUrl);
      audioPreviewRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        setAudioPreviewDuration(audio.duration || 0);
      });
      audio.addEventListener('timeupdate', () => {
        setAudioPreviewCurrentTime(audio.currentTime || 0);
      });
      audio.addEventListener('ended', () => {
        setAudioPreviewPlaying(false);
        setAudioPreviewCurrentTime(0);
      });
    }

    if (audioPreviewPlaying) {
      audioPreviewRef.current.pause();
      setAudioPreviewPlaying(false);
    } else {
      audioPreviewRef.current.play().catch((err) => console.error(err));
      setAudioPreviewPlaying(true);
    }
  }, [audioPreviewUrl, audioPreviewPlaying]);

  // Uploads and sends the previewed recording
  const sendRecording = useCallback(async () => {
    if (!audioPreviewUrl || audioChunksRef.current.length === 0) return;

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    setAudioPreviewUrl(null);
    setAudioPreviewPlaying(false);
    setAudioPreviewCurrentTime(0);
    setUploadingMedia(true);

    const randId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    const filePath = `chat/${userId}/${Date.now()}_${randId}_voicenote.webm`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, audioBlob, { contentType: 'audio/webm' });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      const durationVal = audioPreviewDuration || 0;

      const { error: dbError } = await supabase.from('messages').insert({
        user_id: userId,
        content: JSON.stringify({ url: publicUrl, duration: durationVal }),
        media_url: publicUrl,
        media_type: 'voice',
        reply_to_message_id: replyMessage?.id || null,
      });

      if (dbError) throw dbError;
      setReplyMessage(null);
    } catch (err) {
      console.error('Failed to upload voice note:', err);
      dispatch({
        type: 'SET_GLOBAL_NOTIFICATION',
        payload: { message: 'Failed to upload voice note. Please try again.', type: 'error' },
      });
    } finally {
      setUploadingMedia(false);
      audioChunksRef.current = [];
    }
  }, [audioPreviewUrl, audioPreviewDuration, replyMessage, userId, dispatch]);

  // Uploads voice note immediately without preview
  const sendRecordingImmediately = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }

      setIsRecording(false);
      setIsRecordingPaused(false);
      setRecordLevels([]);
      setUploadingMedia(true);

      const randId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
      const filePath = `chat/${userId}/${Date.now()}_${randId}_voicenote.webm`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(filePath, audioBlob, { contentType: 'audio/webm' });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        const { error: dbError } = await supabase.from('messages').insert({
          user_id: userId,
          content: JSON.stringify({ url: publicUrl, duration: 0 }),
          media_url: publicUrl,
          media_type: 'voice',
          reply_to_message_id: replyMessage?.id || null,
        });

        if (dbError) throw dbError;
        setReplyMessage(null);
      } catch (err) {
        console.error('Failed to upload voice note immediately:', err);
        dispatch({
          type: 'SET_GLOBAL_NOTIFICATION',
          payload: { message: 'Failed to upload voice note. Please try again.', type: 'error' },
        });
      } finally {
        setUploadingMedia(false);
        audioChunksRef.current = [];
      }
    };

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    mediaRecorderRef.current.stop();
  }, [isRecording, userId, replyMessage, dispatch]);

  // Saves edited text of own message
  const handleSaveEdit = useCallback(
    async (mId) => {
      if (!editText.trim()) return;
      try {
        const { error } = await supabase
          .from('messages')
          .update({ content: editText.trim(), is_edited: true })
          .eq('id', mId);
        if (error) throw error;
        setEditingMessage(null);
        setEditText('');
      } catch (err) {
        console.error('Failed to edit message:', err);
      }
    },
    [editText]
  );

  // Deletes a message from DB
  const handleDeleteMessage = useCallback((mId) => {
    setMessageToDelete(mId);
  }, []);

  // Toggles message emoji reactions
  const handleToggleReaction = useCallback(
    async (msg, emoji) => {
      const current = { ...(msg.reactions || {}) };
      const list = current[emoji] ? [...current[emoji]] : [];
      const newReactions = list.includes(userId)
        ? { ...current, [emoji]: list.filter((id) => id !== userId) }
        : { ...current, [emoji]: [...list, userId] };

      try {
        const { error } = await supabase
          .from('messages')
          .update({ reactions: newReactions })
          .eq('id', msg.id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update reaction:', err);
      }
    },
    [userId]
  );

  // Format creation timestamp
  const getFormattedTime = useCallback((isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${mins} ${ampm}`;
  }, []);

  /**
   * Formats the partner's last seen ISO string into a friendly relative or absolute date.
   *
   * @param {string} lastSeenIso - ISO date string
   * @returns {string} Friendly last seen message
   */
  const formatLastSeen = useCallback((lastSeenIso) => {
    if (!lastSeenIso) return 'Last seen offline';
    const lastSeenDate = new Date(lastSeenIso);
    const diffMs = Date.now() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) {
      return 'Last seen just now';
    }
    if (diffMins < 60) {
      return `Last seen ${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `Last seen ${diffHours}h ago`;
    }

    const formattedDate = lastSeenDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = lastSeenDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `Last seen ${formattedDate} at ${formattedTime}`;
  }, []);

  /**
   * Simulates sending a document in the chat.
   *
   * @returns {Promise<void>}
   */
  const simulateSendDocument = useCallback(async () => {
    try {
      const { error } = await supabase.from('messages').insert({
        user_id: userId,
        content: 'Market_Logistics.pdf',
        media_type: 'document',
        media_url:
          'https://oxqpmfdoytdfxmofmeno.supabase.co/storage/v1/object/public/chat-media/dummy_market_logistics.pdf',
        reply_to_message_id: replyMessage?.id || null,
      });
      if (error) throw error;
      setReplyMessage(null);
    } catch (err) {
      console.error('Failed to simulate send document:', err);
    }
  }, [userId, replyMessage]);

  /**
   * Simulates sending a location in the chat.
   *
   * @returns {Promise<void>}
   */
  const simulateSendLocation = useCallback(async () => {
    try {
      const { error } = await supabase.from('messages').insert({
        user_id: userId,
        content: '📍 Pinned Location: 37.7749° N, 122.4194° W',
        media_type: 'location',
        media_url: 'https://maps.google.com/?q=37.7749,-122.4194',
        reply_to_message_id: replyMessage?.id || null,
      });
      if (error) throw error;
      setReplyMessage(null);
    } catch (err) {
      console.error('Failed to simulate send location:', err);
    }
  }, [userId, replyMessage]);

  /**
   * Pins a message in the chat.
   *
   * @param {Object} msg - The message object to pin.
   * @returns {void}
   */

  const handlePinMessage = useCallback(
    (msg) => {
      if (!coupleKey) return;
      localStorage.setItem(`pinned_msg_${coupleKey}`, msg.id);
      setPinnedMessage(msg);

      // Broadcast to partner
      typingChannelRef.current?.send({
        type: 'broadcast',
        event: 'pin_message',
        payload: { messageId: msg.id },
      });

      dispatch({
        type: 'SET_GLOBAL_NOTIFICATION',
        payload: { message: 'Message pinned! 📌', type: 'success' },
      });
    },
    [coupleKey, dispatch]
  );

  /**
   * Unpins the currently pinned message.
   *
   * @returns {void}
   */

  const handleUnpinMessage = useCallback(() => {
    if (!coupleKey) return;
    localStorage.removeItem(`pinned_msg_${coupleKey}`);
    setPinnedMessage(null);

    // Broadcast to partner
    typingChannelRef.current?.send({
      type: 'broadcast',
      event: 'unpin_message',
      payload: {},
    });

    dispatch({
      type: 'SET_GLOBAL_NOTIFICATION',
      payload: { message: 'Message unpinned! 📌', type: 'info' },
    });
  }, [coupleKey, dispatch]);

  // Group messages by date headings
  const groupedMessages = useMemo(() => {
    // ⚡ BOLT OPTIMIZATION: Instantiate Date objects once outside the loop
    // to prevent O(N) object creation on every render (e.g. typing keystrokes).
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const todayString = today.toDateString();
    const yesterdayString = yesterday.toDateString();

    const partnerUnreadMessages = messages.filter(
      (m) =>
        m.user_id !== userId &&
        new Date(m.created_at).getTime() > lastReadTimestamp &&
        new Date(m.created_at).getTime() < mountTimeRef.current
    );
    const unreadCount = partnerUnreadMessages.length;
    let hasInsertedUnreadDivider = false;

    const groups = [];
    let lastDateLabel = '';
    let prevMsg = null;
    let prevMsgTime = 0;

    messages.forEach((msg) => {
      const date = new Date(msg.created_at);
      const msgTime = date.getTime();

      let label = '';
      const dateString = date.toDateString();
      if (dateString === todayString) {
        label = 'Today';
      } else if (dateString === yesterdayString) {
        label = 'Yesterday';
      } else {
        label = date.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });
      }

      let isFirstMessageOfDay = false;
      if (label !== lastDateLabel) {
        groups.push({ type: 'date', label });
        lastDateLabel = label;
        isFirstMessageOfDay = true;
      }

      // Inject unread messages divider right before the first unread message from partner
      if (unreadCount > 0 && !hasInsertedUnreadDivider && msg.id === partnerUnreadMessages[0].id) {
        groups.push({ type: 'unread_divider', count: unreadCount });
        hasInsertedUnreadDivider = true;
      }

      // Check if we can couple this image with the previous image message (W2/album)
      let coupled = false;
      if (
        (msg.media_type === 'image' || msg.media_type === 'video') &&
        prevMsg &&
        (prevMsg.media_type === 'image' || prevMsg.media_type === 'video') &&
        prevMsg.user_id === msg.user_id
      ) {
        const diffTime = (msgTime - prevMsgTime) / 1000;
        if (diffTime < 15) {
          // Find last message/media_group pushed to groups
          let lastPushedIdx = -1;
          for (let k = groups.length - 1; k >= 0; k--) {
            if (groups[k].type === 'message' || groups[k].type === 'media_group') {
              lastPushedIdx = k;
              break;
            }
          }
          if (lastPushedIdx !== -1) {
            const lastPushed = groups[lastPushedIdx];
            if (
              lastPushed.type === 'message' &&
              (lastPushed.data.media_type === 'image' || lastPushed.data.media_type === 'video') &&
              lastPushed.data.user_id === msg.user_id
            ) {
              groups[lastPushedIdx] = {
                type: 'media_group',
                user_id: msg.user_id,
                messages: [lastPushed.data, msg],
                hideHeader: lastPushed.hideHeader,
              };
              coupled = true;
            } else if (lastPushed.type === 'media_group' && lastPushed.user_id === msg.user_id) {
              lastPushed.messages.push(msg);
              coupled = true;
            }
          }
        }
      }

      if (!coupled) {
        // ⚡ BOLT OPTIMIZATION: Compute hideHeader here instead of in the render loop
        let hideHeader = false;
        if (!isFirstMessageOfDay && prevMsg) {
          const diffTime = (msgTime - prevMsgTime) / 1000;
          if (prevMsg.user_id === msg.user_id && diffTime < 120) {
            hideHeader = true;
          }
        }
        groups.push({ type: 'message', data: msg, hideHeader });
      }

      prevMsg = msg;
      prevMsgTime = msgTime;
    });

    return groups;
  }, [messages, lastReadTimestamp, userId]);

  // Click handler to redirect and highlight tagged Fridge item
  const handleReferenceClick = useCallback(
    (itemId) => {
      navigate('/fridge');
      setTimeout(() => {
        const event = new CustomEvent('highlight-fridge-item', { detail: { id: itemId } });
        window.dispatchEvent(event);
      }, 400);
    },
    [navigate]
  );

  // Toggle single message selection for batch actions
  const handleToggleSelectMessage = useCallback((msgId) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  }, []);

  // Batch delete selected messages
  const handleDeleteSelectedMessages = useCallback(async () => {
    const ids = Array.from(selectedMessageIds);
    if (ids.length === 0) return;
    try {
      const { error } = await supabase.from('messages').delete().in('id', ids);
      if (error) throw error;
      setIsSelectionMode(false);
      setSelectedMessageIds(new Set());
      dispatch({
        type: 'SET_GLOBAL_NOTIFICATION',
        payload: {
          message: `Deleted ${ids.length} message${ids.length === 1 ? '' : 's'} successfully!`,
          type: 'success',
        },
      });
    } catch (err) {
      console.error('Failed to delete messages:', err);
    }
  }, [selectedMessageIds, dispatch]);

  // Batch pin message (pins the single selected message)
  const handlePinSelectedMessages = useCallback(() => {
    const ids = Array.from(selectedMessageIds);
    if (ids.length !== 1) return;
    const msg = messages.find((m) => m.id === ids[0]);
    if (msg) {
      if (pinnedMessage?.id === msg.id) {
        handleUnpinMessage();
      } else {
        handlePinMessage(msg);
      }
    }
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  }, [selectedMessageIds, messages, pinnedMessage, handlePinMessage, handleUnpinMessage]);

  // Batch forward selected messages
  const handleForwardSelectedMessages = useCallback(() => {
    const count = selectedMessageIds.size;
    dispatch({
      type: 'SET_GLOBAL_NOTIFICATION',
      payload: {
        message: `Forwarded ${count} message${count === 1 ? '' : 's'} successfully! 🚀`,
        type: 'success',
      },
    });
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  }, [selectedMessageIds, dispatch]);

  // Start cropping mode on the active preview image
  const handleStartCropping = useCallback(() => {
    const activeItem = pendingMediaFiles[activePreviewIndex];
    if (!activeItem) return;
    if (activeItem.crop) {
      setCropRect({ ...activeItem.crop });
    } else {
      setCropRect({ x: 10, y: 10, w: 80, h: 80 });
    }
    setIsCropping(true);
  }, [pendingMediaFiles, activePreviewIndex]);

  // Saves the custom crop box rectangle to active preview item metadata
  const handleSaveCrop = useCallback(() => {
    setPendingMediaFiles((prev) =>
      prev.map((item, idx) =>
        idx === activePreviewIndex ? { ...item, crop: { ...cropRect } } : item
      )
    );
    setIsCropping(false);
  }, [activePreviewIndex, cropRect]);

  // Interactive mouse/touch drag handler for custom resizable crop box
  const handleCropPointerDown = useCallback(
    (e, handle) => {
      e.stopPropagation();

      const cropBoxContainer = e.currentTarget.parentElement;
      if (!cropBoxContainer) return;
      const containerRect = cropBoxContainer.getBoundingClientRect();

      const startX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
      const startY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;

      dragRef.current = {
        handle,
        startX,
        startY,
        startCrop: { ...cropRect },
        containerRect,
      };

      const handlePointerMove = (moveEvent) => {
        if (!dragRef.current) return;
        const curX =
          moveEvent.clientX !== undefined ? moveEvent.clientX : moveEvent.touches?.[0]?.clientX;
        const curY =
          moveEvent.clientY !== undefined ? moveEvent.clientY : moveEvent.touches?.[0]?.clientY;
        if (curX === undefined || curY === undefined) return;

        const deltaX =
          ((curX - dragRef.current.startX) / dragRef.current.containerRect.width) * 100;
        const deltaY =
          ((curY - dragRef.current.startY) / dragRef.current.containerRect.height) * 100;

        let { x, y, w, h } = dragRef.current.startCrop;
        const activeHandle = dragRef.current.handle;

        // Map deltaX and deltaY to local coordinates depending on rotation
        let dx = deltaX;
        let dy = deltaY;
        const activeItem = pendingMediaFiles[activePreviewIndex] || pendingMediaFiles[0];
        const rotation = activeItem?.rotation || 0;

        if (rotation === 90) {
          dx = deltaY;
          dy = -deltaX;
        } else if (rotation === 180) {
          dx = -deltaX;
          dy = -deltaY;
        } else if (rotation === 270) {
          dx = -deltaY;
          dy = deltaX;
        }

        if (cropAspectRatio === 'free') {
          if (activeHandle === 'top-left') {
            const nextX = Math.max(0, Math.min(x + w - 10, x + dx));
            const nextY = Math.max(0, Math.min(y + h - 10, y + dy));
            w = w + (x - nextX);
            h = h + (y - nextY);
            x = nextX;
            y = nextY;
          } else if (activeHandle === 'top-right') {
            w = Math.max(10, Math.min(100 - x, w + dx));
            const nextY = Math.max(0, Math.min(y + h - 10, y + dy));
            h = h + (y - nextY);
            y = nextY;
          } else if (activeHandle === 'bottom-left') {
            const nextX = Math.max(0, Math.min(x + w - 10, x + dx));
            w = w + (x - nextX);
            x = nextX;
            h = Math.max(10, Math.min(100 - y, h + dy));
          } else if (activeHandle === 'bottom-right') {
            w = Math.max(10, Math.min(100 - x, w + dx));
            h = Math.max(10, Math.min(100 - y, h + dy));
          } else if (activeHandle === 'move') {
            x = Math.max(0, Math.min(100 - w, x + dx));
            y = Math.max(0, Math.min(100 - h, y + dy));
          }
        } else {
          // Lock aspect ratio
          let targetRatio = 1;
          if (cropAspectRatio === '1:1') targetRatio = 1.0;
          else if (cropAspectRatio === '16:9') targetRatio = 16 / 9;
          else if (cropAspectRatio === '4:3') targetRatio = 4 / 3;
          else if (cropAspectRatio === '9:16') targetRatio = 9 / 16;

          const containerRatio =
            dragRef.current.containerRect.width / dragRef.current.containerRect.height;
          const rPct = targetRatio / containerRatio;

          if (activeHandle === 'bottom-right') {
            w = Math.max(10, Math.min(100 - x, w + dx));
            h = w / rPct;
            if (y + h > 100) {
              h = 100 - y;
              w = h * rPct;
            }
          } else if (activeHandle === 'top-right') {
            w = Math.max(10, Math.min(100 - x, w + dx));
            const nextH = w / rPct;
            const nextY = y + h - nextH;
            if (nextY >= 0) {
              y = nextY;
              h = nextH;
            } else {
              y = 0;
              h = y + h;
              w = h * rPct;
            }
          } else if (activeHandle === 'bottom-left') {
            const nextX = Math.max(0, Math.min(x + w - 10, x + dx));
            w = w + (x - nextX);
            x = nextX;
            h = w / rPct;
            if (y + h > 100) {
              h = 100 - y;
              w = h * rPct;
              x = x + w - h * rPct;
            }
          } else if (activeHandle === 'top-left') {
            const nextX = Math.max(0, Math.min(x + w - 10, x + dx));
            w = w + (x - nextX);
            x = nextX;
            const nextH = w / rPct;
            const nextY = y + h - nextH;
            if (nextY >= 0) {
              y = nextY;
              h = nextH;
            } else {
              y = 0;
              h = y + h;
              w = h * rPct;
              x = x + w - h * rPct;
            }
          } else if (activeHandle === 'move') {
            x = Math.max(0, Math.min(100 - w, x + dx));
            y = Math.max(0, Math.min(100 - h, y + dy));
          }
        }

        setCropRect({ x, y, w, h });
      };

      const handlePointerUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
      };

      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    },
    [cropRect, cropAspectRatio, pendingMediaFiles, activePreviewIndex]
  );

  // Apply crop aspect ratio constraint
  const applyAspectRatio = useCallback((ratioStr) => {
    setCropAspectRatio(ratioStr);
    if (ratioStr === 'free') return;

    let targetRatio = 1.0;
    if (ratioStr === '1:1') targetRatio = 1.0;
    else if (ratioStr === '16:9') targetRatio = 16 / 9;
    else if (ratioStr === '4:3') targetRatio = 4 / 3;
    else if (ratioStr === '9:16') targetRatio = 9 / 16;

    if (!previewContainerRef.current) return;
    const container = previewContainerRef.current;
    const containerRatio = container.clientWidth / container.clientHeight;

    const rPct = targetRatio / containerRatio;

    let newW, newH;
    if (rPct > 1) {
      newW = 80;
      newH = newW / rPct;
      if (newH > 80) {
        newH = 80;
        newW = newH * rPct;
      }
    } else {
      newH = 80;
      newW = newH * rPct;
      if (newW > 80) {
        newW = 80;
        newH = newW / rPct;
      }
    }

    const newX = (100 - newW) / 2;
    const newY = (100 - newH) / 2;
    setCropRect({ x: newX, y: newY, w: newW, h: newH });
  }, []);

  // Get active preview image rendered scale factor and dimensions to prevent clipping
  const getScaleAndDims = useCallback(() => {
    const activeItem = pendingMediaFiles[activePreviewIndex] || pendingMediaFiles[0];
    if (!activeItem || !naturalDims.w || !naturalDims.h || !previewContainerRef.current) {
      return { scale: 1, isVertical: false, width: '100%', height: 'auto' };
    }

    const container = previewContainerRef.current;
    const cW = container.clientWidth - 32;
    const cH = container.clientHeight - 32;

    const iW = naturalDims.w;
    const iH = naturalDims.h;
    const imgRatio = iW / iH;

    const isVertical = iH > iW;

    const rotation = activeItem.rotation || 0;
    const isRotated = rotation === 90 || rotation === 270;

    let rW, rH;
    const containerRatio = cW / cH;

    if (imgRatio > containerRatio) {
      rW = cW;
      rH = cW / imgRatio;
    } else {
      rH = cH;
      rW = cH * imgRatio;
    }

    let scale = 1;
    if (isRotated) {
      const scaleW = cW / rH;
      const scaleH = cH / rW;
      scale = Math.min(scaleW, scaleH);
    }

    return {
      scale,
      isVertical,
      width: `${rW}px`,
      height: `${rH}px`,
    };
  }, [activePreviewIndex, pendingMediaFiles, naturalDims]);

  // Set the natural dimensions when image is loaded
  const handleImageLoad = useCallback((e) => {
    setNaturalDims({
      w: e.currentTarget.naturalWidth,
      h: e.currentTarget.naturalHeight,
    });
  }, []);

  // Rotate the active preview image 90 degrees clockwise
  const handleRotateActive = useCallback(() => {
    setPendingMediaFiles((prev) =>
      prev.map((item, idx) =>
        idx === activePreviewIndex ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  }, [activePreviewIndex]);

  // Flip the active preview image horizontally
  const handleFlipActive = useCallback(() => {
    setPendingMediaFiles((prev) =>
      prev.map((item, idx) =>
        idx === activePreviewIndex ? { ...item, flipped: !item.flipped } : item
      )
    );
  }, [activePreviewIndex]);

  // Apply visual CSS filter to the active preview image
  const handleFilterActive = useCallback(
    (filterName) => {
      setPendingMediaFiles((prev) =>
        prev.map((item, idx) =>
          idx === activePreviewIndex ? { ...item, filter: filterName } : item
        )
      );
    },
    [activePreviewIndex]
  );

  // Toggle video mute state
  const handleToggleMuteActive = useCallback(() => {
    setPendingMediaFiles((prev) =>
      prev.map((item, idx) =>
        idx === activePreviewIndex ? { ...item, isMuted: !item.isMuted } : item
      )
    );
  }, [activePreviewIndex]);

  // Touch handlers for swipe navigation
  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const diffX = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          setActivePreviewIndex((prev) => {
            const next = Math.max(0, prev - 1);
            if (next !== prev) setNaturalDims({ w: 0, h: 0 });
            return next;
          });
        } else {
          setActivePreviewIndex((prev) => {
            const next = Math.min(pendingMediaFiles.length - 1, prev + 1);
            if (next !== prev) setNaturalDims({ w: 0, h: 0 });
            return next;
          });
        }
      }
    },
    [pendingMediaFiles.length]
  );

  // In-app CORS-safe image download helper
  const handleDownloadImage = useCallback(async (url) => {
    try {
      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL || 'https://oxqpmfdoytdfxmofmeno.supabase.co';
      const prefix = `${supabaseUrl}/storage/v1/object/public/`;
      let downloadUrl = url;
      if (url.startsWith(prefix)) {
        downloadUrl = url.replace(prefix, '/storage-proxy/');
      }
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const filename = url.substring(url.lastIndexOf('/') + 1) || 'image.webp';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download image:', err);
      // Fallback
      window.open(url, '_blank');
    }
  }, []);

  // Scrolls message into view when replying to it
  const handleScrollToMessage = useCallback((mId) => {
    const el = document.getElementById(`msg-${mId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.classList.add('animate-pulse-gold');
    setTimeout(() => el?.classList.remove('animate-pulse-gold'), 2000);
  }, []);

  const formatVoiceDuration = useCallback((seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }, []);

  const bgStyles = {
    doodle: {
      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.95)), url('/board-chat-bg.png')`,
      backgroundSize: 'cover',
    },
    midnight: {
      background: 'linear-gradient(to bottom, #0b0f19, #020617)',
    },
    sunset: {
      background: 'linear-gradient(to bottom right, #1e1b4b, #3b0764, #500724)',
    },
    neon: {
      background:
        'linear-gradient(rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.92)), linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)',
      backgroundSize: '100% 100%, 32px 32px, 32px 32px',
    },
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col h-full w-full bg-slate-950 text-white relative overflow-hidden"
      style={bgStyles[chatBg] || bgStyles.doodle}
    >
      {/* Bespoke Chat Header */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800/80 px-4 py-3 flex items-center justify-between z-10 shrink-0 select-none">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-slate-800/60 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>

          <div
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-2.5 min-w-0 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold">
              {partner?.avatar_url ? (
                <img
                  src={partner.avatar_url}
                  alt="Partner Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                'P'
              )}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="font-bold text-sm text-text-main truncate leading-tight font-rounded">
                {partner?.name || 'Partner'}
              </span>
              <span className="text-[10px] text-text-muted font-medium truncate mt-0.5 leading-none">
                {partnerIsTyping ? (
                  <span className="text-amber-500 font-bold">typing...</span>
                ) : presence.partner === 'online' ? (
                  <>
                    <span className="text-emerald-500 font-semibold">online</span>
                    {presence.partnerRoom &&
                      presence.partnerRoom !== 'Lover-HQ' &&
                      presence.partnerRoom !== 'Chat Room' && (
                        <span className="text-gray-400">
                          {' '}
                          • {presence.partnerRoom.replace(' Room', '').replace('Page', '')}
                        </span>
                      )}
                  </>
                ) : (
                  formatLastSeen(partnerLastSeen)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Video and Audio call stub buttons */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'SET_GLOBAL_NOTIFICATION',
                payload: { message: 'Video calling is coming soon! 📹', type: 'info' },
              })
            }
            aria-label="Video call"
            className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-slate-800/40 transition-colors flex items-center justify-center"
          >
            <Video className="w-5 h-5 text-gray-300" />
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'SET_GLOBAL_NOTIFICATION',
                payload: { message: 'Audio calling is coming soon! 📞', type: 'info' },
              })
            }
            aria-label="Audio call"
            className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-slate-800/40 transition-colors flex items-center justify-center"
          >
            <Phone className="w-4.5 h-4.5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Pinned Message Banner (Telegram/WhatsApp style) */}
      {pinnedMessage && (
        <div
          onClick={() => handleScrollToMessage(pinnedMessage.id)}
          className="bg-slate-900/95 backdrop-blur border-b border-slate-800/40 px-4 py-2 flex items-center justify-between z-10 shrink-0 select-none animate-slide-down cursor-pointer"
        >
          <div className="flex items-center space-x-2.5 min-w-0 border-l-2 border-primary pl-2.5">
            <Pin className="w-3.5 h-3.5 text-primary shrink-0 rotate-45" />
            <div className="min-w-0 flex flex-col">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider leading-none">
                Pinned Message
              </span>
              <span className="text-xs text-text-muted truncate mt-0.5 max-w-md">
                {pinnedMessage.media_url
                  ? pinnedMessage.media_type === 'voice'
                    ? '🎙️ Voice Note'
                    : '🖼️ Photo'
                  : pinnedMessage.content}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleUnpinMessage();
            }}
            className="p-1 rounded-full text-text-muted hover:text-text-main hover:bg-slate-800 transition-colors"
            aria-label="Unpin message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dimmed Backdrop for Long-press Action state */}
      {longPressedMessage && (
        <div className="chat-longpress-overlay" onClick={() => setLongPressedMessage(null)} />
      )}

      {/* Message List area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar relative">
        {useMemo(
          () =>
            loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2">
                <LoadingSpinner size="md" />
                <span className="text-xs text-text-muted">Fetching your digital diary...</span>
              </div>
            ) : groupedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 text-center px-8">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Smile className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-main">No messages here yet</p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Send a sweet note, upload a picture, record a voice memo, or tag a Fridge item
                    as a reference!
                  </p>
                </div>
              </div>
            ) : (
              groupedMessages.map((item, idx) => {
                if (item.type === 'unread_divider') {
                  if (!showUnreadDivider) return null;
                  return (
                    <div
                      key={`unread-divider-${idx}`}
                      className="flex items-center justify-center my-4 select-none animate-fade-in"
                    >
                      <div className="flex-1 h-[1px] bg-red-500/20" />
                      <span className="mx-4 px-3 py-1 bg-red-950/40 border border-red-500/20 text-red-400 text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-sm">
                        {item.count} Unread {item.count === 1 ? 'Message' : 'Messages'}
                      </span>
                      <div className="flex-1 h-[1px] bg-red-500/20" />
                    </div>
                  );
                }

                if (item.type === 'date') {
                  return (
                    <div key={`date-${item.label}-${idx}`} className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-slate-900/80 border border-slate-800/80 rounded-full text-[10px] font-bold text-text-muted tracking-wider uppercase">
                        {item.label}
                      </span>
                    </div>
                  );
                }

                if (item.type === 'media_group') {
                  const groupMsgs = item.messages;
                  const isSelf = item.user_id === userId;
                  const hideHeader = item.hideHeader || false;

                  const highlightedMsg = groupMsgs.find((m) => longPressedMessage?.id === m.id);
                  const isHighlighted = !!highlightedMsg;
                  const displayMsg = highlightedMsg || groupMsgs[0];

                  return (
                    <div
                      key={`mediagroup-${groupMsgs[0].id}`}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1 group relative transition-all duration-300 ${
                        hideHeader ? 'mt-0.5' : 'mt-4'
                      } ${isHighlighted ? 'message-bubble-highlighted' : ''}`}
                    >
                      {/* Floating Reactions Tray */}
                      {isHighlighted && (
                        <div
                          className={`reactions-tray-floating -top-12 ${
                            isSelf ? 'right-0' : 'left-0'
                          }`}
                        >
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                handleToggleReaction(displayMsg, emoji);
                                setLongPressedMessage(null);
                              }}
                              className="reaction-btn"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Floating Context Menu */}
                      {isHighlighted && (
                        <div
                          className={`context-menu-floating top-full mt-2 ${
                            isSelf ? 'right-0' : 'left-0'
                          }`}
                        >
                          <button
                            onClick={() => {
                              setReplyMessage(displayMsg);
                              setLongPressedMessage(null);
                            }}
                            className="context-menu-item"
                          >
                            <Reply className="w-4 h-4 text-gray-400" />
                            <span>Reply</span>
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(displayMsg.content);
                              setLongPressedMessage(null);
                              dispatch({
                                type: 'SET_GLOBAL_NOTIFICATION',
                                payload: { message: 'Copied to clipboard!', type: 'success' },
                              });
                            }}
                            className="context-menu-item"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                            <span>Copy</span>
                          </button>
                          <button
                            onClick={() => {
                              setLongPressedMessage(null);
                              dispatch({
                                type: 'SET_GLOBAL_NOTIFICATION',
                                payload: { message: 'Forwarding coming soon! 🚀', type: 'info' },
                              });
                            }}
                            className="context-menu-item"
                          >
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span>Forward</span>
                          </button>
                          <button
                            onClick={() => {
                              if (pinnedMessage?.id === displayMsg.id) {
                                handleUnpinMessage();
                              } else {
                                handlePinMessage(displayMsg);
                              }
                              setLongPressedMessage(null);
                            }}
                            className="context-menu-item"
                          >
                            <Pin className="w-4 h-4 text-gray-400" />
                            <span>{pinnedMessage?.id === displayMsg.id ? 'Unpin' : 'Pin'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsSelectionMode(true);
                              setSelectedMessageIds(new Set([displayMsg.id]));
                              setLongPressedMessage(null);
                            }}
                            className="context-menu-item"
                          >
                            <CheckCheck className="w-4 h-4 text-gray-400" />
                            <span>Select Multiple</span>
                          </button>
                          {isSelf && (
                            <button
                              onClick={() => {
                                handleDeleteMessage(displayMsg.id);
                                setLongPressedMessage(null);
                              }}
                              className="context-menu-item context-menu-item-danger"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      )}

                      <div
                        className={`flex items-end w-full ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Media group bubble container */}
                        <div
                          className={`relative max-w-[75%] rounded-2xl overflow-hidden shadow-md border ${
                            isSelf
                              ? `bg-primary/10 border-primary/20 bubble-self ${
                                  isHighlighted ? 'message-bubble-highlighted-self' : ''
                                }`
                              : `bg-slate-800 border-slate-700/80 bubble-partner ${
                                  isHighlighted ? 'message-bubble-highlighted-partner' : ''
                                }`
                          }`}
                          style={{ padding: '4px' }}
                        >
                          {/* Image Grid Layout */}
                          <div
                            className="grid gap-1 rounded-xl overflow-hidden grid-cols-2"
                            style={{ minWidth: '240px', maxWidth: '300px' }}
                          >
                            {groupMsgs.slice(0, 4).map((msg, gridIdx) => {
                              const isImgSelected = selectedMessageIds.has(msg.id);
                              const showMoreOverlay = gridIdx === 3 && groupMsgs.length > 4;
                              const moreCount = groupMsgs.length - 4;

                              return (
                                <div
                                  key={msg.id}
                                  onMouseDown={(e) => {
                                    if (isSelectionMode) return;
                                    if (e.button === 0) {
                                      clearTimeout(pressTimer.current);
                                      pressTimer.current = setTimeout(() => {
                                        setLongPressedMessage(msg);
                                      }, 500);
                                    }
                                  }}
                                  onMouseUp={() => clearTimeout(pressTimer.current)}
                                  onMouseLeave={() => clearTimeout(pressTimer.current)}
                                  onTouchStart={() => {
                                    if (isSelectionMode) return;
                                    clearTimeout(pressTimer.current);
                                    pressTimer.current = setTimeout(() => {
                                      setLongPressedMessage(msg);
                                    }, 500);
                                  }}
                                  onTouchEnd={() => clearTimeout(pressTimer.current)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelectionMode) {
                                      handleToggleSelectMessage(msg.id);
                                    } else {
                                      setActiveLightboxImage(msg.media_url);
                                    }
                                  }}
                                  className={`relative aspect-square bg-slate-950 overflow-hidden cursor-pointer group/img select-none ${
                                    groupMsgs.length === 3 && gridIdx === 0
                                      ? 'col-span-2 aspect-[2/1]'
                                      : ''
                                  }`}
                                >
                                  {msg.media_type === 'video' ? (
                                    <div className="relative w-full h-full">
                                      <video
                                        src={msg.media_url}
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
                                      />
                                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                        <Play className="w-5 h-5 text-white/90 fill-white/50 drop-shadow" />
                                      </div>
                                    </div>
                                  ) : (
                                    <img
                                      src={msg.media_url}
                                      alt="Batch upload thumbnail"
                                      className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
                                    />
                                  )}

                                  {/* Selection Checkbox Overlay inside grid cell */}
                                  {isSelectionMode && (
                                    <div className="absolute top-2 left-2 z-15">
                                      <div
                                        className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                                          isImgSelected
                                            ? 'bg-primary border-primary text-white'
                                            : 'border-white/70 bg-black/40 text-transparent'
                                        }`}
                                      >
                                        <Check className="w-3 h-3 stroke-[4px]" />
                                      </div>
                                    </div>
                                  )}

                                  {/* Pinned icon indicator on individual image */}
                                  {pinnedMessage?.id === msg.id && (
                                    <div className="absolute top-2 right-2 bg-slate-900/80 px-1.5 py-0.5 rounded-full z-15">
                                      <Pin className="w-3 h-3 text-primary rotate-45" />
                                    </div>
                                  )}

                                  {/* More overlay */}
                                  {showMoreOverlay && (
                                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-white font-extrabold text-sm z-10 backdrop-blur-[1px]">
                                      +{moreCount}
                                    </div>
                                  )}

                                  {/* Single image reactions inside grid cell */}
                                  {msg.reactions &&
                                    Object.keys(msg.reactions).some(
                                      (k) => msg.reactions[k]?.length > 0
                                    ) && (
                                      <div className="absolute bottom-1 right-1 flex items-center space-x-0.5 bg-slate-900/90 border border-slate-800/80 px-1.5 py-0.5 rounded-full text-[8px] z-10">
                                        {Object.keys(msg.reactions).map((emoji) => {
                                          const count = msg.reactions[emoji]?.length || 0;
                                          if (count === 0) return null;
                                          return <span key={emoji}>{emoji}</span>;
                                        })}
                                      </div>
                                    )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Batch Caption / Footer */}
                          <div className="px-2 py-1.5 flex flex-col justify-end space-y-1 select-none">
                            {/* If there's a caption sent on the first image, render it below the grid */}
                            {groupMsgs[0].content && groupMsgs[0].content !== 'Shared a photo' && (
                              <p className="text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap mt-1 text-gray-250">
                                {groupMsgs[0].content}
                              </p>
                            )}

                            {/* Combined Time/Read status footer */}
                            <div className="flex items-center justify-end space-x-1.5 text-[8px] text-text-muted self-end">
                              <span>{getFormattedTime(groupMsgs[0].created_at)}</span>
                              {isSelf && (
                                <span>
                                  {presence.partner === 'online' ? (
                                    presence.partnerRoom === 'Chat Room' ? (
                                      <CheckCheck className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <CheckCheck className="w-3 h-3 text-gray-400" />
                                    )
                                  ) : (
                                    <Check className="w-3 h-3 text-gray-400" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                const msg = item.data;
                const isSelf = msg.user_id === userId;
                const isHighlighted = longPressedMessage?.id === msg.id;

                // ⚡ BOLT OPTIMIZATION: Read precomputed hideHeader instead of parsing Dates on every render
                const hideHeader = item.hideHeader || false;

                // Find quoted reply message
                const quotedMsg = msg.reply_to_message_id
                  ? messages.find((m) => m.id === msg.reply_to_message_id)
                  : null;

                const hasText =
                  msg.content &&
                  msg.media_type !== 'voice' &&
                  msg.content !== 'Shared a photo' &&
                  msg.content !== 'Shared a video' &&
                  msg.content !== 'Attached a fridge item' &&
                  msg.content !== '🎙️ Voice Note';

                const isMediaOnly =
                  (msg.media_type === 'image' ||
                    msg.media_type === 'video' ||
                    msg.media_type === 'document' ||
                    msg.media_type === 'location') &&
                  !hasText &&
                  !msg.fridge_items;

                return (
                  <div
                    key={`msg-${msg.id}`}
                    id={`msg-${msg.id}`}
                    onMouseDown={(e) => {
                      if (isSelectionMode) return;
                      // Only trigger long press on left click
                      if (e.button === 0) {
                        clearTimeout(pressTimer.current);
                        pressTimer.current = setTimeout(() => {
                          setLongPressedMessage(msg);
                        }, 500);
                      }
                    }}
                    onMouseUp={() => clearTimeout(pressTimer.current)}
                    onMouseLeave={() => clearTimeout(pressTimer.current)}
                    onTouchStart={() => {
                      if (isSelectionMode) return;
                      clearTimeout(pressTimer.current);
                      pressTimer.current = setTimeout(() => {
                        setLongPressedMessage(msg);
                      }, 500);
                    }}
                    onTouchEnd={() => clearTimeout(pressTimer.current)}
                    onClick={() => {
                      if (isSelectionMode) {
                        handleToggleSelectMessage(msg.id);
                      }
                    }}
                    className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1 group relative transition-all duration-300 ${
                      hideHeader ? 'mt-0.5' : 'mt-4'
                    } ${isHighlighted ? 'message-bubble-highlighted' : ''}`}
                  >
                    {/* Floating Reactions Tray (W3) */}
                    {isHighlighted && (
                      <div
                        className={`reactions-tray-floating -top-12 ${
                          isSelf ? 'right-0' : 'left-0'
                        }`}
                      >
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              handleToggleReaction(msg, emoji);
                              setLongPressedMessage(null);
                            }}
                            className="reaction-btn"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Floating Context Menu (W3) */}
                    {isHighlighted && (
                      <div
                        className={`context-menu-floating top-full mt-2 ${
                          isSelf ? 'right-0' : 'left-0'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setReplyMessage(msg);
                            setLongPressedMessage(null);
                          }}
                          className="context-menu-item"
                        >
                          <Reply className="w-4 h-4 text-gray-400" />
                          <span>Reply</span>
                        </button>
                        {msg.media_type !== 'voice' && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              setLongPressedMessage(null);
                              dispatch({
                                type: 'SET_GLOBAL_NOTIFICATION',
                                payload: { message: 'Copied to clipboard!', type: 'success' },
                              });
                            }}
                            className="context-menu-item"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                            <span>Copy</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setLongPressedMessage(null);
                            dispatch({
                              type: 'SET_GLOBAL_NOTIFICATION',
                              payload: { message: 'Forwarding coming soon! 🚀', type: 'info' },
                            });
                          }}
                          className="context-menu-item"
                        >
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span>Forward</span>
                        </button>
                        <button
                          onClick={() => {
                            if (pinnedMessage?.id === msg.id) {
                              handleUnpinMessage();
                            } else {
                              handlePinMessage(msg);
                            }
                            setLongPressedMessage(null);
                          }}
                          className="context-menu-item"
                        >
                          <Pin className="w-4 h-4 text-gray-400" />
                          <span>{pinnedMessage?.id === msg.id ? 'Unpin' : 'Pin'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsSelectionMode(true);
                            setSelectedMessageIds(new Set([msg.id]));
                            setLongPressedMessage(null);
                          }}
                          className="context-menu-item"
                        >
                          <CheckCheck className="w-4 h-4 text-gray-400" />
                          <span>Select Multiple</span>
                        </button>
                        {isSelf && (
                          <>
                            {!msg.media_url && (
                              <button
                                onClick={() => {
                                  setEditingMessage(msg);
                                  setEditText(msg.content);
                                  setLongPressedMessage(null);
                                }}
                                className="context-menu-item"
                              >
                                <Edit3 className="w-4 h-4 text-gray-400" />
                                <span>Edit</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleDeleteMessage(msg.id);
                                setLongPressedMessage(null);
                              }}
                              className="context-menu-item context-menu-item-danger"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    <div
                      className={`flex items-end w-full ${isSelf ? 'justify-end' : 'justify-start'}`}
                    >
                      {isSelectionMode && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectMessage(msg.id);
                          }}
                          className="mr-3 flex items-center justify-center cursor-pointer select-none self-center shrink-0"
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              selectedMessageIds.has(msg.id)
                                ? 'bg-primary border-primary text-white'
                                : 'border-slate-650 bg-slate-900/60 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3.5px]" />
                          </div>
                        </div>
                      )}

                      {/* Message Bubble Container */}
                      <div className="flex flex-col relative max-w-[75%]">
                        <div
                          className={`relative ${
                            isMediaOnly
                              ? `bg-transparent border-none shadow-none p-0 ${
                                  isSelf
                                    ? isHighlighted
                                      ? 'message-bubble-highlighted-self rounded-2xl'
                                      : ''
                                    : isHighlighted
                                      ? 'message-bubble-highlighted-partner rounded-2xl'
                                      : ''
                                }`
                              : `p-3 shadow-md ${
                                  isSelf
                                    ? `bg-primary/20 border border-primary/30 text-white bubble-self ${
                                        isHighlighted ? 'message-bubble-highlighted-self' : ''
                                      }`
                                    : `bg-slate-800 border border-slate-700/80 text-white bubble-partner ${
                                        isHighlighted ? 'message-bubble-highlighted-partner' : ''
                                      }`
                                } ${hideHeader ? (isSelf ? 'rounded-tr-2xl' : 'rounded-tl-2xl') : ''}`
                          }`}
                        >
                          {/* Quote Reply display (Telegram-style accent W2) */}
                          {quotedMsg && (
                            <div
                              onClick={() => handleScrollToMessage(quotedMsg.id)}
                              className="mb-2 p-2 bg-slate-950/40 rounded-lg border-l-2 border-primary/80 text-[10px] text-text-muted cursor-pointer hover:bg-slate-950/70 transition-colors flex items-center justify-between"
                            >
                              <div className="truncate">
                                <span className="font-extrabold text-primary block text-[9px] uppercase tracking-wider">
                                  {quotedMsg.user_id === userId
                                    ? 'You'
                                    : partner?.name || 'Partner'}
                                </span>
                                <span className="truncate block mt-0.5 text-gray-300 font-medium">
                                  {quotedMsg.media_type === 'image'
                                    ? '🖼️ Photo'
                                    : quotedMsg.media_type === 'voice'
                                      ? '🎙️ Voice Note'
                                      : quotedMsg.media_type === 'document'
                                        ? '📄 Document'
                                        : quotedMsg.media_type === 'location'
                                          ? '📍 Pinned Location'
                                          : quotedMsg.content}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Tagged Fridge Item reference card */}
                          {msg.fridge_items && (
                            <div
                              onClick={() => handleReferenceClick(msg.fridge_items.id)}
                              className="cursor-pointer"
                            >
                              {msg.fridge_items.type === 'note' &&
                                (() => {
                                  let noteText = '';
                                  let noteColor = 'yellow';
                                  try {
                                    const parsed = JSON.parse(msg.fridge_items.content);
                                    noteText = parsed.text || '';
                                    noteColor = parsed.color || 'yellow';
                                  } catch {
                                    noteText = msg.fridge_items.content;
                                  }
                                  return (
                                    <div
                                      className={`mb-2.5 p-2 bg-slate-950/60 rounded-xl flex items-center space-x-2.5 text-[10px] hover:bg-slate-950 transition-all fridge-accent-card fridge-accent-${noteColor}`}
                                    >
                                      <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-primary shrink-0">
                                        <Tag className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="font-bold text-gray-400 block uppercase tracking-wider text-[8px]">
                                          Linked Fridge Note
                                        </span>
                                        <span className="truncate block font-semibold text-text-main mt-0.5">
                                          {noteText}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })()}

                              {msg.fridge_items.type === 'photo' && (
                                <div className="mb-2.5 p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center space-x-2.5 text-[10px] hover:bg-slate-950 transition-all">
                                  <div className="w-10 h-10 rounded overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                                    <img
                                      src={msg.fridge_items.content}
                                      alt="Fridge preview"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-bold text-gray-400 block uppercase tracking-wider text-[8px]">
                                      Linked Photo Magnet
                                    </span>
                                    <span className="truncate block font-semibold text-text-main mt-0.5">
                                      Polaroid Photo
                                    </span>
                                  </div>
                                </div>
                              )}

                              {msg.fridge_items.type === 'voice' &&
                                (() => {
                                  let voiceDurStr = '';
                                  try {
                                    const parsed = JSON.parse(msg.fridge_items.content);
                                    if (parsed.duration) {
                                      voiceDurStr = `${Math.floor(parsed.duration)}s`;
                                    }
                                  } catch {
                                    // Ignore parsing errors for custom fridge attachments
                                  }
                                  return (
                                    <div className="mb-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center space-x-2.5 text-[10px] hover:bg-slate-950 transition-all">
                                      <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-primary shrink-0">
                                        <Mic className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="font-bold text-gray-400 block uppercase tracking-wider text-[8px]">
                                          Linked Voice Memo {voiceDurStr && `(${voiceDurStr})`}
                                        </span>
                                        <span className="truncate block font-semibold text-text-main mt-0.5">
                                          Voice Magnet
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })()}

                              {msg.fridge_items.type === 'emoji' &&
                                (() => {
                                  const emojiId = msg.fridge_items.content;
                                  const emojiDef = ANIMATED_EMOJIS.find((e) => e.id === emojiId);
                                  const imageUrl = emojiDef ? getEmojiCdnUrl(emojiDef.code) : '';
                                  return (
                                    <div className="mb-2.5 p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center space-x-2.5 text-[10px] hover:bg-slate-950 transition-all">
                                      <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                        {imageUrl ? (
                                          <img
                                            src={imageUrl}
                                            alt="Sticker magnet"
                                            className="w-full h-full object-contain"
                                          />
                                        ) : (
                                          <span className="text-2xl">{emojiId}</span>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="font-bold text-gray-400 block uppercase tracking-wider text-[8px]">
                                          Linked Sticker Magnet
                                        </span>
                                        <span className="truncate block font-semibold text-text-main mt-0.5">
                                          {emojiDef?.label || 'Animated Sticker'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })()}
                            </div>
                          )}

                          {/* Editing panel */}
                          {editingMessage?.id === msg.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-white font-medium"
                              />
                              <div className="flex justify-end space-x-2 text-[10px]">
                                <button
                                  onClick={() => setEditingMessage(null)}
                                  aria-label="Cancel edit"
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-gray-400 font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(msg.id)}
                                  aria-label="Save edit"
                                  className="px-2.5 py-1 rounded bg-primary text-white font-bold"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={
                                isMediaOnly ? 'relative' : 'space-y-2 message-text-container'
                              }
                            >
                              {/* Image Render (Full Bleed borderless W2) */}
                              {msg.media_type === 'image' && msg.media_url && (
                                <div
                                  className={`${
                                    isMediaOnly
                                      ? 'rounded-2xl overflow-hidden max-h-[280px] w-full relative'
                                      : '-mx-3 -mt-3 mb-2 rounded-t-xl overflow-hidden max-h-[220px]'
                                  }`}
                                >
                                  <img
                                    src={msg.media_url}
                                    alt="Shared upload"
                                    className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                    onClick={() => setActiveLightboxImage(msg.media_url)}
                                  />
                                </div>
                              )}

                              {/* Video Render */}
                              {msg.media_type === 'video' && msg.media_url && (
                                <div
                                  className={`${
                                    isMediaOnly
                                      ? 'rounded-2xl overflow-hidden max-h-[350px] w-full relative'
                                      : '-mx-3 -mt-3 mb-2 rounded-t-xl overflow-hidden max-h-[220px]'
                                  }`}
                                >
                                  <video
                                    src={msg.media_url}
                                    controls
                                    playsInline
                                    className="w-full h-full object-cover rounded-2xl max-h-[350px]"
                                  />
                                </div>
                              )}

                              {/* Voice Note Player */}
                              {msg.media_type === 'voice' && msg.media_url && (
                                <VoiceMessagePlayer src={msg.media_url} />
                              )}

                              {/* Document Blocks (W2) */}
                              {msg.media_type === 'document' && (
                                <div className="flex items-center space-x-2.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 min-w-[200px] mb-1">
                                  <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                    <FileText className="w-4.5 h-4.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold text-gray-200 block truncate leading-tight">
                                      {msg.content}
                                    </span>
                                    <span className="text-[9px] text-text-muted font-bold block mt-0.5 leading-none">
                                      9.1 MB • PDF Document
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Location Blocks */}
                              {msg.media_type === 'location' && (
                                <div className="space-y-2 mb-1 min-w-[200px]">
                                  <div className="rounded-lg overflow-hidden border border-slate-800/40 relative">
                                    <div className="bg-slate-950 flex flex-col items-center justify-center p-3 text-center text-[10px] text-text-muted min-h-[90px]">
                                      <MapPin className="w-5 h-5 text-blue-400 mb-1" />
                                      <span className="font-bold text-gray-300">
                                        Shared Location
                                      </span>
                                      <span className="text-[8px] mt-0.5 text-slate-500">
                                        Click to open map
                                      </span>
                                    </div>
                                  </div>
                                  <a
                                    href={msg.media_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-blue-400 hover:underline block"
                                  >
                                    View on Google Maps →
                                  </a>
                                </div>
                              )}

                              {/* Message Text */}
                              {hasText && (
                                <p className="text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap">
                                  {msg.content}
                                </p>
                              )}

                              {(msg.media_type === 'image' || msg.media_type === 'video') &&
                              !hasText ? (
                                <div className="message-media-footer">
                                  {msg.is_edited && <span>edited</span>}
                                  <span>{getFormattedTime(msg.created_at)}</span>
                                  {isSelf && (
                                    <span>
                                      {presence.partner === 'online' ? (
                                        presence.partnerRoom === 'Chat Room' ? (
                                          <CheckCheck className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <CheckCheck className="w-3 h-3 text-gray-400" />
                                        )
                                      ) : (
                                        <Check className="w-3 h-3 text-gray-400" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="message-bubble-footer">
                                  {msg.is_edited && <span>edited</span>}
                                  <span>{getFormattedTime(msg.created_at)}</span>
                                  {isSelf && (
                                    <span>
                                      {presence.partner === 'online' ? (
                                        presence.partnerRoom === 'Chat Room' ? (
                                          <CheckCheck className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <CheckCheck className="w-3 h-3 text-gray-400" />
                                        )
                                      ) : (
                                        <Check className="w-3 h-3 text-gray-400" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Rendered Reaction Emojis Badges (Issue #37) */}
                          {msg.reactions &&
                            Object.keys(msg.reactions).some(
                              (k) => msg.reactions[k]?.length > 0
                            ) && (
                              <div className="absolute -bottom-2.5 right-3 flex items-center space-x-1 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-full text-[9px] z-10 shadow shadow-black">
                                {Object.keys(msg.reactions).map((emoji) => {
                                  const count = msg.reactions[emoji]?.length || 0;
                                  if (count === 0) return null;
                                  const didIReact = msg.reactions[emoji]?.includes(userId);
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => handleToggleReaction(msg, emoji)}
                                      className={`flex items-center space-x-0.5 hover:scale-110 transition-transform ${
                                        didIReact ? 'text-primary' : 'text-gray-400'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      {count > 1 && <span>{count}</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ),
          [
            loading,
            groupedMessages,
            userId,
            partner,
            presence.partner,
            presence.partnerRoom,
            messages,
            editingMessage?.id,
            editText,
            handleReferenceClick,
            handleSaveEdit,
            handleToggleReaction,
            getFormattedTime,
            handleDeleteMessage,
            handleScrollToMessage,
            longPressedMessage,
            dispatch,
            handlePinMessage,
            handleUnpinMessage,
            pinnedMessage,
            handleToggleSelectMessage,
            isSelectionMode,
            selectedMessageIds,
            showUnreadDivider,
          ]
        )}

        {/* 3D Flipping Heart Typing Indicator Coin (Issue #36) */}
        {partnerIsTyping && (
          <div className="flex items-end space-x-2 mt-4 ml-2 select-none">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold font-rounded overflow-hidden">
              {partner?.avatar_url ? (
                <img src={partner.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                'P'
              )}
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl rounded-tl-none typing-coin-container">
              <div className="typing-coin-wrapper">
                <div className="typing-coin-front" />
                <div className="typing-coin-back">
                  <div className="css-heart-glyph" />
                </div>
              </div>
              <div className="typing-coin-wrapper">
                <div className="typing-coin-front" />
                <div className="typing-coin-back">
                  <div className="css-heart-glyph" />
                </div>
              </div>
              <div className="typing-coin-wrapper">
                <div className="typing-coin-front" />
                <div className="typing-coin-back">
                  <div className="css-heart-glyph" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Uploading progress modal */}
      {uploadingMedia && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-2xl text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <LoadingSpinner size="md" className="text-primary" />
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-white">Sending Memories...</h4>
                {uploadProgress ? (
                  <p className="text-[10px] text-text-muted font-bold">
                    Uploading {uploadProgress.current} of {uploadProgress.total} file
                    {uploadProgress.total === 1 ? '' : 's'}
                  </p>
                ) : (
                  <p className="text-[10px] text-text-muted font-bold">Processing voice message</p>
                )}
              </div>
            </div>

            {uploadProgress && (
              <div className="space-y-1">
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                  <div
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    className="bg-primary h-full rounded-full transition-all duration-300"
                  />
                </div>
                <span className="text-[9px] text-text-muted font-mono block text-right">
                  {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pinned Bottom Input Bar (W1) / Batch Selection Actions Bar */}
      {isSelectionMode ? (
        <div className="p-4 bg-slate-900 border-t border-slate-800/60 shrink-0 z-20 flex items-center justify-between animate-slide-up">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedMessageIds(new Set());
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <span className="text-xs font-extrabold text-white">
              {selectedMessageIds.size} Selected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Delete Selected */}
            <button
              onClick={handleDeleteSelectedMessages}
              disabled={selectedMessageIds.size === 0}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            {/* Pin Selected */}
            <button
              onClick={handlePinSelectedMessages}
              disabled={selectedMessageIds.size !== 1}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-850 hover:bg-slate-800 disabled:opacity-50 text-gray-300 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              <Pin className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">Pin</span>
            </button>

            {/* Forward Selected */}
            <button
              onClick={handleForwardSelectedMessages}
              disabled={selectedMessageIds.size === 0}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <ArrowRight className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">Forward</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-900 border-t border-slate-800/60 space-y-2 shrink-0 z-20">
          {/* Active quoted reply bar */}
          {replyMessage && (
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between text-xs animate-slide-up">
              <div className="truncate flex-1">
                <span className="text-primary font-bold block text-[10px] uppercase tracking-wider">
                  Replying to{' '}
                  {replyMessage.user_id === userId ? 'yourself' : partner?.name || 'Partner'}
                </span>
                <p className="truncate text-text-muted mt-0.5 font-medium">
                  {replyMessage.content}
                </p>
              </div>
              <button
                onClick={() => setReplyMessage(null)}
                className="text-text-muted hover:text-text-main p-1 shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Tagged reference item preview bar */}
          {referencedItem && (
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between text-xs animate-slide-up">
              <div className="flex items-center space-x-2 truncate">
                <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px] shrink-0 font-bold font-sans">
                  {referencedItem.type[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <span className="text-gray-300 font-bold block text-[10px] uppercase tracking-wider">
                    Referencing Fridge {referencedItem.type}
                  </span>
                  <p className="truncate text-text-muted mt-0.5 font-medium">
                    {referencedItem.type === 'note'
                      ? JSON.parse(referencedItem.content).text || referencedItem.content
                      : `Uploaded ${referencedItem.type}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReferencedItem(null)}
                className="text-text-muted hover:text-text-main p-1 shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Voice Note Recording / Preview Dashboard (WhatsApp / Telegram style) */}
          {isRecording || audioPreviewUrl ? (
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-full px-4 py-2 w-full animate-slide-up space-x-3">
              {/* Trash Bin / Discard Button */}
              <button
                type="button"
                onClick={discardRecording}
                className="text-text-muted hover:text-red-500 p-2 rounded-full transition-colors flex-shrink-0"
                aria-label="Discard recording"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              {/* Middle Section: Waveform or Preview Player */}
              <div className="flex-1 flex items-center justify-center min-w-0">
                {audioPreviewUrl ? (
                  /* PREVIEW MODE PLAYER */
                  <div className="flex items-center space-x-3 w-full">
                    <button
                      type="button"
                      onClick={handleTogglePreviewPlay}
                      className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center transition-all hover:scale-105"
                      aria-label={audioPreviewPlaying ? 'Pause preview' : 'Play preview'}
                    >
                      {audioPreviewPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    {/* Preview Time Progress Slider */}
                    <div className="flex-1 flex items-center space-x-2">
                      <span className="text-[10px] text-text-muted font-mono">
                        {formatVoiceDuration(audioPreviewCurrentTime)}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={audioPreviewDuration || 1}
                        step="0.05"
                        value={audioPreviewCurrentTime}
                        onChange={(e) => {
                          const newTime = parseFloat(e.target.value);
                          setAudioPreviewCurrentTime(newTime);
                          if (audioPreviewRef.current) {
                            audioPreviewRef.current.currentTime = newTime;
                          }
                        }}
                        className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <span className="text-[10px] text-text-muted font-mono">
                        {formatVoiceDuration(audioPreviewDuration)}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* ACTIVE RECORDING MODE */
                  <div className="flex items-center space-x-3 w-full">
                    {/* Timer & Pulsing Dot */}
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full bg-red-500 ${isRecordingPaused ? '' : 'animate-pulse'}`}
                      />
                      <span className="text-xs font-bold text-gray-200 font-mono">
                        {formatVoiceDuration(recordDuration)}
                      </span>
                    </div>

                    {/* Active Recording Animated Dynamic Waveform */}
                    <div className="flex-1 h-8 flex items-center justify-center space-x-[3px] overflow-hidden select-none">
                      {recordLevels.length === 0 ? (
                        <div className="text-[10px] text-text-muted tracking-wider uppercase font-bold animate-pulse">
                          Say something...
                        </div>
                      ) : (
                        (() => {
                          const mirrored = [...recordLevels]
                            .reverse()
                            .concat(recordLevels.slice(1));
                          return mirrored.map((lvl, index) => (
                            <div
                              key={`rec-wave-${index}`}
                              style={{ height: `${lvl}px` }}
                              className="w-[5px] bg-primary rounded-full transition-all duration-75 shrink-0"
                            />
                          ));
                        })()
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Buttons: Pause/Resume, Stop/Preview, Send */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {audioPreviewUrl ? (
                  /* Preview Send Button */
                  <button
                    type="button"
                    onClick={sendRecording}
                    className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center text-white shadow-lg transition-all hover:scale-105"
                    aria-label="Send voice note"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                ) : (
                  /* Active Recording Controls */
                  <>
                    {/* Pause / Resume button */}
                    <button
                      type="button"
                      onClick={isRecordingPaused ? resumeRecording : pauseRecording}
                      className="w-8 h-8 rounded-full border border-slate-700/60 text-text-muted hover:text-text-main flex items-center justify-center transition-colors"
                      aria-label={isRecordingPaused ? 'Resume recording' : 'Pause recording'}
                    >
                      {isRecordingPaused ? (
                        <Play className="w-4 h-4 fill-current" />
                      ) : (
                        <Pause className="w-4 h-4" />
                      )}
                    </button>

                    {/* Stop and Listen (Preview) Button */}
                    <button
                      type="button"
                      onClick={stopRecordingAndPreview}
                      className="w-8 h-8 rounded-full bg-slate-800 text-text-main hover:bg-slate-700 flex items-center justify-center transition-colors"
                      aria-label="Stop and preview voice note"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Immediate Send Button */}
                    <button
                      type="button"
                      onClick={sendRecordingImmediately}
                      className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center text-white shadow-lg transition-all hover:scale-105"
                      aria-label="Send immediately"
                    >
                      <Send className="w-4.5 h-4.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* STANDARD FORM */
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2 relative">
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageSelected}
                accept="image/*,video/*"
                multiple
                className="hidden"
              />

              {/* Attachment options trigger button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowItemSelector(!showItemSelector)}
                  className={`w-10 h-10 rounded-full border border-slate-700/60 flex items-center justify-center text-text-muted hover:text-text-main transition-colors ${
                    showItemSelector ? 'bg-slate-800 text-text-main' : ''
                  }`}
                  aria-label="Add attachment"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>

              {/* Text message Input field */}
              <input
                type="text"
                value={newMessageText}
                onChange={handleInputChange}
                placeholder="Message your partner..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-full h-10 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-white font-medium"
              />

              {/* Microphone VN recording toggle button */}
              <button
                type="button"
                onClick={startRecording}
                className="w-10 h-10 rounded-full border border-slate-700/60 flex items-center justify-center transition-colors text-text-muted hover:text-text-main shrink-0"
                aria-label="Record voice note"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Send text button */}
              <button
                type="submit"
                disabled={!newMessageText.trim() && !referencedItem}
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary flex items-center justify-center text-white shadow-lg transition-all shrink-0 hover:scale-105"
                aria-label="Send message"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Sliding Bottom Sheet Attachment Menu (W4) */}
      {showItemSelector && (
        <div className="bottom-sheet-container">
          <div className="bottom-sheet-backdrop" onClick={() => setShowItemSelector(false)} />
          <div className="bottom-sheet-panel max-w-[460px] max-h-[70vh] overflow-y-auto">
            <div className="bottom-sheet-drag-handle" onClick={() => setShowItemSelector(false)} />

            {/* 3x3 Grid: Gallery Trigger + 8 Most Recent Fridge Items */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2.5">
                Recent Fridge Items
              </span>
              <div className="grid grid-cols-3 gap-2">
                {/* Slot 1: Gallery Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    triggerImageSelect();
                    setShowItemSelector(false);
                  }}
                  className="aspect-square bg-slate-800/80 rounded-xl hover:bg-slate-700 transition-colors flex flex-col items-center justify-center text-text-muted hover:text-text-main gap-1.5"
                >
                  <Image className="w-5 h-5 text-emerald-500" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Gallery</span>
                </button>

                {/* Slots 2-9: First 8 Fridge Items */}
                {fridgeItems.slice(0, 8).map((item) => {
                  let textPreview = '';
                  let noteColor = 'yellow';

                  if (item.type === 'note') {
                    try {
                      const parsed = JSON.parse(item.content);
                      textPreview = parsed.text || '';
                      noteColor = parsed.color || 'yellow';
                    } catch {
                      textPreview = item.content;
                    }
                  } else if (item.type === 'photo') {
                    textPreview = 'Photo';
                  } else if (item.type === 'voice') {
                    textPreview = 'Voice';
                  } else if (item.type === 'emoji') {
                    textPreview = 'Sticker';
                  }

                  // Note style mappings
                  const colorBg =
                    item.type === 'note'
                      ? noteColor === 'yellow'
                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                        : noteColor === 'blue'
                          ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                          : noteColor === 'pink'
                            ? 'bg-pink-500/20 border-pink-500/30 text-pink-300'
                            : noteColor === 'green'
                              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                              : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                      : '';

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setReferencedItem(item);
                        setShowItemSelector(false);
                      }}
                      className={`aspect-square rounded-xl overflow-hidden border flex flex-col justify-between p-2 text-left relative group hover:scale-[1.03] transition-transform duration-200 ${
                        item.type === 'photo'
                          ? 'bg-slate-900 border-slate-800'
                          : item.type === 'note'
                            ? colorBg
                            : item.type === 'voice'
                              ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300'
                              : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      {item.type === 'photo' ? (
                        <img
                          src={item.content}
                          alt="Fridge thumb"
                          className="absolute inset-0 w-full h-full object-cover rounded-xl"
                        />
                      ) : item.type === 'emoji' ? (
                        (() => {
                          const emojiDef = ANIMATED_EMOJIS.find((e) => e.id === item.content);
                          const imageUrl = emojiDef ? getEmojiCdnUrl(emojiDef.code) : '';
                          return (
                            <div className="absolute inset-0 flex items-center justify-center p-2">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt="Sticker"
                                  className="w-8 h-8 object-contain"
                                />
                              ) : (
                                <span className="text-lg">✨</span>
                              )}
                            </div>
                          );
                        })()
                      ) : item.type === 'voice' ? (
                        <>
                          <div className="flex-grow flex items-center justify-center">
                            <Mic className="w-5 h-5 text-indigo-400" />
                          </div>
                          <span className="text-[7px] font-bold opacity-60 uppercase self-end">
                            Voice
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[8px] leading-tight font-medium overflow-hidden line-clamp-3 break-words font-rounded">
                            {textPreview}
                          </span>
                          <span className="text-[7px] font-bold opacity-60 uppercase self-end">
                            Note
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Grid (2x3 Grid of circular action icons) - Rendered below the top grid */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2.5">
                Actions
              </span>
              <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowItemSelector(false);
                    dispatch({
                      type: 'SET_GLOBAL_NOTIFICATION',
                      payload: { message: 'Camera access not supported on desktop.', type: 'info' },
                    });
                  }}
                  className="flex flex-col items-center gap-1.5 focus:outline-none group"
                >
                  <div className="w-12 h-12 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowItemSelector(false);
                    simulateSendDocument();
                  }}
                  className="flex flex-col items-center gap-1.5 focus:outline-none group"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">Document</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowItemSelector(false);
                    simulateSendLocation();
                  }}
                  className="flex flex-col items-center gap-1.5 focus:outline-none group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:scale-105 transition-transform">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">Location</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowItemSelector(false);
                    dispatch({
                      type: 'SET_GLOBAL_NOTIFICATION',
                      payload: { message: 'Contacts integration coming soon!', type: 'info' },
                    });
                  }}
                  className="flex flex-col items-center gap-1.5 focus:outline-none group"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 hover:scale-105 transition-transform">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">Contact</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowItemSelector(false);
                    dispatch({
                      type: 'SET_GLOBAL_NOTIFICATION',
                      payload: { message: 'Polls coming soon!', type: 'info' },
                    });
                  }}
                  className="flex flex-col items-center gap-1.5 focus:outline-none group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-300">Poll</span>
                </button>
              </div>
            </div>

            {/* Tag Fridge Item Section inside Bottom Sheet - Rendered at the Bottom */}
            <div className="border-t border-slate-800/80 pt-4">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2.5">
                Link Fridge Items
              </span>
              <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-[11px]">
                {fridgeItems.length === 0 ? (
                  <p className="text-center text-[10px] text-text-muted py-2">
                    No fridge items found to tag.
                  </p>
                ) : (
                  fridgeItems.map((item) => {
                    let textPreview = '';
                    let itemEmoji = '📌';
                    let noteColor = 'yellow';
                    let subtext = '';

                    const formatTime = (dateStr) => {
                      const d = new Date(dateStr);
                      return d.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    };

                    if (item.type === 'note') {
                      itemEmoji = '📝';
                      try {
                        const parsed = JSON.parse(item.content);
                        textPreview = parsed.text || '';
                        noteColor = parsed.color || 'yellow';
                      } catch {
                        textPreview = item.content;
                      }
                      subtext = `Sticky Note • ${formatTime(item.created_at)}`;
                    } else if (item.type === 'photo') {
                      itemEmoji = '🖼️';
                      textPreview = 'Polaroid Photo';
                      subtext = `Photo magnet • ${formatTime(item.created_at)}`;
                    } else if (item.type === 'voice') {
                      itemEmoji = '🎙️';
                      textPreview = 'Voice Memo';
                      let voiceDur = '';
                      try {
                        const parsed = JSON.parse(item.content);
                        if (parsed.duration) {
                          voiceDur = `(${Math.round(parsed.duration)}s)`;
                        }
                      } catch {
                        // ignore parsing error
                      }
                      subtext = `Voice magnet ${voiceDur} • ${formatTime(item.created_at)}`;
                    } else if (item.type === 'emoji') {
                      itemEmoji = '✨';
                      textPreview = `Emoji sticker`;
                      subtext = `sticker • ${formatTime(item.created_at)}`;
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setReferencedItem(item);
                          setShowItemSelector(false);
                        }}
                        className={`flex items-center space-x-2.5 w-full text-left p-2 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-850 text-gray-300 truncate ${
                          item.type === 'note'
                            ? `fridge-accent-card fridge-accent-${noteColor}`
                            : ''
                        }`}
                      >
                        {item.type === 'photo' ? (
                          <div className="w-8 h-8 rounded overflow-hidden bg-slate-950 shrink-0 border border-slate-800/80">
                            <img
                              src={item.content}
                              alt="Fridge thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-sm shrink-0">{itemEmoji}</span>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className="truncate font-semibold text-gray-200 text-xs">
                            {textPreview}
                          </span>
                          <span className="truncate text-gray-400 text-[9px] mt-0.5">
                            {subtext}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-scale-up">
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-white">Delete Message?</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Are you sure you want to delete this message? This action will delete the message
                for everyone and cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setMessageToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-text-main hover:bg-slate-800/60 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const mId = messageToDelete;
                  setMessageToDelete(null);
                  try {
                    const { error } = await supabase.from('messages').delete().eq('id', mId);
                    if (error) throw error;
                  } catch (err) {
                    console.error('Failed to delete message:', err);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950/40"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Batch Preview & Captioning Stage */}
      {pendingMediaFiles.length > 0 && (
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
            {/* Show selected image/video as active preview (overflow-visible, no grey box) */}
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
                        {/* 3x3 Grid Overlay */}
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

                        {/* WhatsApp/Telegram L-shaped thick corners */}
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
                    {/* Aspect Ratio Presets */}
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

                    {/* Dedicated crop controls bottom bar */}
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
                    const activeItem =
                      pendingMediaFiles[activePreviewIndex] || pendingMediaFiles[0];
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
                {/* Add more button */}
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
      )}

      {/* Lightbox Modal Overlay */}
      {activeLightboxImage && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col justify-between animate-fade-in select-none">
          {/* Header */}
          {(() => {
            const isVideo = activeLightboxImage.match(/\.(mp4|webm|mov|ogg|m4v)/i);
            return (
              <>
                <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                  <span className="text-xs font-bold text-gray-300">
                    {isVideo ? 'Shared Video' : 'Shared Photo'}
                  </span>
                  <button
                    onClick={() => setActiveLightboxImage(null)}
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    aria-label="Close lightbox"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Media */}
                <div
                  className="flex-1 flex items-center justify-center p-4 cursor-zoom-out"
                  onClick={() => setActiveLightboxImage(null)}
                >
                  {isVideo ? (
                    <video
                      src={activeLightboxImage}
                      controls
                      autoPlay
                      className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <img
                      src={activeLightboxImage}
                      alt="Shared details"
                      className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 hover:scale-[1.01]"
                    />
                  )}
                </div>

                {/* Footer controls */}
                <div className="p-6 flex justify-center space-x-6 bg-gradient-to-t from-black/80 to-transparent">
                  <button
                    onClick={() => handleDownloadImage(activeLightboxImage)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full text-xs font-bold transition-all border border-white/10 flex items-center space-x-1.5"
                  >
                    <span>{isVideo ? 'Download Video' : 'Download Image'}</span>
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </motion.div>
  );
}
