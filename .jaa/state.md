Completed tracking optimizations and arrays

- Fixed SaveManager & ProductionQueue regressions: Ensure cost is correctly stored/restored and researchedTechs Set is serialized properly.
- Refined unit combat AI to improve spacing, target selection, and tactical responsiveness. Adjusted melee attack ranges, enhanced anti-clumping separation force, and eliminated awkward archer-to-archer kiting loops.
- Improved macro pacing: Accelerated unit production times and added increased `maxCarry` to the `wheelbarrow` technology. Removed double population counting in Game.js.
- Improved Procedural Map Generation: Widened connection paths between landmasses, smoothed terrain generation to remove micro-choke points, reduced visual clutter decorations, and ensured gold and stone resources spawn on clear, buildable terrain rather than inside forests.
- Enhanced UX/UI Feedback: Upgraded visual and auditory feedback loops including a new `.shake` effect for invalid actions, distinct text rendering in `EffectsManager`, clearer HP/Production bars, and robust hover highlighting (`drawHoverHighlight`) for improved tactical clarity.
- Implemented robust UI integration for dynamic descriptions, fixing tooltip elements (`.tooltip-desc`) in `Game.js` to ensure the localized descriptions or base descriptions are rendered for building variants and unit upgrades.
- Enhanced the `assets/civilization/*.json` and `assets/technologies/base_technologies.json` definitions by translating and automatically calculating and appending explicit mathematical modifiers (e.g., "+15% Vel. Caballería", "+10% HP Edificios") to descriptions, ensuring maximum tactical clarity for players.
- Removed array allocations (\`.filter\`, \`.splice\`, \`.push\`, \`.shift\`, etc.) from hot paths and core game loops, replacing them with manual iteration and pre-allocated arrays or in-place object pools to reduce Garbage Collection pressure.
