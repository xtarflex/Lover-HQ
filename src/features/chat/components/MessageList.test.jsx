/**
 * @file MessageList.test.jsx
 * @description Unit tests for MessageList component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageList } from './MessageList';

describe('MessageList', () => {
  it('renders loading spinner when loading is true', () => {
    render(
      <MessageList
        loading={true}
        groupedMessages={[]}
        userId="user-1"
        partner={{ name: 'Alex' }}
        presence={{ partner: 'online' }}
        showUnreadDivider={false}
        longPressedMessage={null}
        setLongPressedMessage={vi.fn()}
        handleToggleReaction={vi.fn()}
        setReplyMessage={vi.fn()}
        dispatch={vi.fn()}
        pinnedMessage={null}
        handleUnpinMessage={vi.fn()}
        handlePinMessage={vi.fn()}
        setIsSelectionMode={vi.fn()}
        setSelectedMessageIds={vi.fn()}
        handleDeleteMessage={vi.fn()}
        selectedMessageIds={new Set()}
        handleToggleSelectMessage={vi.fn()}
        setActiveLightboxImage={vi.fn()}
        getFormattedTime={vi.fn()}
        quotedMessagesMap={new Map()}
        handleScrollToMessage={vi.fn()}
        handleReferenceClick={vi.fn()}
        editingMessage={null}
        editText=""
        setEditText={vi.fn()}
        setEditingMessage={vi.fn()}
        handleSaveEdit={vi.fn()}
        isSelectionMode={false}
        partnerIsTyping={false}
        messagesEndRef={{ current: null }}
        pressTimer={{ current: null }}
      />
    );
    expect(screen.getByText('Fetching your digital diary...')).toBeInTheDocument();
  });

  it('renders empty message state when groupedMessages is empty', () => {
    render(
      <MessageList
        loading={false}
        groupedMessages={[]}
        userId="user-1"
        partner={{ name: 'Alex' }}
        presence={{ partner: 'online' }}
        showUnreadDivider={false}
        longPressedMessage={null}
        setLongPressedMessage={vi.fn()}
        handleToggleReaction={vi.fn()}
        setReplyMessage={vi.fn()}
        dispatch={vi.fn()}
        pinnedMessage={null}
        handleUnpinMessage={vi.fn()}
        handlePinMessage={vi.fn()}
        setIsSelectionMode={vi.fn()}
        setSelectedMessageIds={vi.fn()}
        handleDeleteMessage={vi.fn()}
        selectedMessageIds={new Set()}
        handleToggleSelectMessage={vi.fn()}
        setActiveLightboxImage={vi.fn()}
        getFormattedTime={vi.fn()}
        quotedMessagesMap={new Map()}
        handleScrollToMessage={vi.fn()}
        handleReferenceClick={vi.fn()}
        editingMessage={null}
        editText=""
        setEditText={vi.fn()}
        setEditingMessage={vi.fn()}
        handleSaveEdit={vi.fn()}
        isSelectionMode={false}
        partnerIsTyping={false}
        messagesEndRef={{ current: null }}
        pressTimer={{ current: null }}
      />
    );
    expect(screen.getByText('No messages here yet')).toBeInTheDocument();
  });

  it('renders raw message items and handles plain object quotedMessagesMap', () => {
    const rawMessage = {
      id: 'm2',
      user_id: 'user-2',
      content: 'I am replying to m1',
      reply_to_message_id: 'm1',
      created_at: '2026-07-23T12:00:00Z',
    };
    const quotedMessagesObj = {
      m1: { id: 'm1', user_id: 'user-1', content: 'Original message' },
    };

    render(
      <MessageList
        loading={false}
        groupedMessages={[rawMessage]}
        userId="user-2"
        partner={{ name: 'Alex' }}
        presence={{ partner: 'online' }}
        showUnreadDivider={false}
        longPressedMessage={null}
        setLongPressedMessage={vi.fn()}
        handleToggleReaction={vi.fn()}
        setReplyMessage={vi.fn()}
        dispatch={vi.fn()}
        pinnedMessage={null}
        handleUnpinMessage={vi.fn()}
        handlePinMessage={vi.fn()}
        setIsSelectionMode={vi.fn()}
        setSelectedMessageIds={vi.fn()}
        handleDeleteMessage={vi.fn()}
        selectedMessageIds={new Set()}
        handleToggleSelectMessage={vi.fn()}
        setActiveLightboxImage={vi.fn()}
        getFormattedTime={() => '12:00 PM'}
        quotedMessagesMap={quotedMessagesObj}
        handleScrollToMessage={vi.fn()}
        handleReferenceClick={vi.fn()}
        editingMessage={null}
        editText=""
        setEditText={vi.fn()}
        setEditingMessage={vi.fn()}
        handleSaveEdit={vi.fn()}
        isSelectionMode={false}
        partnerIsTyping={false}
        messagesEndRef={{ current: null }}
        pressTimer={{ current: null }}
      />
    );

    expect(screen.getByText('I am replying to m1')).toBeInTheDocument();
    expect(screen.getByText('Original message')).toBeInTheDocument();
  });
});
