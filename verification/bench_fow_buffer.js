const { performance } = require('perf_hooks');

// Mock ImageData
const width = 480;
const height = 480;
const totalTiles = width * height;
const dataBuffer = new ArrayBuffer(totalTiles * 4);
const data8 = new Uint8ClampedArray(dataBuffer);
const data32 = new Uint32Array(dataBuffer);

// Mock Grid
const grid = new Uint8Array(totalTiles);
for (let i = 0; i < totalTiles; i++) {
    const rand = Math.random();
    if (rand < 0.5) grid[i] = 0;
    else if (rand < 0.8) grid[i] = 1;
    else grid[i] = 2;
}

const exploredAlpha = 127;

function originalUpdate() {
    const data = data8;
    for (let i = 0; i < totalTiles; i++) {
        const state = grid[i];
        const pxIdx = i * 4;
        data[pxIdx] = 0;
        data[pxIdx + 1] = 0;
        data[pxIdx + 2] = 0;
        if (state === 0) {
            data[pxIdx + 3] = 255;
        } else if (state === 1) {
            data[pxIdx + 3] = exploredAlpha;
        } else {
            data[pxIdx + 3] = 0;
        }
    }
}

function optimizedUpdate() {
    const d32 = data32;
    // Lookup Table
    // const COLORS = [0xFF000000, (exploredAlpha << 24), 0x00000000]; // Array lookup

    // Or local vars + switch/if? No, lookup table is key.
    // Using simple array is fast in V8

    const C0 = 0xFF000000;
    const C1 = (exploredAlpha << 24);
    const C2 = 0x00000000;

    // Since grid[i] is 0, 1, 2.
    // We can use an array
    const LUT = [C0, C1, C2];

    for (let i = 0; i < totalTiles; i++) {
        d32[i] = LUT[grid[i]];
    }
}

// Warmup
for(let i=0; i<100; i++) originalUpdate();
for(let i=0; i<100; i++) optimizedUpdate();

// Bench Original
const startOriginal = performance.now();
for(let i=0; i<1000; i++) {
    originalUpdate();
}
const endOriginal = performance.now();
const timeOriginal = endOriginal - startOriginal;

// Bench Optimized
const startOptimized = performance.now();
for(let i=0; i<1000; i++) {
    optimizedUpdate();
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

console.log(`Original: ${timeOriginal.toFixed(2)}ms`);
console.log(`Optimized: ${timeOptimized.toFixed(2)}ms`);
console.log(`Speedup: ${(timeOriginal / timeOptimized).toFixed(2)}x`);
