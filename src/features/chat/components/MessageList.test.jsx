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
});
