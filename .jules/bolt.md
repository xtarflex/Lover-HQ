## 2024-05-18 - Chat Input Latency and React Rendering Bottlenecks
**Learning:** In a highly interactive chat application with a growing list of messages, updating local state for the input field (e.g., `newMessageText`) can trigger full re-renders of the entire message list if it's rendered within the same component and not memoized. This causes noticeable typing latency (O(N) rendering cost on every keystroke) because React has to reconcile the large list of DOM nodes.
**Action:** Extract the message list rendering logic into a separate `React.memo` component or use `useMemo` inline to isolate the expensive rendering of the message list from the fast-changing input state. Ensure that all callback props passed to the memoized list are wrapped in `useCallback` to maintain referential equality.

## 2026-07-07 - Expensive Date Parsing in Render Loops
**Learning:** Creating `new Date()` instances inside a mapping function during a React component's render phase is exceptionally expensive. In `Chat.jsx`, grouping logic generated thousands of Date objects on every keystroke, severely degrading typing performance and causing input lag.
**Action:** Always hoist Date instantiation and expensive calculations into `useMemo` or out of the render loop entirely. Precompute grouping conditions (like time differences) and store them in the data structure, rather than calculating them on the fly during render.
## 2026-07-09 - 🧪 Added Tests for Game Registry lookups
**Learning:** Testing simple array lookup methods like getGameById and getGamesByTag validates core utility functions that form the baseline of dynamic imports and routing.
**Action:** Always test array lookups to cover the not found and empty params edge cases to prevent silent undefined rendering issues down the line.

## 2024-05-18 - Avoid Date Instantiation in Render Loops
**Learning:** Comparing Supabase timestamps in React mapping loops by converting them to Date objects (`new Date(created_at) > new Date(last_seen)`) creates massive performance overhead on every keystroke/render in long lists.
**Action:** Since Supabase timestamps are standard ISO 8601 strings (YYYY-MM-DDTHH:mm:ss.sssZ), they can be safely compared using standard JavaScript string comparison operators (`created_at > last_seen`), completely eliminating the Date instantiation overhead in hot paths.

## 2025-01-20 - [Hardware limits on AudioContexts]
**Learning:** Browsers enforce a hardware limit (often around 6) on the number of concurrently active `AudioContext` instances. Instantiating a new `AudioContext` on every sound playback will eventually hit this limit and crash/stop sound from playing.
**Action:** Use a singleton / shared `AudioContext` variable at module level, checking for its existence and resuming it if its state is `suspended`.

## 2024-05-19 - O(N) Array Searches in Render Loops (useRevealFilters.js)
**Learning:** Performing multiple array `.find()` or `.filter()` operations inside a list-rendering component (or its hooks) creates an O(N * M) bottleneck, especially when the lists (like `promptsData` and `archiveMemories`) grow large.
**Action:** Convert static arrays to Maps outside the component scope for O(1) lookups. For dynamic arrays, use `useMemo` to construct a Map, then perform O(1) lookups inside the render/callback cycles.

