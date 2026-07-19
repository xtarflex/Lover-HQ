# 🎬 Shared Theater Design Specification

This document provides the technical design, architectural guidelines, and synchronization protocol specifications for the **Shared Theater** co-watching feature in Lover-HQ.

---

## 🏗️ 1. Architecture Overview

The Shared Theater feature enables two partners in a private room to watch videos in real-time synchronization. It supports two primary sources of media:
1. **Direct Uploads**: User-uploaded movie files (`.mp4`, `.webm`) stored securely in Supabase Storage.
2. **Streaming Links & YouTube**: Direct web video links or YouTube URLs, played via the YouTube Iframe API.

### A. Media Upload & Streaming Mechanics
* **Upload Flow & Chunking**: Video files are often very large. To ensure reliability on unstable mobile connections, files are uploaded in **5MB chunks** using a resumable upload protocol (Tus/client-side slicing) directly to the Supabase Storage bucket.
* **Generous Upload Limits & Auto-Delete**: Videos are large, so we set a generous size limit of **500MB** to support full-length compressed movies. To prevent database storage overflow, we restrict couples to **maximum 3 uploaded movie files** at any time. When a 4th movie is uploaded, the system will automatically delete the oldest uploaded movie file from storage (YouTube links are excluded from this limit and never deleted).
* **No Mobile Compression**: Compressing video files in-browser (using FFmpeg.wasm) is highly resource-intensive and leads to mobile tab crashes. Therefore, we enforce the 500MB storage upload size limit and advise users to pre-optimize files, or use YouTube links.
* **Streaming Protocol (HTTP Range Requests)**: Instead of costly server-side transcoding (such as HLS/M3U8), uploaded files are streamed directly using **HTTP Range Requests**. Supabase Storage and modern HTML5 browsers handle this natively, letting users scrub instantly to any timeline position without downloading the full video first.

### B. YouTube Integration
* **Metadata Storage**: YouTube videos are not uploaded. Instead, when a user adds a YouTube URL, we parse the YouTube Video ID and store it along with the title and placeholder thumbnail in the `theater_movies` table.
* **Hybrid Player**: The player wrapper dynamically switches between a native `<video>` tag (for uploads) and a YouTube IFrame Player (for YouTube content), running the exact same sync hook across both engines.

```
+-----------------------------------------------------------+
|                      Shared Theater                       |
+-----------------------------------------------------------+
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   Cinematic Frontend                Stateful Media Engine
   • Theater.jsx                     • useTheaterSync.js
   • TheaterCurtains.jsx             • Supabase Realtime Channels
   • TheaterPlayer.jsx               • Chunked Uploader (Storage)
   • TheaterLibrary.jsx
```

---

## 🗄️ 2. Database Schema (Supabase)

The database schema manages uploaded movie catalogs and maintains playback synchronization state.

### A. The Movie Library Table (`theater_movies`)
Stores metadata of movies and YouTube videos added by either partner.
```sql
create table public.theater_movies (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  source_type text check (source_type in ('upload', 'youtube', 'external')) default 'upload' not null,
  storage_path text, -- Nullable; path inside the 'theater-media' storage bucket (for uploaded movies)
  external_url text, -- Nullable; direct external URL or YouTube link
  youtube_video_id text, -- Nullable; extracted YouTube Video ID
  file_size bigint, -- Nullable; size in bytes (only for uploaded files)
  duration interval, -- Video duration (nullable until parsed)
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)
alter table public.theater_movies enable row level security;

create policy "Users can view movies in their shared room"
  on public.theater_movies for select
  using (true);

create policy "Users can upload movies to their shared room"
  on public.theater_movies for insert
  with check (auth.uid() = uploaded_by);
```

### B. The Watching Session Table (`theater_sessions`)
Maintains the current session state. Only one active session row exists per couple.
```sql
create table public.theater_sessions (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid not null, -- References the couple's relationship identifier
  active_movie_id uuid references public.theater_movies(id) on delete set null,
  current_time double precision default 0.0 not null, -- Playback position in seconds
  playback_state text default 'paused'::text not null, -- 'playing', 'paused', 'buffering'
  last_updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.theater_sessions enable row level security;
```

---

## 🔄 3. Stateful Playback Sync (`useTheaterSync`)

To ensure low-latency sync without database hammering, playback states are broadcasted over **Supabase Realtime Broadcast Channels**.

