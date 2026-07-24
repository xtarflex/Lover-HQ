/**
 * @file Chat.jsx
 * @description Dedicated, full-screen Chat screen for Lover-HQ.
 * Refactored Orchestrator Component.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext, useAppDispatch } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { getFridgeItems } from '../../services/fridge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getFormattedTime } from '../../utils/time';

// Custom Hooks
import { useChatMessages } from './hooks/useChatMessages';
import { useChatTyping } from './hooks/useChatTyping';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import { useMediaUploader } from './hooks/useMediaUploader';
import { usePinnedMessage } from './hooks/usePinnedMessage';
import { useChatBatchSelect } from './hooks/useChatBatchSelect';
import { usePartnerPresence } from './hooks/usePartnerPresence';
import { groupChatMessages } from './utils/messageGrouping';

// Extracted UI Sub-components
import { ChatHeader } from './components/ChatHeader';
import { PinnedMessageBanner } from './components/PinnedMessageBanner';
import { MessageList } from './components/MessageList';
import { BatchActionBar } from './components/BatchActionBar';
import { ReplyPreview } from './components/ReplyPreview';
import { ReferencedItemPreview } from './components/ReferencedItemPreview';
import { VoiceRecorderBar } from './components/VoiceRecorderBar';
import { ChatInputForm } from './components/ChatInputForm';
import { AttachmentBottomSheet } from './components/AttachmentBottomSheet';
import { DeleteMessageModal } from './components/DeleteMessageModal';
import { MediaPreviewSheet } from './components/MediaPreviewSheet';
import { ImageLightbox } from './components/ImageLightbox';

/**
 * Stateful Chat Screen Orchestrator component.
 *
 * @returns {React.ReactElement}
 */
