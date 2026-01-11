## 2024-05-24 - Canvas Path Batching
**Learning:** In HTML5 Canvas, executing many ctx.stroke() calls is expensive.
**Action:** Always batch compatible shapes into a single path.

## 2024-05-24 - Array Push vs Manual Indexing
**Learning:** In hot loops (like spatial queries), `arr.push(x)` is significantly slower (~60-80%) than `arr[count++] = x` in V8, especially when reusing arrays.
**Action:** Use manual indexing for high-frequency array population in performance-critical code.

## 2025-05-25 - Bitwise Truncation vs Math.floor
**Learning:** `(x | 0)` is reliably faster (10-20% in hot loops) than `Math.floor(x)` for positive numbers in V8, as it avoids float checks and inlines better.
**Action:** Use `| 0` for grid coordinate conversions where inputs are guaranteed positive.

## 2025-05-25 - Hoisting Properties in Nested Loops
**Learning:** Hoisting `this.props` to local variables outside of nested loops (O(N^2)) avoids repeated prototype lookups, yielding measurable (~5-10%) gains in tight spatial queries.
**Action:** Always hoist class properties (`this.buckets`, `this.cols`) before entering critical nested loops.
