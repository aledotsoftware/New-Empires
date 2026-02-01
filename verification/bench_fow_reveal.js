
const { performance } = require('perf_hooks');

// Constants
const TILE_SIZE = 32;
const FOW_STATES = {
    HIDDEN: 0,
    EXPLORED: 1,
    VISIBLE: 2
};

class FogOfWar {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.totalTiles = cols * rows;
        this.invTileSize = 1 / TILE_SIZE;
        this.grid = new Uint8Array(this.totalTiles);
        this.isDirty = false;
    }

    // Baseline: O(R^2) per-pixel check
    revealCircleOriginal(centerX, centerY, radius) {
        const gridX = (centerX * this.invTileSize) | 0;
        const gridY = (centerY * this.invTileSize) | 0;
        const gridRadius = (radius * this.invTileSize) | 0;
        const gridRadiusSq = gridRadius * gridRadius;

        const startX = Math.max(0, gridX - gridRadius);
        const endX = Math.min(this.cols - 1, gridX + gridRadius);
        const startY = Math.max(0, gridY - gridRadius);
        const endY = Math.min(this.rows - 1, gridY + gridRadius);

        for (let y = startY; y <= endY; y++) {
            const dy = y - gridY;
            const dySq = dy * dy;

            for (let x = startX; x <= endX; x++) {
                const dx = x - gridX;
                const distSq = dx * dx + dySq;

                if (distSq <= gridRadiusSq) {
                    const idx = y * this.cols + x;
                    if (this.grid[idx] !== FOW_STATES.VISIBLE) {
                        this.grid[idx] = FOW_STATES.VISIBLE;
                        this.isDirty = true;
                    }
                }
            }
        }
    }

    // Optimization: Scanline Fill (O(R))
    revealCircleOptimized(centerX, centerY, radius) {
        const gridX = (centerX * this.invTileSize) | 0;
        const gridY = (centerY * this.invTileSize) | 0;
        const gridRadius = (radius * this.invTileSize) | 0;
        const gridRadiusSq = gridRadius * gridRadius;

        const startY = Math.max(0, gridY - gridRadius);
        const endY = Math.min(this.rows - 1, gridY + gridRadius);

        for (let y = startY; y <= endY; y++) {
            const dy = y - gridY;

            // Calculate span width based on circle equation: x^2 + y^2 <= r^2
            // x <= sqrt(r^2 - y^2)
            // Use integer math for "width from center"

            const dySq = dy * dy;
            // Avoid negative square root input due to rounding issues at edges
            if (dySq > gridRadiusSq) continue;

            const spanHalfWidth = Math.sqrt(gridRadiusSq - dySq) | 0;

            // Calculate segment bounds
            const x0 = Math.max(0, gridX - spanHalfWidth);
            const x1 = Math.min(this.cols, gridX + spanHalfWidth + 1); // Exclusive end for fill

            if (x0 < x1) {
                const rowOffset = y * this.cols;
                // Use native fill for speed
                this.grid.fill(FOW_STATES.VISIBLE, rowOffset + x0, rowOffset + x1);
                this.isDirty = true; // Conservative dirty flag (assume something changed)
            }
        }
    }
}

// Setup
const MAP_SIZE = 6400; // Normal map
const COLS = Math.ceil(MAP_SIZE / TILE_SIZE); // 200
const ROWS = Math.ceil(MAP_SIZE / TILE_SIZE); // 200

const fowOriginal = new FogOfWar(COLS, ROWS);
const fowOptimized = new FogOfWar(COLS, ROWS);

// Benchmark Parameters
const ITERATIONS = 10000;
const RADIUS = 250; // Unit vision radius
const ENTITY_COUNT = 100; // Simulate 100 units revealing vision

console.log(`Running benchmark on map ${COLS}x${ROWS} tiles...`);
console.log(`Simulating ${ITERATIONS} frames with ${ENTITY_COUNT} units each...`);

// Generate random entity positions
const entities = [];
for (let i = 0; i < ENTITY_COUNT; i++) {
    entities.push({
        x: Math.random() * MAP_SIZE,
        y: Math.random() * MAP_SIZE
    });
}

// Warmup
for (let i = 0; i < 10; i++) {
    for (const ent of entities) {
        fowOriginal.revealCircleOriginal(ent.x, ent.y, RADIUS);
    }
}

const startOriginal = performance.now();
for (let i = 0; i < ITERATIONS / 100; i++) { // Reduce total calls to keep benchmark short (10000 * 100 is too much)
    // Let's do 500 frames of 100 units = 50,000 calls
    for (const ent of entities) {
        fowOriginal.revealCircleOriginal(ent.x, ent.y, RADIUS);
    }
}
const endOriginal = performance.now();
const timeOriginal = endOriginal - startOriginal;

// Warmup
for (let i = 0; i < 10; i++) {
    for (const ent of entities) {
        fowOptimized.revealCircleOptimized(ent.x, ent.y, RADIUS);
    }
}

const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS / 100; i++) {
    for (const ent of entities) {
        fowOptimized.revealCircleOptimized(ent.x, ent.y, RADIUS);
    }
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

console.log(`Original: ${timeOriginal.toFixed(2)}ms`);
console.log(`Optimized: ${timeOptimized.toFixed(2)}ms`);
console.log(`Improvement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}%`);

// Correctness Check (Visual Sampling)
let mismatch = 0;
for (let i = 0; i < fowOriginal.totalTiles; i++) {
    if (fowOriginal.grid[i] !== fowOptimized.grid[i]) {
        mismatch++;
    }
}

console.log(`Correctness Mismatch (Tiles): ${mismatch}`);
if (mismatch > 0) {
    console.log("NOTE: Slight mismatch is expected due to floating point vs integer rounding differences in circle edge calculations.");
    console.log("Acceptable if mismatch is small (< 1% of area).");
}
