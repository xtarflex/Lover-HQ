import { vi } from 'vitest';
import '@testing-library/jest-dom';

// ============================================================================
// 0. Browser API Stubs Missing in jsdom
// ============================================================================

/**
 * Stub for window.matchMedia — not implemented by jsdom.
 * Returns a MediaQueryList-like object that always reports the query as unmatched.
 *
 * @param {string} query - CSS media query string.
 * @returns {object} Mock MediaQueryList.
 */
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// ============================================================================
// 1. Supabase Client Mock Setup
// ============================================================================

/**
 * Registry of active mock channels by name.
 * @type {Record<string, any>}
 */
const mockChannels = {};

/**
 * Creates a mock query builder for database calls.
 * @returns {object} Mock query builder.
 */
const mockCreateQueryBuilder = () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => {
      return Promise.resolve({ data: null, error: null });
    }),
    then: vi.fn().mockImplementation((onfulfilled) => {
      return Promise.resolve({ data: [], error: null }).then(onfulfilled);
    }),
  };
  return builder;
};

/**
 * Creates or retrieves a mock subscription channel.
 * @param {string} name - Channel name.
 * @param {Record<string, any>} [config={}] - Channel configuration.
 * @returns {object} The mock channel object.
 */
const mockChannel = (name, config = {}) => {
  if (!mockChannels[name]) {
    mockChannels[name] = {
      name,
      config,
      listeners: [],
      /**
       * Sends a broadcast message.
       * @param {object} data - Broadcast data.
       * @returns {Promise<{error: null}>}
       */
      send: vi.fn().mockImplementation(function (data) {
        this.sentBroadcasts.push(data);
        return Promise.resolve({ error: null });
      }),
      /**
       * Registers a listener on the channel.
       * @param {string} type - Event type.
       * @param {object} filter - Filtering options.
       * @param {Function} callback - Callback function.
       * @returns {object} The channel instance for chaining.
       */
      on: vi.fn().mockImplementation(function (type, filter, callback) {
        this.listeners.push({ type, filter, callback });
        return this;
      }),
      /**
       * Subscribes to the channel.
       * @param {Function} [callback] - Callback function called with subscription status.
       * @returns {object} The channel instance for chaining.
       */
      subscribe: vi.fn().mockImplementation(function (callback) {
        if (callback) {
          setTimeout(() => callback('SUBSCRIBED'), 0);
        }
        return this;
      }),
      sentBroadcasts: [],
    };
  }
  return mockChannels[name];
};

/**
 * The shared singleton mock Supabase client.
 */
const mockSupabaseClient = {
  from: vi.fn().mockImplementation(() => mockCreateQueryBuilder()),
  channel: vi.fn().mockImplementation((name, config) => mockChannel(name, config)),
  removeChannel: vi.fn().mockImplementation((channel) => {
    const key = Object.keys(mockChannels).find((k) => mockChannels[k] === channel);
    if (key) {
      delete mockChannels[key];
    }
    return Promise.resolve();
  }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
      getPublicUrl: vi.fn().mockImplementation((path) => ({
        data: { publicUrl: `https://example.com/storage/${path}` },
      })),
    }),
  },
};

/**
 * Resets the active realtime channels mock state.
 * Useful between tests to avoid cross-test pollution.
 * @returns {void}
 */
export const resetMockChannels = () => {
  for (const key in mockChannels) {
    if (Object.prototype.hasOwnProperty.call(mockChannels, key)) {
      delete mockChannels[key];
    }
  }
};

/**
 * Simulates an incoming broadcast event on a mock channel.
 * @param {string} channelName - The name of the channel.
 * @param {string} event - The name of the event.
 * @param {any} payload - The event payload.
 * @returns {void}
 */
export const simulateIncomingBroadcast = (channelName, event, payload) => {
  const channel = mockChannels[channelName];
  if (channel) {
    channel.listeners.forEach((listener) => {
      if (listener.type === 'broadcast' && listener.filter.event === event) {
        listener.callback({ payload });
      }
    });
  } else {
    console.warn(`[Mock Supabase] No active channel found for: ${channelName}`);
  }
};

/**
 * Simulates a Postgres database change event on a mock channel.
 * @param {string} channelName - The name of the channel.
 * @param {string} table - The table name.
 * @param {string} eventType - The type of event (e.g. INSERT, UPDATE, DELETE).
 * @param {any} newRecord - The new row record.
 * @param {any|null} [oldRecord=null] - The old row record.
 * @returns {void}
 */
