
import { SpatialGrid } from '../js/managers/SpatialGrid.js';

// Mock Entity
class Entity {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.size = 32;
        this.id = id;
        this.isDead = false;
        this.team = 'enemy';
        this.amount = 100; // for resource
        this.isUnderConstruction = true; // for building
    }
}

const WIDTH = 2000;
const HEIGHT = 2000;
const CELL_db = 100;

const grid = new SpatialGrid(WIDTH, HEIGHT, CELL_db);
const entities = [];

// Populate grid
for (let i = 0; i < 1000; i++) {
    const e = new Entity(Math.random() * WIDTH, Math.random() * HEIGHT, i);
    entities.push(e);
    grid.add(e);
}

// Prepare queries
const queries = [];
for (let i = 0; i < 1000; i++) {
    queries.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT
    });
}

const cache = [];

// Baseline: query + loop
function baseline() {
    let hits = 0;
    for (let q of queries) {
        // Mock query radius 30
        const nearby = grid.query(q.x, q.y, 30, cache);
        for (let i = 0; i < nearby.length; i++) {
            const other = nearby[i];
            if (!other.isDead) {
                const distSq = (other.x - q.x) ** 2 + (other.y - q.y) ** 2;
                if (distSq < other.size * other.size) {
                    hits++;
                    break;
                }
            }
        }
    }
    return hits;
}

// Optimization: find + predicate
function predicate(other, ctx) {
    if (!other.isDead) {
        const distSq = (other.x - ctx.x) ** 2 + (other.y - ctx.y) ** 2;
        return distSq < other.size * other.size;
    }
    return false;
}

function optimized() {
    let hits = 0;
    for (let q of queries) {
        const target = grid.find(q.x, q.y, 30, predicate, q);
        if (target) hits++;
    }
    return hits;
}

// Warmup
baseline();
optimized();

// Bench Baseline
const startB = performance.now();
for (let i = 0; i < 100; i++) baseline();
const endB = performance.now();
console.log(`Baseline: ${(endB - startB).toFixed(2)}ms`);

// Bench Optimized
const startO = performance.now();
for (let i = 0; i < 100; i++) optimized();
const endO = performance.now();
console.log(`Optimized: ${(endO - startO).toFixed(2)}ms`);

const ratio = (endB - startB) / (endO - startO);
console.log(`Speedup: ${ratio.toFixed(2)}x`);
