// verification/verify_spatial_correctness.js

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

// Inlined SpatialGrid (Optimized)
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
        const buckets = this.buckets;

        // Optimized Logic
        if (entity._spatialCellSize === this.cellSize &&
            entity.x >= entity._spatialMinX && entity.x < entity._spatialMaxX &&
            entity.y >= entity._spatialMinY && entity.y < entity._spatialMaxY) {

            const index = entity._spatialIndex;
            const bucket = buckets[index];
            if (bucket.length === 0) {
                this.activeIndices[this.activeIndices.length] = index;
            }
            bucket[bucket.length] = entity;
            return;
        }

        const col = (entity.x * this.invCellSize) | 0;
        const row = (entity.y * this.invCellSize) | 0;

        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const index = row * this.cols + col;

            entity._spatialMinX = col * this.cellSize;
            entity._spatialMaxX = (col + 1) * this.cellSize;
            entity._spatialMinY = row * this.cellSize;
            entity._spatialMaxY = (row + 1) * this.cellSize;
            entity._spatialIndex = index;
            entity._spatialCellSize = this.cellSize;

            const bucket = buckets[index];
            if (bucket.length === 0) {
                this.activeIndices[this.activeIndices.length] = index;
            }
            bucket[bucket.length] = entity;
        }
    }
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ Assertion Failed: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ ${message}`);
    }
}

// Test Suite
const grid = new SpatialGrid(1000, 1000, 100);
const ent = new Entity(50, 50);

console.log("--- Test 1: Initial Add ---");
grid.clear();
grid.add(ent);
assert(ent._spatialIndex === 0, "Index should be 0 for (50, 50)");
assert(ent._spatialMinX === 0, "MinX should be 0");
assert(ent._spatialMaxX === 100, "MaxX should be 100");
assert(grid.buckets[0].includes(ent), "Bucket 0 should contain entity");

console.log("--- Test 2: Move within bounds ---");
grid.clear();
ent.x = 99;
ent.y = 99;
// We rely on the fact that if cache is used, index remains 0.
const oldIndex = ent._spatialIndex;
grid.add(ent);
assert(ent._spatialIndex === oldIndex, "Index should remain 0");
assert(grid.buckets[0].includes(ent), "Bucket 0 should contain entity");

console.log("--- Test 3: Move across boundary ---");
grid.clear();
ent.x = 101; // Cross X boundary
ent.y = 50;
grid.add(ent);
// Should be in col 1, row 0 -> index 1
assert(ent._spatialIndex === 1, `Index should update to 1. Got ${ent._spatialIndex}`);
assert(ent._spatialMinX === 100, "MinX should update to 100");
assert(grid.buckets[1].includes(ent), "Bucket 1 should contain entity");
assert(!grid.buckets[0].includes(ent), "Bucket 0 should NOT contain entity");

console.log("--- Test 4: Move across row boundary ---");
grid.clear();
ent.x = 101;
ent.y = 150; // Row 1
grid.add(ent);
// col 1, row 1. Grid width 1000 -> 10 cols. Index = 1 * 10 + 1 = 11.
assert(ent._spatialIndex === 11, `Index should update to 11. Got ${ent._spatialIndex}`);
assert(grid.buckets[11].includes(ent), "Bucket 11 should contain entity");

console.log("--- Test 5: Cell Size Change (Simulated) ---");
const smallGrid = new SpatialGrid(1000, 1000, 50); // Different cell size
smallGrid.add(ent);
// x=101, y=150. Cell 50.
// col = 2, row = 3.
// cols = 20. Index = 3 * 20 + 2 = 62.
assert(ent._spatialCellSize === 50, "Cell size should update to 50");
assert(ent._spatialIndex === 62, `Index should be 62 for small grid. Got ${ent._spatialIndex}`);

// Add back to large grid -> should update again
grid.clear();
grid.add(ent);
assert(ent._spatialCellSize === 100, "Cell size should revert to 100");
assert(ent._spatialIndex === 11, "Index should revert to 11");

console.log("All tests passed!");
