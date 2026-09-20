/**
 * @file ChatSettingsPanel.test.jsx
 * @description Unit tests for ChatSettingsPanel accessibility and toggle functionality.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatSettingsPanel from './ChatSettingsPanel';

describe('ChatSettingsPanel accessibility and toggle controls', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders sound effects toggle with accessible role and aria attributes', () => {
    render(<ChatSettingsPanel />);

    const soundToggle = screen.getByRole('switch', { name: /toggle message sound effects/i });
    expect(soundToggle).toBeInTheDocument();
    expect(soundToggle).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(soundToggle);
    expect(soundToggle).toHaveAttribute('aria-checked', 'false');
    expect(localStorage.getItem('chat_sound_enabled')).toBe('false');

    fireEvent.click(soundToggle);
    expect(soundToggle).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem('chat_sound_enabled')).toBe('true');
  });

  it('renders haptics toggle with accessible role and aria attributes', () => {
    render(<ChatSettingsPanel />);

    const hapticsToggle = screen.getByRole('switch', {
      name: /toggle heartbeat haptic vibration/i,
    });
    expect(hapticsToggle).toBeInTheDocument();
    expect(hapticsToggle).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(hapticsToggle);
    expect(hapticsToggle).toHaveAttribute('aria-checked', 'false');
    expect(localStorage.getItem('chat_haptics_enabled')).toBe('false');

    fireEvent.click(hapticsToggle);
    expect(hapticsToggle).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem('chat_haptics_enabled')).toBe('true');
  });
});
