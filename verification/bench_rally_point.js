
const { performance } = require('perf_hooks');

// Mock Canvas Context with operation counters
const ctx = {
    _ops: 0,
    save: function() { this._ops += 10; }, // Weight: 10
    restore: function() { this._ops += 10; }, // Weight: 10
    beginPath: function() { this._ops += 1; },
    moveTo: function() { this._ops += 1; },
    lineTo: function() { this._ops += 1; },
    stroke: function() { this._ops += 5; },
    fill: function() { this._ops += 5; },
    fillRect: function() { this._ops += 5; },
    rect: function() { this._ops += 1; },
    arc: function() { this._ops += 2; },
    closePath: function() { this._ops += 1; },
    setLineDash: function() { this._ops += 5; },
    set strokeStyle(v) { this._ops += 1; },
    set fillStyle(v) { this._ops += 1; },
    set lineWidth(v) { this._ops += 1; },
    resetOps: function() { this._ops = 0; }
};

// Mock Entity
class Entity {
    constructor(id) {
        this.id = id;
        this.x = Math.random() * 2000;
        this.y = Math.random() * 2000;
        this.team = 'player';
        this.rallyPoint = { x: this.x + 100, y: this.y + 100 };
    }
}

// Setup
const ENTITY_COUNT = 500; // Stress test
const selectedEntities = [];
for (let i = 0; i < ENTITY_COUNT; i++) {
    selectedEntities.push(new Entity(i));
}

const camera = { x: 0, y: 0 };

// Original Implementation
function drawRallyPointsOriginal() {
    for (let entity of selectedEntities) {
        if (entity.team === 'player' && entity.rallyPoint) {
            const startX = (entity.x - camera.x) | 0;
            const startY = (entity.y - camera.y) | 0;
            const endX = (entity.rallyPoint.x - camera.x) | 0;
            const endY = (entity.rallyPoint.y - camera.y) | 0;

            ctx.save();

            // Draw Dashed Line
            ctx.strokeStyle = 'rgba(232, 212, 139, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Draw Flag Marker
            ctx.fillStyle = '#e8d48b';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);

            // Pole
            ctx.fillRect(endX, endY - 20, 2, 20);

            // Flag Triangle
            ctx.beginPath();
            ctx.moveTo(endX + 2, endY - 20);
            ctx.lineTo(endX + 12, endY - 15);
            ctx.lineTo(endX + 2, endY - 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Base Circle
            ctx.beginPath();
            ctx.arc(endX + 1, endY, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
}

// Optimized Implementation
function drawRallyPointsOptimized() {
    const entitiesWithRally = [];
    // Filter first (simulate finding valid entities)
    for (let i = 0; i < selectedEntities.length; i++) {
        const entity = selectedEntities[i];
        if (entity.team === 'player' && entity.rallyPoint) {
            entitiesWithRally.push(entity);
        }
    }

    if (entitiesWithRally.length === 0) return;

    // Batch 1: Dashed Lines
    ctx.save();
    ctx.strokeStyle = 'rgba(232, 212, 139, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();

    for (let i = 0; i < entitiesWithRally.length; i++) {
        const entity = entitiesWithRally[i];
        const startX = (entity.x - camera.x) | 0;
        const startY = (entity.y - camera.y) | 0;
        const endX = (entity.rallyPoint.x - camera.x) | 0;
        const endY = (entity.rallyPoint.y - camera.y) | 0;

        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
    }
    ctx.stroke();
    ctx.restore();

    // Batch 2: Flag Poles (Rects)
    // Rects are typically drawn individually or batched via path.
    // Since fillRect is immediate, we'll use a path for batching "fill" calls.
    ctx.save();
    ctx.fillStyle = '#e8d48b';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    // ctx.setLineDash([]); // Default is empty, assume restore reset it or we set it explicitly if needed.
    // Actually restore() resets lineDash, so no need to call setLineDash([])

    ctx.beginPath();
    for (let i = 0; i < entitiesWithRally.length; i++) {
        const entity = entitiesWithRally[i];
        const endX = (entity.rallyPoint.x - camera.x) | 0;
        const endY = (entity.rallyPoint.y - camera.y) | 0;
        ctx.rect(endX, endY - 20, 2, 20); // Pole
    }
    ctx.fill();

    // Batch 3: Flag Triangles
    ctx.beginPath();
    for (let i = 0; i < entitiesWithRally.length; i++) {
        const entity = entitiesWithRally[i];
        const endX = (entity.rallyPoint.x - camera.x) | 0;
        const endY = (entity.rallyPoint.y - camera.y) | 0;

        ctx.moveTo(endX + 2, endY - 20);
        ctx.lineTo(endX + 12, endY - 15);
        ctx.lineTo(endX + 2, endY - 10);
        // closePath logic usually implies a line back to start, which is fine here
        // But for batching, we need to be careful not to connect separate triangles?
        // moveTo handles the separation.
    }
    // Note: closePath() in batch connects last point to *latest* moveTo.
    // So if we emit moveTo for each triangle, they are sub-paths.
    ctx.fill();
    ctx.stroke();

    // Batch 4: Base Circles
    ctx.beginPath();
    for (let i = 0; i < entitiesWithRally.length; i++) {
        const entity = entitiesWithRally[i];
        const endX = (entity.rallyPoint.x - camera.x) | 0;
        const endY = (entity.rallyPoint.y - camera.y) | 0;
        ctx.moveTo(endX + 1 + 3, endY); // Move to start of arc to avoid line from previous
        ctx.arc(endX + 1, endY, 3, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.restore();
}

// Benchmark
console.log('Running Rally Point Benchmark...');

// Measure Ops
ctx.resetOps();
drawRallyPointsOriginal();
const opsOriginal = ctx._ops;

ctx.resetOps();
drawRallyPointsOptimized();
const opsOptimized = ctx._ops;

console.log(`Operations (Original): ${opsOriginal}`);
console.log(`Operations (Optimized): ${opsOptimized}`);
console.log(`Ops Reduction: ${((opsOriginal - opsOptimized) / opsOriginal * 100).toFixed(2)}%`);

// Measure Time
const ITERATIONS = 5000;
const startOriginal = performance.now();
for (let i = 0; i < ITERATIONS; i++) drawRallyPointsOriginal();
const endOriginal = performance.now();

const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) drawRallyPointsOptimized();
const endOptimized = performance.now();

const timeOriginal = endOriginal - startOriginal;
const timeOptimized = endOptimized - startOptimized;

console.log(`Time (Original): ${timeOriginal.toFixed(2)}ms`);
console.log(`Time (Optimized): ${timeOptimized.toFixed(2)}ms`);
console.log(`Speedup: ${(timeOriginal / timeOptimized).toFixed(2)}x`);