export const simulatePostgresChange = (channelName, table, eventType, newRecord, oldRecord = null) => {
  const channel = mockChannels[channelName];
  if (channel) {
    channel.listeners.forEach((listener) => {
      if (
        listener.type === 'postgres_changes' &&
        listener.filter.table === table &&
        (listener.filter.event === '*' || listener.filter.event === eventType)
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
  } else {
    console.warn(`[Mock Supabase] No active channel found for: ${channelName}`);
  }
};

// Setup mock Supabase client modules
vi.mock('@/lib/supabase', () => {
  return {
    supabase: mockSupabaseClient,
    getSupabase: () => mockSupabaseClient,
  };
});

vi.mock('@/hooks/useSupabase', () => {
  return {
    useSupabase: () => mockSupabaseClient,
  };
});

// ============================================================================
// 2. Web Audio API Mock Setup
// ============================================================================

/** Mock representation of AudioParam. */
class AudioParamMock {
  /**
   * @param {number} [value=0] - Initial value.
   */
  constructor(value = 0) {
    this.value = value;
  }
  setValueAtTime = vi.fn().mockReturnThis();
  exponentialRampToValueAtTime = vi.fn().mockReturnThis();
  linearRampToValueAtTime = vi.fn().mockReturnThis();
  setTargetAtTime = vi.fn().mockReturnThis();
  setValueCurveAtTime = vi.fn().mockReturnThis();
  cancelScheduledValues = vi.fn().mockReturnThis();
}

/** Mock representation of OscillatorNode. */
class OscillatorNodeMock {
  constructor() {
    this.type = 'sine';
    this.frequency = new AudioParamMock(440);
    this.detune = new AudioParamMock(0);
  }
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

/** Mock representation of GainNode. */
class GainNodeMock {
  constructor() {
    this.gain = new AudioParamMock(1.0);
  }
  connect = vi.fn();
  disconnect = vi.fn();
}

/** Mock representation of BiquadFilterNode. */
class BiquadFilterNodeMock {
  constructor() {
    this.type = 'lowpass';
    this.frequency = new AudioParamMock(350);
    this.detune = new AudioParamMock(0);
    this.Q = new AudioParamMock(1);
    this.gain = new AudioParamMock(0);
  }
  connect = vi.fn();
  disconnect = vi.fn();
}

/** Mock representation of AudioBuffer. */
class AudioBufferMock {
  /**
   * @param {number} numberOfChannels - Number of audio channels.
   * @param {number} length - Buffer length in samples.
   * @param {number} sampleRate - Sample rate in Hz.
   */
  constructor(numberOfChannels, length, sampleRate) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channelData = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }
  /**
   * Gets the Float32Array channel data.
   * @param {number} channel - The index of the channel.
   * @returns {Float32Array}
   */
  getChannelData(channel) {
    return this.channelData[channel] || new Float32Array(this.length);
  }
  copyFromChannel = vi.fn();
  copyToChannel = vi.fn();
}

/** Mock representation of AudioBufferSourceNode. */
class AudioBufferSourceNodeMock {
  constructor() {
    this.buffer = null;
    this.playbackRate = new AudioParamMock(1.0);
    this.loop = false;
    this.loopStart = 0;
    this.loopEnd = 0;
  }
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

/** Mock representation of AnalyserNode. */
class AnalyserNodeMock {
  constructor() {
    this.fftSize = 2048;
    this.frequencyBinCount = 1024;
    this.minDecibels = -100;
    this.maxDecibels = -30;
    this.smoothingTimeConstant = 0.8;
  }
  connect = vi.fn();
  disconnect = vi.fn();
  /**
   * Simulates filling frequency array with dummy visual spectrum data.
   * @param {Uint8Array} array - Target array to populate.
   * @returns {void}
   */
  getByteFrequencyData = vi.fn().mockImplementation((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  });
  /**
   * Simulates filling time domain array with center line wave values.
   * @param {Uint8Array} array - Target array to populate.
   * @returns {void}
   */
  getByteTimeDomainData = vi.fn().mockImplementation((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = 128 + Math.floor(Math.sin(i * 0.05) * 50);
    }
  });
}

/** Mock representation of AudioContext. */
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = {};
  }
  close = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
  resume = vi.fn().mockResolvedValue(undefined);
  /** @returns {OscillatorNodeMock} */
  createOscillator() { return new OscillatorNodeMock(); }
  /** @returns {GainNodeMock} */
  createGain() { return new GainNodeMock(); }
  /** @returns {BiquadFilterNodeMock} */
  createBiquadFilter() { return new BiquadFilterNodeMock(); }
  /**
   * @param {number} channels - Number of channels.
   * @param {number} length - Buffer length in samples.
   * @param {number} rate - Sample rate in Hz.
   * @returns {AudioBufferMock}
   */
  createBuffer(channels, length, rate) { return new AudioBufferMock(channels, length, rate); }
  /** @returns {AudioBufferSourceNodeMock} */
  createBufferSource() { return new AudioBufferSourceNodeMock(); }
  /** @returns {AnalyserNodeMock} */
  createAnalyser() { return new AnalyserNodeMock(); }
  /**
   * Creates a MediaElementSourceNode mock (used by the Web Audio visualizer).
   * @param {HTMLMediaElement} _element - The audio element to connect.
   * @returns {object} Mock source node.
   */
  createMediaElementSource(_element) {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
}

globalThis.AudioContext = MockAudioContext;
globalThis.webkitAudioContext = MockAudioContext;

// ============================================================================
// ResizeObserver Polyfill (jsdom does not implement it)
// ============================================================================

if (!globalThis.ResizeObserver) {
  /**
   * Minimal ResizeObserver polyfill for the jsdom test environment.
   * Fires the callback once synchronously with a mock entry on observe().
   */
  globalThis.ResizeObserver = class ResizeObserver {
    /**
     * @param {ResizeObserverCallback} callback
     */
    constructor(callback) {
      this._callback = callback;
    }
    /**
     * Begins observing the target element.
     * @param {Element} target
     */
    observe(target) {
      // Fire once synchronously so canvas width initialises in tests
      this._callback([{ contentRect: { width: 400, height: 300 } }], this);
    }
    /** No-op unobserve. */
    unobserve() {}
    /** No-op disconnect. */
    disconnect() {}
  };
}

// ============================================================================
// MediaSession API Mock
// ============================================================================

if (!navigator.mediaSession) {
  Object.defineProperty(navigator, 'mediaSession', {
    value: {
      metadata: null,
      playbackState: 'none',
      setActionHandler: vi.fn(),
    },
    configurable: true,
  });
}

if (!globalThis.MediaMetadata) {
  globalThis.MediaMetadata = class MediaMetadata {
    constructor(metadata) {
      this.title = metadata.title || '';
      this.artist = metadata.artist || '';
      this.album = metadata.album || '';
      this.artwork = metadata.artwork || [];
    }
  };
}

// ============================================================================
// 3. Canvas Rendering Mock Setup
// ============================================================================

if (typeof HTMLCanvasElement !== 'undefined') {
  /**
   * Mocks the getContext function on HTMLCanvasElement.
   * @param {string} contextId - The context type (e.g. '2d').
   * @returns {object|null}
   */
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId) => {
    if (contextId === '2d') {
      return {
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        rect: vi.fn(),
        roundRect: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        stroke: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        /**
         * Creates a linear gradient.
         * @returns {object} Mock gradient object.
         */
        createLinearGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn(),
        }),
      };
    }
    return null;
  });

  // Mock standard dimensions for JSDOM
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() { return 400; },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() { return 300; },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() { return 400; },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() { return 300; },
  });
}

