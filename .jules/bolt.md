# Bolt's Journal

## 2024-05-22 - [Safe Array Concatenation in Hot Paths]
**Learning:** `Array.prototype.push.apply` is significantly faster than a manual loop for merging arrays in V8, but it risks a "Maximum call stack size exceeded" error if the source array is too large (>65k).
**Action:** Use a hybrid approach: check `source.length` and use `push.apply` for safe sizes (e.g., < 32k), falling back to a loop for larger datasets.
