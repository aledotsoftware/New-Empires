
const { SpatialGrid } = require('../js/managers/SpatialGrid.js');

// Mock classes matching game logic
class MockUnit {
    constructor(id, x, y, team) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.team = team;
        this.isDead = false;
    }
}

// Predicate similar to Unit._enemyPredicate
function enemyPredicate(entity, unit) {
    if (entity.team !== unit.team && !entity.isDead) {
        const dx = unit.x - entity.x;
        const dy = unit.y - entity.y;
        const distSq = dx * dx + dy * dy;
        return distSq < 200 * 200;
    }
    return false;
}

const width = 2000;
const height = 2000;
const cellSize = 100;
const grid = new SpatialGrid(width, height, cellSize);

// Setup Scenario 1: Melee Combat (Target in same cell)
const unitsCombat = [];
const enemiesCombat = [];
const numCombat = 1000;

for (let i = 0; i < numCombat; i++) {
    // Place unit and enemy very close (same cell)
    const x = Math.random() * width;
    const y = Math.random() * height;

    const unit = new MockUnit(i, x, y, 'player');
    const enemy = new MockUnit(i + 10000, x + 5, y + 5, 'enemy'); // Very close

    unitsCombat.push(unit);
    enemiesCombat.push(enemy);

    grid.add(unit);
    grid.add(enemy);
}

// Setup Scenario 2: Search (Target far or nowhere)
// We add more units to fill the grid to simulate load
for (let i = 0; i < 5000; i++) {
     grid.add(new MockUnit(i + 20000, Math.random() * width, Math.random() * height, 'neutral'));
}

console.log('Running Benchmark: SpatialGrid.find (Center-First Optimization Candidate)...');

// Warmup
for (let i = 0; i < 100; i++) {
    const u = unitsCombat[0];
    grid.find(u.x, u.y, 200, enemyPredicate, u);
}

const iterations = 1000;
const start = process.hrtime.bigint();

for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < numCombat; i++) {
        const u = unitsCombat[i];
        grid.find(u.x, u.y, 200, enemyPredicate, u);
    }
}

const end = process.hrtime.bigint();
const totalTime = Number(end - start) / 1e6; // ms
const perOp = totalTime / (iterations * numCombat);

console.log(`Total Time: ${totalTime.toFixed(2)} ms`);
console.log(`Per Operation: ${perOp.toFixed(4)} ms`);
console.log(`Ops/Sec: ${(1000 / perOp).toFixed(2)}`);
