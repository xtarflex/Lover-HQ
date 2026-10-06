# 📦 Lover-HQ Module Reference Guide

This document maps all feature rooms, shared components, custom hooks, services, and utilities across the codebase.

---

## 1. Feature Rooms (`src/features/*`)

Lover-HQ is organized into 10 lazy-loaded feature modules rendered via React Router v7:

### 🏠 Home (`src/features/home`)
- **`Home.jsx`**: Central dashboard for the couple's digital house. Renders ambient room presence cards, active partner status pills, quick action shortcuts, and milestone countdown previews.

### 🎨 The Fridge (`src/features/fridge`)
- **`Fridge.jsx`**: Interactive 2D drag-and-drop shared canvas. Supports placement and synchronization of yellow/pink/blue sticky notes, photo polaroids, voice notes, and decorative magnets.
- **`components/FridgeItem.jsx`**: Memoized draggable canvas element using Framer Motion physics, snap-to-grid calculations, audio playback progress indicators, and comment badges.
- **`components/FridgeSpeedDial.jsx`**: Floating Action Button (FAB) radial menu for rapidly creating notes, uploading photos, recording voice clips, or clearing stale items.
- **`components/MagnetCommentDrawer.jsx`**: Bottom drawer enabling threaded micro-discussions, emoji reactions, and read status indicators on specific fridge magnets.
- **`hooks/useFridgeSync.js`**: Orchestrates optimistic Supabase CRUD, offline item caching, and Realtime database change subscriptions.
- **`hooks/useFridgeAudio.js`**: Synthesizes custom tactile Web Audio clicks, pin drops, and peel sound effects.
- **`hooks/useFridgeZoom.js`**: Smooth pinch-to-zoom and canvas panning navigation.

### 🎵 The Music Room (`src/features/music`)
- **`Music.jsx`**: Dual-sided turntable player interface (Now Playing turntable face + Collection Management queue face).
- **`components/NowPlayingFace.jsx`**: Active turntable vinyl disc, cover artwork, playback controls, scrub bar, dynamic background glow, and listen-along status.
- **`components/CollectionManagementFace.jsx`**: Playlist curation, track library, search, and queue reordering.
- **`components/visualizers/*`**: WebGL and 2D canvas visualizers (`CircularRingVisualizer`, `FluidVisualizer`, `VinylDiscVisualizer`, `WaveBarVisualizer`) driven by audio spectrum analysis.
- **`hooks/useHtml5Player.js`**: High-performance HTML5 `<audio>` player with throttled time tracking and error fallbacks.
- **`hooks/useYoutubePlayer.js`**: Dual hidden iframe YouTube player deck for seamless crossfading between video audio tracks.
- **`hooks/useCrossfade.js`**: Equal-power crossfade transition engine blending primary and standby decks.
- **`hooks/useAudioProcessor.js`**: Off-thread AudioWorklet metrics consumer with dynamic high-water mark peak normalization.
- **`hooks/useMusicSync.js`**: Real-time play, pause, seek, and drift-correcting heartbeat broadcast synchronization.

### 💬 Intimate Chat (`src/features/chat`)
- **`Chat.jsx`**: Private asynchronous messaging space tailored for long-distance partners.
- **`components/MessageList.jsx`**: Virtualized message list with group clustering, date dividers, and reply anchors.
- **`components/ChatInputForm.jsx`**: Input form with auto-expanding textarea, haptic feedback, voice recording triggers, and sticker drawer toggles.
- **`components/VoiceMessagePlayer.jsx`**: Inline audio player displaying 25 reactive waveform bars and scrub controls.
- **`components/VoiceRecorderBar.jsx`**: Live audio recording bar with real-time waveform visualizer and cancel/send triggers.
- **`components/ImageLightbox.jsx`**: Full-screen high-resolution media viewer with zoom and swipe-to-dismiss.
- **`components/PinnedMessageBanner.jsx`**: Sticky carousel banner for treasured messages and important reminders.
- **`components/AttachmentBottomSheet.jsx`**: Native-feeling drawer for attaching fridge items, photos, or audio snippets.
- **`hooks/useChatMessages.js`**: Optimistic message sending, Realtime channel subscriptions, and offline caching.
- **`hooks/useChatTyping.js`**: Debounced real-time partner typing indicators over Realtime broadcast.
- **`hooks/useVoiceRecorder.js`**: MediaRecorder wrapper capturing Opus/WAV voice audio with canvas waveform sampling.

### 🎲 Games Arcade (`src/features/games`)
- **`Games.jsx` & `GameLobby.jsx`**: Multi-game lobby with live invitation tracking and active session management.
- **`games/quickDraw`**: Real-time cooperative drawing game with canvas stroke batching (32ms throttled) and guess validation.
- **`games/threeMensMorris`**: Ancient strategy alignment game with placement and movement phases.
- **`games/ticTacToe`**: Quick turn-based classic match with celebration bursts and emoji reactions.
- **`games/wordChain`**: Vocabulary chain game with dictionary definition lookups and countdown timers.
- **`games/mathPuzzle`**: Cooperative arithmetic grid solver with worker-based puzzle generation (`generator.worker.js`).
- **`games/scrabble`**: Tile rack and dictionary scoring board game with tile bag randomization.
- **`lib/gameRecorder.js`**: Lightweight move recorder saving turn-by-turn replay data to `game_replays`.
- **`hooks/useGameSync.js`**: Zero-latency peer-to-peer game moves over Supabase Realtime broadcast channels.

