import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import our context provider and components
import { MusicProvider } from '@/contexts/MusicContext';
import MusicPlayer from '@/features/music/components/MusicPlayer';
import Queue from '@/features/music/components/Queue';

// Import mock controls from our setup
import {
  simulateIncomingBroadcast,
  simulatePostgresChange,
  resetMockChannels,
} from '../../../../vitest.setup';

// Mock the AppContext to provide mock user and partner
vi.mock('@/contexts/AppContext', () => ({
  useAppContext: () => ({
    user: { id: 'user-a-uuid', partner_id: 'user-b-uuid', avatar_url: null },
    partner: { id: 'user-b-uuid', name: 'LovePartner', avatar_url: null },
  }),
  useAppDispatch: () => vi.fn(),
}));

// ---------------------------------------------------------------------------
// Supabase mock helpers for controlling queue return values
// ---------------------------------------------------------------------------

/** Currently-configured queue rows returned by mock fetchQueue. */
let mockQueueRows = [];

/**
 * Returns the mock Supabase client — re-imported after vi.mock resolves.
 * We call this lazily so vitest hoisting doesn't cause problems.
 * @returns {object}
 */
const getMockSupabase = async () => {
  const { default: supabaseMock } = await import('@/hooks/useSupabase');
  return supabaseMock;
};

/**
 * Sets up Supabase `from()` to return `rows` for any select call.
 * @param {Array} rows - Rows to return.
 */
function setMockQueueRows(rows) {
  mockQueueRows = rows;
  // Our vitest.setup.js useSupabase mock returns mockSupabaseClient.
  // We override `from` here to return the test-configured rows.
  // The mock is already set globally via vi.mock in vitest.setup.js —
  // just update the internal variable.
}

// Mock useSupabase to return rows from mockQueueRows for select queries
vi.mock('@/hooks/useSupabase', () => ({
  useSupabase: () => ({
    from: vi.fn().mockImplementation((table) => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(function () {
          return this;
        }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn().mockImplementation(function (onfulfilled) {
          return Promise.resolve({ data: mockQueueRows, error: null }).then(onfulfilled);
        }),
      };
      return builder;
    }),
    channel: vi.fn().mockImplementation((name) => {
      // Delegate to the global mock channel registry via setup helpers
      const ch = {
        listeners: [],
        on: vi.fn().mockImplementation(function (type, filter, callback) {
          this.listeners.push({ type, filter, callback });
          return this;
        }),
        subscribe: vi.fn().mockImplementation(function (cb) {
          if (cb) setTimeout(() => cb('SUBSCRIBED'), 0);
          return this;
        }),
        send: vi.fn().mockImplementation(() => Promise.resolve({ error: null })),
      };
      // Register globally so simulatePostgresChange/simulateIncomingBroadcast can reach it
      window.__mockChannels = window.__mockChannels || {};
      window.__mockChannels[name] = ch;
      return ch;
    }),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Patch simulatePostgresChange to also work with window.__mockChannels
const _simulatePostgresChange = (channelName, table, eventType, newRecord, oldRecord = null) => {
  const ch = window.__mockChannels?.[channelName];
  if (!ch) return;
  ch.listeners.forEach((listener) => {
    if (
      listener.type === 'postgres_changes' &&
      listener.filter?.table === table &&
      (listener.filter?.event === '*' || listener.filter?.event === eventType)
    ) {
      listener.callback({
        schema: 'public',
        table,
        commit_timestamp: new Date().toISOString(),
        eventType,
        new: newRecord,
        old: oldRecord,
      });
    }
  });
};

const _simulateIncomingBroadcast = (channelName, event, payload) => {
  const ch = window.__mockChannels?.[channelName];
  if (!ch) return;
  ch.listeners.forEach((listener) => {
    if (listener.type === 'broadcast' && listener.filter?.event === event) {
      listener.callback({ payload });
    }
  });
};

describe('MusicPlayer & Queue Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetMockChannels();
    window.__mockChannels = {};
    mockQueueRows = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * Helper function to render components wrapped in the MusicProvider.
   * @returns {import('@testing-library/react').RenderResult}
   */
  const renderPlayerWithProvider = () => {
    return render(
      <MusicProvider>
        <MusicPlayer />
        <Queue />
      </MusicProvider>
    );
  };

  it('renders standard blank/empty states when no music is queued', () => {
    renderPlayerWithProvider();

    expect(screen.getByText('Music Room Empty')).toBeInTheDocument();
    expect(screen.getByText('Add a song below to get started!')).toBeInTheDocument();
  });

  it('handles track addition and playback controls locally', async () => {
    const mockTrack = {
      id: 'track-1',
      title: 'Yellow',
      artist: 'Coldplay',
      source: 'upload',
      url: 'https://example.com/yellow.mp3',
      duration_seconds: 180,
      position_index: 1,
      added_by: 'user-b-uuid',
    };

    // Pre-configure mock DB to return the track on next fetch
    setMockQueueRows([mockTrack]);

    renderPlayerWithProvider();

    await act(async () => {
      // Simulate real-time queue synchronization via the DB channel subscription
      _simulatePostgresChange('music_queue_db_sync', 'music_queue', 'INSERT', mockTrack);
      // Advance timers to flush 150ms debounce + async fetch microtasks
      vi.advanceTimersByTime(200);
    });

    // Flush any pending microtasks from the database fetch
    await act(async () => {
      await Promise.resolve();
    });

    // The player should now show the track
    expect(screen.getAllByText('Yellow')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Coldplay')[0]).toBeInTheDocument();

    // Playback should have started
    const playPauseBtn = screen.getByRole('button', { name: /^pause$/i });
    expect(playPauseBtn).toBeInTheDocument();

    // Click Pause to pause locally
    await act(async () => {
      fireEvent.click(playPauseBtn);
      vi.advanceTimersByTime(200);
    });

    // Should switch to Play button
    const playBtn = screen.getByRole('button', { name: /^play$/i });
    expect(playBtn).toBeInTheDocument();
  });

  it('synchronizes listening states when receiving partner broadcast actions', async () => {
    const mockTrack = {
      id: 'track-2',
      title: 'Starlight',
      artist: 'Muse',
      source: 'youtube',
      url: 'dQw4w9WgXcQ',
      duration_seconds: 240,
      position_index: 1,
      added_by: 'user-a-uuid',
    };

    // Pre-configure mock DB to return the track
    setMockQueueRows([mockTrack]);

    renderPlayerWithProvider();

    await act(async () => {
      _simulatePostgresChange('music_queue_db_sync', 'music_queue', 'INSERT', mockTrack);
      vi.advanceTimersByTime(200);
    });

    expect(screen.getAllByText('Starlight')[0]).toBeInTheDocument();

    // Simulate partner seeking the track to 60s
    await act(async () => {
      _simulateIncomingBroadcast(`music:pair:user-a-uuid_user-b-uuid`, 'seek', {
        senderId: 'user-b-uuid',
        timestamp: 60,
        eventSentAt: Date.now() + 1000, // newer timestamp to satisfy LWW
      });
      vi.advanceTimersByTime(200);
    });

    // Player should now reflect the 60s timestamp (formatted as 1:00)
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });
});
