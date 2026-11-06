import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MoodSelector, { MOOD_OPTIONS, getMoodById } from './MoodSelector';

describe('MoodSelector Component', () => {
  it('renders all 7 mood options in standard grid mode', () => {
    render(<MoodSelector currentMood="happy" onSelectMood={vi.fn()} />);

    MOOD_OPTIONS.forEach((mood) => {
      expect(screen.getByText(mood.label)).toBeInTheDocument();
      expect(screen.getByText(mood.desc)).toBeInTheDocument();
    });
  });

  it('renders compact mode with mood labels and emojis', () => {
    render(<MoodSelector currentMood="romantic" onSelectMood={vi.fn()} isCompact={true} />);

    MOOD_OPTIONS.forEach((mood) => {
      expect(screen.getByText(mood.label)).toBeInTheDocument();
    });
  });

  it('calls onSelectMood when a mood button is clicked', () => {
    const handleSelect = vi.fn();
    render(<MoodSelector currentMood="happy" onSelectMood={handleSelect} />);

    const playfulBtn = screen.getByRole('radio', { name: /playful/i });
    fireEvent.click(playfulBtn);

    expect(handleSelect).toHaveBeenCalledWith('playful');
  });

  it('marks current mood as checked in accessibility tree', () => {
    render(<MoodSelector currentMood="cozy" onSelectMood={vi.fn()} />);

    const cozyBtn = screen.getByRole('radio', { name: /cozy/i });
    expect(cozyBtn).toHaveAttribute('aria-checked', 'true');

    const happyBtn = screen.getByRole('radio', { name: /happy/i });
    expect(happyBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('getMoodById falls back to happy for unknown or null identifiers', () => {
    expect(getMoodById(null).id).toBe('happy');
    expect(getMoodById('unknown_mood').id).toBe('happy');
    expect(getMoodById('romantic').id).toBe('romantic');
    expect(getMoodById('missing you').id).toBe('missing_you');
  });
});
