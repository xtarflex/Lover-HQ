/**
 * @file ChatInputForm.test.jsx
 * @description Unit tests for ChatInputForm component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInputForm } from './ChatInputForm';

describe('ChatInputForm', () => {
  it('renders input area, attachment triggers, and stateful Mic button when empty', () => {
    render(
      <ChatInputForm
        handleSendMessage={vi.fn()}
        imageInputRef={{ current: null }}
        handleImageSelected={vi.fn()}
        showItemSelector={false}
        setShowItemSelector={vi.fn()}
        newMessageText=""
        handleInputChange={vi.fn()}
        startRecording={vi.fn()}
        referencedItem={null}
      />
    );

    expect(screen.getByPlaceholderText('Message your partner...')).toBeInTheDocument();
    expect(screen.getByLabelText('Add attachment')).toBeInTheDocument();
    expect(screen.getByLabelText('Emoji & Stickers')).toBeInTheDocument();
    expect(screen.getByLabelText('Record voice note')).toBeInTheDocument();
    expect(screen.queryByLabelText('Send message')).not.toBeInTheDocument();
  });

  it('morphs to Send button when text is present', () => {
    render(
      <ChatInputForm
        handleSendMessage={vi.fn()}
        imageInputRef={{ current: null }}
        handleImageSelected={vi.fn()}
        showItemSelector={false}
        setShowItemSelector={vi.fn()}
        newMessageText="Hello"
        handleInputChange={vi.fn()}
        startRecording={vi.fn()}
        referencedItem={null}
      />
    );

    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    expect(screen.queryByLabelText('Record voice note')).not.toBeInTheDocument();
  });
});
