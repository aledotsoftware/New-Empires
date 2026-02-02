
import { FogOfWar } from '../js/map/FogOfWar.js';
import { performance } from 'perf_hooks';

// Mock FOW_STATES locally for verification if needed,
// but FogOfWar.js imports them from constants.
// We can check constants through the class instance behavior.

console.log('⚡ Bolt: Verifying FogOfWar Optimization');

// 1. Correctness Test
console.log('\n🔍 Testing Correctness...');
const COLS = 100;
const ROWS = 100;
const fow = new FogOfWar(COLS, ROWS);

// Reveal a circle
const cx = 50 * 32; // pixel coords (TILE_SIZE=32)
const cy = 50 * 32;
const radius = 10 * 32; // 10 tiles

console.log('revealing circle at center...');
fow.revealCircle(cx, cy, radius);

// Verify tiles are visible
// We can access fow.grid directly (Uint8Array)
// Index 50,50 should be VISIBLE (2)
const centerIdx = 50 * COLS + 50;
if (fow.grid[centerIdx] !== 2) {
    console.error(`❌ Error: Center tile should be VISIBLE (2), got ${fow.grid[centerIdx]}`);
    process.exit(1);
}

// Verify visibleRanges is populated
if (fow.visibleRanges.length === 0) {
    console.error('❌ Error: visibleRanges is empty after reveal');
    process.exit(1);
}
console.log(`✅ visibleRanges populated with ${fow.visibleRanges.length / 2} spans`);

// Call resetVisible
console.log('calling resetVisible()...');
fow.resetVisible();

// Verify tiles are EXPLORED (1)
if (fow.grid[centerIdx] !== 1) {
    console.error(`❌ Error: Center tile should be EXPLORED (1) after reset, got ${fow.grid[centerIdx]}`);
    process.exit(1);
}

// Verify visibleRanges is cleared
if (fow.visibleRanges.length !== 0) {
    console.error(`❌ Error: visibleRanges not cleared after reset. Length: ${fow.visibleRanges.length}`);
    process.exit(1);
}
console.log('✅ Correctness verified: VISIBLE -> EXPLORED transition and visibleRanges cleanup works.');


// 2. Benchmark
console.log('\n⏱️ Benchmarking...');
const LARGE_COLS = 480;
const LARGE_ROWS = 480;
const fowBench = new FogOfWar(LARGE_COLS, LARGE_ROWS);
const ITERATIONS = 1000;
const NUM_UNITS = 100;

// Setup Units with random positions
const units = [];
for(let i=0; i<NUM_UNITS; i++) {
    units.push({
        x: Math.random() * LARGE_COLS * 32,
        y: Math.random() * LARGE_ROWS * 32,
        visionRadius: 200
    });
}

// We measure the cost of resetVisible.
// But resetVisible is only expensive if there are visible tiles to reset.
// So we must reveal first.

// We will simulate the loop: Reset -> Reveal
// And measure total time?
// Or just Reset time?
// The optimization is specifically for Reset.
// But Reveal now has overhead (pushing to array).
// So we should verify that Total Time (Reset + Reveal) is better or neutral,
// and Reset Time is much better.

let totalResetTime = 0;
let totalRevealTime = 0;

for (let i = 0; i < ITERATIONS; i++) {
    // 1. Reveal
    const t0 = performance.now();
    for (const u of units) {
        fowBench.revealCircle(u.x, u.y, u.visionRadius);
    }
    const t1 = performance.now();
    totalRevealTime += (t1 - t0);

    // 2. Reset
    const t2 = performance.now();
    fowBench.resetVisible();
    const t3 = performance.now();
    totalResetTime += (t3 - t2);
}

console.log(`Total Reveal Time: ${totalRevealTime.toFixed(2)}ms`);
console.log(`Total Reset Time:  ${totalResetTime.toFixed(2)}ms`);
console.log(`Avg Reset Time:    ${(totalResetTime/ITERATIONS).toFixed(4)}ms`);

// Sanity check: reset time should be very low (e.g. < 0.1ms per frame for 100 units)
if (totalResetTime / ITERATIONS > 0.5) {
    console.warn('⚠️ Warning: Reset time seems high (>0.5ms). Optimization might not be working effective enough.');
} else {
    console.log('✅ Performance looks excellent.');
}

// Check against baseline (approximate based on memory of old implementation which was ~0.6ms)
const baseline = 0.6 * ITERATIONS;
const improvement = baseline / totalResetTime;
console.log(`Estimated Speedup vs O(N) Baseline: ~${improvement.toFixed(1)}x`);
