# Bolt's Journal

## 2024-05-22 - Initial Setup
**Learning:** This journal tracks critical performance learnings.
**Action:** Always check this file before starting.

## 2024-05-22 - Smart Entity Cleanup
**Learning:** Running `Array.filter` on multiple entity lists every frame (60 FPS) generates significant Garbage Collection (GC) pressure, even when no entities are removed. In a game loop, object pooling or avoiding allocations is critical.
**Action:** Implemented a "dirty flag" pattern (`hasDeadEntities`). The expensive filter operations and Game Over checks now only run when an entity actually dies, which is a rare event compared to the frame rate. Population count was optimized with `reduce` to avoid creating intermediate arrays.
