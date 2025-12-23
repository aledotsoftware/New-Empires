## 2024-05-23 - DOM Manipulation Optimization
**Learning:** When refactoring complex DOM generation logic to use a data-driven approach (data first, DOM second), ensure that *all* conditional branches (e.g., different unit types) are updated to the new data structure pattern. Leaving some branches using the old imperative pattern (calling  directly inside the logic block) while moving the helper function definition to the rendering phase causes crashing bugs.

**Action:** Always verify that every path in a refactored function populates the data structure correctly and does not rely on helper functions that have been moved out of scope. Use "Search and Replace" with care when logic is split across multiple if/else blocks.

## 2024-05-22 - Smart Entity Cleanup
**Learning:** Running `Array.filter` on multiple entity lists every frame (60 FPS) generates significant Garbage Collection (GC) pressure, even when no entities are removed. In a game loop, object pooling or avoiding allocations is critical.
**Action:** Implemented a "dirty flag" pattern (`hasDeadEntities`). The expensive filter operations and Game Over checks now only run when an entity actually dies, which is a rare event compared to the frame rate. Population count was optimized with `reduce` to avoid creating intermediate arrays.

## 2024-05-24 - Smart DOM Updates
**Learning:** Destroying and recreating the entire Command Panel (15 buttons) every frame causes massive Layout Thrashing and unnecessary GC, even when the UI state hasn't changed.
**Action:** Implemented "Smart DOM Updates" by initializing the DOM elements once and reusing them. We only update `innerHTML` and attributes when the button's calculated state (signature) changes. This reduces DOM operations from ~30/frame to 0/frame in steady state.

## 2024-05-25 - Spatial Grid Memory Optimization
**Learning:** In high-frequency game loops, even small array allocations (like those returned from `SpatialGrid.query`) accumulate rapidly, causing GC stutter. For 100 units checking nearby enemies every 0.5s, this generated hundreds of arrays per second.
**Action:** Refactored `SpatialGrid.query` to accept an optional `result` array. Modified `Unit` class to maintain a persistent `_nearbyCache` array. This eliminates array allocation during the AI update loop completely (0 allocs vs N allocs).
