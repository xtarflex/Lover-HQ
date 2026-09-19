# AI Brainstorm & Implementation Strategy: Lover-HQ Game Plugin Platform

If I were architecting this from scratch based on the goal of creating an open, third-party game marketplace for Lover-HQ, here is how I would design the system, features, and the step-by-step refactoring process.

## 1. The Vision: "Lover-HQ Applets"
I wouldn't just call them "Games." I would refer to this system internally as **"Applets" or "Micro-Experiences."** Why? Because couples might want things beyond games. A third-party developer might build a "Shared Budgeting" applet, or a "Virtual Pet" applet. Designing the architecture to handle *any* interactive HTML5 experience makes the platform infinitely more scalable.

## 2. Refactoring the Current Codebase

To make this a reality without breaking the current app, I would implement a **Strangler Fig Pattern** (gradually replacing the old system with the new one).

### Phase 1: The Wrapper (Current State)
1. **Keep `GAME_REGISTRY` for now.**
2. Build the generic `IframeGameContainer.jsx`.
3. Take one of our existing simple games (e.g., Tic-Tac-Toe), move it to a completely separate repository, host it on Netlify/Vercel, and plug its URL into the existing `GAME_REGISTRY`.
4. **Goal:** Prove that the `postMessage` bridge works flawlessly with Supabase Realtime for a first-party game before inviting third parties.

### Phase 2: The Storefront UI
1. Overhaul `GameLobby.jsx`.
2. Introduce tabs: **"Our Library"** (installed games) and **"The Arcade"** (the marketplace).
3. The Arcade isn't just a grid of icons. It needs:
   * **Game Detail Pages:** Screenshots, descriptions, "Requires fast connection" warnings.
   * **Couples Social Proof:** "Played by 5,000 couples this week."
   * **One-Click Install:** Clicking "Add to Library" instantly makes it available for both partners.

### Phase 3: The API Bridge (Lover-HQ SDK)
Developers need a dead-simple way to talk to Lover-HQ. I would create an NPM package (`@lover-hq/applet-sdk`).

Instead of developers writing raw `window.parent.postMessage`, they would use clean methods:
```javascript
import { LoverHQ } from '@lover-hq/applet-sdk';

// Initialize connection
LoverHQ.init();

// Listen for partner moves
LoverHQ.on('partner_action', (data) => { ... });

// Send a move
LoverHQ.sendAction({ type: 'MOVE', x: 1, y: 2 });

// End the game
LoverHQ.endGame({ winnerId: 'player1_id' });
```
This SDK handles the messy iframe messaging under the hood and ensures developers adhere to our data payload formats.

## 3. Security & Sandboxing (Crucial)

Iframes are secure, but we must protect user privacy.
* **No PII:** The external game *never* gets the user's email or phone number.
* **Anonymous IDs:** When loading the iframe, Lover-HQ passes pseudo-anonymous IDs (`player1`, `player2`) and simple display names/avatars.
* **Strict CSP:** The `IframeGameContainer` must use a strict `sandbox` attribute: `sandbox="allow-scripts allow-same-origin"`. We **block** `allow-top-navigation` so a malicious game can't redirect the user away from Lover-HQ.

## 4. Supabase Architecture

To support this, I would design the database with these core tables:

1. `applets_catalog`: The store items.
   * `id`, `developer_id`, `name`, `status`, `iframe_url`, `webhook_url` (optional, if the dev's server needs game-end updates).
2. `couple_installations`: What they have installed.
   * `couple_id`, `applet_id`, `installed_at`.
3. `applet_sessions`: Tracks active gameplay.
   * `id`, `applet_id`, `couple_id`, `state_json` (a generic JSON blob so games can save their current state/board if a user closes the app).

## 5. Monetization & Growth (The Future)
If the marketplace thrives, hosting costs for Lover-HQ will rise.
* **Premium Games:** We could allow developers to charge a one-time fee (e.g., $1.99) to unlock a premium game. Lover-HQ takes a 30% cut.
* **Developer Tipping:** Allow couples to send a $3 tip to the developer of their favorite game directly through the app.

## Summary of the "AI Way"
I would build this not just as a game hub, but as an **extensible Iframe OS** for couples. I would mandate the use of a clean npm SDK for developers, enforce strict iframe sandboxing to guarantee zero security leaks, and transition our existing games to this new iframe model first to iron out the realtime network latency before opening the gates to the public.