### Playback Synchronization Protocol
1. **Presence & Room Binding**: Both users join a broadcast channel named `theater_room:<couple_id>`.
2. **State Sync Events**:
   - `play`: Broadcasts the current timestamp `{ event: 'play', time: 142.5 }`. Receivers play the video from that timestamp.
   - `pause`: Broadcasts `{ event: 'pause', time: 142.5 }`. Receivers pause immediately.
   - `seek`: Broadcasts `{ event: 'seek', time: 300.2 }`. Receivers seek to the timestamp.
   - `heartbeat`: Every 3 seconds, the "active controller" client (the one who initiated playback) broadcasts the running state: `{ state: 'playing', time: 145.5 }`.
3. **Drift Compensation**:
   - If a receiver client's local playback time drifts by **> 1.5 seconds** from the received state, the player adjusts:
     - Drift between 1.5s and 3s: Scale playback rate temporarily (`0.9x` or `1.1x`) to catch up smoothly.
     - Drift > 3s: Hard-jump `currentTime` to match the target sync time.
4. **Buffering Recovery**:
   - When a client enters a `buffering` state, it broadcasts `{ event: 'buffering' }`.
   - The remote partner's player automatically pauses and overlays a "Partner is buffering..." loading screen to prevent them from getting ahead.
   - Once buffering resolves, a `{ event: 'ready' }` signal is broadcasted, resuming playback on both ends.

---

## 🎨 4. Cinematic UI/UX Design

### A. The Theatrical Red Curtains (`TheaterCurtains.jsx`) & Library Spacing
* **Separate Library View**: The library is housed in a slide-up drawer or sub-panel behind the curtains.
* **Curtains Closed (Setup Mode)**: When no movie is active (`active_movie_id` is null), the red curtains remain closed in the top half of the screen, and the Library search/upload catalog is fully displayed in the space underneath.
* **Curtains Open (Cinema Mode)**: Tapping a movie from the Library triggers an animation that draws the curtains back to the left and right edges, dimming the screen to start the video.
* **In-Show Browsing**: While watching, users can tap a subtle overlay icon to slide in a small Library panel from the side, allowing them to queue the next video collaboratively without interrupting the current play state.

### B. Ambient Lighting (Ambilight Canvas Backdrop)
To prevent ugly black bars when viewing wide cinematic content:
* **Vertical Viewport Spacing**: On mobile screens held vertically (portrait mode), landscape video (16:9) leaves wide blank spaces at the top and bottom.
* **Technique**: The `<canvas>` backdrop is styled to occupy `100%` of the viewport height behind the player.
* **Dynamic Glow Sync**: The canvas extracts active video frames continuously using `requestAnimationFrame`. It shrinks them to a tiny 16x9 canvas grid (extracting average color vectors), heavily blurs the result (`filter: blur(64px)`), and glows it across the top and bottom spaces. This creates an ambient lighting effect that **changes colors dynamically with the movie frames** (e.g., turning blue during underwater scenes, green during forest scenes). For YouTube, the backdrop falls back to averaging thumbnail palette gradients or CSS-themed pulses.

### C. Controls, Orientation, and Subtitles
* **Autohide Controls**: Controls automatically slide down out of view after 3 seconds of cursor inactivity, reappearing instantly on hover or touch.
* **Inline Couples Chat**: A toggleable mini-chat drawer (`width: 300px`) slides out from the right, allowing partners to chat in-context without leaving the movie stream.
* **Horizontal Viewing Support**: Movies are best watched in landscape. The player UI includes a "Rotate" or "Fullscreen" toggle. It attempts to lock the device orientation to landscape using the Screen Orientation API (`screen.orientation.lock('landscape')`). If locked orientation is blocked by the browser, it uses a CSS rotation fallback (`transform: rotate(90deg)`) to force landscape rendering within portrait orientation.
* **WebVTT Subtitles Upload**: Users can upload standard subtitle files (`.vtt` or `.srt` converted to WebVTT) alongside their movie. The player links these subtitles using the HTML5 `<track>` element. Since the video playback timeline is synchronized by `useTheaterSync`, the subtitles **remain perfectly in sync automatically** without requiring additional network sync events.

---

## 📈 5. Implementation Roadmap

### Phase 1: Database Setup
- Create migration script (`supabase/migrations/xxxx_create_theater_tables.sql`).
- Set up Supabase Storage Bucket `theater-media` with authenticated read/write permissions.

### Phase 2: Synchronization Hook
- Develop `src/features/theater/hooks/useTheaterSync.js` to manage the broadcast channel and video ref event listeners.
- Add test coverage verifying event emissions for `play`, `pause`, and `seek`.

### Phase 3: Component Assembly
- **`TheaterCurtains.jsx`**: Red curtains transition animation.
- **`TheaterLibrary.jsx`**: Movie listing, selection, and drag-and-drop video upload widget.
- **`TheaterPlayer.jsx`**: HTML5 custom video player wrapper with Ambilight canvas background.
- **`Theater.jsx`**: Main feature page pulling the components together.
