## 2024-05-24 - Canvas Path Batching
**Learning:** In HTML5 Canvas, executing many ctx.stroke() calls is expensive.
**Action:** Always batch compatible shapes into a single path.

## 2024-05-24 - Array Push vs Manual Indexing
**Learning:** In hot loops (like spatial queries), `arr.push(x)` is significantly slower (~60-80%) than `arr[count++] = x` in V8, especially when reusing arrays.
**Action:** Use manual indexing for high-frequency array population in performance-critical code.
