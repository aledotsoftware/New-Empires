# Palette's Journal - UX & Accessibility Learnings

## 2024-05-22 - Post-Game Map Viewing
**Learning:** Players in RTS games expect to be able to review the map after the game ends to analyze strategies and enemy layouts. Locking the camera immediately upon "Game Over" frustrates this desire.
**Action:** Decoupled the camera update logic (`updateCamera`) from the main game state update loop. This allows the camera to remain interactive (pan/scroll) even when the game state (`isGameOver`) is frozen, enabling a "Spectator Mode" post-game without complex architectural changes.

## 2024-05-22 - Playwright Interaction with Animated UI
**Learning:** UI elements with CSS transitions (like cards appearing or hover effects) can cause Playwright's `click()` to fail with "element is not stable".
**Action:** Use `force=True` in Playwright `click()` calls for elements known to be interactive but potentially animating, or implement explicit waits for stability if critical. For list selections, using specific indices (e.g., `>> nth=0`) is more reliable than generic class selectors.
