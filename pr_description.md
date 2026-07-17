🎯 **What:** The `getGameById` and `getGamesByTag` functions in `src/features/games/games/index.js` lacked test coverage.
📊 **Coverage:** Added a new test file `src/features/games/games/index.test.js` that covers:
  - `getGameById`: Returns correct game definition for known ID, returns undefined for unknown ID.
  - `getGamesByTag`: Returns correct array of games for known tag, returns empty array for unknown tag, and correctly returns games matching a unique tag.
✨ **Result:** Enhanced test coverage for the core game lookup utilities, ensuring robust handling of valid and invalid registry queries.
