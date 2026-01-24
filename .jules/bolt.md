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

## 2025-01-26 - Global Lookups & Math Calls
**Learning:** In the `moveTowardsTarget` hot path, removing a repeated `typeof CONFIG` global check and replacing `Math.max/min` clamping with explicit `if/else` checks yielded a massive ~6.8x speedup (329ms -> 48ms for 1M iterations). Property access hoisting and import usage were key factors.
**Action:** For critical per-entity methods, hoist repeated property accesses and prefer local constants/imports over global variable checks.

## 2025-01-28 - Micro-optimization vs Readability
**Learning:** While replacing `Math.min` might yield nanosecond gains in tight loops, applying it broadly (e.g. in 1Hz timers) is counter-productive. Code reviews favor readability unless the bottleneck is proven. However, removing `typeof CONFIG` and global lookups remains a solid win (verified ~7.9x speedup in isolated benchmark for `Villager.update`).
**Action:** Distinguish between "Hot Path" (per frame per entity) and "Warm Path" (timers). Keep math readable unless profiling demands otherwise.

## 2025-02-05 - DOM Updates & Layout Thrashing
**Learning:** Optimizing high-frequency DOM updates (like game clocks or resource counters at 10-60 FPS) by caching rendered state significantly reduces 'Layout Thrashing' and Style Recalculation costs. Simple strict equality checks on strings/numbers in JS are much cheaper than touching DOM properties like `textContent`, even if the value hasn't changed.
**Action:** Implement "dirty checking" or "last rendered value" tracking for any UI element updated in the main loop.

## 2025-02-12 - Block Sorting Strategy
**Learning:** Sorting the entire render list (N entities) every frame using `sort((a,b) => a.y - b.y)` is O(N log N). However, if entities are queried from a SpatialGrid row-by-row, the list is already "Block Sorted" (Row0 < Row1 < Row2). Sorting small buckets individually and concatenating them is 34% faster for N=1000 and avoids the worst-case sorting cost for large N.
**Action:** Leverage inherent spatial ordering when rendering. Sort small buckets/rows locally instead of global sorts.

## 2025-02-26 - Array.filter vs In-Place Removal
**Learning:** `Array.filter` creates a shallow copy of the array every frame. For high-frequency loops (like particle systems), replacing `filter` with a manual in-place "read/write index" loop (swap-and-pop or just overwrite) eliminated GC pressure and yielded a ~13x speedup in synthetic benchmarks.
**Action:** Avoid `filter` in `update()` loops. Use manual in-place modification.

## 2025-02-27 - Context State Batching
**Learning:** Canvas `ctx.save()` and `ctx.restore()` are relatively expensive operations (managing the state stack). For particle systems with hundreds of entities, calling them per-particle adds significant overhead. By wrapping the entire system render loop in a single `save/restore` and manually managing state changes (alpha, color) inside the loop, we eliminate N*2 state stack operations per frame.
**Action:** Batch context state saves at the system level for high-count entities like particles.

## 2025-03-02 - Floating Point Keys in DOM Caching
**Learning:** Using floating-point values (like entity HP) in cache keys for DOM updates causes "thrashing" (rebuilding the DOM every frame) when values change by fractional amounts (e.g. 99.9 -> 99.1).
**Action:** Always round floating-point values (using `Math.ceil` or `Math.floor`) when generating cache keys or comparing state for UI updates, especially if the UI only displays integer values.
