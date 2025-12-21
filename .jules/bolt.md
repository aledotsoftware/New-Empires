## 2024-05-22 - Initial Setup
**Learning:** This journal tracks critical performance learnings.
**Action:** Always check this file before starting.

## 2024-05-22 - Smart UI Updates
**Learning:** In a vanilla JS game loop (60 FPS), repeatedly clearing and rebuilding the DOM (using `innerHTML` or `removeChild` loops) for UI panels that rarely change structure (like action buttons or selection info) causes massive layout thrashing and garbage collection pressure.
**Action:** Implement "Smart Updates":
1. Track the *signature* of the current state (e.g., `id:123_type:villager` or a hash of button labels).
2. If signature matches last frame:
   - Do NOT touch the DOM structure.
   - ONLY update dynamic attributes (e.g., `class="disabled"`, text content for HP).
3. If signature differs:
   - Rebuild the DOM structure.
**Result:** Eliminated ~60 DOM rebuilds per second per panel, significantly reducing CPU usage during idle/selection states.
