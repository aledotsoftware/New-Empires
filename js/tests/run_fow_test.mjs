
import { FogOfWar } from '../map/FogOfWar.js';
import { FOW_STATES, TILE_SIZE } from '../core/constants.js';

function testFOW() {
    console.log(`Starting Fog of War Logic Test (TILE_SIZE=${TILE_SIZE})...`);

    const cols = 100;
    const rows = 100;
    const fow = new FogOfWar(cols, rows);

    // Initial state check
    console.log("Check initial state: HIDDEN");
    if (fow.grid[0] !== FOW_STATES.HIDDEN) throw new Error("Initial state should be HIDDEN");

    // Test reveal circle
    console.log("Revealing circle at (400, 400) with radius 200...");
    fow.revealCircle(400, 400, 200);

    // Calculate expected grid coordinates
    const gridX = Math.floor(400 / TILE_SIZE);
    const gridY = Math.floor(400 / TILE_SIZE);

    // Tiles around center should be VISIBLE
    if (!fow.isVisible(gridX, gridY)) throw new Error(`Tile (${gridX},${gridY}) should be VISIBLE`);
    if (!fow.isVisible(gridX + 1, gridY)) throw new Error(`Tile (${gridX+1},${gridY}) should be VISIBLE`);

    // Tiles far away should be HIDDEN
    if (fow.isVisible(50, 50)) throw new Error("Tile (50,50) should be HIDDEN");

    // Test resetVisible
    console.log("Resetting visible to explored...");
    fow.resetVisible();

    if (fow.isVisible(gridX, gridY)) throw new Error(`Tile (${gridX},${gridY}) should NOT be VISIBLE after reset`);
    if (!fow.isExplored(gridX, gridY)) throw new Error(`Tile (${gridX},${gridY}) should be EXPLORED after reset`);

    // Test update with entities
    const mockEntities = [
        { x: 2000, y: 2000, visionRadius: 300, isDead: false }
    ];
    console.log("Updating visibility with mock entity at (2000, 2000)...");
    fow.update(mockEntities);

    // Calculate expected grid coordinates for new entity
    const gridX2 = Math.floor(2000 / TILE_SIZE);
    const gridY2 = Math.floor(2000 / TILE_SIZE);

    if (!fow.isVisible(gridX2, gridY2)) throw new Error(`Tile (${gridX2},${gridY2}) should be VISIBLE after update`);

    // Previous location check
    if (!fow.isExplored(gridX, gridY)) throw new Error(`Tile (${gridX},${gridY}) should still be EXPLORED`);
    if (fow.isVisible(gridX, gridY)) throw new Error(`Tile (${gridX},${gridY}) should NOT be VISIBLE`);

    console.log("✅ Fog of War Logic Test Passed!");
}

// Note: This script is intended to be run in a browser or environment where it can import these modules
// For now, we just define it for reference.
testFOW();
