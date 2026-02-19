
import { performance } from 'perf_hooks';

const ITERATIONS = 1000;
const MAP_SIZE = 480; // Ludicrous
const TOTAL_TILES = MAP_SIZE * MAP_SIZE;

// Mock Data
const data32 = new Uint32Array(TOTAL_TILES);
const grid = new Uint8Array(TOTAL_TILES);

// LUT
const lut = new Uint32Array([0xFF000000, 0x80000000, 0x00000000]); // Hidden, Explored, Visible

// Mock visible ranges (simulate 200 units -> many ranges)
// On a 480x480 map, 200 units with r=8 tiles (256px) cover ~40,000 tiles (20%).
// Scanlines: ~8 ranges per unit * 200 = 1600 ranges.
const RANGES_COUNT = 2000;
const ranges = [];
for (let i = 0; i < RANGES_COUNT; i++) {
    const start = Math.floor(Math.random() * (TOTAL_TILES - 100));
    const end = start + Math.floor(Math.random() * 50);
    ranges.push(start);
    ranges.push(end);

    // Fill grid mock with 2 (VISIBLE)
    // In Game.js, grid is updated before this loop runs
    for (let j = start; j <= end; j++) {
        grid[j] = 2;
    }
}

function runBaseline() {
    const start = performance.now();
    for (let iter = 0; iter < ITERATIONS; iter++) {
        // Simulate currRanges update from Game._updateFOWBuffer
        const len = ranges.length;
        for (let r = 0; r < len; r += 2) {
            const s = ranges[r];
            const e = ranges[r + 1];
            for (let i = s; i <= e; i++) {
                data32[i] = lut[grid[i]];
            }
        }
    }
    return performance.now() - start;
}

function runOptimized() {
    const start = performance.now();
    const visibleColor = lut[2];
    for (let iter = 0; iter < ITERATIONS; iter++) {
        // Optimized: direct fill
        const len = ranges.length;
        for (let r = 0; r < len; r += 2) {
            const s = ranges[r];
            const e = ranges[r + 1];
            // In Game.js, we know these ranges are VISIBLE, so we can skip lookup
            data32.fill(visibleColor, s, e + 1);
        }
    }
    return performance.now() - start;
}

console.log(`Running Bitmap Benchmark: ${ITERATIONS} iterations, ${RANGES_COUNT} ranges...`);

const timeBaseline = runBaseline();
console.log(`Baseline (Loop): ${timeBaseline.toFixed(2)}ms`);

const timeOptimized = runOptimized();
console.log(`Optimized (Fill): ${timeOptimized.toFixed(2)}ms`);

const speedup = timeBaseline / timeOptimized;
console.log(`Speedup: ${speedup.toFixed(2)}x`);
