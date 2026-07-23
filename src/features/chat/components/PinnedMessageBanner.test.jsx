/**
 * @file PinnedMessageBanner.test.jsx
 * @description Unit tests for the PinnedMessageBanner component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PinnedMessageBanner } from './PinnedMessageBanner';

const textMessage = { id: 'msg-1', content: 'Hello world', media_url: null };
const voiceMessage = {
  id: 'msg-2',
  content: '',
  media_url: 'https://example.com/v.webm',
  media_type: 'voice',
};
const photoMessage = {
  id: 'msg-3',
  content: '',
  media_url: 'https://example.com/p.jpg',
  media_type: 'image',
};

describe('PinnedMessageBanner', () => {
  it('renders nothing when pinnedMessage is null', () => {
    const { container } = render(
      <PinnedMessageBanner
        pinnedMessage={null}
        handleScrollToMessage={vi.fn()}
        handleUnpinMessage={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the "Pinned Message" label for a text message', () => {
    render(
      <PinnedMessageBanner
        pinnedMessage={textMessage}
        handleScrollToMessage={vi.fn()}
        handleUnpinMessage={vi.fn()}
      />
    );
    expect(screen.getByText('Pinned Message')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows voice note emoji for a voice message', () => {
    render(
      <PinnedMessageBanner
        pinnedMessage={voiceMessage}
        handleScrollToMessage={vi.fn()}
        handleUnpinMessage={vi.fn()}
      />
    );
    expect(screen.getByText('🎙️ Voice Note')).toBeInTheDocument();
  });

  it('shows photo emoji for an image message', () => {
    render(
      <PinnedMessageBanner
        pinnedMessage={photoMessage}
        handleScrollToMessage={vi.fn()}
        handleUnpinMessage={vi.fn()}
      />
    );
    expect(screen.getByText('🖼️ Photo')).toBeInTheDocument();
  });

  it('calls handleScrollToMessage when banner body is clicked', () => {
    const onScroll = vi.fn();
    const { container } = render(
      <PinnedMessageBanner
        pinnedMessage={textMessage}
        handleScrollToMessage={onScroll}
        handleUnpinMessage={vi.fn()}
      />
    );
    fireEvent.click(container.firstChild);
    expect(onScroll).toHaveBeenCalledWith('msg-1');
  });

  it('calls handleUnpinMessage when unpin button is clicked without scrolling', () => {
    const onUnpin = vi.fn();
    const onScroll = vi.fn();
    render(
      <PinnedMessageBanner
        pinnedMessage={textMessage}
        handleScrollToMessage={onScroll}
        handleUnpinMessage={onUnpin}
      />
    );
    fireEvent.click(screen.getByLabelText('Unpin message'));
    expect(onUnpin).toHaveBeenCalled();
    expect(onScroll).not.toHaveBeenCalled();
  });
});
