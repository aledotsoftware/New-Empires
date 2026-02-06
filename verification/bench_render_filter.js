
// verification/bench_render_filter.js

// Mock Entity
class Entity {
    constructor(id, team, x, y, visible) {
        this.id = id;
        this.team = team;
        this.x = x;
        this.y = y;
        this.visible = visible; // Simulated FOW state
    }
}

// Setup
const ROW_ENTITIES = 2000; // Many entities in one row (worst case or busy scene)
const VISIBLE_RATIO = 0.05; // 5% visible (common in FOW)

const entities = [];
for (let i = 0; i < ROW_ENTITIES; i++) {
    const isVisible = Math.random() < VISIBLE_RATIO;
    entities.push(new Entity(i, 'enemy', Math.random() * 1000, Math.random() * 100, isVisible));
}

// Helper: Current Approach (Sort then Filter)
function renderCurrent() {
    // Simulate queryRowIndices dumping everything
    // In reality, it iterates buckets and pushes to array.
    // We use slice() to simulate creating/filling the cache array with pointers.
    const cache = entities.slice();

    // Sort
    cache.sort((a, b) => a.y - b.y);

    // Filter
    const renderList = [];
    let count = 0;
    for (let i = 0; i < cache.length; i++) {
        if (cache[i].visible) {
            renderList[count++] = cache[i];
        }
    }
    return renderList;
}

// Helper: New Approach (Filter then Sort)
function renderOptimized() {
    const cache = [];
    let count = 0;

    // Filter (simulating _queryVisibleRow)
    // We iterate the source (grid buckets) and only add if visible
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].visible) {
            cache[count++] = entities[i];
        }
    }

    // Sort the smaller array
    cache.sort((a, b) => a.y - b.y);

    return cache;
}

// Warmup
for (let i = 0; i < 100; i++) {
    renderCurrent();
    renderOptimized();
}

// Benchmark
const ITERATIONS = 5000;

console.log(`Benchmarking with ${ROW_ENTITIES} entities (${VISIBLE_RATIO*100}% visible) over ${ITERATIONS} iterations...`);

console.time('Current (Sort then Filter)');
for (let i = 0; i < ITERATIONS; i++) {
    renderCurrent();
}
console.timeEnd('Current (Sort then Filter)');

console.time('Optimized (Filter then Sort)');
for (let i = 0; i < ITERATIONS; i++) {
    renderOptimized();
}
console.timeEnd('Optimized (Filter then Sort)');
