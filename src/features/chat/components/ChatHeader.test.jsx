/**
 * @file ChatHeader.test.jsx
 * @description Unit tests for ChatHeader component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatHeader } from './ChatHeader';

describe('ChatHeader', () => {
  it('renders partner name and avatar fallback', () => {
    render(
      <ChatHeader
        partner={{ name: 'Alex' }}
        partnerIsTyping={false}
        presence={{ partner: 'offline' }}
        partnerLastSeen={null}
        navigate={vi.fn()}
        dispatch={vi.fn()}
      />
    );
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('P')).toBeInTheDocument();
  });

  it('renders "typing..." when partnerIsTyping is true', () => {
    render(
      <ChatHeader
        partner={{ name: 'Alex' }}
        partnerIsTyping={true}
        presence={{ partner: 'online' }}
        partnerLastSeen={null}
        navigate={vi.fn()}
        dispatch={vi.fn()}
      />
    );
    expect(screen.getByText('typing...')).toBeInTheDocument();
  });

  it('calls navigate(-1) on back arrow click', () => {
    const navigate = vi.fn();
    render(
      <ChatHeader
        partner={{ name: 'Alex' }}
        partnerIsTyping={false}
        presence={{ partner: 'offline' }}
        partnerLastSeen={null}
        navigate={navigate}
        dispatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(navigate).toHaveBeenCalledWith(-1);
  });
});
