# 📜 Architecture Decision Records (ADRs)

This document records key architectural decisions, rationale, trade-offs, and constraints across the evolution of Lover-HQ.

---

## ADR-001: Upgrade to React 19 and Vite 8

### Status
Accepted & Implemented

### Context
Lover-HQ previously ran on React 18 with Vite 5. React 19 introduces enhanced asset loading, improved action hooks, stricter concurrent rendering, and full compatibility with modern WebGL wrappers like `@react-three/fiber` v9.

### Decision
- Upgrade codebase dependencies to React 19.2, React DOM 19.2, React Router v7, and Vite 8.
- Enforce `node >=20.0.0` engine in `package.json`.
- Standardize on `pnpm` as the exclusive package manager across all local development and CI/CD pipelines.

### Consequences
- **Positive**: Native preloading capabilities, faster Vite cold-starts and Rolldown bundling, smoother 3D canvas mounting.
- **Negative / Constraints**: Strict React 18/19 ref cleanups require explicit unmount handling; all hook dependencies must be meticulously declared or stabilized with refs to avoid infinite re-render loops.

---

## ADR-002: Dual Context State Topology (`AppContext` + `MusicContext`)

### Status
Accepted & Implemented

### Context
Audio playback in Lover-HQ includes continuous time progress updates, dual-deck crossfading, spectral flux visualizers, and real-time partner sync. Co-locating playback state within a single global application store caused all UI components across the application to re-evaluate 4–5 times per second during song playback.

