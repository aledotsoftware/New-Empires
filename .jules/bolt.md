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