// ============================================================================
// 4. HTML5 Audio Element Mock Setup
// ============================================================================

/** Mock representation of HTML5 Audio class. */
class MockAudio {
  /**
   * @param {string} [src=''] - Source URL of the audio.
   */
  constructor(src = '') {
    this._src = src;
    this.volume = 1.0;
    this.currentTime = 0;
    this._duration = 180;
    this.paused = true;
    this.muted = false;
    this._listeners = {};
    this._playInterval = null;

    if (src) {
      setTimeout(() => {
        this._trigger('loadedmetadata');
        this._trigger('durationchange');
      }, 0);
    }
  }

  /**
   * Getter for src.
   * @returns {string} The source URL.
   */
  get src() {
    return this._src;
  }

  /**
   * Setter for src. Sets URL and triggers event callbacks.
   * @param {string} val - The source URL.
   */
  set src(val) {
    this._src = val;
    if (val) {
      setTimeout(() => {
        this._trigger('loadedmetadata');
        this._trigger('durationchange');
      }, 0);
    }
  }

  /**
   * Getter for duration.
   * @returns {number} Duration in seconds.
   */
  get duration() {
    return this._duration;
  }

  /**
   * Setter for duration. Triggers durationchange callbacks.
   * @param {number} val - Duration in seconds.
   */
  set duration(val) {
    this._duration = val;
    this._trigger('durationchange');
  }

