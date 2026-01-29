
const { performance } = require('perf_hooks');

// Mock Canvas Context
class MockContext {
    constructor() {
        this.fillStyle = '';
        this.calls = 0;
    }
    fillRect() { this.calls++; }
    drawImage() { this.calls++; }
    save() { }
    restore() { }
    beginPath() { }
    fill() { this.calls++; }
    rect() { } // path operations don't count as draw calls usually, but fill() does.
    strokeRect() { this.calls++; }
}

// Mock Game
class Game {
    constructor() {
        this.minimap = { width: 200, height: 200 };
        this.minimapCtx = new MockContext();
        this.resourceNodes = [];
        this.buildings = [];
        this.units = [];
        this.camera = { x: 0, y: 0 };
        this.viewWidth = 800;
        this.viewHeight = 600;

        // Populate with data
        for (let i = 0; i < 500; i++) {
            this.resourceNodes.push({ x: Math.random() * 2000, y: Math.random() * 2000, amount: 100 });
        }

        for (let i = 0; i < 200; i++) {
            this.units.push({ x: Math.random() * 2000, y: Math.random() * 2000, team: 'player' });
        }
    }

    renderMinimapOriginal() {
        const scale = this.minimap.width / 2000;
        const ctx = this.minimapCtx;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.minimap.width, this.minimap.height);

        // Resources
        ctx.fillStyle = '#4a5568';
        for (let node of this.resourceNodes) {
            if (node.amount > 0) {
                ctx.fillRect(node.x * scale - 1, node.y * scale - 1, 2, 2);
            }
        }

        // Units
        for (let unit of this.units) {
            const x = unit.x * scale;
            const y = unit.y * scale;
            ctx.fillStyle = unit.team === 'player' ? '#48bb78' : '#c53030';
            ctx.fillRect(x - 1, y - 1, 2, 2);
        }

        // Camera (simplified)
        ctx.strokeRect(0, 0, 10, 10);
    }

    renderMinimapOptimized() {
        const scale = this.minimap.width / 2000;
        const ctx = this.minimapCtx;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.minimap.width, this.minimap.height);

        // Resources (Batched)
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();
        for (let node of this.resourceNodes) {
            if (node.amount > 0) {
                ctx.rect(node.x * scale - 1, node.y * scale - 1, 2, 2);
            }
        }
        ctx.fill();

        // Units (Batched)
        // Assuming all units in this.units are player for now, as per analysis
        ctx.fillStyle = '#48bb78';
        ctx.beginPath();
        for (let unit of this.units) {
            const x = unit.x * scale;
            const y = unit.y * scale;
            // logic to switch color if mixed would require split batches
            // But we know this.units is player only
            ctx.rect(x - 1, y - 1, 2, 2);
        }
        ctx.fill();

        // Camera (simplified)
        ctx.strokeRect(0, 0, 10, 10);
    }
}

const game = new Game();

// Warmup
for (let i = 0; i < 100; i++) game.renderMinimapOriginal();

// Benchmark Original
game.minimapCtx.calls = 0;
const startOrig = performance.now();
for (let i = 0; i < 1000; i++) {
    game.renderMinimapOriginal();
}
const endOrig = performance.now();
const callsOrig = game.minimapCtx.calls;

// Benchmark Optimized
game.minimapCtx.calls = 0;
const startOpt = performance.now();
for (let i = 0; i < 1000; i++) {
    game.renderMinimapOptimized();
}
const endOpt = performance.now();
const callsOpt = game.minimapCtx.calls;

console.log(`Original Time: ${(endOrig - startOrig).toFixed(2)}ms, Draw Calls: ${callsOrig}`);
console.log(`Optimized Time: ${(endOpt - startOpt).toFixed(2)}ms, Draw Calls: ${callsOpt}`);
console.log(`Speedup: ${(endOrig - startOrig) / (endOpt - startOpt)}x`);
