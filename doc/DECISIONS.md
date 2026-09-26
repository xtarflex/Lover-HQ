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

## ADR-007: Moments Iframe Architecture & Host-Mediated Proxy

### Status
Accepted

### Context
Lover-HQ features interactive multiplayer games and couple activities. Historically, all games were hardcoded directly as built-in React components within `src/features/games/games/`. This tightly coupled external game complexity to the core bundle, prevented independent authoring by creators, risked application stability if a game encountered unhandled runtime exceptions, and restricted interactive modules strictly to the games category.

### Decision
- Transition to an extensible, sandboxed micro-app platform branded as **Moments**, spanning both **Game Moments** and **Together / Utility Moments**.
- Execute embedded Moments inside a hardened HTML5 `<iframe>` using strict sandboxing (`sandbox="allow-scripts allow-same-origin allow-forms"` with `allow-top-navigation` strictly omitted).
- Enforce the **Host-Mediated Proxy Pattern**: The iframe has zero direct network access to Lover-HQ databases or Supabase tokens. All real-time messaging, state snapshots, and presence signals flow via a typed `postMessage` protocol through Lover-HQ's host shell using `@lover-hq/moment-sdk`.
- Retain existing built-in games via the **Strangler Fig Pattern** while dogfooding the iframe bridge with an extracted Tic-Tac-Toe pilot.

### Consequences
- **Positive**: Complete process isolation; buggy or malicious third-party code cannot crash or hijack Lover-HQ.
- **Positive**: Language and engine agnosticism—creators can build in vanilla JS, Canvas, React, Phaser, Pixi, or WebGL engines.
- **Positive**: Unifies games and living couple utilities under a common runtime and catalog.
- **Negative**: Requires careful host-shell overlay design (reaction trays, partner status pills) to maintain a cohesive, native look and feel.
