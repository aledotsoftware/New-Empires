const { performance } = require('perf_hooks');

// Mock Canvas Context
class MockContext {
    constructor() {
        this.fillStyle = '';
    }
    beginPath() {}
    fill() {}
    rect() {}
}

// Mock Game
class Game {
    constructor(unitCount, enemyCount) {
        this.units = [];
        this.enemies = [];
        this.minimapCtx = new MockContext();

        // Populate
        for (let i = 0; i < unitCount; i++) {
            this.units.push({ x: Math.random() * 6400, y: Math.random() * 6400, team: 'player' });
        }
        for (let i = 0; i < enemyCount; i++) {
            this.enemies.push({ x: Math.random() * 6400, y: Math.random() * 6400, team: 'enemy' });
        }

        this.minimap = { width: 200 };
        this.canvasWidth = 6400;
    }

    renderCurrent() {
        const scale = this.minimap.width / this.canvasWidth;

        // Batch 1: Player Units
        this.minimapCtx.fillStyle = '#48bb78';
        this.minimapCtx.beginPath();
        for (let unit of this.units) {
            if (unit.team === 'player') {
                this.minimapCtx.rect(unit.x * scale - 1, unit.y * scale - 1, 2, 2);
            }
        }
        this.minimapCtx.fill();

        // Batch 2: Enemy/Other Units
        this.minimapCtx.fillStyle = '#c53030';
        this.minimapCtx.beginPath();
        for (let unit of this.units) {
            if (unit.team !== 'player') {
                this.minimapCtx.rect(unit.x * scale - 1, unit.y * scale - 1, 2, 2);
            }
        }
        this.minimapCtx.fill();
    }

    renderProposed() {
        const scale = this.minimap.width / this.canvasWidth;

        // Batch 1: Player Units (Optimized Loop with Safety Check)
        this.minimapCtx.fillStyle = '#48bb78';
        this.minimapCtx.beginPath();
        const units = this.units;
        const uLen = units.length;
        for (let i = 0; i < uLen; i++) {
            const unit = units[i];
            // Safety check restored
            if (unit.team === 'player') {
                this.minimapCtx.rect((unit.x * scale - 1) | 0, (unit.y * scale - 1) | 0, 2, 2);
            }
        }
        this.minimapCtx.fill();

        // Batch 2: Enemy Units (Added with Safety Check)
        if (this.enemies) {
            this.minimapCtx.fillStyle = '#c53030';
            this.minimapCtx.beginPath();
            const enemies = this.enemies;
            const eLen = enemies.length;
            for (let i = 0; i < eLen; i++) {
                const enemy = enemies[i];
                this.minimapCtx.rect((enemy.x * scale - 1) | 0, (enemy.y * scale - 1) | 0, 2, 2);
            }
            this.minimapCtx.fill();
        }
    }
}

// Setup
const unitCount = 2000;
const enemyCount = 2000;
const game = new Game(unitCount, enemyCount);
const iterations = 5000;

console.log(`Benchmarking Minimap Render with ${unitCount} players and ${enemyCount} enemies (${iterations} iterations)`);

// Benchmark Current
const startCurrent = performance.now();
for (let i = 0; i < iterations; i++) {
    game.renderCurrent();
}
const endCurrent = performance.now();

// Benchmark Proposed
const startProposed = performance.now();
for (let i = 0; i < iterations; i++) {
    game.renderProposed();
}
const endProposed = performance.now();

const timeCurrent = endCurrent - startCurrent;
const timeProposed = endProposed - startProposed;

console.log(`Current Logic: ${timeCurrent.toFixed(2)}ms`);
console.log(`Proposed Logic: ${timeProposed.toFixed(2)}ms`);
console.log(`Speedup: ${(timeCurrent / timeProposed).toFixed(2)}x`);
