
const { performance } = require('perf_hooks');

// Mock Canvas Context
class MockContext {
    constructor() {
        this.fillStyle = '';
        this.calls = 0;
        this.canvas = { width: 200, height: 200 };
    }
    fillRect() { this.calls++; }
    drawImage() { this.calls++; }
    save() { }
    restore() { }
    beginPath() { }
    fill() { this.calls++; }
    rect() { }
    strokeRect() { this.calls++; }
    clearRect() { this.calls++; }
    getContext() { return this; }
}

class MockCanvas {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.ctx = new MockContext();
        this.ctx.canvas = this;
    }
    getContext() { return this.ctx; }
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
        for (let i = 0; i < 60; i++) {
            this.resourceNodes.push({ x: Math.random() * 2000, y: Math.random() * 2000, amount: 100 });
        }

        // Add some buildings
        for (let i = 0; i < 20; i++) {
            this.buildings.push({ x: Math.random() * 2000, y: Math.random() * 2000, team: 'player', size: 60 });
        }

        for (let i = 0; i < 200; i++) {
            this.units.push({ x: Math.random() * 2000, y: Math.random() * 2000, team: 'player' });
        }

        // Cache setup
        this._minimapBufferCanvas = new MockCanvas(200, 200);
        this._minimapBufferCtx = this._minimapBufferCanvas.getContext('2d');
        this._minimapDirty = true;
    }

    // Current implementation (Optimized with Batching)
    renderMinimapBatched() {
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

        // Buildings (Mixed drawImage/fillRect - simulating fillRect for mock)
        for (let building of this.buildings) {
            const x = building.x * scale;
            const y = building.y * scale;
            const size = Math.max(4, building.size * scale * 2);
            ctx.fillStyle = building.team === 'player' ? '#48bb78' : '#c53030';
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }

        // Units (Batched)
        ctx.fillStyle = '#48bb78';
        ctx.beginPath();
        for (let unit of this.units) {
            const x = unit.x * scale;
            const y = unit.y * scale;
            ctx.rect(x - 1, y - 1, 2, 2);
        }
        ctx.fill();

        // Camera
        ctx.strokeRect(0, 0, 10, 10);
    }

    _renderMinimapBuffer() {
        if (!this._minimapBufferCtx) return;

        const ctx = this._minimapBufferCtx;
        const width = this._minimapBufferCanvas.width;
        const height = this._minimapBufferCanvas.height;
        const scale = width / 2000;

        // Clear & Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // Resources
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();
        for (let node of this.resourceNodes) {
            if (node.amount > 0) {
                ctx.rect(node.x * scale - 1, node.y * scale - 1, 2, 2);
            }
        }
        ctx.fill();

        // Buildings
        for (let building of this.buildings) {
            const x = building.x * scale;
            const y = building.y * scale;
            const size = Math.max(4, building.size * scale * 2);
            ctx.fillStyle = building.team === 'player' ? '#48bb78' : '#c53030';
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }

        this._minimapDirty = false;
    }

    renderMinimapCached() {
        if (this._minimapDirty) {
            this._renderMinimapBuffer();
        }

        // Draw Buffer
        this.minimapCtx.drawImage(this._minimapBufferCanvas, 0, 0);

        const scale = this.minimap.width / 2000;
        const ctx = this.minimapCtx;

        // Units (Batched)
        ctx.fillStyle = '#48bb78';
        ctx.beginPath();
        for (let unit of this.units) {
            const x = unit.x * scale;
            const y = unit.y * scale;
            ctx.rect(x - 1, y - 1, 2, 2);
        }
        ctx.fill();

        // Camera
        ctx.strokeRect(0, 0, 10, 10);
    }
}

const game = new Game();

// Warmup
for (let i = 0; i < 100; i++) game.renderMinimapBatched();

const iterations = 5000;

// Benchmark Batched (Current)
game.minimapCtx.calls = 0;
const startBatched = performance.now();
for (let i = 0; i < iterations; i++) {
    game.renderMinimapBatched();
}
const endBatched = performance.now();
const callsBatched = game.minimapCtx.calls;

// Benchmark Cached
game.minimapCtx.calls = 0;
game._minimapDirty = true; // First frame dirty
const startCached = performance.now();
for (let i = 0; i < iterations; i++) {
    game.renderMinimapCached();
}
const endCached = performance.now();
const callsCached = game.minimapCtx.calls;

console.log(`Batched (Current) Time: ${(endBatched - startBatched).toFixed(2)}ms, Draw Calls: ${callsBatched}`);
console.log(`Cached (Proposed) Time: ${(endCached - startCached).toFixed(2)}ms, Draw Calls: ${callsCached}`);
console.log(`Speedup: ${((endBatched - startBatched) / (endCached - startCached)).toFixed(2)}x`);
