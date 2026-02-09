
import { Unit } from '../js/entities/Unit.js';
import { CONFIG } from '../js/core/constants.js';
import { performance } from 'perf_hooks';

// Mock Game
const game = {
    gridMap: {
        invTileSize: 1 / 32,
        cols: CONFIG.CANVAS_WIDTH / 32,
        rows: CONFIG.CANVAS_HEIGHT / 32,
        collisionGrid: new Uint8Array((CONFIG.CANVAS_WIDTH / 32) * (CONFIG.CANVAS_HEIGHT / 32))
    },
    terrainMap: {
        getTerrainDataByGrid: (col, row) => ({ movementSpeed: 1.0 }),
        getTerrainDataAt: (x, y) => ({ movementSpeed: 1.0 })
    }
};

function runBenchmark() {
    const unit = new Unit(100, 100, 'player');
    const iterations = 10_000_000; // Increased to 10M

    // We reuse targets array to avoid 10M object allocations affecting GC
    const targets = new Float32Array(iterations * 2);
    for (let i = 0; i < iterations; i++) {
        targets[i*2] = Math.random() * CONFIG.CANVAS_WIDTH;
        targets[i*2+1] = Math.random() * CONFIG.CANVAS_HEIGHT;
    }

    // Force initialization of cache if any
    unit.moveTowardsTarget(101, 101, 0.016, game);

    console.log('Starting benchmark...');
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        const tx = targets[i*2];
        const ty = targets[i*2+1];
        unit.moveTowardsTarget(tx, ty, 0.016, game);
    }

    const end = performance.now();
    const duration = end - start;

    console.log(`Executed ${iterations} iterations in ${duration.toFixed(2)}ms`);
    console.log(`Average time per call: ${(duration / iterations * 1000).toFixed(4)}µs`); // in microseconds
    console.log(`Final Position: ${unit.x.toFixed(2)}, ${unit.y.toFixed(2)}`);
    console.log(`Final Grid: ${unit._lastGridCol}, ${unit._lastGridRow}`);

    // Verify correctness: Unit should have moved
    if (unit.x === 100 && unit.y === 100) {
        console.error('FAIL: Unit did not move!');
        process.exit(1);
    }

    console.log('PASS: Benchmark completed successfully.');
}

runBenchmark();