  /**
   * Adds an event listener.
   * @param {string} event - Event name.
   * @param {Function} cb - Event callback.
   * @returns {void}
   */
  addEventListener(event, cb) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(cb);
  }

  /**
   * Removes an event listener.
   * @param {string} event - Event name.
   * @param {Function} cb - Event callback.
   * @returns {void}
   */
  removeEventListener(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter((l) => l !== cb);
  }

  /**
   * Triggers event callbacks.
   * @param {string} event - Event name.
   * @param {any} [payload={}] - Event payload.
   * @returns {void}
   * @private
   */
  _trigger(event, payload = {}) {
    if (this._listeners[event]) {
      this._listeners[event].forEach((cb) => cb(payload));
    }
  }

  /**
   * Starts mock playback intervals to advance currentTime.
   * @returns {Promise<void>}
   */
  play() {
    this.paused = false;
    this._trigger('play');

    if (this._playInterval) {
      clearInterval(this._playInterval);
    }
    this._playInterval = setInterval(() => {
      if (!this.paused) {
        this.currentTime += 0.5;
        this._trigger('timeupdate');
        if (this.currentTime >= this.duration) {
          this.currentTime = this.duration;
          this.paused = true;
          clearInterval(this._playInterval);
          this._trigger('ended');
        }
      }
    }, 500);

    return Promise.resolve();
  }

  /**
   * Pauses the mock playback interval.
   * @returns {void}
   */
  pause() {
    this.paused = true;
    if (this._playInterval) {
      clearInterval(this._playInterval);
      this._playInterval = null;
    }
    this._trigger('pause');
  }
}

globalThis.Audio = MockAudio;

// ============================================================================
// 5. YouTube Iframe Player Mock Setup
// ============================================================================

/** Mock representation of the YT library. */
const mockYT = {
  PlayerState: {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
  },
  Player: class MockYTPlayer {
    /**
     * @param {string} elementId - ID of element to replace.
     * @param {object} options - YouTube player configuration.
     */
    constructor(elementId, options) {
      this.elementId = elementId;
      this.options = options;
      this.volume = 100;
      this.currentTime = 0;
      this.duration = 180;
      this.isPlaying = false;
      this.playerState = -1; // UNSTARTED
      this._playInterval = null;

      setTimeout(() => {
        if (options.events && options.events.onReady) {
          options.events.onReady({ target: this });
        }
      }, 0);
    }

    /**
     * Loads a YouTube video by ID and simulates playing state.
     * @param {object} params - Parameters containing videoId and optional startSeconds.
     * @returns {void}
     */
    loadVideoById({ videoId, startSeconds = 0 }) {
      this.videoId = videoId;
      this.currentTime = startSeconds;
      this.isPlaying = true;
      this.playerState = 1; // PLAYING
      this._triggerStateChange(1);

      if (this._playInterval) {
        clearInterval(this._playInterval);
      }
      this._playInterval = setInterval(() => {
        if (this.isPlaying) {
          this.currentTime += 0.5;
          if (this.currentTime >= this.duration) {
            this.currentTime = this.duration;
            this.isPlaying = false;
            this.playerState = 0; // ENDED
            clearInterval(this._playInterval);
            this._triggerStateChange(0);
          }
        }
      }, 500);
    }

    /**
     * Simulates playing the video.
     * @returns {void}
     */
    playVideo() {
      this.isPlaying = true;
      this.playerState = 1;
      this._triggerStateChange(1);
    }

    /**
     * Simulates pausing the video.
     * @returns {void}
     */
    pauseVideo() {
      this.isPlaying = false;
      this.playerState = 2; // PAUSED
      this._triggerStateChange(2);
    }

    /**
     * Simulates seeking.
     * @param {number} seconds - Position to seek to.
     * @param {boolean} [allowSeekAhead] - Placeholder param.
     * @returns {void}
     */
    seekTo(seconds, allowSeekAhead) {
      this.currentTime = seconds;
    }

    /**
     * Sets player volume.
     * @param {number} vol - Volume level.
     * @returns {void}
     */
    setVolume(vol) {
      this.volume = vol;
    }

    /**
     * Gets player volume.
     * @returns {number}
     */
    getVolume() {
      return this.volume;
    }

    /**
     * Gets current playback time.
     * @returns {number}
     */
    getCurrentTime() {
      return this.currentTime;
    }

    /**
     * Gets total duration.
     * @returns {number}
     */
    getDuration() {
      return this.duration;
    }

    /**
     * Gets current player state.
     * @returns {number}
     */
    getPlayerState() {
      return this.playerState;
    }

    /**
     * Triggers the state change event callback.
     * @param {number} state - The new state ID.
     * @returns {void}
     * @private
     */
    _triggerStateChange(state) {
      if (this.options.events && this.options.events.onStateChange) {
        this.options.events.onStateChange({ data: state, target: this });
      }
    }
  }
};

globalThis.YT = mockYT;
