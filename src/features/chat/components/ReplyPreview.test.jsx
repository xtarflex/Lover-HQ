/**
 * @file ReplyPreview.test.jsx
 * @description Unit tests for the ReplyPreview component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReplyPreview } from './ReplyPreview';

const USER_ID = 'user-a';
const partner = { name: 'Alex' };

describe('ReplyPreview', () => {
  it('renders null when replyMessage is null', () => {
    const { container } = render(
      <ReplyPreview replyMessage={null} userId={USER_ID} partner={partner} onDismiss={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the reply message content', () => {
    const msg = { id: '1', user_id: 'user-b', content: 'Original message' };
    render(
      <ReplyPreview replyMessage={msg} userId={USER_ID} partner={partner} onDismiss={vi.fn()} />
    );
    expect(screen.getByText('Original message')).toBeInTheDocument();
  });

  it('shows "yourself" when replying to own message', () => {
    const msg = { id: '1', user_id: USER_ID, content: 'My own message' };
    render(
      <ReplyPreview replyMessage={msg} userId={USER_ID} partner={partner} onDismiss={vi.fn()} />
    );
    expect(screen.getByText(/yourself/i)).toBeInTheDocument();
  });

  it("shows partner name when replying to partner's message", () => {
    const msg = { id: '1', user_id: 'user-b', content: 'Hi' };
    render(
      <ReplyPreview replyMessage={msg} userId={USER_ID} partner={partner} onDismiss={vi.fn()} />
    );
    expect(screen.getByText(/Alex/)).toBeInTheDocument();
  });

  it('shows "Partner" fallback when partner name is missing', () => {
    const msg = { id: '1', user_id: 'user-b', content: 'Hi' };
    render(<ReplyPreview replyMessage={msg} userId={USER_ID} partner={null} onDismiss={vi.fn()} />);
    expect(screen.getByText(/Partner/)).toBeInTheDocument();
  });

  it('calls onDismiss when X button is clicked', () => {
    const onDismiss = vi.fn();
    const msg = { id: '1', user_id: 'user-b', content: 'Hi' };
    render(
      <ReplyPreview replyMessage={msg} userId={USER_ID} partner={partner} onDismiss={onDismiss} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
