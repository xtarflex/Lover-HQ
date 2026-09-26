# Lover-HQ: Moments Platform Architecture

This document defines the technical architecture, security model, and data topology for the **Lover-HQ Moments Platform**—an extensible, sandboxed micro-app ecosystem enabling couples to share interactive games and utility experiences.

---

## 1. Vision & Mental Model

### The "Moment" Concept
Rather than treating games and utilities as disconnected modules, Lover-HQ unifies all embedded experiences under the concept of **Moments** (*"Try a new moment together"*).

Moments are partitioned into two core categories running on the same underlying sandbox runtime:

1. **Game Moments (`category: "game"`):**
   - Synchronous, turn-based, or real-time playful competition and cooperation (e.g., Tic-Tac-Toe, Scrabble, QuickDraw, Word Chain).
   - Ephemeral session lifecycles: match start $\rightarrow$ turn progression $\rightarrow$ match completion $\rightarrow$ shared scoreboard.
2. **Together / Utility Moments (`category: "utility"`):**
   - Asynchronous or persistent shared tools for daily life (e.g., Couple Habit Trackers, Shared Bucket Lists, Scratch Maps, Countdown Timers, Budgeting Spaces).
   - Living data lifecycles: continuous state accumulation persisted indefinitely across the couple's relationship.

---

## 2. Sandboxed Runtime & Security Posture

Moments are authored as standalone web applications hosted on HTTPS endpoints and rendered within Lover-HQ inside a sandboxed `<iframe>`.

```mermaid
flowchart TB
    subgraph LoverHQ["Lover-HQ Native Shell"]
        ShellHeader["Partner Status Pill & Navigation Bar"]
        FloatingTray["Persistent Reaction Bar"]
        HostBridge["Host Bridge Controller (useMomentBridge)"]
        RealtimeRelay["Supabase Realtime & Postgres Relay"]
    end

    subgraph IframeSandbox["Sandboxed Iframe Container"]
        SDK["@lover-hq/moment-sdk"]
        AppletUI["Third-Party / First-Party Web App"]
    end

    ShellHeader --- IframeSandbox
    FloatingTray --- IframeSandbox
    SDK <-->|"postMessage (Strict Origin & Schema)"| HostBridge
    HostBridge <--> RealtimeRelay
```

### Security Directives
1. **Zero PII Exposure:**
   The iframe is never provided with email addresses, phone numbers, auth tokens, or real names. Instead, Lover-HQ transmits opaque, deterministic session identifiers:
   ```json
   {
     "participantId": "anon_p1_7f8a9",
     "partnerId": "anon_p2_b3c4d",
     "displayName": "Alex",
     "avatarUrl": "https://loverhq.app/avatars/p1.webp",
     "isHost": true,
     "theme": "rose_dark"
   }
   ```
2. **Host-Mediated Proxy Pattern:**
   The iframe has **zero direct backend or database access**. It cannot open arbitrary WebSockets to Lover-HQ servers. All real-time messaging, state snapshots, and completion signals must be dispatched through the host window via `window.parent.postMessage`.
3. **Strict Iframe Sandboxing:**
   ```html
   <iframe
     src="https://moments.loverhq.dev/tictactoe"
     sandbox="allow-scripts allow-same-origin allow-forms"
     allow="autoplay; camera 'none'; microphone 'none'; geolocation 'none'"
     referrerpolicy="no-referrer"
   />
   ```
   - **`allow-top-navigation` is strictly omitted**, preventing external scripts from redirecting or hijacking Lover-HQ.
   - **`allow-popups` is disabled**, preventing unsolicited windows or external ads.

---

## 3. Communication Protocol (`postMessage` Specification)

Communication between `@lover-hq/moment-sdk` and Lover-HQ's host container follows a typed, versioned RPC schema.

### Message Envelope Schema
```typescript
interface MomentMessage<T = unknown> {
  protocol: 'LOVER_HQ_MOMENT_V1';
  messageId: string;
  timestamp: number;
  type: string;
  payload: T;
}
```

### Core Message Events

