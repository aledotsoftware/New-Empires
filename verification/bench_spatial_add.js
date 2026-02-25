// verification/bench_spatial_optimized.js

// Mock Entity class
class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this._spatialMinX = null;
        this._spatialMaxX = null;
        this._spatialMinY = null;
        this._spatialMaxY = null;
        this._spatialIndex = -1;
        this._spatialCellSize = 0;
    }
}

class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        const size = this.cols * this.rows;
        this.buckets = new Array(size);
        for (let i = 0; i < size; i++) {
            this.buckets[i] = [];
        }
        this.invCellSize = 1 / cellSize;
        this.activeIndices = [];
    }

    clear() {
        const len = this.activeIndices.length;
        const buckets = this.buckets;
        for (let i = 0; i < len; i++) {
            const index = this.activeIndices[i];
            buckets[index].length = 0;
        }
        this.activeIndices.length = 0;
    }

    add(entity) {
        // Fast path: Check bounds
        // Note: entity._spatialCellSize === this.cellSize check is important for robustness
        if (entity._spatialCellSize === this.cellSize &&
            entity.x >= entity._spatialMinX && entity.x < entity._spatialMaxX &&
            entity.y >= entity._spatialMinY && entity.y < entity._spatialMaxY) {

            const index = entity._spatialIndex;
            const bucket = this.buckets[index];
            if (bucket.length === 0) {
                this.activeIndices[this.activeIndices.length] = index;
            }
            bucket[bucket.length] = entity;
            return;
        }

        // Slow path: Recalculate
        const col = (entity.x * this.invCellSize) | 0;
        const row = (entity.y * this.invCellSize) | 0;

        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const index = row * this.cols + col;

            // Update cache
            entity._spatialMinX = col * this.cellSize;
            entity._spatialMaxX = (col + 1) * this.cellSize;
            entity._spatialMinY = row * this.cellSize;
            entity._spatialMaxY = (row + 1) * this.cellSize;
            entity._spatialIndex = index;
            entity._spatialCellSize = this.cellSize;

            const bucket = this.buckets[index];
            if (bucket.length === 0) {
                this.activeIndices[this.activeIndices.length] = index;
            }
            bucket[bucket.length] = entity;
        }
    }
}

// Benchmark
const grid = new SpatialGrid(6400, 6400, 100);
const entities = [];
const numEntities = 20000;
const iterations = 1000;

for (let i = 0; i < numEntities; i++) {
    entities.push(new Entity(Math.random() * 6400, Math.random() * 6400));
}

console.log(`Starting optimized benchmark with ${numEntities} entities, ${iterations} iterations...`);
const start = process.hrtime.bigint();

for (let i = 0; i < iterations; i++) {
    grid.clear();
    for (let j = 0; j < numEntities; j++) {
        const ent = entities[j];
        ent.x += (Math.random() - 0.5) * 2;
        ent.y += (Math.random() - 0.5) * 2;
        if (ent.x < 0) ent.x = 0; else if (ent.x > 6400) ent.x = 6400;
        if (ent.y < 0) ent.y = 0; else if (ent.y > 6400) ent.y = 6400;

        grid.add(ent);
    }
}

const end = process.hrtime.bigint();
const duration = Number(end - start) / 1e6; // ms

console.log(`Total time: ${duration.toFixed(2)} ms`);
console.log(`Average per frame: ${(duration / iterations).toFixed(4)} ms`);
