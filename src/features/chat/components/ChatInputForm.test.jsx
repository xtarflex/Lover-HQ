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
  it('renders input field and action buttons', () => {
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
    expect(screen.getByLabelText('Record voice note')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('disables Send button when text is empty and no reference item is present', () => {
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

    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('enables Send button when text is present', () => {
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

    expect(screen.getByLabelText('Send message')).toBeEnabled();
  });
});
