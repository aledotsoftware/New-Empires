
const { performance } = require('perf_hooks');

class MockEntity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this._screenX = 0;
        this._screenY = 0;
    }
}

const camera = { x: 100, y: 100 };
const entities = [];
const count = 5000;
for (let i = 0; i < count; i++) {
    entities.push(new MockEntity(Math.random() * 2000, Math.random() * 2000));
}

const iterations = 5000;

console.log(`Benchmarking Render Math for ${count} entities over ${iterations} frames...`);

// Baseline: Calculate every time
const startBaseline = performance.now();
for (let f = 0; f < iterations; f++) {
    // Pass 1: Background
    for (let i = 0; i < count; i++) {
        const ent = entities[i];
        const sx = (ent.x - camera.x) | 0;
        const sy = (ent.y - camera.y) | 0;
        // simulate usage
        if (sx > 0) {}
    }
    // Pass 2: Sprite
    for (let i = 0; i < count; i++) {
        const ent = entities[i];
        const sx = (ent.x - camera.x) | 0;
        const sy = (ent.y - camera.y) | 0;
        if (sx > 0) {}
    }
    // Pass 3: HP BG
    for (let i = 0; i < count; i++) {
        const ent = entities[i];
        const sx = (ent.x - camera.x) | 0;
        const sy = (ent.y - camera.y) | 0;
        if (sx > 0) {}
    }
    // Pass 4: HP FG
    for (let i = 0; i < count; i++) {
        const ent = entities[i];
        const sx = (ent.x - camera.x) | 0;
        const sy = (ent.y - camera.y) | 0;
        if (sx > 0) {}
    }
}
const endBaseline = performance.now();

// Optimized: Calculate once
const startOptimized = performance.now();
for (let f = 0; f < iterations; f++) {
    // Pre-pass (or part of Pass 1 in reality, but for simulation let's say Pre-pass logic)
    for (let i = 0; i < count; i++) {
        const ent = entities[i];
        ent._screenX = (ent.x - camera.x) | 0;
        ent._screenY = (ent.y - camera.y) | 0;
    }

    // Pass 1: Background
    for (let i = 0; i < count; i++) {
        const ent = entities[i];
        const sx = ent._screenX;
        const sy = ent._screenY;
        if (sx > 0) {}
    }
    // Pass 2: Sprite
    for (let i = 0; i < count; i++) {
        const ent = entities[i];
        const sx = ent._screenX;
        const sy = ent._screenY;
        if (sx > 0) {}
    }
    // Pass 3: HP BG
    for (let i = 0; i < count; i++) {
        const ent = entities[i];
        const sx = ent._screenX;
        const sy = ent._screenY;
        if (sx > 0) {}
    }
    // Pass 4: HP FG
    for (let i = 0; i < count; i++) {
        const ent = entities[i];
        const sx = ent._screenX;
        const sy = ent._screenY;
        if (sx > 0) {}
    }
}
const endOptimized = performance.now();

const timeBaseline = endBaseline - startBaseline;
const timeOptimized = endOptimized - startOptimized;

console.log(`Baseline: ${timeBaseline.toFixed(2)} ms`);
console.log(`Optimized: ${timeOptimized.toFixed(2)} ms`);
console.log(`Improvement: ${(timeBaseline - timeOptimized).toFixed(2)} ms (${(timeBaseline / timeOptimized).toFixed(2)}x speedup)`);
