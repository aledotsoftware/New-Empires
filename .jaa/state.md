Completed tracking optimizations and arrays

- Fixed SaveManager & ProductionQueue regressions: Ensure cost is correctly stored/restored and researchedTechs Set is serialized properly.- Refined unit combat AI to improve spacing, target selection, and tactical responsiveness. Adjusted melee attack ranges, enhanced anti-clumping separation force, and eliminated awkward archer-to-archer kiting loops.
- Improved macro pacing: Accelerated unit production times and added increased `maxCarry` to the `wheelbarrow` technology. Removed double population counting in Game.js.