### Decision
- Isolate audio engine state inside a dedicated [`MusicContext.jsx`](file:///c:/lover%20hq/src/contexts/MusicContext.jsx).
- Keep general user identity, presence, global notifications, and active room state in [`AppContext.jsx`](file:///c:/lover%20hq/src/contexts/AppContext.jsx).
- Wrap the `MusicContext.Provider` value in `useMemo` and throttle `timeupdate` dispatches to ~250ms.

### Consequences
- **Positive**: Eliminates unnecessary re-render cascades across static UI components (such as `Queue.jsx`, `Settings.jsx`, and `CollectionManagementFace.jsx`).
- **Positive**: Preserves independent lifecycles for background music streaming and room navigation.

---

## ADR-003: High-Frequency Boundary Decoupling & Realtime Broadcast Throttling

### Status
Accepted & Implemented

### Context
In real-time multiplayer features like Quick Draw, high-resolution pointer events (`mousemove` / `touchmove`) fire at 60Hz to 120Hz. Transmitting every pointer coordinate delta across the Supabase Realtime WebSocket gateway saturated client network buffers, dropped UI frames, and exhausted Supabase per-channel message limits. Similarly, main-thread audio FFT analysis starved the visualizer rendering loop.

### Decision
- **Drawing Canvas**: Buffer coordinates locally in a `strokeBufferRef` and dispatch batched coordinates (`stroke_batch`) at a throttled 32ms cadence (~30fps) over the network. Flush remaining coordinates immediately upon `endDraw`.
- **Audio Analysis**: Offload spectral flux calculations, 240-frame history ring buffers, and autocorrelation BPM detection to an `AudioWorkletProcessor` worker thread. Post summarized 30fps metrics to the main thread via `MessagePort`.

### Consequences
- **Positive**: Drastically reduced WebSocket message volume without perceptible latency. Smooth drawing curves preserved via quadratic Bezier interpolation on the receiving client.
- **Positive**: Zero main-thread frame drops during simultaneous 3D canvas rendering and audio spectrum visualization.

---

## ADR-004: Atomic Offline Queue Reconciliation & In-Flight Concurrency Mutex

### Status
Accepted & Implemented

### Context
When mobile clients operate on unstable cellular connections, users can create, edit, or delete notes while an offline queue synchronization cycle is in flight. Previously, `useOfflineQueue` snapshotted `localStorage` at loop start and overwrote `localStorage` upon completion, silently erasing any new offline items added while network requests were pending.

### Decision
- Introduce an asynchronous mutex (`isSyncingRef`) preventing overlapping sync loops.
- Track successfully synchronized item IDs in an in-memory `Set`.
- Re-read `localStorage` upon sync loop completion and atomically filter out only successfully synced IDs:
  ```javascript
  const freshQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
  const remaining = freshQueue.filter((item) => !successfulCreationIds.has(item.id));
  localStorage.setItem(queueKey, JSON.stringify(remaining));
  ```

### Consequences
- **Positive**: Guarantees zero data loss for offline mutations submitted during active synchronization.
- **Positive**: Eliminates duplicate database rows caused by concurrent online triggers.

---

## ADR-005: Decoupled Presence Channel Lifecycle & Monotonic Out-of-Order Sequence Guard

### Status
Accepted & Implemented

### Context
When users navigated between rooms (e.g., from `/fridge` to `/chat`), `usePresence` previously destroyed and recreated the Supabase Realtime channel because `roomName` was in the subscription effect dependency array. This caused WebSocket connection churn, dropped messages, and triggered asynchronous cleanup writes (`updateDbPresence(false, null)`) that raced against active room updates (`updateDbPresence(true, 'chat')`), occasionally leaving users permanently marked offline in PostgreSQL.

### Decision
- Separate channel subscription from room navigation. The channel is bound to the user pair UUIDs (`presence:pair:...`) and remains connected throughout the entire browser session.
- Room navigation updates in-memory presence via `channel.track(...)` and updates PostgreSQL without tearing down the channel or flipping `is_online` to false.
- Introduce a monotonic sequence counter (`writeSeqRef`) on database upserts to reject stale out-of-order network responses.

### Consequences
- **Positive**: Instant, seamless page transitions without connection drops or offline presence flickers.
- **Positive**: Immunity to asynchronous race conditions during rapid route navigation.

---

## ADR-006: Hybrid Hosting & Edge Failover (Netlify to Cloudflare)

### Status
Accepted & Implemented

### Context
Lover-HQ is hosted on Netlify's free tier. In the event that monthly build minutes or bandwidth quotas are exhausted, an automated procedure is required to keep the application reachable without service interruption.

### Decision
- Maintain an identical automated deployment configuration on Cloudflare Pages.
- Implement the `netlify-cloudflare-hybrid-switch` skill to manage automated DNS and client-side redirects if Netlify monthly thresholds are reached.

### Consequences
- **Positive**: High availability and zero-downtime failover for the couple.
- **Positive**: Preserves identical client environment variables and PWA service worker configurations across both platforms.

---

## ADR-007: Moments Iframe Architecture & Hybrid Split Model

### Status
Accepted

### Context
Lover-HQ features interactive multiplayer games and couple activities. Historically, all games were hardcoded directly as built-in React components within `src/features/games/games/`. This tightly coupled external game complexity to the core bundle, prevented independent authoring by creators, risked application stability if a game encountered unhandled runtime exceptions, and restricted interactive modules strictly to the games category. Furthermore, attempting to host arbitrary real-time game loops and unbounded JSON databases for third-party developers would balloon Supabase bandwidth and compute costs.

### Decision
- Transition to an extensible, sandboxed micro-app platform branded as **Moments**, spanning both **Game Moments** and **Together / Utility Moments**.
- Execute embedded Moments inside a hardened HTML5 `<iframe>` using strict sandboxing (`sandbox="allow-scripts allow-same-origin allow-forms"` with `allow-top-navigation` strictly omitted).
- Adopt the **Industry-Standard Hybrid Split Model** (mirroring Discord Activities):
  - **Lover-HQ Core Platform**: Manages user authentication (zero PII passed; opaque session tokens), storefront catalog discovery, couple installation states, and high-level outcome ingestion (`completeSession` reporting winner and scores to trigger celebratory modals and chat milestones).
  - **Third-Party Creators**: Maintain authoritative gameplay loops, custom databases, and real-time multiplayer servers on their own infrastructure (AWS, Supabase, Firebase, WebSockets).
  - **Convenience Cache Helper**: Provide an optional, scoped key-value store (`couple_moment_cache`) strictly capped at $\le$ 256KB per couple per Moment for serverless applets.
  - **First-Party Exception**: Official built-in games and relationship utilities continue utilizing Lover-HQ's internal Supabase Realtime channels.
- Retain existing built-in games via the **Strangler Fig Pattern** while dogfooding the iframe bridge with an extracted Tic-Tac-Toe pilot.

### Consequences
- **Positive**: Complete process isolation; buggy or malicious third-party code cannot crash or hijack Lover-HQ.
- **Positive**: Cost and quota protection; Lover-HQ is never billed for high-frequency third-party gameplay loops or unbounded database tables.
- **Positive**: Language and engine agnosticism—creators can build in vanilla JS, Canvas, React, Phaser, Pixi, or WebGL engines.
- **Positive**: Unifies games and living couple utilities under a common runtime and catalog.
- **Negative**: Requires careful host-shell overlay design (reaction trays, partner status pills) to maintain a cohesive, native look and feel.

---

## ADR-008: YouTube Track Artwork Hybrid Strategy & Clean Square Cover Art Resolution

### Status
Accepted & Implemented

### Context
YouTube video audio tracks played in Lover-HQ frequently supply 16:9 or 4:3 landscape thumbnails containing letterbox black bars, pillarbox side bars, or colored borders. When rendered inside square UI elements (such as vinyl record disc labels, mini-player thumbnails, queue cards, and lockscreen/mediaSession notification panels), these borders create harsh visual artifacts. Naive CSS solutions like `transform: scaleX(1.777)` distort the aspect ratio, while `clip-path` fails when thumbnail resolutions and border paddings differ between tracks (`maxresdefault.jpg` vs `hqdefault.jpg`).

### Decision
- Implement a three-tiered hybrid artwork strategy:
  1. **Automated Zero-Auth Metadata Lookup**: Query the public iTunes Search API (`Access-Control-Allow-Origin: *`, zero API keys or rate limits for client queries) using sanitized track and artist titles (`cleanSearchQuery`) to fetch clean studio square 1000x1000 cover art.
  2. **High-Resolution Fallback Selection**: When studio square art is unavailable or before external lookup resolves, verify and select the highest resolution YouTube thumbnail available (`maxresdefault.jpg` over `hqdefault.jpg`).
  3. **Conditional Calibrated Zoom**: Maintain a subtle calibrated zoom (`scale-[1.33]`) specifically on confirmed YouTube thumbnails via `isYouTubeThumbnail()`, pushing letterboxing outside square masks while preserving unscaled 1:1 geometry (`scale-100`) for clean square album artwork.
  4. **Dynamic Metadata Propagation**: Automatically enhance track artwork in the background during playback, persist upgraded URLs to Supabase `music_library`, and register clean art in `navigator.mediaSession.metadata`.

### Consequences
- **Positive**: Pristine square cover art for popular music tracks without visual letterbox bars.
- **Positive**: Zero API key dependencies or proxy server costs.
- **Positive**: Seamless lockscreen and OS notification media controls with high-res artwork.
- **Positive**: Consistent scaling across all music UI surfaces (`VinylDiscVisualizer`, `NowPlayingFace`, `MiniPlayer`, `Queue`, `FloatingQueuePanel`, `HeroCard`, `MusicPlayer`).

