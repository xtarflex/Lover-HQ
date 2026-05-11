# 📝 Lover-HQ Code Snippets & Patterns

## Essential Patterns

### 1. Supabase Singleton Client

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Channel manager for cleanup
class ChannelManager {
  constructor() {
    this.channels = new Map();
  }

  getChannel(name) {
    if (!this.channels.has(name)) {
      const channel = supabase.channel(name);
      this.channels.set(name, channel);
    }
    return this.channels.get(name);
  }

  removeChannel(name) {
    const channel = this.channels.get(name);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(name);
    }
  }

  cleanup() {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
  }
}

export const channelManager = new ChannelManager();
```

---

### 2. Global State Context

```javascript
// src/contexts/AppContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AppContext = createContext(null);

const initialState = {
  user: null,
  partner: null,
  presence: {
    user: false,
    partner: false,
  },
  currentRoom: 'fridge',
  loading: true,
  error: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    
    case 'SET_PARTNER':
      return { ...state, partner: action.payload };
    
    case 'UPDATE_PRESENCE':
      return {
        ...state,
        presence: {
          ...state.presence,
          [action.payload.who]: action.payload.isOnline,
        },
      };
    
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Load user session on mount
    async function loadSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          // Fetch user data from database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userError) throw userError;
          
          dispatch({ type: 'SET_USER', payload: userData });
          
          // Fetch partner data if paired
          if (userData.partner_id) {
            const { data: partnerData, error: partnerError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userData.partner_id)
              .single();
            
            if (partnerError) throw partnerError;
            
            dispatch({ type: 'SET_PARTNER', payload: partnerData });
          }
        } else {
          dispatch({ type: 'SET_USER', payload: null });
        }
      } catch (error) {
        console.error('Session load error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    }

    loadSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Reload user data
          loadSession();
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'SET_PARTNER', payload: null });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
```

---

### 3. Custom Hook: Real-time Subscription

```javascript
// src/hooks/useRealtimeSubscription.js
import { useEffect, useRef } from 'react';
import { channelManager } from '@/lib/supabase';

/**
 * Subscribe to a Supabase Realtime channel with automatic cleanup
 * @param {string} channelName - Unique channel identifier
 * @param {string} event - Event name to listen for
 * @param {function} callback - Handler function
 * @param {array} dependencies - useEffect dependencies
 */