export default function Chat() {
  const { user, partner, presence } = useAppContext();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const userId = user?.id;
  const partnerId = partner?.id;

  const [newMessageText, setNewMessageText] = useState('');
  const [referencedItem, setReferencedItem] = useState(null);
  const [replyMessage, setReplyMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');

  const [fridgeItems, setFridgeItems] = useState([]);
  const [showItemSelector, setShowItemSelector] = useState(false);

  const [chatBg] = useState(() => {
    if (typeof window === 'undefined') return 'doodle';
    return localStorage.getItem('chat_background_preset') || 'doodle';
  });

  const [longPressedMessage, setLongPressedMessage] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const pressTimer = useRef(null);

  const [showUnreadDivider, setShowUnreadDivider] = useState(true);

  // Scroll to Bottom Helper
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const coupleKey = [userId, partnerId].filter(Boolean).sort().join('_');

  // 1. Hook: Messages & Realtime Sync
  const { messages, setMessages, loading } = useChatMessages(coupleKey, scrollToBottom);

  const quotedMessagesMap = useMemo(() => {
    const map = {};
    (messages || []).forEach((m) => {
      if (m?.id) map[m.id] = m;
    });
    return map;
  }, [messages]);

  const lastReadTimestamp = useMemo(() => {
    if (typeof window === 'undefined' || !coupleKey) return null;
    return localStorage.getItem(`last_read_chat_${coupleKey}`);
  }, [coupleKey]);

  const groupedMessages = useMemo(() => {
    return groupChatMessages(messages, userId, lastReadTimestamp);
  }, [messages, userId, lastReadTimestamp]);

  // 2. Hook: Partner Presence
  const { partnerLastSeen } = usePartnerPresence(partnerId, partner?.last_seen);

  // 3. Hook: Partner Typing Broadcast
  const { partnerIsTyping, handleInputChange } = useChatTyping(
    coupleKey,
    userId,
    setNewMessageText
  );

  // 4. Hook: Pinned Message
  const { pinnedMessage, handlePinMessage, handleUnpinMessage } = usePinnedMessage(
    coupleKey,
    setMessages
  );

  // 5. Hook: Batch Selection Mode
  const {
    isSelectionMode,
    setIsSelectionMode,
    selectedMessageIds,
    setSelectedMessageIds,
    handleToggleSelectMessage,
  } = useChatBatchSelect();

  // 6. Hook: Voice Recorder & Upload Handlers
  const voiceRecorderProps = useVoiceRecorder({
    userId,
    partnerId,
    replyMessage,
    dispatch,
    coupleKey,
    setReplyMessage,
  });

  // 7. Hook: Multi-Media Attachment & Editing Uploader
  const mediaUploaderProps = useMediaUploader({
    userId,
    replyMessage,
    setReplyMessage,
    dispatch,
  });

  const { isRecording, audioPreviewUrl } = voiceRecorderProps;
  const uploadingMedia = mediaUploaderProps.uploadingMedia || voiceRecorderProps.uploadingMedia;
  const uploadProgress = mediaUploaderProps.uploadProgress || voiceRecorderProps.uploadProgress;

  // Unread divider auto-dismiss
  useEffect(() => {
    if (!coupleKey) return;
    const timer = setTimeout(() => {
      localStorage.setItem(`last_read_chat_${coupleKey}`, new Date().toISOString());
      setShowUnreadDivider(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [coupleKey]);

  // Fetch Fridge Items List
  const fetchFridgeItemsList = useCallback(async () => {
    if (!userId || !partnerId) return;
    try {
      const items = await getFridgeItems(userId, partnerId);
      setFridgeItems(items || []);
    } catch (err) {
      console.error('Failed to fetch fridge items:', err);
    }
  }, [userId, partnerId]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchFridgeItemsList();
  }, [fetchFridgeItemsList]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleScrollToMessage = useCallback((messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('message-bubble-highlighted');
      setTimeout(() => el.classList.remove('message-bubble-highlighted'), 2000);
    }
  }, []);

  // Send Message Handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessageText.trim() && !referencedItem) || !userId || !partnerId) return;

    const textToSend = newMessageText.trim();
    const currentReplyId = replyMessage?.id || null;
    const currentRefId = referencedItem?.id || null;

    setNewMessageText('');
    setReplyMessage(null);
    setReferencedItem(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      couple_key: coupleKey,
      user_id: userId,
      content: textToSend || (currentRefId ? 'Attached a fridge item' : ''),
      reply_to_message_id: currentReplyId,
      referenced_fridge_item_id: currentRefId,
      created_at: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const insertPayload = {
        user_id: userId,
        content: textToSend || (currentRefId ? 'Attached a fridge item' : ''),
      };
      if (coupleKey) insertPayload.couple_key = coupleKey;
      if (currentReplyId) insertPayload.reply_to_message_id = currentReplyId;
      if (currentRefId) insertPayload.referenced_fridge_item_id = currentRefId;

      const { data, error } = await supabase
        .from('messages')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      dispatch({
        type: 'SET_GLOBAL_NOTIFICATION',
        payload: { message: 'Failed to send message. Please try again.', type: 'error' },
      });
    }
  };

  // Reactions Handler
  const handleToggleReaction = async (messageObj, emoji) => {
    if (!userId) return;
    const currentReactions = messageObj.reactions || {};
    const currentUsers = currentReactions[emoji] || [];
    const hasReacted = currentUsers.includes(userId);

    const newUsers = hasReacted
      ? currentUsers.filter((id) => id !== userId)
      : [...currentUsers, userId];

    const updatedReactions = { ...currentReactions, [emoji]: newUsers };

    setMessages((prev) =>
      prev.map((m) => (m.id === messageObj.id ? { ...m, reactions: updatedReactions } : m))
    );

    try {
      const { error } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageObj.id);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  // Edit Message Handlers
  const handleSaveEdit = async (messageId) => {
    if (!editText.trim()) return;
    const newContent = editText.trim();
    setEditingMessage(null);

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, content: newContent, is_edited: true } : m))
    );

    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent, is_edited: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save edit:', err);
    }
  };

  // Batch Delete/Pin/Forward Actions
  const handleDeleteSelectedMessages = async () => {
    const idsToDelete = Array.from(selectedMessageIds);
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());

    setMessages((prev) => prev.filter((m) => !idsToDelete.includes(m.id)));

    try {
      const { error } = await supabase.from('messages').delete().in('id', idsToDelete);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to delete selected messages:', err);
    }
  };

  const handlePinSelectedMessages = () => {
    if (selectedMessageIds.size !== 1) return;
    const selectedId = Array.from(selectedMessageIds)[0];
    const msg = messages.find((m) => m.id === selectedId);
    if (msg) {
      if (pinnedMessage?.id === msg.id) {
        handleUnpinMessage();
      } else {
        handlePinMessage(msg);
      }
    }
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  };

  const handleForwardSelectedMessages = () => {
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
    dispatch({
      type: 'SET_GLOBAL_NOTIFICATION',
      payload: { message: 'Forwarding coming soon! 🚀', type: 'info' },
    });
  };

  // Image Selection Triggers
  const handleImageSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const formatted = files.map((file) => ({
      file,
      rotation: 0,
      flipped: false,
      filter: 'none',
      isMuted: false,
    }));
    mediaUploaderProps.setPendingMediaFiles(formatted);
    e.target.value = '';
  };

  const triggerImageSelect = () => imageInputRef.current?.click();

  const handleReferenceClick = () => {
    navigate('/fridge');
    dispatch({
      type: 'SET_GLOBAL_NOTIFICATION',
      payload: { message: 'Navigated to Fridge item! 📌', type: 'info' },
    });
  };

  // Stubs for Document / Location
  const simulateSendDocument = () => {
    dispatch({
      type: 'SET_GLOBAL_NOTIFICATION',
      payload: { message: 'Document sharing coming soon! 📄', type: 'info' },
    });
  };

  const simulateSendLocation = () => {
    dispatch({
      type: 'SET_GLOBAL_NOTIFICATION',
      payload: { message: 'Location sharing coming soon! 📍', type: 'info' },
    });
  };

  // Lightbox State
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  const handleDownloadImage = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `lover_hq_${Date.now()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download image:', err);
      window.open(url, '_blank');
    }
  };

  const bgStyles = {
    doodle: {
      backgroundImage: `radial-gradient(rgba(244, 63, 94, 0.04) 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
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
      {/* 1. Header */}
      <ChatHeader
        partner={partner}
        partnerIsTyping={partnerIsTyping}
        presence={presence}
        partnerLastSeen={partnerLastSeen}
        navigate={navigate}
        dispatch={dispatch}
      />

      {/* 2. Pinned Message Banner */}
      <PinnedMessageBanner
        pinnedMessage={pinnedMessage}
        handleScrollToMessage={handleScrollToMessage}
        handleUnpinMessage={handleUnpinMessage}
      />

      {/* 3. Longpress Backdrop */}
      {longPressedMessage && (
        <div className="chat-longpress-overlay" onClick={() => setLongPressedMessage(null)} />
      )}

      {/* 4. Message List */}
      <MessageList
        loading={loading}
        groupedMessages={groupedMessages}
        userId={userId}
        partner={partner}
        presence={presence}
        showUnreadDivider={showUnreadDivider}
        longPressedMessage={longPressedMessage}
        setLongPressedMessage={setLongPressedMessage}
        handleToggleReaction={handleToggleReaction}
        setReplyMessage={setReplyMessage}
        dispatch={dispatch}
        pinnedMessage={pinnedMessage}
        handleUnpinMessage={handleUnpinMessage}
        handlePinMessage={handlePinMessage}
        setIsSelectionMode={setIsSelectionMode}
        setSelectedMessageIds={setSelectedMessageIds}
        handleDeleteMessage={(id) => setMessageToDelete(id)}
        selectedMessageIds={selectedMessageIds}
        handleToggleSelectMessage={handleToggleSelectMessage}
        setActiveLightboxImage={setActiveLightboxImage}
        getFormattedTime={getFormattedTime}
        quotedMessagesMap={quotedMessagesMap}
        handleScrollToMessage={handleScrollToMessage}
        handleReferenceClick={handleReferenceClick}
        editingMessage={editingMessage}
        editText={editText}
        setEditText={setEditText}
        setEditingMessage={setEditingMessage}
        handleSaveEdit={handleSaveEdit}
        isSelectionMode={isSelectionMode}
        partnerIsTyping={partnerIsTyping}
        messagesEndRef={messagesEndRef}
        pressTimer={pressTimer}
      />

      {/* 5. Uploading Progress Modal */}
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
          </div>
        </div>
      )}

      {/* 6. Bottom Input / Selection Bar Area */}
      {isSelectionMode ? (
        <BatchActionBar
          selectedMessageIds={selectedMessageIds}
          onCancel={() => {
            setIsSelectionMode(false);
            setSelectedMessageIds(new Set());
          }}
          onDelete={handleDeleteSelectedMessages}
          onPin={handlePinSelectedMessages}
          onForward={handleForwardSelectedMessages}
        />
      ) : (
        <div className="p-4 bg-slate-900 border-t border-slate-800/60 space-y-2 shrink-0 z-20">
          <ReplyPreview
            replyMessage={replyMessage}
            userId={userId}
            partner={partner}
            onDismiss={() => setReplyMessage(null)}
          />

          <ReferencedItemPreview
            referencedItem={referencedItem}
            setReferencedItem={setReferencedItem}
          />

          {isRecording || audioPreviewUrl ? (
            <VoiceRecorderBar {...voiceRecorderProps} />
          ) : (
            <ChatInputForm
              handleSendMessage={handleSendMessage}
              imageInputRef={imageInputRef}
              handleImageSelected={handleImageSelected}
              showItemSelector={showItemSelector}
              setShowItemSelector={setShowItemSelector}
              newMessageText={newMessageText}
              handleInputChange={handleInputChange}
              startRecording={voiceRecorderProps.startRecording}
              referencedItem={referencedItem}
            />
          )}
        </div>
      )}

      {/* 7. Attachment Bottom Sheet Menu */}
      <AttachmentBottomSheet
        showItemSelector={showItemSelector}
        setShowItemSelector={setShowItemSelector}
        triggerImageSelect={triggerImageSelect}
        fridgeItems={fridgeItems}
        setReferencedItem={setReferencedItem}
        dispatch={dispatch}
        simulateSendDocument={simulateSendDocument}
        simulateSendLocation={simulateSendLocation}
      />

      {/* 8. Delete Confirmation Modal */}
      <DeleteMessageModal
        messageToDelete={messageToDelete}
        setMessageToDelete={setMessageToDelete}
      />

      {/* 9. Media Batch Preview Sheet */}
      <MediaPreviewSheet
        pendingMediaFiles={mediaUploaderProps.pendingMediaFiles}
        setPendingMediaFiles={mediaUploaderProps.setPendingMediaFiles}
        activePreviewIndex={mediaUploaderProps.activePreviewIndex}
        setActivePreviewIndex={mediaUploaderProps.setActivePreviewIndex}
        mediaCaption={mediaUploaderProps.mediaCaption}
        setMediaCaption={mediaUploaderProps.setMediaCaption}
        isCropping={mediaUploaderProps.isCropping}
        setIsCropping={mediaUploaderProps.setIsCropping}
        cropRect={mediaUploaderProps.cropRect}
        cropAspectRatio={mediaUploaderProps.cropAspectRatio}
        setCropAspectRatio={mediaUploaderProps.setCropAspectRatio}
        showFiltersDrawer={mediaUploaderProps.showFiltersDrawer}
        setShowFiltersDrawer={mediaUploaderProps.setShowFiltersDrawer}
        previewContainerRef={mediaUploaderProps.previewContainerRef}
        activeObjectUrl={mediaUploaderProps.activeObjectUrl}
        handleToggleMuteActive={mediaUploaderProps.handleToggleMuteActive}
        handleStartCropping={mediaUploaderProps.handleStartCropping}
        handleRotateActive={mediaUploaderProps.handleRotateActive}
        handleFlipActive={mediaUploaderProps.handleFlipActive}
        handleTouchStart={mediaUploaderProps.handleTouchStart}
        handleTouchEnd={mediaUploaderProps.handleTouchEnd}
        getScaleAndDims={mediaUploaderProps.getScaleAndDims}
        handleImageLoad={mediaUploaderProps.handleImageLoad}
        handleCropPointerDown={mediaUploaderProps.handleCropPointerDown}
        applyAspectRatio={mediaUploaderProps.applyAspectRatio}
        handleSaveCrop={mediaUploaderProps.handleSaveCrop}
        handleFilterActive={mediaUploaderProps.handleFilterActive}
        triggerImageSelect={triggerImageSelect}
        setNaturalDims={mediaUploaderProps.setNaturalDims}
        handleBatchUpload={mediaUploaderProps.handleBatchUpload}
      />

      {/* 10. Lightbox Overlay */}
      {activeLightboxImage && (
        <ImageLightbox
          src={activeLightboxImage}
          onClose={() => setActiveLightboxImage(null)}
          onDownload={handleDownloadImage}
        />
      )}
    </motion.div>
  );
}
