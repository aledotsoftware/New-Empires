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

## 2025-05-23 - Render Loop Lookups & Caching
**Learning:** In hot render loops like `drawResourceNodes` (N=hundreds), repeated global lookups (`assetLoader.getImage`) and property access (`typeof`) add measurable overhead (~0.1ms per frame for 10k nodes).
**Action:** Cache static assets directly on the entity instance (`node._cachedImage`) during the first render pass to convert subsequent lookups into O(1) property access.

## 2025-05-23 - Spatial Grid Correctness vs Performance
**Learning:** Merging `SpatialGrid.add()` and `Unit.update()` into a single loop for "optimization" introduces asymmetric behavior (early units don't see late units). While fixing this requires splitting the loop (2x iteration overhead), correctness is a prerequisite for any valid optimization.
**Action:** Be wary of single-pass optimizations that depend on neighbor state. Verify symmetric visibility.

## 2025-05-24 - Drop-Off Point Caching
**Learning:** Villager pathfinding to drop-off resources was an O(N) operation over all buildings (N=hundreds), causing spikes in late game. By maintaining a cached array of just 'TownCenter' and 'Storage' buildings (O(M), M < 10), we reduced the search space significantly.
**Action:** Identify and cache subsets of entities (like drop-off points) that are queried frequently but change infrequently.

## 2025-05-25 - Instruction Cache & Loop Splitting
**Learning:** Splitting a mixed workload loop (e.g. SpatialGrid.add + Unit.update) into two distinct passes proved to be ~65% faster in benchmarks, contrary to the "iterate once" intuition. This is likely due to improved Instruction Cache locality and JIT optimization, as the CPU executes homogeneous operations in each pass without context switching.
**Action:** When a loop performs two distinct, heavy types of operations, benchmark splitting them. The overhead of iterating twice is often dwarfed by the gains in CPU efficiency.

## 2025-05-26 - Draw Call Batching & Z-Ordering
**Learning:** Batching `ctx.fillRect` calls for entity backgrounds (team bases) by team color reduced N draw calls to 2 draw calls per frame. Crucially, drawing these backgrounds in a separate "Ground Pass" before sorting sprites not only optimized performance but also fixed a visual artifact where the "base" of a foreground unit would be drawn over the head of a background unit.
**Action:** When optimizing rendering, look for opportunities to split layers (Ground, Sprite, UI) to enable batching and improve visual correctness simultaneously.

## 2025-05-27 - Multi-Pass Rendering & Coordinate Caching
**Learning:** In multi-pass rendering (Backgrounds -> Icons), recalculating screen coordinates and re-checking frustum culling for each pass adds significant overhead (N*Passes operations).
**Action:** For static or semi-static entities (like resources), perform a single "Pre-pass" to calculate/cache screen coordinates and filter visible items into a compacted list. This reduced render time by ~26% in `drawResourceNodes`.

## 2025-05-28 - Minimap Layer Caching
**Learning:** Even with batched drawing calls, iterating over static entities (resources/buildings) and performing `ctx` calls (even if batched) every frame adds significant overhead to the main thread. Caching the static layer (background + resources + buildings) into an offscreen canvas reduced draw calls by ~87% (120k -> 15k in benchmark) and eliminated iteration logic from the hot path.
**Action:** Identify static layers in UI/HUD elements (like minimaps) and cache them in offscreen canvases, updating only when the underlying state changes (dirty flag pattern).

## 2025-05-29 - Logic Bugs as Performance Leaks
**Learning:** The `renderMinimap` loop iterated twice over `this.units` (once for player, once for enemies), but since enemies were stored in `this.enemies`, the second pass was wasted O(N) work and the enemies weren't drawn. Fixing the loop to iterate `this.enemies` correctly not only fixed a bug (missing dots) but also improved performance by replacing 2*N checks with N+M checks (where M << N typically).
**Action:** When optimizing loops, verify the data structures being iterated actually contain the target data. A "performance" loop that does nothing is still wasted cycles.

## 2025-06-01 - Center-First Spatial Search
**Learning:** In "find closest" spatial queries (like melee combat), scanning buckets in a standard loop order (top-left to bottom-right) is inefficient because the target is most likely in the same bucket as the seeker. Prioritizing the "center bucket" (checking it first, then skipping it in the loop) yielded a ~4.9x speedup (53ms vs 260ms) for close-range lookups by avoiding wasted checks on distant neighbors.
**Action:** For spatial `find` operations where proximity is highly correlated with success, explicitly check the origin bucket before iterating the search radius.

## 2026-01-31 - Fog of War Bitmap Buffering
**Learning:** Rebuilding `Path2D` with thousands of `rect()` calls every frame is extremely expensive for the CPU and GPU. Caching the 2D grid state into a low-resolution offscreen canvas using `putImageData` and then using `drawImage` with scaling is ~90% faster. Browser interpolation handles the tile-to-pixel scaling smoothly.
**Action:** Use bitmap buffers for any tile-based overlays that change infrequently but cover large areas.

## 2026-01-31 - Allocation Hot Spots (FOW)
**Learning:** Allocating temporary arrays (e.g., `[]`) inside frequent update loops (10Hz+) generates significant Garbage Collection pressure. Reusing a persistent cache array (`this._cache.length = 0` then `push`) reduced execution time by ~17% in FOW updates and eliminated thousands of short-lived object allocations per minute.
**Action:** For any collection built inside a loop (update/render), prefer a persistent member variable cache over local array allocation.

## 2026-02-06 - Uint32Array vs Uint8 writes
**Learning:** Updating a large `ImageData` buffer (e.g., Fog of War) byte-by-byte (`data[i]=R; data[i+1]=G...`) with conditional logic is significantly slower than writing 32-bit integers via a `Uint32Array` view. Using a Lookup Table (LUT) to map state indices to pre-calculated 32-bit colors eliminated branch prediction failures and reduced memory access by 4x, yielding a ~5x speedup (0.6ms vs 3ms for 230k tiles).
**Action:** For pixel manipulation loops, always use `Uint32Array` views and pre-calculated integer colors (checking endianness).

## 2026-02-06 - Constant Hoisting & Property Access
**Learning:** In extremely hot loops like `Unit.moveTowardsTarget`, repeated property access on nested objects (e.g. `gridMap.invTileSize`) adds up. Replacing dynamic lookups with a module-level constant (`1 / TILE_SIZE`) and hoisting `gridMap` checks reduced execution time by ~8-15% in benchmarks.
**Action:** For per-frame/per-entity calculations, prefer module-level constants over object properties where values are static.
