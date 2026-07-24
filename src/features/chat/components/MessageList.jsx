/**
 * @file MessageList.jsx
 * @description Renders the chat message list area, unread dividers, media groups, message bubbles, and scroll target.
 * Extracted verbatim from Chat.jsx.
 */

import React, { useMemo } from 'react';
import {
  Smile,
  Reply,
  Copy,
  ArrowRight,
  Pin,
  CheckCheck,
  Trash2,
  Check,
  Play,
  Edit3,
  Tag,
  Mic,
  FileText,
  MapPin,
} from 'lucide-react';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { TypingIndicator } from './TypingIndicator';
import { ANIMATED_EMOJIS, getEmojiCdnUrl } from '../../fridge/components/emojiData';

const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

/**
 * MessageList Component.
 */
export function MessageList({
  loading,
  groupedMessages,
  userId,
  partner,
  presence,
  showUnreadDivider,
  longPressedMessage,
  setLongPressedMessage,
  handleToggleReaction,
  setReplyMessage,
  dispatch,
  pinnedMessage,
  handleUnpinMessage,
  handlePinMessage,
  setIsSelectionMode,
  setSelectedMessageIds,
  handleDeleteMessage,
  selectedMessageIds,
  handleToggleSelectMessage,
  setActiveLightboxImage,
  getFormattedTime,
  quotedMessagesMap,
  handleScrollToMessage,
  handleReferenceClick,
  editingMessage,
  editText,
  setEditText,
  setEditingMessage,
  handleSaveEdit,
  isSelectionMode,
  partnerIsTyping,
  messagesEndRef,
  pressTimer,
}) {
  const content = useMemo(
    () =>
      loading ? (
        <div className="flex flex-col items-center justify-center h-full space-y-2">
          <LoadingSpinner size="md" />
          <span className="text-xs text-text-muted">Fetching your digital diary...</span>
        </div>
      ) : !groupedMessages || groupedMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full space-y-4 text-center px-8">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <Smile className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-main">No messages here yet</p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Send a sweet note, upload a picture, record a voice memo, or tag a Fridge item as a
              reference!
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
            const groupMsgs = item.messages || [];
            const isSelf = (item?.user_id || groupMsgs[0]?.user_id) === userId;
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
                    className={`reactions-tray-floating -top-12 ${isSelf ? 'right-0' : 'left-0'}`}
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

                            {pinnedMessage?.id === msg.id && (
                              <div className="absolute top-2 right-2 bg-slate-900/80 px-1.5 py-0.5 rounded-full z-15">
                                <Pin className="w-3 h-3 text-primary rotate-45" />
                              </div>
                            )}

                            {showMoreOverlay && (
                              <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-white font-extrabold text-sm z-10 backdrop-blur-[1px]">
                                +{moreCount}
                              </div>
                            )}

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

                    <div className="px-2 py-1.5 flex flex-col justify-end space-y-1 select-none">
                      {groupMsgs[0].content && groupMsgs[0].content !== 'Shared a photo' && (
                        <p className="text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap mt-1 text-gray-250">
                          {groupMsgs[0].content}
                        </p>
                      )}

                      <div className="flex items-center justify-end space-x-1.5 text-[8px] text-text-muted self-end">
                        <span>{getFormattedTime(groupMsgs[0].created_at, groupMsgs[0].id)}</span>
                        {isSelf && (
                          <span>
                            {presence?.partner === 'online' ? (
                              presence?.partnerRoom === 'Chat Room' ? (
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

          const msg = item.data || item;
          const isSelf = msg?.user_id === userId;
          const isHighlighted = longPressedMessage?.id === msg.id;
          const hideHeader = item.hideHeader || false;
          const quotedMsg = msg.reply_to_message_id
            ? typeof quotedMessagesMap?.get === 'function'
              ? quotedMessagesMap.get(msg.reply_to_message_id)
              : quotedMessagesMap?.[msg.reply_to_message_id]
            : null;

          const hasText =
            msg.content &&
            msg.media_type !== 'voice' &&
            msg.content !== 'Shared a photo' &&
            msg.content !== 'Shared a video' &&
            msg.content !== 'Attached a fridge item' &&
            msg.content !== '🎙️ Voice Note';

          const fridgeItem = msg.fridge_items || msg.fridge_item || msg.referenced_fridge_item;

          const isMediaOnly =
            (msg.media_type === 'image' ||
              msg.media_type === 'video' ||
              msg.media_type === 'document' ||
              msg.media_type === 'location') &&
            !hasText &&
            !fridgeItem;

          return (
            <div
              key={`msg-${msg.id}`}
              id={`msg-${msg.id}`}
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
              onClick={() => {
                if (isSelectionMode) {
                  handleToggleSelectMessage(msg.id);
                }
              }}
              className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1 group relative transition-all duration-300 ${
                hideHeader ? 'mt-0.5' : 'mt-4'
              } ${isHighlighted ? 'message-bubble-highlighted' : ''}`}
            >
              {isHighlighted && (
                <div className={`reactions-tray-floating -top-12 ${isSelf ? 'right-0' : 'left-0'}`}>
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

              {isHighlighted && (
                <div
                  className={`context-menu-floating top-full mt-2 ${isSelf ? 'right-0' : 'left-0'}`}
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

              <div className={`flex items-end w-full ${isSelf ? 'justify-end' : 'justify-start'}`}>
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
                    {quotedMsg && (
                      <div
                        onClick={() => handleScrollToMessage(quotedMsg.id)}
                        className="mb-2 p-2 bg-slate-950/40 rounded-lg border-l-2 border-primary/80 text-[10px] text-text-muted cursor-pointer hover:bg-slate-950/70 transition-colors flex items-center justify-between"
                      >
                        <div className="truncate">
                          <span className="font-extrabold text-primary block text-[9px] uppercase tracking-wider">
                            {quotedMsg.user_id === userId ? 'You' : partner?.name || 'Partner'}
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

                    {fridgeItem && (
                      <div
                        onClick={() => handleReferenceClick(fridgeItem.id)}
                        className="cursor-pointer"
                      >
                        {fridgeItem.type === 'note' &&
                          (() => {
                            let noteText = '';
                            let noteColor = 'yellow';
                            try {
                              const parsed = JSON.parse(fridgeItem.content);
                              noteText = parsed.text || '';
                              noteColor = parsed.color || 'yellow';
                            } catch {
                              noteText = fridgeItem.content;
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

                        {fridgeItem.type === 'photo' && (
                          <div className="mb-2.5 p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center space-x-2.5 text-[10px] hover:bg-slate-950 transition-all">
                            <div className="w-10 h-10 rounded overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                              <img
                                src={fridgeItem.content}
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

                        {fridgeItem.type === 'voice' &&
                          (() => {
                            let voiceDurStr = '';
                            try {
                              const parsed = JSON.parse(fridgeItem.content);
                              if (parsed.duration) {
                                voiceDurStr = `${Math.floor(parsed.duration)}s`;
                              }
                            } catch {
                              // Ignore parsing errors
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

                        {fridgeItem.type === 'emoji' &&
                          (() => {
                            const emojiId = fridgeItem.content;
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
                        className={isMediaOnly ? 'relative' : 'space-y-2 message-text-container'}
                      >
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

                        {msg.media_type === 'voice' && msg.media_url && (
                          <VoiceMessagePlayer src={msg.media_url} />
                        )}

                        {msg.media_type === 'document' && (
                          <div className="flex items-center space-x-2.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 min-w-[200px] mb-1">
                            <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                              <FileText className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-gray-200 block truncate leading-tight">
                                {msg.content || 'Document'}
                              </span>
                            </div>
                          </div>
                        )}

                        {msg.media_type === 'location' && (
                          <div className="space-y-2 mb-1 min-w-[200px]">
                            <div className="rounded-lg overflow-hidden border border-slate-800/40 relative">
                              <div className="bg-slate-950 flex flex-col items-center justify-center p-3 text-center text-[10px] text-text-muted min-h-[90px]">
                                <MapPin className="w-5 h-5 text-blue-400 mb-1" />
                                <span className="font-bold text-gray-300">Shared Location</span>
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

                        {hasText && (
                          <p className="text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}

                        {(msg.media_type === 'image' || msg.media_type === 'video') && !hasText ? (
                          <div className="message-media-footer">
                            {msg.is_edited && <span>edited</span>}
                            <span>{getFormattedTime(msg.created_at, msg.id)}</span>
                            {isSelf && (
                              <span>
                                {presence?.partner === 'online' ? (
                                  presence?.partnerRoom === 'Chat Room' ? (
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
                            <span>{getFormattedTime(msg.created_at, msg.id)}</span>
                            {isSelf && (
                              <span>
                                {presence?.partner === 'online' ? (
                                  presence?.partnerRoom === 'Chat Room' ? (
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

                    {msg.reactions &&
                      Object.keys(msg.reactions).some((k) => msg.reactions[k]?.length > 0) && (
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
      presence?.partner,
      presence?.partnerRoom,
      editingMessage?.id,
      editText,
      handleReferenceClick,
      handleSaveEdit,
      handleToggleReaction,
      getFormattedTime,
      quotedMessagesMap,
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
      pressTimer,
      setActiveLightboxImage,
      setEditText,
      setEditingMessage,
      setLongPressedMessage,
      setReplyMessage,
      setSelectedMessageIds,
      setIsSelectionMode,
    ]
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar relative">
      {content}

      {partnerIsTyping && <TypingIndicator partner={partner} />}

      <div ref={messagesEndRef} />
    </div>
  );
}
