# Lover-HQ: Game Platform Architecture Assessment

This document assesses the feasibility and technical design required to transform the Lover-HQ game module from a hard-coded set of built-in games to an extensible, third-party plugin platform.

## 1. The Core Approaches: Iframes vs. SDK/API

To allow third-party developers to create games for the platform, there are two primary architectures. Here is a breakdown of how they work in plain terms.

### Approach A: The Iframe / External URL Method (Recommended)
**How it works:**
The third-party developer builds their game as a standalone web app using HTML, CSS, and JS (or tools like Unity WebGL, Godot, or Phaser). They host this game on their own servers or a hosting provider (like Vercel or Netlify). They give us a single URL (e.g., `https://awesome-tictactoe.com`).

When a user opens the game in Lover-HQ, our app creates an `<iframe src="https://awesome-tictactoe.com">`—which is essentially a "browser inside our browser."

**How Lover-HQ communicates with the game:**
Because the game is hosted elsewhere, it cannot directly access the Lover-HQ database or user session. Instead, we use a secure browser feature called `postMessage`.
1. Lover-HQ sends a message into the Iframe: `"Here is the User ID, Partner ID, and a temporary token for the real-time channel."`
2. The game runs its logic and sends a message back out to Lover-HQ: `"Player 1 just won! Give them 10 points."`
3. Lover-HQ receives that message and safely updates the database.

**Pros:**
* **Any Language/Engine:** Developers can use React, Vue, Canvas, WebGL, Unity, etc.
* **Safe and Sandboxed:** If the third-party game crashes or has terrible CSS, it *cannot* break the rest of the Lover-HQ app. It is contained within its box.
* **Zero Maintenance for Us:** We don't have to build or manage their code.
* **Scalable:** Very easy to approve new games—we just need a URL.

**Cons:**
* UI might feel slightly less "native" if the developer doesn't follow our design system.
* Requires the developer to host their own code.

### Approach B: The SDK / Bundled Code Method
**How it works:**
We create a "Lover-HQ Game SDK (Software Development Kit)." Developers write React components following our strict rules and use our provided hooks (e.g., `useLoverHQGame()`). They send us their raw code (or publish it to an NPM registry). We then bundle their code directly into our main Lover-HQ app.

**Pros:**
* Feels completely native. Games will perfectly match the app's UI.
* Extremely fast loading times since it's all one app.

**Cons:**
* **Security Risk:** If a developer writes malicious or buggy code, it could break the entire Lover-HQ app or steal user data.
* **Highly Restrictive:** Developers are forced to use React and our specific tech stack. No Unity, no complex 3D engines, etc.
* **App Size:** As we add hundreds of games, the main Lover-HQ app becomes massive and slow to download.

### Recommendation
For a marketplace model (like an App Store), **Approach A (Iframes)** is the industry standard (used by Discord Activities, Twitch Extensions, and Facebook Instant Games). It provides the necessary security sandbox while giving developers the freedom to build complex 2D or 3D games.

---

## 2. The Marketplace & Database Architecture

To move away from the hard-coded `GAME_REGISTRY`, we need new database tables in Supabase.

### A. The Catalog (`games_catalog` table)
This acts as the App Store. It holds all approved games available for download.
* `id` (UUID)
* `developer_id` (UUID)
* `title`, `description`, `icon_url`, `banner_url`
* `game_url` (The external URL for the iframe)
* `engine_type` (e.g., "html5", "unity_webgl")
* `status` (e.g., "pending_review", "published")

### B. Installed Games (`installed_games` table)
This tracks which couples have "installed" which games.
* `id` (UUID)
* `couple_id` (UUID - a new concept linking the two partners)
* `game_id` (UUID - references `games_catalog`)
* `installed_at` (Timestamp)

**How the User Experience works:**
1. Users navigate to the Game Room. We query `installed_games` to show their library.
2. They click "Store". We query `games_catalog` to show available games.
3. User clicks "Install". We insert a row into `installed_games`. The next time either partner opens the app, the game appears in their library.

---

## 3. How Developers Submit Games

We will need a **Developer Portal** (a separate web interface, e.g., `developers.lover-hq.com`).

**The Developer Journey:**
1. **Registration:** Developer signs up for an account.
2. **SDK/Docs:** They read documentation on how to listen for Lover-HQ `postMessage` events (e.g., `onGameStart`, `onPartnerMove`).
3. **Development:** They build and host the game on their own servers.
4. **Submission:** They go to the Developer Portal, fill out a form (Game Title, Description, Icon, and the **Game URL**).
5. **Review Process:** The game goes into a "pending" state. We (the Lover-HQ team) playtest the game to ensure it isn't malicious, actually works, and doesn't violate guidelines.
6. **Publishing:** We flip the status to `published`, and it instantly appears in the Lover-HQ Store.

---

## 4. Game Complexity & Types

By using the Iframe approach, the platform becomes **engine-agnostic**.

* **Simple Games:** Developers can write simple HTML/JS/CSS for games like Tic-Tac-Toe or Word Chains.
* **Complex 2D Games:** Developers can use HTML5 Canvas engines like Phaser.js or Pixi.js for complex animations and physics.
* **Advanced 3D Games:** Developers can build games in Unity or Godot, export them to WebGL, and host them. As long as it can run in a web browser iframe, it will work in Lover-HQ.

We can add a `requirements` column to the `games_catalog` to warn users if a game requires a fast phone (e.g., for heavy 3D WebGL games).

---

## 5. Feasibility Conclusion

**Is this feasible?** Yes, absolutely.
**Is it possible?** Yes, this is a well-established software pattern (often called a "Micro-frontend" or "Iframe Sandbox" architecture).

**High-Level Steps to Implement in the Future:**
1. **Database:** Create `games_catalog` and `installed_games` tables.
2. **Lover-HQ App:** Build the "Store" UI and refactor the Game Room to fetch from `installed_games` instead of `GAME_REGISTRY`.
3. **Lover-HQ App:** Create a generic `GameIframeWrapper` component that loads the external `game_url` and handles the secure `postMessage` communication bridge for real-time multiplayer syncing.
4. **Developer Portal:** Build a simple dashboard for developers to submit their URLs and game metadata.
5. **Documentation:** Write the standard for how external games must send and receive state updates to sync with Lover-HQ's Supabase backend.
