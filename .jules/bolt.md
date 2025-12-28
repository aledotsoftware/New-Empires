# Bolt's Journal - Critical Learnings

## 2024-05-22 - [SpatialGrid vs Map]
**Learning:** For high-frequency spatial queries (60fps), a flat 1D array with integer indexing significantly outperformed a `Map`-based implementation by reducing garbage collection overhead.
**Action:** Prefer flat arrays over Maps for coordinate-based lookups in the main game loop.

## 2024-05-23 - [DOM Batching]
**Learning:** `Game.updateUI` was consuming too much time. Throttling it to 10Hz (100ms) reduced overhead without noticeable lag for the user.
**Action:** Always throttle UI updates that don't need frame-perfect synchronization.
