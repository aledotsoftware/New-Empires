
const { performance } = require('perf_hooks');

// Constants
const TILE_SIZE = 32;
const FOW_STATES = { HIDDEN: 0, EXPLORED: 1, VISIBLE: 2 };

class FogOfWar {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.totalTiles = cols * rows;
        this.invTileSize = 1 / TILE_SIZE;
        this.grid = new Uint8Array(this.totalTiles);
        this.isDirty = true;
    }

    // Original implementation
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

    // Optimized implementation
    revealCircleOptimized(centerX, centerY, radius) {
        const gridX = (centerX * this.invTileSize) | 0;
        const gridY = (centerY * this.invTileSize) | 0;
        const gridRadius = (radius * this.invTileSize) | 0;
        const gridRadiusSq = gridRadius * gridRadius;

        const startY = Math.max(0, gridY - gridRadius);
        const endY = Math.min(this.rows - 1, gridY + gridRadius);

        for (let y = startY; y <= endY; y++) {
            const dy = y - gridY;

            // Calculate span width at this Y
            // x^2 + dy^2 <= r^2  =>  x^2 <= r^2 - dy^2
            const term = gridRadiusSq - dy * dy;
            if (term < 0) continue; // Should not happen if loop bounds are correct, but safe

            const span = Math.floor(Math.sqrt(term));

            const minX = Math.max(0, gridX - span);
            const maxX = Math.min(this.cols - 1, gridX + span);

            if (minX > maxX) continue;

            const rowOffset = y * this.cols;
            const startIdx = rowOffset + minX;
            const endIdx = rowOffset + maxX;

            // Fill the range with VISIBLE
            this.grid.fill(FOW_STATES.VISIBLE, startIdx, endIdx + 1);
            this.isDirty = true;
        }
    }
}

// Setup
const COLS = 200; // 6400 / 32
const ROWS = 200;
const N_REVEALS = 10000;
const REVEALS = [];

for (let i = 0; i < N_REVEALS; i++) {
    REVEALS.push({
        x: Math.random() * COLS * TILE_SIZE,
        y: Math.random() * ROWS * TILE_SIZE,
        radius: 250 // Typical vision radius (~8 tiles)
    });
}

const fow1 = new FogOfWar(COLS, ROWS);
const fow2 = new FogOfWar(COLS, ROWS);

console.log(`Running benchmark: revealCircle (${N_REVEALS} iterations)...`);

// Warmup
for (let i = 0; i < 100; i++) fow1.revealCircleOriginal(REVEALS[0].x, REVEALS[0].y, REVEALS[0].radius);
for (let i = 0; i < 100; i++) fow2.revealCircleOptimized(REVEALS[0].x, REVEALS[0].y, REVEALS[0].radius);

global.gc && global.gc();
const start1 = performance.now();
for (let i = 0; i < N_REVEALS; i++) {
    const r = REVEALS[i];
    fow1.revealCircleOriginal(r.x, r.y, r.radius);
}
const end1 = performance.now();

global.gc && global.gc();
const start2 = performance.now();
for (let i = 0; i < N_REVEALS; i++) {
    const r = REVEALS[i];
    fow2.revealCircleOptimized(r.x, r.y, r.radius);
}
const end2 = performance.now();

console.log(`Original (Pixel Check): ${(end1 - start1).toFixed(2)}ms`);
console.log(`Optimized (Scanline):   ${(end2 - start2).toFixed(2)}ms`);
const speedup = (end1 - start1) / (end2 - start2);
console.log(`Speedup:                x${speedup.toFixed(2)}`);

// Correctness Check
let mismatch = 0;
for (let i = 0; i < fow1.totalTiles; i++) {
    if (fow1.grid[i] !== fow2.grid[i]) {
        mismatch++;
    }
}
if (mismatch > 0) {
    console.error(`ERROR: Verification failed! ${mismatch} tiles mismatch.`);
    process.exit(1);
} else {
    console.log('✅ Verification passed: Grids are identical.');
}
