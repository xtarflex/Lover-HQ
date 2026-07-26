/**
 * @file TypingIndicator.test.jsx
 * @description Unit tests for the TypingIndicator and RecordingIndicator components.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TypingIndicator, RecordingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
  it('renders the three coin-flip animation wrappers', () => {
    const { container } = render(<TypingIndicator />);
    const wrappers = container.querySelectorAll('.typing-coin-wrapper');
    expect(wrappers).toHaveLength(3);
  });

  it('renders the clean typing container without redundant partner avatar', () => {
    const { container } = render(<TypingIndicator />);
    expect(container.querySelector('.typing-coin-container')).toBeInTheDocument();
    expect(screen.queryByText('P')).not.toBeInTheDocument();
  });
});

describe('RecordingIndicator', () => {
  it('renders recording text and pulsing mic indicator', () => {
    render(<RecordingIndicator />);
    expect(screen.getByText('Recording voice note...')).toBeInTheDocument();
  });
});
