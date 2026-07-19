## 2024-05-18 - Chat Input Latency and React Rendering Bottlenecks
**Learning:** In a highly interactive chat application with a growing list of messages, updating local state for the input field (e.g., `newMessageText`) can trigger full re-renders of the entire message list if it's rendered within the same component and not memoized. This causes noticeable typing latency (O(N) rendering cost on every keystroke) because React has to reconcile the large list of DOM nodes.
**Action:** Extract the message list rendering logic into a separate `React.memo` component or use `useMemo` inline to isolate the expensive rendering of the message list from the fast-changing input state. Ensure that all callback props passed to the memoized list are wrapped in `useCallback` to maintain referential equality.

## 2026-07-07 - Expensive Date Parsing in Render Loops
**Learning:** Creating `new Date()` instances inside a mapping function during a React component's render phase is exceptionally expensive. In `Chat.jsx`, grouping logic generated thousands of Date objects on every keystroke, severely degrading typing performance and causing input lag.
**Action:** Always hoist Date instantiation and expensive calculations into `useMemo` or out of the render loop entirely. Precompute grouping conditions (like time differences) and store them in the data structure, rather than calculating them on the fly during render.

## 2026-07-09 - 🧪 Added Tests for Game Registry lookups
**Learning:** Testing simple array lookup methods like getGameById and getGamesByTag validates core utility functions that form the baseline of dynamic imports and routing.
**Action:** Always test array lookups to cover the not found and empty params edge cases to prevent silent undefined rendering issues down the line.

## 2024-07-25 - Efficient Date Comparisons in React Loops
**Learning:** When comparing timestamps in a React render loop (like filtering elements based on a `created_at` timestamp), instantiating a `new Date()` for every item creates immense overhead and garbage collection pressure, leading to UI stutter during frequent re-renders (like drag and drop).
**Action:** Instead of `new Date(item.created_at) >= cutoff`, pre-calculate the cutoff as an ISO 8601 string (`cutOffDate.toISOString()`) outside the loop, and do a direct string comparison: `item.created_at >= cutOffIsoString`. This provides O(N) string comparison speed versus O(N) object instantiations.
