
import { FogOfWar } from '../js/map/FogOfWar.js';

// Mock constants
// We need to mock the import or ensure it resolves.
// Since we are running with node, we might need a package.json type: module or use .mjs extension.
// But we can't change package.json.

// Let's try to run this with node.
// We might need to mock the constants module if it fails.
// Actually, let's create a test that mocks the environment.

console.log("Testing FogOfWar optimization...");

// Mock entity
class MockEntity {
    constructor(x, y, isBuilding) {
        this.x = x;
        this.y = y;
        this.isBuilding = isBuilding;
        this.visionRadius = 100;
        this.isDead = false;
    }
}

// Simple test
try {
    const fow = new FogOfWar(100, 100);

    const building = new MockEntity(500, 500, true);
    const unit = new MockEntity(600, 600, false);

    const entities = [building, unit];

    console.log("Running update 1...");
    fow.update(entities);

    console.log("Checking if cache created...");
    if (building._fowCacheRanges) {
        console.log("SUCCESS: Cache created for building");
        console.log(`Cache length: ${building._fowCacheRanges.length}`);
    } else {
        console.error("FAILURE: Cache NOT created for building");
        process.exit(1);
    }

    if (unit._fowCacheRanges) {
        console.error("FAILURE: Cache created for unit (should not happen)");
        process.exit(1);
    } else {
        console.log("SUCCESS: No cache for unit");
    }

    console.log("Running update 2 (cache hit)...");
    const start = process.hrtime.bigint();
    fow.update(entities);
    const end = process.hrtime.bigint();
    console.log(`Update took ${Number(end - start) / 1e6} ms`);

    // Validate cache is still there and used (we can't easily check 'used' without spying, but logic suggests it)
    if (!building._fowCacheRanges) {
        console.error("FAILURE: Cache lost");
        process.exit(1);
    }

    console.log("All tests passed!");
} catch (e) {
    console.error("Test failed:", e);
    process.exit(1);
}