### 🔓 The Blind Reveal (`src/features/reveal`)
- **`Reveal.jsx`**: Daily blind intimacy prompts where answers remain blurred until both partners submit their responses.
- **`components/DailyQuestionCard.jsx`**: Flip card rendering the prompt, local response editor, and partner answer reveal states.
- **`components/CustomQuestionQueue.jsx`**: Queue for couples to craft custom future questions for each other.
- **`components/MemoryLane.jsx`**: Filterable chronological archive of past questions, answers, and anniversaries.
- **`hooks/useDailyQuestion.js`**: Deterministic daily question rotation based on date hashes.
- **`hooks/useRevealData.js`**: Supabase data subscription with RLS enforcement.

### 📍 The Board (`src/features/board`)
- **`Board.jsx`**: Shared bucket list and adventure planner.
- **`components/BoardCategory.jsx`**: Categorized lists (Travel, Food, Movies, Life Goals).
- **`components/BoardItem.jsx`**: Interactive bucket list card with mutual heart voting and completion stamps.
- **`components/CompleteItemModal.jsx`**: Celebration modal prompting couples to attach a photo or memory upon completing a goal.

### 👤 Partner Profile (`src/features/profile`)
- **`Profile.jsx`**: Partner-centric hub displaying the partner's status, editable nickname, avatar, and countdowns.
- **`components/PartnerDetailsForm.jsx`**: Allows editing partner details with optimistic sync.
- **`components/PairingSetup.jsx`**: 6-digit pairing code generator and verification modal.
- **`components/ReconnectInvitesPanel.jsx`**: Handles reconnection invites and repair flows.

### ⚙️ Settings (`src/features/settings`)
- **`Settings.jsx`**: Comprehensive configuration suite.
- **`components/*Panel.jsx`**: Modular preference panels covering Audio/Haptics (`ChatSettingsPanel`), Fridge Auto-cleanup (`FridgeSettingsPanel`), Game Preferences (`GameSettingsPanel`), Audio Quality (`MusicSettingsPanel`), and Cache Purging (`DataManagementPanel`).

### 🔐 Authentication & Onboarding (`src/features/auth`)
- **`Auth.jsx`**: Authentication entry point supporting anonymous sessions and magic links.
- **`Onboarding.jsx`**: Step-by-step profile onboarding wizard.
- **`PairingModal.jsx`**: Initial setup code entry for linking partner accounts.

---

## 2. Core Context Providers (`src/contexts/*`)

### `AppContext.jsx`
- **Purpose**: Global application session management.
- **Exports**: `AppContext`, `useAppContext`, `useAppDispatch`, `AppProvider`.
- **State**: User authentication identity, partner profile, active room presence, global toasts, and live invitations.

### `MusicContext.jsx`
- **Purpose**: Global audio player, queue management, and Realtime listen-along engine.
- **Exports**: `MusicContext`, `useMusic`, `MusicProvider`.
- **State**: Track queue, playlists, active player (`html5` | `youtube`), throttled `currentTime`, audio worklet nodes, and crossfader controls. Wrapped in `useMemo` to eliminate cascading re-renders.

---

## 3. Shared Hooks (`src/hooks/*`)

| Hook | Purpose |
|---|---|
| **`usePresence.js`** | Manages persistent Supabase Realtime presence channel across route transitions with monotonic sequence guards. |
| **`useOfflineQueue.js`** | Offline mutation queue for creations, updates, and deletions with in-flight mutex and atomic set reconciliation. |
| **`useSupabase.js`** | Accesses the shared Supabase singleton client. |
| **`useAsyncData.js`** | Standardized asynchronous fetch hook with loading, data, and error boundaries. |
| **`useAuthSync.js`** | Synchronizes local auth tokens and session status with Supabase Auth state changes. |
| **`usePreferences.js`** | Multi-device user preferences synchronization backed by PostgreSQL and Realtime updates. |
| **`useSyncPreferencesToStorage.js`** | Mirrors cloud user preferences into `localStorage` design tokens. |
| **`useSpeculativePreload.js`** | Preloads lazy chunk routes on hover/touch triggers for instant navigation. |
| **`useKeyboardHeight.js`** | Tracks mobile virtual keyboard height for responsive chat input positioning. |

---

## 4. Shared UI Components (`src/components/*`)

- **`TopBar.jsx`**: Minimalist header showing Lover-HQ branding, partner activity pill, and online presence beacon.
- **`BottomNav.jsx`**: Floating bottom navigation bar with active room indicators and elevated Home hub button.
- **`MiniPlayer.jsx`**: Persistent, draggable mini music player bar visible across all rooms during playback.
- **`ErrorBoundary.jsx`**: Graceful error boundary catching unexpected React render exceptions with retry controls.
- **`GlassDropdown.jsx`**: Glassmorphism dropdown menu with animated Framer Motion transitions.
- **`LoadingSpinner.jsx`**: Accessible loading spinner with configurable sizes and themes.
- **`Notification.jsx`**: Global floating toast notification system.
- **`OfflineIndicator.jsx`**: Subtle banner displayed when the device loses internet connectivity.
- **`InstallPrompt.jsx`**: PWA install prompt banner for mobile home screen installation.

---

## 5. Services & Utilities (`src/services/*`, `src/utils/*`)

- **`services/fridge.js`**: Supabase database service for fridge item CRUD, comment queries, and batch deletions.
- **`utils/geometry.js`**: Vector mathematics for drag calculations, rotation offsets, and coordinate clamping.
- **`utils/compression.js`**: Client-side canvas image compression and WebP conversion before storage upload.
- **`utils/notification.js`**: Browser Web Push notifications and haptic vibration triggers (`triggerBuzz()`).
- **`utils/time.js`**: Human-friendly relative timestamps, audio duration formatting (`formatTime`), and timezone offsets.
- **`utils/url.js`**: URL sanitization, YouTube video ID extraction, and safe protocol validation.
- **`utils/phone.js`**: Phone number formatting and pairing link generator.
