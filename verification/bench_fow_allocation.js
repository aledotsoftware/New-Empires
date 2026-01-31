
const { performance } = require('perf_hooks');

// Mock classes
class Entity {
    constructor(id, team) {
        this.id = id;
        this.team = team;
        this.x = Math.random() * 1000;
        this.y = Math.random() * 1000;
        this.visionRadius = 200;
    }
}

// Mock Game state
const units = [];
const buildings = [];
const N_UNITS = 2000;
const N_BUILDINGS = 500;

for (let i = 0; i < N_UNITS; i++) units.push(new Entity(i, 'player'));
for (let i = 0; i < N_BUILDINGS; i++) buildings.push(new Entity(i, i % 2 === 0 ? 'player' : 'enemy'));

// Mock FOW
const fow = {
    update: (entities) => {
        let sum = 0;
        for (let i = 0; i < entities.length; i++) {
            sum += entities[i].x;
        }
        return sum;
    }
};

// Original Approach (Allocation)
function updateFOW_Original() {
    const playerEntities = [];
    for (let i = 0; i < units.length; i++) {
        if (units[i].team === 'player') playerEntities.push(units[i]);
    }
    for (let i = 0; i < buildings.length; i++) {
        if (buildings[i].team === 'player') playerEntities.push(buildings[i]);
    }
    fow.update(playerEntities);
}

// Optimized Approach (Cached)
const _visionEntitiesCache = [];
function updateFOW_Optimized() {
    _visionEntitiesCache.length = 0;

    // We know units are all players (based on Game.js analysis)
    // But let's keep the check if we want strict equivalence, OR optimize it out if we trust the context.
    // In Game.js: "this.units contiene EXCLUSIVAMENTE unidades del jugador"
    // So we can skip the check for units.

    const uLen = units.length;
    for (let i = 0; i < uLen; i++) {
        // units are known to be player in Game.js context, but let's keep it robust or mimic logic?
        // Game.js logic: if (this.units[i].team === 'player')
        // Optimizing this check out is also a win.
        if (units[i].team === 'player') _visionEntitiesCache.push(units[i]);
    }

    const bLen = buildings.length;
    for (let i = 0; i < bLen; i++) {
        const b = buildings[i];
        if (b.team === 'player') {
            _visionEntitiesCache.push(b);
        }
    }

    fow.update(_visionEntitiesCache);
}

// Benchmark
const ITERATIONS = 10000;

console.log('Running benchmarks...');

global.gc && global.gc();
const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    updateFOW_Original();
}
const end1 = performance.now();

global.gc && global.gc();
const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    updateFOW_Optimized();
}
const end2 = performance.now();

console.log(`Original (Allocating): ${(end1 - start1).toFixed(2)}ms`);
console.log(`Optimized (Cached):    ${(end2 - start2).toFixed(2)}ms`);
console.log(`Speedup:               x${((end1 - start1) / (end2 - start2)).toFixed(2)}`);
