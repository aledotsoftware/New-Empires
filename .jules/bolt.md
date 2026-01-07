# Bolt's Journal

## 2024-05-22 - [JavaScript Loop Optimization]
**Learning:** In the Game.update loop, switching from `Array.reduce` to a standard `for` loop with cached length yielded a ~8.5x performance improvement, and ~1.3x over `for...of`.
**Action:** Prioritize standard `for` loops in hot paths like the main game loop.

## 2024-05-23 - [Spatial Grid Optimization]
**Learning:** Using a split spatial partitioning strategy (dynamic `spatialGrid` vs static `buildingGrid`) reduced combined query/update time by ~45% (from ~0.52ms to ~0.29ms).
**Action:** Separate static and dynamic entities in spatial partitioning systems to avoid rebuilding the entire grid every frame.

## 2024-05-24 - [Distance Calculation Optimization]
**Learning:** Using `dx*dx + dy*dy` (squared distance) instead of `Math.hypot` or `Math.sqrt` in critical loops provided a significant performance boost (~60x faster than `Math.hypot`, ~20-30x faster than `Math.sqrt`).
**Action:** Always use squared distance for range checks and comparisons in hot paths.

## 2024-05-25 - [Canvas Rendering Batching]
**Learning:** Batching drawing operations (e.g., all grid lines in one path, all HP bar backgrounds in one path) significantly reduces draw calls and state changes, improving rendering performance.
**Action:** Look for opportunities to group similar Canvas API calls in the `render` loop.

## 2024-05-26 - [Canvas Frustum Culling]
**Learning:** Implementing precise view frustum culling in `Entity.render` (checking against `viewWidth`/`viewHeight` instead of map size) avoids rendering off-screen entities.
**Action:** Ensure rendering loops have early exits for off-screen objects.

## 2024-05-27 - [Map Rendering RLE]
**Learning:** Implementing Horizontal Run-Length Encoding (RLE) for terrain rendering (batching adjacent same-type tiles) reduced `Path2D` construction overhead by over 90%.
**Action:** Use RLE or similar batching for tile-based rendering.
