# Palette's Journal - UX & Accessibility Learnings

## 2024-05-22 - Post-Game Map Viewing
**Learning:** Players in RTS games expect to be able to review the map after the game ends to analyze strategies and enemy layouts. Locking the camera immediately upon "Game Over" frustrates this desire.
**Action:** Decoupled the camera update logic (`updateCamera`) from the main game state update loop. This allows the camera to remain interactive (pan/scroll) even when the game state (`isGameOver`) is frozen, enabling a "Spectator Mode" post-game without complex architectural changes.

## 2025-05-24 - Nested Modal Focus Management
**Learning:** The existing `FocusManager` used a single `previousActiveElement` variable, which failed to restore focus correctly when modals were nested (e.g., Confirmation dialog over Settings).
**Action:** Upgraded `FocusManager` to use a `focusStack`. This ensures focus is restored to the correct element in reverse order of opening, preserving the keyboard navigation flow through multiple layers of UI.
## 2024-05-24 - Build Ghost Accessibility
**Learning:** Relying solely on color (Red vs Green) to indicate state (Invalid vs Valid placement) is a critical accessibility failure for colorblind users and can be ambiguous on complex terrain backgrounds.
**Action:** Enhanced the building placement preview ("ghost") to include a high-contrast symbol ('🚫') and a clear text label ("Occupied" or "Invalid Terrain") when placement is forbidden. This ensures the feedback is communicated through multiple channels (Color + Shape + Text), making the core mechanic of building accessible to everyone.

## 2025-05-25 - Auto-Pause on Fullscreen Modals
**Learning:** In single-player RTS games, allowing the game loop to run while full-screen modals (Settings, Tech Tree) are open creates unnecessary cognitive load and anxiety, as players fear missing events while reading static content.
**Action:** Implemented automatic toggling of `game.isPaused` when opening/closing these modals. This aligns the system state with the user's mental model that "Menu = Pause", providing a safe space for configuration and learning without gameplay penalty.

## 2025-05-26 - Reactive Tech Tree Feedback
**Learning:** In the Tech Tree, technologies that were unlocked but unaffordable (insufficient resources) were non-interactive. This lack of feedback led to "click rage" or confusion about why an action wasn't working.
**Action:** Implemented a specific "unaffordable" state that keeps the element interactive (clickable) but visually distinct. Clicking now triggers a toast notification explicitly listing the missing resources, guiding the player on what to do next instead of silently failing.

## 2025-05-27 - Hotkey Visual Feedback
**Learning:** Hotkeys are efficient but invisible. Users, especially those learning the game, lack confirmation that their keypress triggered the desired action (e.g., "Did I press 'Q' or not?").
**Action:** Implemented a momentary ".active-key" visual state (simulating a click press) on UI buttons when their corresponding hotkey is pressed. This bridges the gap between physical input and digital response, making the interface feel more tangible and responsive.

## 2025-05-28 - Atmospheric Particle Effects
**Learning:** Static start screens in immersive games can feel "dead". Adding subtle, procedural animations (like rising embers) creates a sense of life and polish without heavy video assets.
**Action:** Implemented a lightweight particle system using DOM elements and CSS animations. Crucially, the system respects `prefers-reduced-motion` to ensure accessibility, disabling the effect for users sensitive to motion.
