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

## 2025-05-29 - System State Visibility
**Learning:** In immersive games, changes to system state (like Pausing) via hotkeys must have immediate, high-contrast visual confirmation. Relying on the absence of movement is insufficient feedback.
**Action:** Implemented a full-screen "PAUSA" overlay with a clear subtitle "Press P to resume" when the game is manually paused. This removes ambiguity about whether the game is frozen or just inactive.

## 2025-05-30 - Unit State Visualization
**Learning:** Players need to understand their economy's flow at a glance. Knowing which villagers are carrying resources (and what type) without selecting them reduces cognitive load and helps diagnose bottlenecks instantly.
**Action:** Added a visual indicator (resource icon) above villagers when they are carrying resources. This provides immediate, non-intrusive feedback about the unit's current task and state directly in the game world.
## 2026-01-23 - [Minimap Navigation & Resolution]
**Learning:** HTML5 Canvas defaults to 300x150, which causes severe coordinate mapping errors when resized via CSS (e.g., 110x110) without updating internal width/height attributes.
**Action:** Always synchronize internal canvas resolution (`width/height`) with CSS display size (`getBoundingClientRect`) in `resize` handlers to ensure 1:1 pixel mapping and accurate pointer events.

## 2026-01-24 - [Sub-Selection Filtering]
**Learning:** In RTS games, precise control over unit subgroups is essential. Players often drag-select a mixed group but need to command only specific units (e.g., "Archers only"). A static "Multiple Selection" text provides no utility.
**Action:** Replaced the generic multi-selection label with interactive buttons for each unit type selected. Clicking a button filters the selection to that specific type, enabling rapid "Select All Army -> Filter to Archers" workflows without needing complex hotkeys.

## 2026-01-25 - [Rich Tooltip Accessibility]
**Learning:** Rich HTML tooltips (containing lists, stats) inside interactive elements are invisible to screen readers if the parent has an `aria-label` (which overrides content) and no link to the tooltip.
**Action:** Implemented unique IDs for tooltips and linked them using `aria-describedby`. This ensures screen readers announce the full detailed content (flattened to text) while keeping the concise name as the primary label.

## 2026-01-26 - [Minimap Viewport Metaphor]
**Learning:** A simple 1px outline for a minimap viewport is often lost on complex terrain backgrounds. Users need a clear visual indicator of their "lens" into the world.
**Action:** Implemented a "Viewport Lens" style using a semi-transparent fill (`rgba(255,255,255,0.08)`) combined with a glow effect. This creates a physical metaphor of a glass lens sliding over the map, improving both visibility and the sense of interactivity.
