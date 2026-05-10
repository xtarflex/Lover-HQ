# 🏗️ Lover-HQ Technical Architecture

## Overview
Lover-HQ is a mobile-first Progressive Web App (PWA) built for two users in a long-distance relationship. The architecture prioritizes real-time synchronization, offline capability, and intimate user experience.

## Tech Stack

### Frontend
- **Framework**: React 18+ with Vite
- **Language**: JavaScript with JSDoc type annotations
- **Styling**: Tailwind CSS with custom design tokens
- **Routing**: React Router v6 with lazy loading
- **State Management**: Context API + useReducer pattern
- **Icons**: Lucide React (stroke-based, 24px)

### Backend & Infrastructure
- **BaaS**: Supabase (PostgreSQL + Real-time + Storage + Auth)
- **Hosting**: Netlify with automatic deployments
- **CDN**: Netlify Edge for global distribution
- **PWA**: Vite PWA Plugin with Workbox

### Real-time Features
- **Presence**: Supabase Realtime Presence API
- **Broadcast**: Supabase Realtime Broadcast for music sync and fridge dragging
- **Database Subscriptions**: For Q&A reveals and game state updates

## Core Architectural Principles

### 1. Singleton Pattern for External Services
```javascript
// ❌ WRONG - Multiple instances
function Component() {
  const supabase = createClient(url, key); // Creates new instance!
}

// ✅ CORRECT - Single instance
import { supabase } from '@/lib/supabase'; // Reuses singleton
```

### 2. Centralized State Management
```javascript
// Global app state structure
{
  user: {
    id: string,
    name: string,
    avatar_url: string,
    partner_id: string | null
  },
  partner: {
    id: string,
    name: string,
    avatar_url: string,
    isOnline: boolean,
    currentRoom: string,
    mood: string | null
  },
  presence: {
    user: boolean,
    partner: boolean
  },
  currentRoom: 'fridge' | 'music' | 'games' | 'reveal' | 'board' | 'profile',
  fridgeItems: FridgeItem[],
  musicQueue: MusicTrack[],
  reveals: RevealQuestion[],
  // ... etc
}
```

### 3. Feature-Based Folder Structure
```
/src
  /assets              # Static files (logo, fonts)
  /components          # Shared UI components
    - ErrorBoundary.jsx
    - TopBar.jsx
    - BottomNav.jsx
    - LoadingSpinner.jsx
    - Avatar.jsx
  /contexts            # Global state
    - AppContext.jsx
  /features            # Lazy-loaded feature modules
    /auth
      - Onboarding.jsx
      - PairingFlow.jsx
    /fridge
      - Fridge.jsx
      - FridgeItem.jsx
      - useFridgeDrag.js
    /music
      - MusicPlayer.jsx
      - Queue.jsx
      - useMusicSync.js
    /games
      - GameHub.jsx
      - ThreeMensMorris.jsx
      - useGameState.js
    /reveal
      - DailyQuestion.jsx
      - Archive.jsx
      - useRevealLogic.js
    /board
      - BucketList.jsx
      - BoardItem.jsx
      - useBoardSync.js
    /profile
      - PartnerProfile.jsx
      - MoodTracker.jsx
      - Countdown.jsx
  /hooks               # Shared custom hooks
    - useSupabase.js
    - usePresence.js
    - useRealtimeSubscription.js
    - useAsyncData.js
  /lib                 # Core utilities
    - supabase.js      # Singleton client
    - constants.js     # Design tokens
    - helpers.js       # Utility functions
  /types               # Type definitions
    - index.js         # JSDoc typedefs
  App.jsx              # Root component with routing
  main.jsx             # Entry point
```

### 4. Error Handling Strategy
- **Component Level**: Error boundaries wrap each feature
- **Data Fetching**: Try-catch with user-friendly error messages
- **Network Failures**: Offline indicators with retry mechanisms
- **Validation**: Client-side + server-side via RLS policies

### 5. Performance Optimizations
- **Code Splitting**: Lazy load all feature routes
- **Image Optimization**: Compress uploads, use WebP format
- **Caching Strategy**: 
  - Static assets: Cache-first
  - API calls: Network-first with fallback
  - Media uploads: Cache-first (30-day expiration)
- **Bundle Size**: Target < 200KB initial load

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  pairing_code TEXT UNIQUE,
  partner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own and partner data"
ON users FOR SELECT
USING (auth.uid() = id OR auth.uid() = partner_id);

CREATE POLICY "Users can update partner profile only"
ON users FOR UPDATE
USING (auth.uid() = partner_id)
WITH CHECK (auth.uid() = partner_id);
```

### Fridge Items Table
```sql
CREATE TABLE fridge_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type TEXT CHECK (type IN ('note', 'photo', 'voice')) NOT NULL,
  content TEXT NOT NULL,
  x_position FLOAT NOT NULL,
  y_position FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Both users can CRUD fridge items
CREATE POLICY "Paired users can manage fridge"
ON fridge_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (partner_id = fridge_items.user_id OR id = fridge_items.user_id)
  )
);
```

### Music Queue Table
```sql
CREATE TABLE music_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  added_by UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  source TEXT CHECK (source IN ('upload', 'youtube', 'spotify')) NOT NULL,
  url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Paired users can view and add to queue