export function useRealtimeSubscription(channelName, event, callback, dependencies = []) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const channel = channelManager.getChannel(channelName);
    
    channel.on('broadcast', { event }, (payload) => {
      callbackRef.current(payload);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to ${channelName}:${event}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Error subscribing to ${channelName}:${event}`);
      }
    });

    return () => {
      channel.off('broadcast', { event });
      channelManager.removeChannel(channelName);
    };
  }, [channelName, event, ...dependencies]);
}
```

---

### 4. Custom Hook: Presence Tracking

```javascript
// src/hooks/usePresence.js
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';

export function usePresence() {
  const { state, dispatch } = useApp();
  const { user, partner } = state;

  useEffect(() => {
    if (!user || !partner) return;

    const channelName = `presence:${[user.id, partner.id].sort().join('-')}`;
    const channel = supabase.channel(channelName);

    // Track own presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const partnerPresent = Object.values(presenceState).some(
          (presence) => presence[0]?.user_id === partner.id
        );
        
        dispatch({
          type: 'UPDATE_PRESENCE',
          payload: { who: 'partner', isOnline: partnerPresent },
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const isPartner = newPresences[0]?.user_id === partner.id;
        if (isPartner) {
          dispatch({
            type: 'UPDATE_PRESENCE',
            payload: { who: 'partner', isOnline: true },
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const isPartner = leftPresences[0]?.user_id === partner.id;
        if (isPartner) {
          dispatch({
            type: 'UPDATE_PRESENCE',
            payload: { who: 'partner', isOnline: false },
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          
          dispatch({
            type: 'UPDATE_PRESENCE',
            payload: { who: 'user', isOnline: true },
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, partner, dispatch]);
}
```

---

### 5. Custom Hook: Async Data Fetching

```javascript
// src/hooks/useAsyncData.js
import { useState, useEffect } from 'react';

/**
 * Fetch data asynchronously with loading and error states
 * @param {function} fetchFn - Async function that returns data
 * @param {array} dependencies - useEffect dependencies
 * @returns {{ data, loading, error, refetch }}
 */
export function useAsyncData(fetchFn, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await fetchFn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      console.error('useAsyncData error:', error);
      setState({ data: null, loading: false, error: error.message });
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      
      try {
        const data = await fetchFn();
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          console.error('useAsyncData error:', error);
          setState({ data: null, loading: false, error: error.message });
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return {
    ...state,
    refetch: load,
  };
}
```

---

### 6. Error Boundary Component

```javascript
// src/components/ErrorBoundary.jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
    
    // TODO: Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  Something went wrong
                </h2>
                <p className="text-sm text-slate-400">
                  We're sorry for the inconvenience
                </p>
              </div>
            </div>
            
            {this.state.error && (
              <div className="bg-slate-900 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-400 font-mono">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### 7. Loading Spinner Component

```javascript
// src/components/LoadingSpinner.jsx
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        border-amber-500 border-t-transparent
        rounded-full animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
```

---

### 8. Avatar Component with Presence

```javascript
// src/components/Avatar.jsx
export function Avatar({ src, name, isOnline, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const initial = name?.[0]?.toUpperCase() || '?';

  return (
    <div className="relative">
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full overflow-hidden
          border-2
          ${isOnline ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'border-slate-600'}
          ${!isOnline && 'grayscale'}
          transition-all duration-300
        `}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold">
            {initial}
          </div>
        )}
      </div>
      
      {isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-slate-900 animate-pulse" />
      )}
    </div>
  );
}
```

---

### 9. Top Bar Component

```javascript
// src/components/TopBar.jsx
import { Home } from 'lucide-react';
import { Avatar } from './Avatar';
import { useApp } from '@/contexts/AppContext';

export function TopBar() {
  const { state } = useApp();
  const { partner, presence, currentRoom } = state;

  const getBreadcrumbText = () => {
    if (!partner) return 'Lover-HQ';
    
    if (presence.partner) {
      const roomLabels = {
        fridge: 'on the Fridge',
        music: 'in the Music Room',
        games: 'playing a game',
        reveal: 'answering a question',
        board: 'planning adventures',
        profile: 'checking your profile',
      };
      
      return `${partner.name} is ${roomLabels[currentRoom] || 'exploring'}`;
    }
    
    return `${partner.name} was here`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-screen-sm mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-amber-500" />
          <span className="font-bold text-slate-100 text-lg">Lover-HQ</span>
        </div>
        
        {/* Dynamic Breadcrumb */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <p className="text-sm text-slate-400 animate-fade-in">
            {getBreadcrumbText()}
          </p>
        </div>
        
        {/* Partner Avatar */}
        {partner && (
          <Avatar
            src={partner.avatar_url}
            name={partner.name}
            isOnline={presence.partner}
            size="sm"
          />
        )}
      </div>
    </header>
  );
}
```

---

### 10. Bottom Nav Component

```javascript
// src/components/BottomNav.jsx
import { Home, Music, Gamepad2, HelpCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

export function BottomNav() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { currentRoom } = state;

  const rooms = [
    { id: 'fridge', label: 'Fridge', icon: Home, path: '/' },
    { id: 'music', label: 'Music', icon: Music, path: '/music' },
    { id: 'games', label: 'Games', icon: Gamepad2, path: '/games' },
    { id: 'reveal', label: 'Reveal', icon: HelpCircle, path: '/reveal' },
    { id: 'board', label: 'Board', icon: MapPin, path: '/board' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800">
      <div className="max-w-screen-sm mx-auto px-4 h-16 flex items-center justify-center gap-2">
        <p className="text-sm text-slate-400">
          {rooms.find(r => r.id === currentRoom)?.label || 'Home'}
        </p>
        
        {/* Elevated Home Button */}
        <button
          onClick={() => navigate('/hub')}
          className="
            absolute left-1/2 -translate-x-1/2 -top-8
            w-16 h-16 rounded-full
            bg-amber-500 hover:bg-amber-600
            shadow-lg shadow-amber-500/30
            flex items-center justify-center
            transition-all duration-200
            active:scale-95
          "
          aria-label="Open Hub"
        >
          <Home className="w-6 h-6 text-slate-900" />
        </button>
      </div>
    </nav>
  );
}
```

---

### 11. Design Tokens (Tailwind Config)

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          900: '#0F172A', // background
          800: '#1E293B', // surface
          700: '#334155', // border
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1', // text-secondary
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',  // text-primary
        },
        amber: {
          500: '#F59E0B', // primary (dark theme)
        },
        pink: {
          500: '#EC4899', // primary (light theme)
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Nunito', 'system-ui', 'sans-serif'],
        handwriting: ['Caveat', 'cursive'],
      },
      fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
      },
      spacing: {
        1: '0.25rem',  // 4px
        2: '0.5rem',   // 8px
        3: '0.75rem',  // 12px
        4: '1rem',     // 16px
        6: '1.5rem',   // 24px
        8: '2rem',     // 32px
        12: '3rem',    // 48px
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
```

---

### 12. Environment Variables Template

```bash
# .env.local (DO NOT COMMIT THIS FILE)

# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Analytics
# VITE_SENTRY_DSN=https://...
```

---

### 13. JSDoc Type Definitions

```javascript
// src/types/index.js

/**
 * @typedef {Object} User
 * @property {string} id - UUID
 * @property {string} name - Display name
 * @property {string} avatar_url - Supabase Storage URL
 * @property {string|null} partner_id - Partner's user ID
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} FridgeItem
 * @property {string} id - UUID
 * @property {string} user_id - Creator's ID
 * @property {'note'|'photo'|'voice'} type - Item type
 * @property {string} content - Text or storage URL
 * @property {number} x_position - Canvas X coordinate (0-1)
 * @property {number} y_position - Canvas Y coordinate (0-1)
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} MusicTrack
 * @property {string} id - UUID
 * @property {string} added_by - User ID
 * @property {string} title - Track title
 * @property {string} artist - Artist name
 * @property {'upload'|'youtube'|'spotify'} source - Source type
 * @property {string} url - Storage URL or external link
 * @property {number} duration_seconds - Track length
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} RevealQuestion
 * @property {string} id - UUID
 * @property {string} question - Prompt text
 * @property {string} user_a_id - First user ID
 * @property {string|null} user_a_answer - First user's answer
 * @property {string} user_b_id - Second user ID
 * @property {string|null} user_b_answer - Second user's answer
 * @property {boolean} revealed - True when both answered
 * @property {string} date - YYYY-MM-DD
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} BoardItem
 * @property {string} id - UUID
 * @property {string} created_by - User ID
 * @property {string} title - Item title
 * @property {'travel'|'movies'|'food'|'life_goals'} category - Category
 * @property {string|null} link_url - External URL
 * @property {boolean} user_a_hearted - First user's vote
 * @property {boolean} user_b_hearted - Second user's vote
 * @property {boolean} completed - Completion status
 * @property {string|null} completed_at - ISO timestamp
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} GameSession
 * @property {string} id - UUID
 * @property {'three_mens_morris'} game_type - Game type
 * @property {string} player_a_id - First player ID
 * @property {string} player_b_id - Second player ID
 * @property {string} current_turn - Current player's ID
 * @property {Object} board_state - Game board JSON
 * @property {'placement'|'movement'} phase - Current phase
 * @property {string|null} winner_id - Winner's ID (null if ongoing)
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */
```

---

## Common Patterns

### Pattern: Optimistic UI Updates

```javascript
async function createFridgeNote(content, x, y) {
  const tempId = crypto.randomUUID();
  const tempItem = {
    id: tempId,
    type: 'note',
    content,
    x_position: x,
    y_position: y,
    created_at: new Date().toISOString(),
  };

  // 1. Update UI immediately
  setItems((prev) => [...prev, tempItem]);

  try {
    // 2. Save to database
    const { data, error } = await supabase
      .from('fridge_items')
      .insert({
        type: 'note',
        content,
        x_position: x,
        y_position: y,
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Replace temp item with server data
    setItems((prev) =>
      prev.map((item) => (item.id === tempId ? data : item))
    );
  } catch (error) {
    // 4. Rollback on error
    setItems((prev) => prev.filter((item) => item.id !== tempId));
    console.error('Failed to create note:', error);
    alert('Failed to create note. Please try again.');
  }
}
```

---

### Pattern: Debounced Real-time Broadcast

```javascript
import { useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

function useDebouncedBroadcast(channelName, event, delay = 300) {
  const timeoutRef = useRef(null);

  const broadcast = useCallback(
    (payload) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        supabase.channel(channelName).send({
          type: 'broadcast',
          event,
          payload,
        });
      }, delay);
    },
    [channelName, event, delay]
  );

  return broadcast;
}

// Usage: Drag fridge item
function FridgeItem({ item }) {
  const broadcastDrag = useDebouncedBroadcast('fridge', 'drag', 100);

  const handleDrag = (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    broadcastDrag({ itemId: item.id, x, y });
  };

  return (
    <div
      draggable
      onDrag={handleDrag}
      style={{ left: `${item.x_position * 100}%`, top: `${item.y_position * 100}%` }}
    >
      {item.content}
    </div>
  );
}
```

---

### Pattern: Protected Route

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { LoadingSpinner } from './LoadingSpinner';

export function ProtectedRoute({ children, requirePaired = false }) {
  const { state } = useApp();
  const { user, loading } = state;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requirePaired && !user.partner_id) {
    return <Navigate to="/pairing" replace />;
  }

  return children;
}
```

---

This covers all essential patterns for the Lover-HQ app. Copy these into your codebase as needed.
