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
/* eslint-disable react-hooks/refs */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Loader2,
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
} from 'lucide-react';
import { useAppContext, useAppDispatch } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { getFridgeItems } from '../../services/fridge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ANIMATED_EMOJIS, getEmojiCdnUrl } from '../fridge/components/emojiData';
import { compressImage } from '../../utils/compression';

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
    <div className="flex items-center space-x-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 min-w-[200px]">
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
          className="flex items-center space-x-[2px] h-8 cursor-pointer select-none py-1"
        >
          {WAVEFORM_BARS.map((height, i) => {
            const progress = duration ? currentTime / duration : 0;
            const barProgressThreshold = i / WAVEFORM_BARS.length;
            const isFilled = progress > barProgressThreshold;
            return (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`w-[3px] rounded-full transition-colors duration-150 ${
                  isFilled ? 'bg-primary' : 'bg-slate-700'
                }`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-text-muted mt-1 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
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

  // Long-press interactions state
  const [longPressedMessage, setLongPressedMessage] = useState(null);
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
    }, 2500);
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

  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);

  // Voice note recorder state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  // Uploads photo and sends as message
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    setUploadingMedia(true);
    const randId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    const sanitizedBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `chat/${userId}/${Date.now()}_${randId}_${sanitizedBase}.webp`;

    try {
      // Compress the image client-side to WebP format at 0.5 quality for maximum compression size savings
      const compressedBlob = await compressImage(file, 1024, 0.5);

      // Upload to storage with correct content type
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, compressedBlob, { contentType: 'image/webp' });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Send image message
      const { error: dbError } = await supabase.from('messages').insert({
        user_id: userId,
        content: 'Shared a photo',
        media_url: publicUrl,
        media_type: 'image',
        reply_to_message_id: replyMessage?.id || null,
      });

      if (dbError) throw dbError;
      setReplyMessage(null);
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingMedia(false);
    }
  };

  // Starts Voice Note Recording
  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadVoiceNote(audioBlob);

        // Stop all track feeds
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Could not access microphone for voice recording.');
    }
  };

  // Stops voice recording
  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  // Uploads recorded voice note blob and sends as message
  const uploadVoiceNote = async (audioBlob) => {
    setUploadingMedia(true);
    const randId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    const filePath = `chat/${userId}/${Date.now()}_${randId}_voicenote.webm`;

    try {
      // Upload blob
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, audioBlob, { contentType: 'audio/webm' });
      if (uploadError) throw uploadError;

      // Get URL
      const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Send voice message
      const { error: dbError } = await supabase.from('messages').insert({
        user_id: userId,
        content: '🎙️ Voice Note',
        media_url: publicUrl,
        media_type: 'voice',
        reply_to_message_id: replyMessage?.id || null,
      });

      if (dbError) throw dbError;
      setReplyMessage(null);
    } catch (err) {
      console.error('Failed to upload voice note:', err);
    } finally {
      setUploadingMedia(false);
    }
  };

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
  const handleDeleteMessage = useCallback(async (mId) => {
    if (!confirm('Delete this message for everyone?')) return;
    try {
      const { error } = await supabase.from('messages').delete().eq('id', mId);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
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

      // ⚡ BOLT OPTIMIZATION: Compute hideHeader here instead of in the render loop
      let hideHeader = false;
      if (!isFirstMessageOfDay && prevMsg) {
        const diffTime = (msgTime - prevMsgTime) / 1000;
        if (prevMsg.user_id === msg.user_id && diffTime < 120) {
          hideHeader = true;
        }
      }

      groups.push({ type: 'message', data: msg, hideHeader });

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

  // Scrolls message into view when replying to it
  const handleScrollToMessage = useCallback((mId) => {
    const el = document.getElementById(`msg-${mId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.classList.add('animate-pulse-gold');
    setTimeout(() => el?.classList.remove('animate-pulse-gold'), 2000);
  }, []);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col h-full w-full bg-slate-950 text-white relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.95)), url('/board-chat-bg.png')`,
        backgroundSize: 'cover',
      }}
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
                  msg.content !== 'Shared a photo' &&
                  msg.content !== 'Attached a fridge item' &&
                  msg.content !== '🎙️ Voice Note';

                const isMediaOnly =
                  (msg.media_type === 'image' ||
                    msg.media_type === 'document' ||
                    msg.media_type === 'location') &&
                  !hasText &&
                  !msg.fridge_items;

                return (
                  <div
                    key={`msg-${msg.id}`}
                    id={`msg-${msg.id}`}
                    onMouseDown={(e) => {
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
                      clearTimeout(pressTimer.current);
                      pressTimer.current = setTimeout(() => {
                        setLongPressedMessage(msg);
                      }, 500);
                    }}
                    onTouchEnd={() => clearTimeout(pressTimer.current)}
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

                    {/* Sender Tag */}
                    {!isSelf && !hideHeader && (
                      <span className="text-[10px] font-bold text-primary font-rounded mb-0.5 ml-2.5">
                        {partner?.name || 'Partner'}
                      </span>
                    )}

                    <div
                      className={`flex items-end space-x-2 ${isSelf ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      {!hideHeader ? (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold font-rounded">
                          {isSelf ? (
                            user?.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt="avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              'Y'
                            )
                          ) : partner?.avatar_url ? (
                            <img
                              src={partner.avatar_url}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            'P'
                          )}
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )}

                      {/* Message Bubble Container */}
                      <div className="flex flex-col relative max-w-[280px] xs:max-w-[320px] sm:max-w-[420px]">
                        <div
                          className={`relative shadow-lg ${
                            isMediaOnly
                              ? `rounded-2xl ${
                                  isSelf
                                    ? `bg-slate-900/40 border border-slate-800/40 text-white ${
                                        isHighlighted ? 'message-bubble-highlighted-self' : ''
                                      }`
                                    : `bg-slate-900 border border-slate-850 text-gray-205 ${
                                        isHighlighted ? 'message-bubble-highlighted-partner' : ''
                                      }`
                                } ${msg.media_type === 'image' ? 'p-0.5' : 'p-2'}`
                              : `p-3 ${
                                  isSelf
                                    ? `bg-primary/20 border border-primary/30 text-white bubble-self ${
                                        isHighlighted ? 'message-bubble-highlighted-self' : ''
                                      }`
                                    : `bg-slate-900 border border-slate-805 text-gray-210 bubble-partner ${
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
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-gray-400 font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(msg.id)}
                                  className="px-2.5 py-1 rounded bg-primary text-white font-bold"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 message-text-container">
                              {/* Image Render (Full Bleed borderless W2) */}
                              {msg.media_type === 'image' && msg.media_url && (
                                <div className="-mx-3 -mt-3 mb-2 rounded-t-xl overflow-hidden max-h-[220px]">
                                  <img
                                    src={msg.media_url}
                                    alt="Shared upload"
                                    className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                    onClick={() => window.open(msg.media_url, '_blank')}
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

                              {/* Embedded footer inside bubble (WhatsApp-style W1/W2) */}
                              {msg.media_type === 'image' && !hasText ? (
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
            user,
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

      {/* Uploading indicator overlay */}
      {uploadingMedia && (
        <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center z-[80] space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-xs text-text-main font-bold">Uploading file...</span>
        </div>
      )}

      {/* Pinned Bottom Input Bar (W1) */}
      <div className="p-4 bg-slate-900 border-t border-slate-800/60 space-y-2 shrink-0 z-20">
        {/* Active quoted reply bar */}
        {replyMessage && (
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-center justify-between text-xs animate-slide-up">
            <div className="truncate flex-1">
              <span className="text-primary font-bold block text-[10px] uppercase tracking-wider">
                Replying to{' '}
                {replyMessage.user_id === userId ? 'yourself' : partner?.name || 'Partner'}
              </span>
              <p className="truncate text-text-muted mt-0.5 font-medium">{replyMessage.content}</p>
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

        {/* Main form & Attachment controls */}
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 relative">
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageUpload}
            accept="image/*"
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
            placeholder={isRecording ? 'Recording voice message...' : 'Message your partner...'}
            disabled={isRecording}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-full h-10 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-white font-medium"
          />

          {/* Microphone VN recording toggle button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-10 h-10 rounded-full border border-slate-700/60 flex items-center justify-center transition-colors shrink-0 ${
              isRecording
                ? 'bg-red-500 border-red-500 text-white animate-pulse'
                : 'text-text-muted hover:text-text-main'
            }`}
            aria-label={isRecording ? 'Stop recording voice note' : 'Record voice note'}
          >
            {isRecording ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
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
      </div>

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
    </motion.div>
  );
}
