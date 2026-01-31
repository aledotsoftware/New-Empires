
const { performance } = require('perf_hooks');

// Mock Canvas Context
class MockContext {
    constructor() {
        this.calls = 0;
    }
    fillRect() { this.calls++; }
    drawImage() { this.calls++; }
    save() { }
    restore() { }
    beginPath() { }
    fill() { this.calls++; }
    rect() { }
    strokeRect() { this.calls++; }
}

// Mock Game
class Game {
    constructor(unitCount, enemyCount) {
        this.minimap = { width: 200, height: 200 };
        this.minimapCtx = new MockContext();
        this.units = [];   // Player units
        this.enemies = []; // Enemy units
        this.camera = { x: 0, y: 0 };
        this.viewWidth = 800;
        this.viewHeight = 600;

        // Populate
        for (let i = 0; i < unitCount; i++) {
            this.units.push({ x: Math.random() * 2000, y: Math.random() * 2000, team: 'player' });
        }
        for (let i = 0; i < enemyCount; i++) {
            this.enemies.push({ x: Math.random() * 2000, y: Math.random() * 2000, team: 'enemy' });
        }
    }

    // CURRENT IMPLEMENTATION (from Game.js)
    renderMinimapCurrent() {
        const scale = this.minimap.width / 2000;

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
        // BUG: Iterates units (player) looking for non-player (wasteful + bug)
        this.minimapCtx.fillStyle = '#c53030';
        this.minimapCtx.beginPath();
        for (let unit of this.units) {
            if (unit.team !== 'player') {
                this.minimapCtx.rect(unit.x * scale - 1, unit.y * scale - 1, 2, 2);
            }
        }
        this.minimapCtx.fill();
    }

    // PROPOSED IMPLEMENTATION
    renderMinimapProposed() {
        const scale = this.minimap.width / 2000;
        const ctx = this.minimapCtx;

        // Cache lengths
        const unitsLen = this.units.length;
        const enemiesLen = this.enemies.length;

        // Batch 1: Player Units
        if (unitsLen > 0) {
            ctx.fillStyle = '#48bb78';
            ctx.beginPath();
            for (let i = 0; i < unitsLen; i++) {
                const unit = this.units[i];
                // Optimization: Integer coords + No redundant check
                const x = (unit.x * scale) | 0;
                const y = (unit.y * scale) | 0;
                ctx.rect(x - 1, y - 1, 2, 2);
            }
            ctx.fill();
        }

        // Batch 2: Enemies (Correct + Optimized)
        if (enemiesLen > 0) {
            ctx.fillStyle = '#c53030';
            ctx.beginPath();
            for (let i = 0; i < enemiesLen; i++) {
                const unit = this.enemies[i];
                const x = (unit.x * scale) | 0;
                const y = (unit.y * scale) | 0;
                ctx.rect(x - 1, y - 1, 2, 2);
            }
            ctx.fill();
        }
    }
}

// Scenarios
const scenarios = [
    { name: 'Early Game', units: 10, enemies: 5 },
    { name: 'Mid Game', units: 100, enemies: 50 },
    { name: 'Late Game', units: 500, enemies: 200 },
    { name: 'Swarm', units: 1000, enemies: 1000 }
];

console.log('--- Minimap Benchmark ---');

for (const s of scenarios) {
    const game = new Game(s.units, s.enemies);
    const ITERATIONS = 5000;

    // Current
    const startCurr = performance.now();
    for (let i = 0; i < ITERATIONS; i++) game.renderMinimapCurrent();
    const endCurr = performance.now();
    const timeCurr = endCurr - startCurr;

    // Proposed
    const startProp = performance.now();
    for (let i = 0; i < ITERATIONS; i++) game.renderMinimapProposed();
    const endProp = performance.now();
    const timeProp = endProp - startProp;

    console.log(`\nScenario: ${s.name} (${s.units} units, ${s.enemies} enemies)`);
    console.log(`Current:  ${timeCurr.toFixed(2)}ms`);
    console.log(`Proposed: ${timeProp.toFixed(2)}ms`);
    console.log(`Speedup:  ${(timeCurr / timeProp).toFixed(2)}x`);
}
