/**
 * @file TypingIndicator.test.jsx
 * @description Unit tests for the TypingIndicator component.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
  it('renders the three coin-flip animation wrappers', () => {
    const { container } = render(<TypingIndicator partner={null} />);
    const wrappers = container.querySelectorAll('.typing-coin-wrapper');
    expect(wrappers).toHaveLength(3);
  });

  it('renders fallback "P" avatar when partner has no avatar_url', () => {
    render(<TypingIndicator partner={{ name: 'Partner' }} />);
    expect(screen.getByText('P')).toBeInTheDocument();
  });

  it('renders partner avatar image when avatar_url is provided', () => {
    const partner = { avatar_url: 'https://example.com/avatar.jpg', name: 'Alex' };
    render(<TypingIndicator partner={partner} />);
    const img = screen.getByRole('img', { name: 'avatar' });
    expect(img).toHaveAttribute('src', partner.avatar_url);
  });

  it('renders the typing container with correct class', () => {
    const { container } = render(<TypingIndicator partner={null} />);
    expect(container.querySelector('.typing-coin-container')).toBeInTheDocument();
  });
});
