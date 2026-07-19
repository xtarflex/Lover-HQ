# 📍 Milestone: Shared Theater Feature & Dashboard Integration Layout

This document outlines the design specification, architecture, and timeline for the new **Shared Theater** co-watching feature, as well as the layout restructuring for the central **Dashboard** (Home screen) to unify navigation.

---

## 📅 Timeline & Gate Strategy (Target: July 30th)

To meet the hard deadline for the "Spiderman: Brand New Day" premiere on July 30th, we are executing **Option 3** for feature sequencing:
1. **Phase 1: Dashboard Layout Skeleton**: Establish the routing, layout design, and placeholder links for all navigation paths.
2. **Phase 2: Theater Stateful Media Engine**: Implement the database schemas, upload mechanism, and synchronized player.
3. **Phase 3: Real-Time State Wiring**: Connect the Dashboard cards to the live status APIs (e.g., active co-watching indicators, unread chat notifications).

---

## 🎛️ Part 1: Dashboard Layout & Navigation System

Currently, the home view (`src/features/home/Home.jsx`) is a simple placeholder. With new sections springing up (e.g., Couples Chat, Settings, and Theater) that do not fit in the 5-item Bottom Navigation bar, the Dashboard will serve as the primary routing hub.

### 1. Visual Presentation & Design Tokens
* **Modern Glassmorphic Grid**: A responsive dashboard grid utilizing glassmorphism (`backdrop-blur-lg`, translucent borders) and high-contrast typography.
* **Curated Themes & Gradients**: Subtle background glow cards utilizing HSL-tailored couple-centric gradients.
* **Micro-Animations**: Hover-scaling and interactive focus rings to make the dashboard feel alive.

### 2. Feature Cards Matrix
Each card will provide a visual portal to its feature:
* **Fridge Canvas**: Live indicator showing recently added items or active post-it counts.
* **Music Room**: Dynamic visualizer node animation and title display of the active queue track.
* **Game Room**: Notification banner for pending game invites or active game status.
* **Couples Chat**: Animated indicator showing current unread message count and partner presence status.
* **Shared Theater**: A marquee-style overlay when a movie is currently streaming.
* **Daily Reveal**: Indicator showing whether today's question has been answered by both partners.

---

## 🎬 Part 2: Shared Theater (Co-Watching Media Engine)

The Theater feature is a collaborative space allowing partners to upload, queue, and watch video content in perfect synchronization. **Unlike the Music feature, Theater will not use a 3D vertical flipping card layout, as video content requires a wide, landscape-optimized viewport.**

```
        [ Header ]
+--------------------------+
|  ◀ Back                  |
|  +--------------------+  |
|  |     [ Video ]      |  |
|  |   Cinematic Screen |  |
|  +--------------------+  |
|  [ Play ] [== Progress ==] |
|                          |
|  [ Chat Overlay / Queue ] |
+--------------------------+
       [ Bottom Nav ]
```

### 1. Spatial UI & "Red Curtain" Presentation
* **Red Curtain Transition**: When no movie is active, the screen renders a digital red curtain backdrop. Clicking a movie from the Library triggers a smooth, wide transition drawing back the curtains to reveal the cinematic screen.
* **Ambient Lighting (Ambilight)**: An ambient canvas blur wrapper behind the widescreen video player. Frequencies of the video's active frames will dynamically blur and bleed colors onto the backdrop, generating an immersive theater environment.
* **Cinematic Controls Overlay**: Controls (Play, Pause, Progress Scrubber, Volume, Fullscreen, and Subtitles) fade out automatically when the mouse/touch is idle.

### 2. Stateful Playback Sync (`useTheaterSync`)
* **Supabase Broadcast Channels**: Play, pause, seek, and buffer-state updates are broadcasted in real-time.
* **Drift Control**: If playback times drift by more than `1.5 seconds` between partners, the client automatically adjusts playback speed (e.g., `0.9x` or `1.1x`) or jumps to the synchronized timestamp to prevent abrupt pauses.
* **Buffering Lock**: If one partner's network buffers, the other's stream pauses automatically with a themed "Partner is buffering..." loading overlay, resuming automatically once both clients are ready.

### 3. Collaborative Movie Library & Queue
* **Library Database Schema (`theater_movies`)**:
  - `id` (uuid, PK)
  - `title` (text)
  - `storage_path` (text, links to Supabase storage)
  - `duration` (interval)
  - `uploaded_by` (uuid, references profiles)
  - `created_at` (timestamp)
* **Co-Watching Session Schema (`theater_sessions`)**:
  - `id` (uuid, PK)
  - `active_movie_id` (uuid, references theater_movies)
  - `current_time` (float, playback timestamp)
  - `playback_state` (text: 'playing', 'paused', 'buffering')
  - `updated_at` (timestamp)
* **Progressive Upload**: Integrates chunked uploads with a live progress spinner. Restricts uploads to standard Web formats (`.mp4`, `.webm`).

---

## 🔍 Verification Plan

### 1. Automated Unit & Integration Tests
* Build tests in `vitest` for the `useTheaterSync` hook to verify broadcast signals:
  - Assert that dispatching `pause` triggers a pause event on the receiver client.
  - Assert that drift adjustments trigger correct speed-scaling behavior.
* Verify schema migrations and RLS policies on `theater_movies` and `theater_sessions` tables.

### 2. Manual Testing Checklist
* Test synchronization with two different browser windows side-by-side.
* Verify upload limits (restrict to valid file signatures).
* Check visual layout responsiveness on mobile viewports.
