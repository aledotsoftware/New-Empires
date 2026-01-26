
const { SpatialGrid } = require('../js/managers/SpatialGrid.js');

// Mock classes
class MockUnit {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = Math.random() - 0.5;
        this.vy = Math.random() - 0.5;
        this.isDead = false;
        this.team = 'player';
    }

    update(dt, game) {
        this.x += this.vx;
        this.y += this.vy;

        // Simulate query (find nearby)
        // In the real game, this calls game.spatialGrid.find()
        // We simulate the workload by doing a query
        game.spatialGrid.query(this.x, this.y, 100, game.queryCache);
    }
}

class MockGame {
    constructor(count) {
        this.units = [];
        for (let i = 0; i < count; i++) {
            this.units.push(new MockUnit(i, Math.random() * 800, Math.random() * 600));
        }
        this.spatialGrid = new SpatialGrid(800, 600, 100);
        this.queryCache = [];
    }

    // Current implementation (Single Pass)
    updateSinglePass(dt) {
        this.spatialGrid.clear();
        for (let i = 0; i < this.units.length; i++) {
            const unit = this.units[i];
            this.spatialGrid.add(unit);
            unit.update(dt, this);
        }
    }

    // Proposed implementation (Double Pass)
    updateDoublePass(dt) {
        this.spatialGrid.clear();

        // Pass 1: Add
        const len = this.units.length;
        for (let i = 0; i < len; i++) {
            this.spatialGrid.add(this.units[i]);
        }

        // Pass 2: Update
        for (let i = 0; i < len; i++) {
            this.units[i].update(dt, this);
        }
    }
}

// Benchmark
const count = 2000;
const frames = 1000;
const game = new MockGame(count);

console.log(`Benchmarking ${count} units for ${frames} frames...`);

// Warmup
for (let i = 0; i < 100; i++) game.updateSinglePass(0.016);

const startSingle = process.hrtime.bigint();
for (let i = 0; i < frames; i++) {
    game.updateSinglePass(0.016);
}
const endSingle = process.hrtime.bigint();
const timeSingle = Number(endSingle - startSingle) / 1e6; // ms

// Warmup
for (let i = 0; i < 100; i++) game.updateDoublePass(0.016);

const startDouble = process.hrtime.bigint();
for (let i = 0; i < frames; i++) {
    game.updateDoublePass(0.016);
}
const endDouble = process.hrtime.bigint();
const timeDouble = Number(endDouble - startDouble) / 1e6; // ms

console.log(`Single Pass (Current): ${timeSingle.toFixed(2)} ms`);
console.log(`Double Pass (Proposed): ${timeDouble.toFixed(2)} ms`);
console.log(`Difference: ${(timeDouble - timeSingle).toFixed(2)} ms (${((timeDouble - timeSingle) / timeSingle * 100).toFixed(2)}%)`);
