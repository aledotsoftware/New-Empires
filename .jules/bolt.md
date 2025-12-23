## 2024-05-22 - Initial Setup
**Learning:** This journal tracks critical performance learnings.
**Action:** Always check this file before starting.

## 2024-05-22 - Smart Entity Cleanup
**Learning:** Running `Array.filter` on multiple entity lists every frame (60 FPS) generates significant Garbage Collection (GC) pressure, even when no entities are removed. In a game loop, object pooling or avoiding allocations is critical.
**Action:** Implemented a "dirty flag" pattern (`hasDeadEntities`). The expensive filter operations and Game Over checks now only run when an entity actually dies, which is a rare event compared to the frame rate. Population count was optimized with `reduce` to avoid creating intermediate arrays.

## 2024-05-24 - Smart DOM Updates
**Learning:** Destroying and recreating the entire Command Panel (15 buttons) every frame causes massive Layout Thrashing and unnecessary GC, even when the UI state hasn't changed.
**Action:** Implemented "Smart DOM Updates" by initializing the DOM elements once and reusing them. We only update `innerHTML` and attributes when the button's calculated state (signature) changes. This reduces DOM operations from ~30/frame to 0/frame in steady state.
