1. **Analyze Requirements:**
   - The user wants to focus on tactical visual experience: HUD, control panel, minimap, iconography, and quick state reading.
   - Specifically mentioned:
     - Improve reading of selection, health, production, and available actions.
     - Make control panel and minimap communicate better what the player can do right now.
     - Prioritize tactical clarity over visual ornament.
     - Keep performance reasonable.
   - Files involved:
     - `medieval-theme.css`
     - `index.html`
     - `js/core/Game.js`
     - `js/managers/IconManager.js`
     - `docs/sistemas/PANEL_CONTROL.md`
     - `docs/sistemas/HOTKEYS.md`

2. **Observations & Improvements to Make:**
   - **HUD & Selection Panel:**
     - Health bar and text could be clearer.
     - Production queue needs better visibility.
   - **Control Panel:**
     - The `updateActionsPanel` method creates action buttons. We can improve how costs and hotkeys are displayed, perhaps by highlighting affordable vs unaffordable actions more clearly. The CSS has `.unaffordable` which is used for tech, but could be extended or similar logic applied.
   - **Minimap:**
     - The minimap currently shows the camera viewport as a simple stroked rect with subtle fill.
     - We can add clearer indicators for the viewport.
     - Maybe add a crosshair or better interactivity feedback.
   - **Iconography (`IconManager.js`):**
     - Some icons are marked as "Temporal". We should ensure fallbacks or emojis are distinct if the image fails. Emojis can be used directly for clarity.
     - We should update `js/core/Game.js` to ensure the HUD clearly separates "can do" vs "can't do". Currently it sets `disabled` and makes the button semi-transparent.

3. **Step-by-Step Plan:**
   - **Step 1: CSS Updates for Clarity (`medieval-theme.css`)**
     - Make the health bars more prominent (thicker, better contrast).
     - Improve the `disabled` state of action buttons to clearly show they are unavailable, maybe with a red tint on the cost.
     - Improve the minimap viewport styling for better contrast against the map.
   - **Step 2: HTML Structure Adjustments (`index.html`)**
     - Ensure the layout of the `selectionContent` has enough space.
   - **Step 3: Game.js Logic Updates (`js/core/Game.js`)**
     - In `updateSelectionPanel`, make the HP text and bar more readable.
     - In `updateActionsPanel`, add visual cues for *why* an action is disabled (e.g., if population is full vs insufficient resources). We can add CSS classes or inline styles.
     - In `renderMinimap`, make the camera viewport more distinct.
   - **Step 4: IconManager Updates (`js/managers/IconManager.js`)**
     - Update fallback emojis to be more tactical and distinct.

4. **Refining the Plan:**
   - Let's look closely at `updateActionsPanel` in `Game.js`.
   - The button rendering already calculates missing resources and shows an error notification on click. We can add a visual indicator on the button itself (like making the cost text red if unaffordable).
   - The health bar in `updateSelectionPanel`: currently `height: 6px`. We can increase to `8px` or `10px` with a darker border for better contrast.
   - The minimap: The `renderMinimap` function uses `strokeRect` with `#e8d48b` (gold). We can make it thicker or add a crosshair in the middle to indicate exactly where the camera is looking.

5. **Pre-commit Checks:**
   - Run verification scripts.
