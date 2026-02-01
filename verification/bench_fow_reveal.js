const { performance } = require('perf_hooks');

// Constants
const TILE_SIZE = 32;
const FOW_STATES = {
    HIDDEN: 0,
    EXPLORED: 1,
    VISIBLE: 2
};

// Original Class Logic
class FogOfWarOriginal {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.totalTiles = cols * rows;
        this.invTileSize = 1 / TILE_SIZE;
        this.grid = new Uint8Array(this.totalTiles);
        this.isDirty = true;
    }

    revealCircle(centerX, centerY, radius) {
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
}

// Optimized Class Logic
class FogOfWarOptimized {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.totalTiles = cols * rows;
        this.invTileSize = 1 / TILE_SIZE;
        this.grid = new Uint8Array(this.totalTiles);
        this.isDirty = true;
    }

    revealCircle(centerX, centerY, radius) {
        const gridX = (centerX * this.invTileSize) | 0;
        const gridY = (centerY * this.invTileSize) | 0;
        const gridRadius = (radius * this.invTileSize) | 0;
        const gridRadiusSq = gridRadius * gridRadius;

        const startY = Math.max(0, gridY - gridRadius);
        const endY = Math.min(this.rows - 1, gridY + gridRadius);

        for (let y = startY; y <= endY; y++) {
            const dy = y - gridY;
            const dySq = dy * dy;

            // Calculate half-width of the circle at this Y
            // dx^2 + dy^2 <= R^2  =>  dx <= sqrt(R^2 - dy^2)
            // Use Math.max(0, ...) to avoid negative sqrt due to float precision (unlikely here but safe)
            const halfWidth = Math.sqrt(Math.max(0, gridRadiusSq - dySq)) | 0;

            const startX = Math.max(0, gridX - halfWidth);
            const endX = Math.min(this.cols - 1, gridX + halfWidth);

            // Use fill for the range (Scanline fill)
            if (endX >= startX) {
                const rowOffset = y * this.cols;
                this.grid.fill(FOW_STATES.VISIBLE, rowOffset + startX, rowOffset + endX + 1);
            }
        }
        this.isDirty = true;
    }
}

// Benchmark Setup
const WIDTH = 6400;
const HEIGHT = 6400;
const COLS = Math.ceil(WIDTH / TILE_SIZE);
const ROWS = Math.ceil(HEIGHT / TILE_SIZE);

const original = new FogOfWarOriginal(COLS, ROWS);
const optimized = new FogOfWarOptimized(COLS, ROWS);

const N_UNITS = 200; // Typical late game army
const ENTITIES = [];
for(let i=0; i<N_UNITS; i++) {
    ENTITIES.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        radius: 250 // DEFAULT_UNIT
    });
}

const ITERATIONS = 500;

console.log(`Map: ${WIDTH}x${HEIGHT} (${COLS}x${ROWS} tiles)`);
console.log(`Units: ${N_UNITS}, Radius: ${ENTITIES[0].radius}`);
console.log(`Iterations: ${ITERATIONS}`);

// Run Original
global.gc && global.gc();
const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    // Reset grid occasionally to simulate real usage (though fill performance is constant)
    if (i % 10 === 0) original.grid.fill(0);

    for (let u = 0; u < N_UNITS; u++) {
        original.revealCircle(ENTITIES[u].x, ENTITIES[u].y, ENTITIES[u].radius);
    }
}
const end1 = performance.now();
const timeOriginal = end1 - start1;

// Run Optimized
global.gc && global.gc();
const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    if (i % 10 === 0) optimized.grid.fill(0);

    for (let u = 0; u < N_UNITS; u++) {
        optimized.revealCircle(ENTITIES[u].x, ENTITIES[u].y, ENTITIES[u].radius);
    }
}
const end2 = performance.now();
const timeOptimized = end2 - start2;

console.log(`Original: ${timeOriginal.toFixed(2)}ms`);
console.log(`Optimized: ${timeOptimized.toFixed(2)}ms`);
console.log(`Speedup: x${(timeOriginal / timeOptimized).toFixed(2)}`);
