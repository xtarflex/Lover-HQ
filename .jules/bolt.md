## 2024-05-18 - Chat Input Latency and React Rendering Bottlenecks
**Learning:** In a highly interactive chat application with a growing list of messages, updating local state for the input field (e.g., `newMessageText`) can trigger full re-renders of the entire message list if it's rendered within the same component and not memoized. This causes noticeable typing latency (O(N) rendering cost on every keystroke) because React has to reconcile the large list of DOM nodes.
**Action:** Extract the message list rendering logic into a separate `React.memo` component or use `useMemo` inline to isolate the expensive rendering of the message list from the fast-changing input state. Ensure that all callback props passed to the memoized list are wrapped in `useCallback` to maintain referential equality.

## 2026-07-07 - Expensive Date Parsing in Render Loops
**Learning:** Creating `new Date()` instances inside a mapping function during a React component's render phase is exceptionally expensive. In `Chat.jsx`, grouping logic generated thousands of Date objects on every keystroke, severely degrading typing performance and causing input lag.
**Action:** Always hoist Date instantiation and expensive calculations into `useMemo` or out of the render loop entirely. Precompute grouping conditions (like time differences) and store them in the data structure, rather than calculating them on the fly during render.

## 2024-07-09 - O(N^2) React Render Loop
**Learning:** Found an O(N^2) bottleneck inside `Chat.jsx` where quoted replies were looked up via `messages.find()` inside the render `.map()` loop, which runs on every keystroke because it's triggered by the React useMemo.
**Action:** When mapping arrays in React, always check if `.find()` or `.filter()` is used inside the loop. Hoist these out into `Map` objects (hash tables) for O(1) lookups before the loop.

## 2024-07-09 - Intl.DateTimeFormat vs toLocaleDateString
**Learning:** Instantiating `Intl.DateTimeFormat` once and reusing it via `.format(date)` is drastically faster than calling `date.toLocaleDateString()` inside a loop.
**Action:** When formatting multiple dates sequentially, always hoist the `Intl.DateTimeFormat` instantiation outside the loop.
