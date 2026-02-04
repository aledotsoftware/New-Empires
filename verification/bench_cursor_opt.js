const { SpatialGrid } = require('../js/managers/SpatialGrid.js');

class MockEntity {
    constructor(id, x, y, team, size=20) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.team = team;
        this.size = size;
        this.isDead = false;
        this.type = 'unit';
    }
}

// Setup
const width = 2000;
const height = 2000;
const cellSize = 100;
const grid = new SpatialGrid(width, height, cellSize);

// Add 2000 items to make grid denser
const items = [];
for (let i = 0; i < 2000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const ent = new MockEntity(i, x, y, 'enemy');
    items.push(ent);
    grid.add(ent);
}

// Queries
const queries = [];
for (let i = 0; i < 1000; i++) {
    queries.push({
        x: Math.random() * width,
        y: Math.random() * height
    });
}

// Baseline: Query + Loop
const cache = [];
const startBase = process.hrtime.bigint();
for (let iter = 0; iter < 500; iter++) {
    for (const q of queries) {
        cache.length = 0;
        const nearby = grid.query(q.x, q.y, 30, cache);
        for (let i = 0; i < nearby.length; i++) {
            const other = nearby[i];
            if (!other.isDead) {
                const dx = other.x - q.x;
                const dy = other.y - q.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < other.size * other.size) {
                    // Match found
                    break;
                }
            }
        }
    }
}
const endBase = process.hrtime.bigint();
const timeBase = Number(endBase - startBase) / 1e6;

// Optimization: Find with Predicate
// Using object literal for predicate context {x, y} as we plan to reuse mouse object
function predicate(entity, ctx) {
    if (!entity.isDead) {
        const dx = entity.x - ctx.x;
        const dy = entity.y - ctx.y;
        const distSq = dx * dx + dy * dy;
        return distSq < entity.size * entity.size;
    }
    return false;
}

const startOpt = process.hrtime.bigint();
for (let iter = 0; iter < 500; iter++) {
    for (const q of queries) {
        grid.find(q.x, q.y, 30, predicate, q);
    }
}
const endOpt = process.hrtime.bigint();
const timeOpt = Number(endOpt - startOpt) / 1e6;

console.log(`Baseline (Query+Loop): ${timeBase.toFixed(2)} ms`);
console.log(`Optimization (Find): ${timeOpt.toFixed(2)} ms`);
console.log(`Speedup: ${(timeBase / timeOpt).toFixed(2)}x`);
