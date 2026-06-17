# Project: Music Room Redesign and Bug Fixes

## Architecture
The Music Room feature consists of a frontend interface connected to a Supabase backend for queue storage, file uploads, and real-time synchronization.

- **Storage / Database**: 
  - `storage.buckets`: Public bucket `music-media` for uploaded tracks.
  - `public.music_queue`: DB table tracking the list of queued tracks (YouTube videos or uploaded files).
- **Core State Orchestration**:
  - `MusicContext.jsx`: Manages active track, player states, playback operations, and sync channels.
  - `useMusicSync.js`: Syncs playback events (play, pause, seek, heartbeat drift correction) over Supabase Realtime Broadcast.
- **Media Engine**:
  - HTML5 audio element for files uploaded by users.
  - YouTube Iframe API for YouTube videos.
- **UI Components**:
  - `Music.jsx`: Main room page container.
  - `MusicPlayer.jsx`: Visualizer canvas, play control panel, circular rotating vinyl, and time/volume sliders.
  - `MiniPlayer.jsx`: Blur glassmorphic floating player bar.
  - `Queue.jsx`: List of upcoming tracks with drag-and-drop / button-based reordering.
  - `AddTrackModal.jsx`: Modal for uploading new tracks or pasting YouTube URLs.

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Utils & Storage Config | Public bucket migration, client MIME type checks, native `<dialog>`, blob URL lifetime, `musicEngine` unit fixes | None | IN_PROGRESS (ConvID: 9fd391fa-9ea4-4378-a8e1-cccd0deac2b0) |
| M2 | Core Player & Sync Refactoring | Decompose `MusicContext.jsx` into modular hooks; fix critical sync loop race conditions, ref swapping, and HMR singleton issues | M1 | PLANNED |
| M3 | Premium UI/UX & Real Visualizer | Web Audio API visualizer, circular rotating vinyl art, glassmorphic MiniPlayer, revamped Queue, emoji-to-SVG assets, accessibility, prefers-reduced-motion | M2 | PLANNED |
| M4 | E2E Integration & Hardening | Dual-track final validation. Phase 1: Pass 100% of Tiers 1-4. Phase 2: Adversarial hardening (Tier 5) with Challenger/Auditor verification | M3, E2E | PLANNED |
| E2E | E2E Test Suite | Requirement-driven opaque-box testing track. Build test runner, write tests for Tiers 1-4, publish `TEST_READY.md` | None | IN_PROGRESS (ConvID: acec6f43-3de2-4815-aaa8-332f9c3be725) |

## Interface Contracts

### Media Players ↔ Music Context
The context should expose:
- `currentTrack`: `Track | null`
- `isPlaying`: `boolean`
- `currentTime`: `number`
- `duration`: `number`
- `volume`: `number`
- `playTrackById(trackId: string, timestamp?: number)`: `Promise<void>`
- `resumeLocalPlayback()`: `Promise<void>`
- `pauseLocalPlayback(broadcast?: boolean)`: `void`
- `seekLocalPlayback(timestamp: number, broadcast?: boolean)`: `void`

### Sync Service ↔ Music Context
- `onRemotePlay(trackId: string, timestamp: number)`: Called when partner starts play.
- `onRemotePause(timestamp: number)`: Called when partner pauses.
- `onRemoteSeek(timestamp: number)`: Called when partner scrubs.
- `getCurrentTimeHelper()`: Returns the exact, non-stale active player timestamp.

## Code Layout
- `src/features/music/lib/musicEngine.js`: Framework-agnostic audio utilities.
- `src/features/music/hooks/useHtml5Player.js` (new): Manages HTML5 audio player.
- `src/features/music/hooks/useYoutubePlayer.js` (new): Manages YouTube IFrame player.
- `src/features/music/hooks/useCrossfade.js` (new): Handles volume crossfading.
- `src/features/music/hooks/useQueueDb.js` (new): Handles DB operations & debounced realtime sync.
- `src/contexts/MusicContext.jsx`: Thin context wrapper using decomposed hooks.
- `src/features/music/components/`: Front-end components (`MusicPlayer.jsx`, `Queue.jsx`, `AddTrackModal.jsx`).
- `src/components/MiniPlayer.jsx`: Floating player widget.
