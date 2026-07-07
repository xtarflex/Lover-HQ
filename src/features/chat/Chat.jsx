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
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { getFridgeItems } from '../../services/fridge';
import { LoadingSpinner } from '../../components/LoadingSpinner';

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
  const navigate = useNavigate();
  const userId = user?.id;
  const partnerId = partner?.id;

  /** stable unique key representing couple */
  const coupleKey = useMemo(() => {
    if (!userId || !partnerId) return null;
    return [userId, partnerId].sort().join('_');
  }, [userId, partnerId]);

  const [messages, setMessages] = useState([]);
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
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current);
    };
  }, [coupleKey, partnerId, fetchChatHistory, fetchFridgeItemsList, scrollToBottom]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds the 5MB limit.');
      return;
    }

    setUploadingMedia(true);
    const filePath = `chat/${userId}/${Date.now()}_${file.name}`;

    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('fridge-media')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('fridge-media').getPublicUrl(filePath);
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
    const filePath = `chat/${userId}/${Date.now()}_voicenote.webm`;

    try {
      // Upload blob
      const { error: uploadError } = await supabase.storage
        .from('fridge-media')
        .upload(filePath, audioBlob, { contentType: 'audio/webm' });
      if (uploadError) throw uploadError;

      // Get URL
      const { data } = supabase.storage.from('fridge-media').getPublicUrl(filePath);
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

  // Group messages by date headings
  const groupedMessages = useMemo(() => {
    // ⚡ BOLT OPTIMIZATION: Instantiate Date objects once outside the loop
    // to prevent O(N) object creation on every render (e.g. typing keystrokes).
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const todayString = today.toDateString();
    const yesterdayString = yesterday.toDateString();

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
  }, [messages]);

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
      className="flex flex-col h-[calc(100vh-5rem)] bg-slate-950 text-white relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.95)), url('/board-chat-bg.png')`,
        backgroundSize: 'cover',
      }}
    >
      {/* Sub Header for status indicators */}
      <div className="bg-slate-900/60 backdrop-blur border-b border-slate-800/60 px-4 py-2 flex items-center justify-between text-xs text-text-muted z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${
              partnerIsTyping
                ? 'bg-amber-500 animate-ping'
                : presence.partner === 'online'
                  ? 'bg-emerald-500'
                  : 'bg-slate-500'
            }`}
          />
          <span className="font-rounded font-bold text-gray-300">
            {partnerIsTyping
              ? `${partner?.name || 'Partner'} is typing...`
              : presence.partner === 'online'
                ? `${partner?.name || 'Partner'} is in the ${presence.partnerRoom || 'app'}`
                : `${partner?.name || 'Partner'} is offline`}
          </span>
        </div>
        {partnerIsTyping && (
          <div className="flex space-x-0.5 items-center">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[bounce_0.8s_infinite_100ms]" />
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[bounce_0.8s_infinite_300ms]" />
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[bounce_0.8s_infinite_500ms]" />
          </div>
        )}
      </div>

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

                // ⚡ BOLT OPTIMIZATION: Read precomputed hideHeader instead of parsing Dates on every render
                const hideHeader = item.hideHeader || false;

                // Find quoted reply message
                const quotedMsg = msg.reply_to_message_id
                  ? messages.find((m) => m.id === msg.reply_to_message_id)
                  : null;

                return (
                  <div
                    key={`msg-${msg.id}`}
                    id={`msg-${msg.id}`}
                    className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1 group relative transition-all duration-300 ${
                      hideHeader ? 'mt-0.5' : 'mt-4'
                    }`}
                  >
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
                          className={`p-3 rounded-2xl relative shadow-lg ${
                            isSelf
                              ? 'bg-primary/20 border border-primary/30 text-white rounded-tr-none'
                              : 'bg-slate-900 border border-slate-800/80 text-gray-200 rounded-tl-none'
                          } ${hideHeader ? (isSelf ? 'rounded-tr-2xl' : 'rounded-tl-2xl') : ''}`}
                        >
                          {/* Quote Reply display */}
                          {quotedMsg && (
                            <div
                              onClick={() => handleScrollToMessage(quotedMsg.id)}
                              className="mb-2 p-2 bg-slate-950/50 rounded-lg border-l-4 border-primary text-[10px] text-text-muted cursor-pointer hover:bg-slate-950/70 transition-colors flex items-center justify-between"
                            >
                              <div className="truncate">
                                <span className="font-extrabold text-primary block">
                                  {quotedMsg.user_id === userId
                                    ? 'You'
                                    : partner?.name || 'Partner'}
                                </span>
                                <span className="truncate block mt-0.5">{quotedMsg.content}</span>
                              </div>
                            </div>
                          )}

                          {/* Tagged Fridge Item reference card */}
                          {msg.fridge_items && (
                            <div
                              onClick={() => handleReferenceClick(msg.fridge_items.id)}
                              className="mb-2.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center space-x-2 text-[10px] cursor-pointer hover:bg-slate-950 hover:border-slate-700 transition-all"
                            >
                              <div className="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-primary">
                                <Tag className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-gray-300 block uppercase tracking-wider text-[8px]">
                                  Tagged Fridge {msg.fridge_items.type}
                                </span>
                                <span className="truncate block font-semibold text-text-main mt-0.5">
                                  {msg.fridge_items.type === 'note'
                                    ? msg.fridge_items.content
                                    : msg.fridge_items.type === 'photo'
                                      ? 'Image Magnet'
                                      : 'Voice Memo'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Editing panel */}
                          {editingMessage?.id === msg.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-white"
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
                            <div className="space-y-2">
                              {/* Image Render */}
                              {msg.media_type === 'image' && msg.media_url && (
                                <div className="rounded-lg overflow-hidden border border-slate-800/40 max-h-[220px]">
                                  <img
                                    src={msg.media_url}
                                    alt="Shared upload"
                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-all duration-300"
                                    onClick={() => window.open(msg.media_url, '_blank')}
                                  />
                                </div>
                              )}

                              {/* Voice Note Player */}
                              {msg.media_type === 'voice' && msg.media_url && (
                                <VoiceMessagePlayer src={msg.media_url} />
                              )}

                              {/* Message Text */}
                              <p className="text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            </div>
                          )}

                          {/* Bubble footer (Timestamp, Read double check, Edited indicator) */}
                          <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] text-text-muted font-mono leading-none">
                            {msg.is_edited && <span>edited</span>}
                            <span>{getFormattedTime(msg.created_at)}</span>
                            {isSelf && (
                              <span>
                                {presence.partner === 'online' ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </span>
                            )}
                          </div>

                          {/* Rendered Reaction Emojis Badges */}
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

                        {/* Message hover menu controls (Reply, React, Edit, Delete) */}
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 px-2 z-10 ${
                            isSelf ? 'right-full' : 'left-full'
                          }`}
                        >
                          {/* React trigger */}
                          <div className="relative group/reactions">
                            <button
                              aria-label="React"
                              className="p-1 rounded-full bg-slate-900 border border-slate-800 text-text-muted hover:text-text-main shadow hover:scale-105"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/reactions:flex items-center space-x-1 bg-slate-950 border border-slate-800 p-1 rounded-full shadow-xl z-[90]">
                              {EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleToggleReaction(msg, emoji)}
                                  className="text-xs hover:scale-125 transition-transform p-0.5"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Reply trigger */}
                          <button
                            onClick={() => setReplyMessage(msg)}
                            aria-label="Reply"
                            className="p-1 rounded-full bg-slate-900 border border-slate-800 text-text-muted hover:text-text-main shadow hover:scale-105"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit own text message */}
                          {isSelf && !msg.media_url && (
                            <button
                              onClick={() => {
                                setEditingMessage(msg);
                                setEditText(msg.content);
                              }}
                              aria-label="Edit"
                              className="p-1 rounded-full bg-slate-900 border border-slate-800 text-text-muted hover:text-text-main shadow hover:scale-105"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete own message */}
                          {isSelf && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              aria-label="Delete"
                              className="p-1 rounded-full bg-slate-900 border border-slate-800 text-text-muted hover:text-red-500 shadow hover:scale-105"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
            messages,
            editingMessage?.id,
            editText,
            handleReferenceClick,
            handleSaveEdit,
            handleToggleReaction,
            getFormattedTime,
            handleDeleteMessage,
            handleScrollToMessage,
          ]
        )}

        {/* Pulsing Side Typing indicator bubble */}
        {partnerIsTyping && (
          <div className="flex items-end space-x-2 mt-4 ml-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold font-rounded overflow-hidden">
              {partner?.avatar_url ? (
                <img src={partner.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                'P'
              )}
            </div>
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl rounded-tl-none flex items-center space-x-1">
              <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce [animation-delay:0.4s]" />
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

      {/* Bottom inputs bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800/60 space-y-2 shrink-0 z-20">
        {/* Active quoted reply bar */}
        {replyMessage && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs animate-slide-up">
            <div className="truncate flex-1">
              <span className="text-primary font-bold block text-[10px] uppercase tracking-wider">
                Replying to{' '}
                {replyMessage.user_id === userId ? 'yourself' : partner?.name || 'Partner'}
              </span>
              <p className="truncate text-text-muted mt-0.5">{replyMessage.content}</p>
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
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs animate-slide-up">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px] shrink-0 font-bold font-sans">
                {referencedItem.type[0].toUpperCase()}
              </div>
              <div className="truncate">
                <span className="text-gray-300 font-bold block text-[10px] uppercase tracking-wider">
                  Referencing Fridge {referencedItem.type}
                </span>
                <p className="truncate text-text-muted mt-0.5">
                  {referencedItem.type === 'note'
                    ? referencedItem.content
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

            {/* Float Popover Selector */}
            {showItemSelector && (
              <div className="absolute bottom-full left-0 mb-3 bg-slate-950 border border-slate-800 p-3 rounded-2xl w-[260px] shadow-2xl z-30 space-y-3 animate-slide-up">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    Add Reference
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowItemSelector(false)}
                    className="text-text-muted hover:text-text-main"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Photo selector shortcut */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerImageSelect();
                      setShowItemSelector(false);
                    }}
                    className="flex items-center space-x-2 w-full text-left p-2 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-text-main transition-all"
                  >
                    <Image className="w-4 h-4 text-emerald-500" />
                    <span>Upload Photo</span>
                  </button>

                  {/* List of select-to-tag Fridge items */}
                  <div>
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Link Fridge Items
                    </span>
                    <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 custom-scrollbar text-[11px]">
                      {fridgeItems.length === 0 ? (
                        <p className="text-center text-[10px] text-text-muted py-2">
                          No fridge items found to tag.
                        </p>
                      ) : (
                        fridgeItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setReferencedItem(item);
                              setShowItemSelector(false);
                            }}
                            className="flex items-center space-x-1.5 w-full text-left p-1.5 rounded-lg bg-slate-900/30 hover:bg-slate-900 text-gray-300 truncate"
                          >
                            <span className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-primary text-[8px] font-bold shrink-0 font-sans">
                              {item.type[0].toUpperCase()}
                            </span>
                            <span className="truncate flex-1">
                              {item.type === 'note' ? item.content : `Magnet ${item.type}`}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
    </motion.div>
  );
}