| Direction | Event Name | Purpose | Payload Summary |
| :--- | :--- | :--- | :--- |
| **Iframe $\rightarrow$ Host** | `MOMENT_INIT` | Handshake request on load | `{ clientVersion: "1.0.0" }` |
| **Host $\rightarrow$ Iframe** | `MOMENT_READY` | Returns session context | Identity, theme, initial state snapshot |
| **Iframe $\rightarrow$ Host** | `MOMENT_DISPATCH_ACTION` | Relays turn or real-time event | `{ action: "PLACE_MARK", x: 1, y: 2 }` |
| **Host $\rightarrow$ Iframe** | `MOMENT_RECEIVE_ACTION` | Forwards partner's turn | `{ from: "partner", action: "...", ... }` |
| **Iframe $\rightarrow$ Host** | `MOMENT_SAVE_STATE` | Persists session or utility data | Arbitrary JSON payload ($\le$ 64KB) |
| **Iframe $\rightarrow$ Host** | `MOMENT_COMPLETE` | Signals match resolution | `{ winnerId: "...", scores: { ... } }` |
| **Host $\rightarrow$ Iframe** | `MOMENT_PARTNER_PRESENCE` | Signals partner connectivity | `{ isConnected: boolean, isFocused: boolean }` |

---

## 4. State Persistence & Database Schema (Supabase)

The Moments data model cleanly isolates catalog metadata, couple installations, active game sessions, and long-term utility storage.

```mermaid
erDiagram
    MOMENTS_CATALOG ||--o{ COUPLE_INSTALLED_MOMENTS : "installed by"
    COUPLE_INSTALLED_MOMENTS ||--o{ MOMENT_SESSIONS : "spawns"
    COUPLE_INSTALLED_MOMENTS ||--o{ COUPLE_MOMENT_DATA : "stores"

    MOMENTS_CATALOG {
        uuid id PK
        text slug UK
        text title
        text description
        text category "game | utility"
        text entry_url
        text icon_url
        text banner_url
        jsonb permissions
        text status "pending | published | archived"
        timestamp created_at
    }

    COUPLE_INSTALLED_MOMENTS {
        uuid id PK
        uuid couple_id
        uuid moment_id FK
        boolean is_pinned
        timestamp installed_at
    }

    COUPLE_MOMENT_DATA {
        uuid id PK
        uuid couple_id
        uuid moment_id FK
        text data_key
        jsonb data_value
        timestamp updated_at
    }

    MOMENT_SESSIONS {
        uuid id PK
        uuid couple_id
        uuid moment_id FK
        text status "active | paused | completed"
        jsonb snapshot_state
        jsonb results
        timestamp created_at
        timestamp ended_at
    }
```

### Table Definitions
1. **`moments_catalog`:**
   Master registry of all verified Moments. Contains category designation (`game` vs. `utility`), remote HTTPS entry URL, and capabilities.
2. **`couple_installed_moments`:**
   Shared installation records. When Partner A installs a Moment, it immediately mounts to the couple's shared library. Includes an `is_pinned` flag for home dashboard surface widgets.
3. **`couple_moment_data`:**
   Key-value JSON document store powering persistent utility moments (such as habit trackers or bucket lists). Scoped strictly to `(couple_id, moment_id)`.
4. **`moment_sessions`:**
   Tracks active game sessions, turn histories, and pause snapshots. Allows interrupted games to be resumed within a 24-hour retention window.

---

## 5. UI Shell & Container Integration

### Route Structure
- **`/moments` (The Moments Hub):** Browsing interface displaying both the comprehensive registered catalog and the couple's installed library, filterable by *All*, *Games*, and *Together Spaces*.
- **`/games` (The Game Room):** Refactored game lobby displaying installed and discoverable **Game Moments** exclusively.
- **`/moments/:slug` & `/games/:slug`:** Dedicated full-screen host container rendering the `<MomentFrameHost />`.
- **Dashboard (Future surface):** Displays quick-launch tiles and pinned utility widgets backed by `is_pinned` records.

### The Host Shell Experience
The iframe is wrapped in an outer Lover-HQ frame providing:
- **Persistent Header:** Top navigation with a back arrow, current partner connection pill (`Online`, `In Moment`, or `Away`), and a session pause/exit modal.
- **Floating Reaction Tray:** Lover-HQ's native romantic reaction buttons overlayed along the bottom right, enabling instantaneous partner feedback independent of the third-party game's capabilities.
- **Connection Curtain:** A warm, synchronized loading state showing both partner avatars connecting before the iframe is revealed.
