
import { FogOfWar } from '../js/map/FogOfWar.js';
import { FOW_STATES } from '../js/core/constants.js';

function testFOW() {
    console.log("Starting Fog of War Logic Test (Node.js wrapper)...");

    const cols = 100;
    const rows = 100;
    const fow = new FogOfWar(cols, rows);

    // Initial state check
    console.log("Check initial state: HIDDEN");
    if (fow.grid[0] !== FOW_STATES.HIDDEN) throw new Error("Initial state should be HIDDEN");

    // Test reveal circle
    console.log("Revealing circle at (400, 400) with radius 200...");
    fow.revealCircle(400, 400, 200); // 400/32 = 12.5. Tile (12,12)

    // TILE_SIZE is 32. 400 / 32 = 12.5.
    // Tile (12, 12).
    // Radius 200 / 32 = 6.25.
    // Range roughly 6-18.

    // Check center
    const cx = 12, cy = 12;
    if (!fow.isVisible(cx, cy)) throw new Error(`Tile (${cx},${cy}) should be VISIBLE`);

    // Check edge
    if (!fow.isVisible(cx + 4, cy)) throw new Error(`Tile (${cx+4},${cy}) should be VISIBLE`);

    // Tiles far away should be HIDDEN
    if (fow.isVisible(50, 50)) throw new Error("Tile (50,50) should be HIDDEN");

    // Test resetVisible
    console.log("Resetting visible to explored...");
    fow.resetVisible();

    if (fow.isVisible(cx, cy)) throw new Error(`Tile (${cx},${cy}) should NOT be VISIBLE after reset`);
    if (!fow.isExplored(cx, cy)) throw new Error(`Tile (${cx},${cy}) should be EXPLORED after reset`);

    // Test update with entities (Batched path)
    const mockEntities = [
        { x: 2000, y: 2000, visionRadius: 300, isDead: false },
        { x: 2050, y: 2000, visionRadius: 300, isDead: false } // Overlapping
    ];
    console.log("Updating visibility with mock entities (Batched)...");
    fow.update(mockEntities);

    // 2000 / 32 = 62.5
    // Tile (62, 62)
    if (!fow.isVisible(62, 62)) throw new Error("Tile (62,62) should be VISIBLE after update");

    // Previous should still be explored
    if (!fow.isExplored(cx, cy)) throw new Error(`Tile (${cx},${cy}) should still be EXPLORED`);
    if (fow.isVisible(cx, cy)) throw new Error(`Tile (${cx},${cy}) should NOT be VISIBLE`);

    console.log("✅ Fog of War Logic Test Passed!");
}

testFOW();
