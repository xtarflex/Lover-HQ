/* eslint-disable */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { supabase, getSupabase } from '@/lib/supabase';
import { useSupabase } from '@/hooks/useSupabase';

/**
 * Dummy component to verify that React component rendering functions properly.
 * @returns {React.JSX.Element}
 */
const DummyComponent = () => {
  return (
    <div>
      <h1>Music Room Setup Verification</h1>
      <p data-testid="status">React is rendering correctly in JSDOM!</p>
    </div>
  );
};

describe('Music Room Test Infrastructure Setup', () => {
  it('should verify JSDOM environment is active and running', () => {
    expect(globalThis.document).toBeDefined();
    expect(globalThis.window).toBeDefined();
    expect(document.body).toBeDefined();
  });

  it('should render a React component and query DOM using React Testing Library', () => {
    render(<DummyComponent />);
    const heading = screen.getByRole('heading', { level: 1 });
    const statusText = screen.getByTestId('status');

    expect(heading).toHaveTextContent('Music Room Setup Verification');
    expect(statusText).toBeInTheDocument();
  });

  it('should verify Supabase client is correctly mocked', () => {
    expect(supabase).toBeDefined();
    expect(getSupabase).toBeDefined();
    expect(useSupabase).toBeDefined();

    const client = getSupabase();
    expect(client.from).toBeDefined();
    expect(client.channel).toBeDefined();

    const queryBuilder = client.from('music_queue');
    expect(queryBuilder.select).toBeDefined();
    expect(queryBuilder.eq).toBeDefined();
  });

  it('should verify Web Audio API is correctly mocked in global scope', () => {
    expect(globalThis.AudioContext).toBeDefined();
    expect(globalThis.webkitAudioContext).toBeDefined();

    const ctx = new AudioContext();
    expect(ctx.state).toBe('running');
    expect(ctx.createGain).toBeDefined();
    expect(ctx.createAnalyser).toBeDefined();

    const gainNode = ctx.createGain();
    expect(gainNode.gain).toBeDefined();
    expect(gainNode.gain.value).toBe(1.0);

    const analyser = ctx.createAnalyser();
    expect(analyser.fftSize).toBe(2048);
  });

  it('should verify Canvas 2D context prototype is mocked for JSDOM', () => {
    const canvas = document.createElement('canvas');
    expect(canvas.getContext).toBeDefined();

    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
    expect(ctx.clearRect).toBeDefined();
    expect(ctx.fillRect).toBeDefined();
    expect(ctx.createLinearGradient).toBeDefined();

    // Verify dimension properties are mocked on HTMLElement prototype
    const div = document.createElement('div');
    expect(div.clientWidth).toBe(400);
    expect(div.clientHeight).toBe(300);
  });

  it('should verify HTML5 Audio class is mocked and simulates play/pause', async () => {
    expect(globalThis.Audio).toBeDefined();

    const audio = new Audio('test-song.mp3');
    expect(audio.src).toBe('test-song.mp3');
    expect(audio.paused).toBe(true);

    const playPromise = audio.play();
    expect(playPromise).toBeInstanceOf(Promise);
    await playPromise;

    expect(audio.paused).toBe(false);

    audio.pause();
    expect(audio.paused).toBe(true);
  });

  it('should verify YouTube IFrame API is mocked in global scope', () => {
    expect(globalThis.YT).toBeDefined();
    expect(globalThis.YT.PlayerState).toBeDefined();
    expect(globalThis.YT.Player).toBeDefined();

    const player = new YT.Player('yt-player-test', {
      events: {
        onReady: (e) => {
          expect(e.target).toBe(player);
        },
      },
    });

    expect(player.loadVideoById).toBeDefined();
    expect(player.playVideo).toBeDefined();
    expect(player.pauseVideo).toBeDefined();
    expect(player.getCurrentTime).toBeDefined();
  });
});
