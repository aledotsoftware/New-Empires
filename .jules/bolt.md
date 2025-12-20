## 2024-05-22 - SpatialGrid Map vs Array
**Learning:** In high-frequency loops (like game update cycles), using `Map<string, T>` with constructed string keys (e.g., `${x},${y}`) generates significant garbage collection pressure.
**Action:** Replace 2D spatial hashes with flat 1D Arrays using integer indexing (`row * width + col`) and reuse arrays/objects instead of recreating them. Track active indices to avoid clearing the entire sparse array.
