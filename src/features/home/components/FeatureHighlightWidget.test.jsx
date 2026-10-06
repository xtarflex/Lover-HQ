import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FeatureHighlightWidget from './FeatureHighlightWidget';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../contexts/AppContext', () => ({
  useAppContext: () => ({
    user: { id: 'u1', name: 'Taylor' },
    partner: { id: 'u2', name: 'Alex', mood: 'happy' },
  }),
}));

describe('FeatureHighlightWidget Component', () => {
  it('renders "Try Out" label, partner mood, and discovery card content', () => {
    const { container } = render(
      <MemoryRouter>
        <FeatureHighlightWidget />
      </MemoryRouter>
    );

    // Assert "Try Out" header from user specification
    expect(screen.getByText('Try Out')).toBeInTheDocument();

    // Assert partner's current mood 'Happy' is applied to the widget
    expect(container.querySelector('[data-mood="happy"]')).toBeInTheDocument();

    // Assert the chassis revolving lights border with 3-sequence class is present
    const revolvingRect = container.querySelector('.animate-chassis-revolve');
    expect(revolvingRect).toBeInTheDocument();
    expect(revolvingRect).toHaveAttribute('pathLength', '100');
    expect(revolvingRect).toHaveAttribute('stroke-linecap', 'round');
  });

  it('rotates to one of the allowed modules and excludes Music, Chat, and Games', () => {
    render(
      <MemoryRouter>
        <FeatureHighlightWidget />
      </MemoryRouter>
    );

    const allowedTitles = ['Fridge', 'Theatre', 'Journal', 'Reveal'];
    const renderedAllowed = allowedTitles.some((title) => screen.queryByText(title) !== null);
    expect(renderedAllowed).toBe(true);

    // Strictly excludes Music, Chat, and Games
    expect(screen.queryByText('Music')).toBeNull();
    expect(screen.queryByText('Chat')).toBeNull();
    expect(screen.queryByText('Games')).toBeNull();
  });

  it('navigates to the selected feature route when clicked', () => {
    render(
      <MemoryRouter>
        <FeatureHighlightWidget />
      </MemoryRouter>
    );

    const card = screen.getByText('Try Out').closest('div[class*="cursor-pointer"]');
    expect(card).toBeInTheDocument();

    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalled();
  });
});
