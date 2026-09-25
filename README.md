# 🏠 Lover-HQ

A private digital sanctuary for long-distance couples, built with love, React 19, and Supabase.

## 🎯 Project Overview

Lover-HQ is a mobile-first Progressive Web App (PWA) designed for two people in a long-distance relationship. It's not a generic messaging app—it's a **private digital house** featuring dedicated rooms designed to maintain intimacy and shared presence:

- **🎨 The Fridge**: A shared canvas for notes, photos, voice recordings, magnet comments, reactions, and quick speed-dial actions.
- **🎵 The Music Room**: Synchronized listening with an off-thread AudioWorklet DSP, 3D visualizers, YouTube & HTML5 playback engines, dynamic crossfading, and shared queues.
- **💬 Intimate Chat**: Real-time messaging with voice notes and animated waveform previews, animated stickers, rich media lightboxes, pinned messages, and message reply threads.
- **🎲 Games Arcade**: 6 real-time and turn-based games (Quick Draw, Three Men's Morris, Tic-Tac-Toe, Word Chain, Math Puzzle, Scrabble) with move replay recording.
- **🔓 The Blind Reveal**: Daily blind Q&A where responses unlock only when both partners answer, featuring custom question queues and Memory Lane archives.
- **📍 The Board**: A collaborative bucket list for future adventures, milestones, and shared dreams.
- **👤 Partner Profile**: A partner-centric hub featuring real-time mood check-ins, milestone countdowns, and anniversary tracking.
- **⚙️ Settings & Privacy**: Granular control over sound effects, haptics, theme appearance, storage caching, and pairing data.
- **🏡 Home**: Central dashboard providing a quick ambient pulse of your partner's active room and status.

## 🚀 Tech Stack

| Domain | Technology |
|---|---|
| **Frontend Framework** | React 19.2 + Vite 8 |
| **Routing** | React Router v7 |
| **Styling** | Tailwind CSS with brand design tokens |
| **Motion & 3D** | Framer Motion + Three.js (`@react-three/fiber`, `@react-three/drei`, `postprocessing`) |
| **Audio Processing** | Web Audio API + AudioWorklet (off-thread spectral flux & BPM tracking) |
| **Backend & Realtime** | Supabase (PostgreSQL, Realtime Broadcast & Presence, Storage, Auth) |
| **Monitoring** | Sentry (`@sentry/react`) |
| **PWA & Offline** | Vite PWA Plugin + Workbox Service Worker |
| **Package Manager** | `pnpm` (strictly enforced) |
| **Testing** | Vitest (400+ unit tests), Playwright (E2E), Stryker (Mutation testing) |

## 📁 Project Structure

```
/src
  /assets              # Static artwork, sound effects, and avatars
  /components          # Shared UI components (MiniPlayer, GlassDropdown, Notification)
  /contexts            # Core state providers (AppContext, MusicContext)
  /features            # 10 modular lazy-loaded feature rooms
    /auth              # Onboarding, pairing codes, and invite links
    /board             # Bucket list and milestones
    /chat              # Intimate chat, voice notes, stickers, and lightbox
    /fridge            # Interactive whiteboard canvas, magnets, comments
    /games             # Turn-based and real-time multiplayer games suite
    /home              # Ambient dashboard hub
    /music             # Audio player, queue, visualizers, and playlists
    /profile           # Partner-centric profile and mood tracker
    /reveal            # Daily blind Q&A and Memory Lane
    /settings          # Audio, notification, and data management panels
  /hooks               # Reusable hooks (usePresence, useOfflineQueue, useAudioProcessor)
  /lib                 # Supabase client singleton, icons, and constants
  /services            # Data services (fridge, dictionary)
  /types               # JSDoc type definitions
  /utils               # Geometry, compression, notification, and time helpers
  App.jsx              # Main routing and presence orchestration
  main.jsx             # React 19 application entry point
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 20+
- `pnpm` (`npm install -g pnpm` or `corepack enable`)
- Supabase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd lover-hq
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Run migrations**
   Apply SQL files from `/supabase/migrations/` in your Supabase SQL editor or CLI.

5. **Start local development**
   ```bash
   pnpm dev
   ```
   Open `http://localhost:5173` in your browser.

## 🧪 Testing & Verification

```bash
# Run unit test suite (Vitest)
pnpm test:run

# Run linter
pnpm lint

# Production build check
pnpm build

# Mutation testing
pnpm test:mutation
```

## 🔐 Architecture & Security

- **Row Level Security (RLS)**: Enforced across all Supabase PostgreSQL tables; partners can only access their shared couple records.
- **Singleton Client**: Centralized Supabase client in `src/lib/supabase.js` prevents connection duplication.
- **Offline Resilient**: Local caching via `useOfflineQueue` with atomic reconciliation and mutex guards.
- **Realtime Presence**: High-performance in-memory presence tracking decoupled from navigation to prevent state flickers.

## 📚 Documentation Sitemap

- [doc/ARCHITECTURE.md](file:///c:/lover%20hq/doc/ARCHITECTURE.md) - System architecture, state topology, audio DSP, and realtime sync
- [doc/MODULES.md](file:///c:/lover%20hq/doc/MODULES.md) - Component and feature module responsibility breakdown
- [doc/DECISIONS.md](file:///c:/lover%20hq/doc/DECISIONS.md) - Architecture Decision Records (ADRs)
- [doc/AGENTS.md](file:///c:/lover%20hq/doc/AGENTS.md) - Coding standards and agent guardrails
- [doc/BRANDING.md](file:///c:/lover%20hq/doc/BRANDING.md) - Design tokens, color palette, and typography standards

