# Bolt's Journal

## 2024-05-22 - [SpatialGrid.query Optimization]
**Learning:** `SpatialGrid.query` was using `for...of` loops which created iterator overhead in the hot path. Replacing with standard `for` loops and avoiding `Array.concat` or `push.apply` with spread syntax in favor of `push.apply` (or manual loops if V8 deopts) is crucial. But actually, `Array.prototype.push.apply` was chosen in memory for merging buckets.
**Action:** Always check critical loops in `update` and `render` methods.

## 2024-05-23 - [Game.update Loop Optimization]
**Learning:** `Array.reduce` in `Game.update` for counting population was allocating callbacks and reducing performance. Replacing it with a direct counter inside the entity update loop was significantly faster.
**Action:** Avoid high-order array methods (reduce, map, filter) in the main game loop (60fps).

## 2024-05-24 - [Distance Calculation]
**Learning:** `Math.hypot` is significantly slower (~15x) than manual squared distance calculation (`dx*dx + dy*dy`).
**Action:** Use squared distance for proximity checks whenever possible.
