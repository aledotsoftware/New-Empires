# Bolt's Journal

## 2024-05-22 - Performance Baseline
**Learning:** Node.js V8 JIT is surprisingly good at optimizing small function calls like `getIndex`. Inlining simple arithmetic might yield marginal gains unless the call frequency is extremely high (millions/frame).
**Action:** Always benchmark "obvious" optimizations. What looks faster might just be code bloat.

## 2024-05-22 - Hot Path Identification
**Learning:** `Unit.moveTowardsTarget` is a critical hot path executed N times per frame (N = unit count). Even micro-optimizations here scale linearly with unit count.
**Action:** Focus on `moveTowardsTarget` and its dependencies (`SpatialGrid`, `GridMap`).

## 2025-01-13 - Allocation Blind Spots
**Learning:** Even with an optimized `SpatialGrid` API allowing zero-allocation queries (`query(..., result)`), developers (myself included) can easily misuse it by clearing the cache manually (`cache.length = 0`) but forgetting to pass it to the function. This results in the function allocating a *new* array every call, silently defeating the optimization intent.
**Action:** Always verify that "cached" queries actually pass the cache variable.

## 2025-01-13 - Early Exit Spatial Search
**Learning:** For "find any target" queries (like `findNearbyEnemy`), populating a full array of neighbors is wasteful if we only need the first valid one. Adding a `find` method with a predicate allowed stopping the search immediately upon finding a match, yielding ~84% improvement in benchmarks. Furthermore, even in "no match" cases, `find` was ~77% faster because it avoided the memory traffic of writing references to the result array.
**Action:** Prefer iterator/predicate patterns over array-filling patterns for "exists" or "find first" queries in hot loops.

## 2025-01-18 - Canvas Path2D Caching
**Learning:** Creating `new Path2D()` objects every frame in HTML5 Canvas, even if empty or simple, generates significant garbage collection pressure at 60fps (360+ allocations/sec). For static viewports (common in RTS base management), caching these path objects resulted in a 9x performance improvement (10.8ms -> 1.2ms per 500 frames) by skipping both the allocation and the coordinate calculation loops.
**Action:** Always look for opportunities to cache `Path2D` or pre-rendered canvases for static rendering layers.
