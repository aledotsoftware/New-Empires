
import { FogOfWar } from '../js/map/FogOfWar.js';
import { CONFIG } from '../js/core/constants.js';

// Mock TILE_SIZE if needed, but FogOfWar imports it from constants.
// Ensure we are in a context where imports work (Node with ESM).

// Mock Entity
class MockEntity {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.visionRadius = radius;
        this.isDead = false;
    }
}

async function runTest() {
    console.log('⚡ Starting FogOfWar Optimization Verification');

    const cols = 100;
    const rows = 100;
    const fow = new FogOfWar(cols, rows);

    // 1. Test Static Sort Comparator optimization
    // We check if numericSort is reused (this is hard to check via script without inspecting code,
    // but we can check if _flushBuffer runs correctly).

    // 2. Test Array Reuse
    const entity = new MockEntity(100, 100, 200); // 200px radius

    // Initial Add - Should allocate cache
    fow.beginUpdate();
    fow.addEntity(entity);
    fow.endUpdate();

    const initialCache = entity._fowCacheRanges;
    if (!initialCache) {
        console.error('❌ Initial cache not created');
        process.exit(1);
    }
    console.log('✅ Initial cache created');

    // Move Entity slightly (Cache Miss, but same radius)
    // Should REUSE the array if optimization is working
    entity.x += 32; // Move 1 tile

    fow.beginUpdate();
    fow.addEntity(entity);
    fow.endUpdate();

    const newCache = entity._fowCacheRanges;

    // In unoptimized code, newCache !== initialCache (new array allocated)
    // In optimized code, newCache === initialCache

    console.log('🔍 Checking for Array Reuse...');
    if (newCache === initialCache) {
        console.log('✅ Array REUSED! Optimization Active.');
    } else {
        console.log('⚠️ Array NOT reused. Optimization NOT active (Expected for baseline).');
    }

    // Verify correctness: Ensure data is valid
    // We expect some data in the cache
    if (entity._fowCacheRanges.length === 0) {
        console.error('❌ Cache is empty');
        process.exit(1);
    }

    // Verify _fowCacheCount if we implement it
    if (entity._fowCacheCount !== undefined) {
        console.log(`✅ _fowCacheCount is present: ${entity._fowCacheCount}`);
    } else {
        console.log('ℹ️ _fowCacheCount is missing (Expected for baseline).');
    }

    console.log('⚡ Verification Complete');
}

runTest().catch(e => console.error(e));
