# Bolt's Journal - Critical Learnings

## 2024-05-22 - SpatialGrid Performance
**Learning:** `Array.prototype.push.apply` is faster than manual loops for merging buckets in `SpatialGrid.query`, but has a stack limit (around ~32k elements). For very large queries, a fallback loop is required.
**Action:** Use `push.apply` for typical cases, but add a length check to avoid stack overflow.

## 2024-05-22 - Distance Calculations
**Learning:** `Math.hypot` is significantly slower (approx 20x) than `Math.sqrt(dx*dx + dy*dy)`.
**Action:** Always use manual calculation for Euclidean distance in hot paths. Use squared distance for comparisons.

## 2024-05-22 - Loop Performance
**Learning:** Standard `for` loops with cached length are ~8.5x faster than `Array.reduce` and ~1.3x faster than `for...of` in V8.
**Action:** Avoid array methods in `update` and `render` loops.

## 2024-05-22 - Canvas Batching
**Learning:** `ctx.stroke()` and `ctx.fill()` are expensive. Batching geometry into a single `Path2D` or reducing call count is critical.
**Action:** Aggregate draw calls where possible (e.g. Grid drawing).

## 2024-05-22 - View Frustum Culling
**Learning:** Checking entities against `CONFIG.CANVAS_WIDTH` for culling is ineffective if that constant represents Map Size, not Viewport Size.
**Action:** Always pass `viewWidth` and `viewHeight` (viewport dimensions) to render methods for precise culling.
