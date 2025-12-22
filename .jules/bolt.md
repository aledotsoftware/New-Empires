## 2024-05-22 - Initial Setup
**Learning:** This journal tracks critical performance learnings.
**Action:** Always check this file before starting.

## 2024-05-22 - Smart Entity Cleanup
**Learning:** Running `Array.filter` on multiple entity lists every frame (60 FPS) generates significant Garbage Collection (GC) pressure, even when no entities are removed. In a game loop, object pooling or avoiding allocations is critical.
**Action:** Implemented a "dirty flag" pattern (`hasDeadEntities`). The expensive filter operations and Game Over checks now only run when an entity actually dies, which is a rare event compared to the frame rate. Population count was optimized with `reduce` to avoid creating intermediate arrays.

## 2024-05-22 - Smart DOM Updates
**Learning:** The UI update loop (`updateActionsPanel`) was destroying and recreating 15-45 DOM elements every frame (60 FPS), causing massive layout thrashing and GC pressure. This is a common antipattern in "immediate mode" UI implemented on the DOM.
**Action:** Implemented a "Smart Update" pattern. The 15-button grid is initialized once. In the loop, we calculate a `stateKey` (hash of visual properties) and only touch the DOM if the key changes. This reduced DOM operations from ~45/frame to 0/frame during stable states.