CREATE POLICY "Paired users can manage queue"
ON music_queue FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (partner_id = music_queue.added_by OR id = music_queue.added_by)
  )
);
```

### Reveals (Q&A) Table
```sql
CREATE TABLE reveals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  user_a_id UUID REFERENCES users(id) NOT NULL,
  user_a_answer TEXT,
  user_b_id UUID REFERENCES users(id) NOT NULL,
  user_b_answer TEXT,
  revealed BOOLEAN GENERATED ALWAYS AS (
    user_a_answer IS NOT NULL AND user_b_answer IS NOT NULL
  ) STORED,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only see their own answer until both submitted
CREATE POLICY "Users can view own answer"
ON reveals FOR SELECT
USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Users can submit own answer"
ON reveals FOR UPDATE
USING (
  (auth.uid() = user_a_id AND user_a_answer IS NULL) OR
  (auth.uid() = user_b_id AND user_b_answer IS NULL)
);
```

### Board (Bucket List) Table
```sql
CREATE TABLE board_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('travel', 'movies', 'food', 'life_goals')) NOT NULL,
  link_url TEXT,
  user_a_hearted BOOLEAN DEFAULT FALSE,
  user_b_hearted BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Paired users can manage board items
CREATE POLICY "Paired users can manage board"
ON board_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (partner_id = board_items.created_by OR id = board_items.created_by)
  )
);
```

### Game State Table
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_type TEXT CHECK (game_type IN ('three_mens_morris')) NOT NULL,
  player_a_id UUID REFERENCES users(id) NOT NULL,
  player_b_id UUID REFERENCES users(id) NOT NULL,
  current_turn UUID REFERENCES users(id) NOT NULL,
  board_state JSONB NOT NULL,
  phase TEXT CHECK (phase IN ('placement', 'movement')) NOT NULL,
  winner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Only the two players can access game state
CREATE POLICY "Players can manage game"
ON game_sessions FOR ALL
USING (auth.uid() = player_a_id OR auth.uid() = player_b_id);
```

### Presence Tracking
```sql
CREATE TABLE presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  is_online BOOLEAN DEFAULT FALSE,
  current_room TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can view partner's presence
CREATE POLICY "Users can view partner presence"
ON presence FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (partner_id = presence.user_id OR id = presence.user_id)
  )
);

CREATE POLICY "Users can update own presence"
ON presence FOR UPDATE
USING (auth.uid() = user_id);
```

## Real-time Channels

### Music Sync Channel
```javascript
// Channel name: `music-sync:${pairId}`
// Events:
// - 'play': { timestamp: number, trackId: string }
// - 'pause': { timestamp: number }
// - 'seek': { timestamp: number }
// - 'skip': { trackId: string }
```

### Fridge Drag Channel
```javascript
// Channel name: `fridge:${pairId}`
// Events:
// - 'drag': { itemId: string, x: number, y: number }
// - 'create': { item: FridgeItem }
// - 'delete': { itemId: string }
```

### Presence Channel
```javascript
// Channel name: `presence:${pairId}`
// Uses Supabase Presence API
// Tracks: { user_id, current_room, timestamp }
```

## Authentication Flow

### Pairing Process
1. **User A**: 
   - Creates account → generates 6-digit pairing code
   - Shares code with User B
2. **User B**: 
   - Opens app → enters pairing code
   - System validates code → links accounts (sets partner_id on both users)
3. **Post-Pairing**:
   - Both users can now access shared data
   - Profile tab shows partner's editable details

### Session Management
- JWT tokens stored in Supabase auth (auto-refresh enabled)
- Session persists across browser restarts
- Manual logout clears session

## PWA Configuration

### Manifest
```json
{
  "name": "Lover-HQ",
  "short_name": "LoverHQ",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#F59E0B",
  "background_color": "#0F172A",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker Strategy
- **Static Assets**: Cache-first with 30-day expiration
- **API Calls**: Network-first with cache fallback
- **Media Uploads**: Cache-first (optimistic UI updates)
- **Offline Fallback**: Show cached fridge state

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access data where they are a participant or partner
- Profile edits restricted to partner's data only

### Content Security
- Image uploads: Max 1MB, validated MIME types
- Voice notes: Max 5MB, audio/* only
- XSS protection: All user content sanitized before rendering

### API Key Management
- Supabase anon key is public (by design)
- RLS policies protect sensitive data
- No private keys exposed in frontend

## Monitoring & Analytics

### Error Tracking
- Client-side errors logged to Supabase Edge Functions
- Critical errors trigger fallback UI (Error Boundary)

### Performance Metrics
- Track page load times
- Monitor real-time connection stability
- Measure media upload success rates

### User Analytics (Privacy-First)
- No third-party analytics
- Internal metrics: daily active pairs, feature usage
- No PII logged

## Deployment Pipeline

### Development
1. Local dev: `npm run dev`
2. Feature branch → PR to `main`
3. Netlify deploys preview URL
4. Manual review and merge

### Production
1. Merge to `main` triggers auto-deploy
2. Netlify builds and deploys to production
3. Service worker updates propagate to clients
4. Database migrations run via Supabase CLI

## Scalability Considerations

### Current (2 Users)
- Single Supabase project (free tier)
- Netlify free tier (100GB bandwidth)
- No CDN caching needed

### Future (Multiple Pairs)
- Partition data by pair_id for performance
- Add database indexes on partner_id columns
- Implement rate limiting on real-time channels
- Consider dedicated hosting for high-traffic features
