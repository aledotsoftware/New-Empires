
import { FogOfWar } from '../map/FogOfWar.js';
import { FOW_STATES } from '../core/constants.js';

function testFOW() {
    console.log("Starting Fog of War Logic Test...");

    const cols = 100;
    const rows = 100;
    const fow = new FogOfWar(cols, rows);

    // Initial state check
    console.log("Check initial state: HIDDEN");
    if (fow.grid[0] !== FOW_STATES.HIDDEN) throw new Error("Initial state should be HIDDEN");

    // Test reveal circle
    console.log("Revealing circle at (400, 400) with radius 200...");
    fow.revealCircle(400, 400, 200); // 400/40 = 10 cols, rows

    // Tiles around (10, 10) should be VISIBLE
    if (!fow.isVisible(10, 10)) throw new Error("Tile (10,10) should be VISIBLE");
    if (!fow.isVisible(11, 10)) throw new Error("Tile (11,10) should be VISIBLE");

    // Tiles far away should be HIDDEN
    if (fow.isVisible(50, 50)) throw new Error("Tile (50,50) should be HIDDEN");

    // Test resetVisible
    console.log("Resetting visible to explored...");
    fow.resetVisible();

    if (fow.isVisible(10, 10)) throw new Error("Tile (10,10) should NOT be VISIBLE after reset");
    if (!fow.isExplored(10, 10)) throw new Error("Tile (10,10) should be EXPLORED after reset");

    // Test update with entities
    const mockEntities = [
        { x: 2000, y: 2000, visionRadius: 300, isDead: false }
    ];
    console.log("Updating visibility with mock entity at (2000, 2000)...");
    fow.update(mockEntities);

    // 2000 / 40 = 50
    if (!fow.isVisible(50, 50)) throw new Error("Tile (50,50) should be VISIBLE after update");
    // (10, 10) was explored before, should still be explored (not hidden)
    if (!fow.isExplored(10, 10)) throw new Error("Tile (10,10) should still be EXPLORED");
    if (fow.isVisible(10, 10)) throw new Error("Tile (10,10) should NOT be VISIBLE");

    console.log("✅ Fog of War Logic Test Passed!");
}

// Note: This script is intended to be run in a browser or environment where it can import these modules
// For now, we just define it for reference.
