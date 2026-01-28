
const { performance } = require('perf_hooks');

// Mock classes
class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.invCellSize = 1 / cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.buckets = new Array(this.cols * this.rows).fill(null).map(() => []);
    }

    add(node) {
        const col = (node.x * this.invCellSize) | 0;
        const row = (node.y * this.invCellSize) | 0;
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            this.buckets[row * this.cols + col].push(node);
        }
    }

    queryRect(minX, minY, width, height, result) {
        result.length = 0;
        const startCol = Math.max(0, (minX * this.invCellSize) | 0);
        const endCol = Math.min(this.cols - 1, ((minX + width) * this.invCellSize) | 0);
        const startRow = Math.max(0, (minY * this.invCellSize) | 0);
        const endRow = Math.min(this.rows - 1, ((minY + height) * this.invCellSize) | 0);

        for (let r = startRow; r <= endRow; r++) {
            const rowBase = r * this.cols;
            for (let c = startCol; c <= endCol; c++) {
                const bucket = this.buckets[rowBase + c];
                for (let i = 0; i < bucket.length; i++) {
                    result.push(bucket[i]);
                }
            }
        }
    }
}

// Mock Canvas Context
const ctx = {
    beginPath: () => {},
    moveTo: () => {},
    arc: () => {},
    fill: () => {},
    drawImage: () => {},
    fillRect: () => {},
    fillStyle: ''
};

// Mock AssetLoader
const assetLoader = {
    getImage: () => ({ complete: true, naturalWidth: 32 })
};
global.assetLoader = assetLoader;

// Setup
const CONFIG = { CANVAS_WIDTH: 2000, CANVAS_HEIGHT: 2000 };
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;

const resourceGrid = new SpatialGrid(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 100);
const resourceNodes = [];
const _resourceRenderCache = [];

// Populate resources (dense map)
for (let i = 0; i < 5000; i++) {
    const node = {
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        radius: 20,
        type: 'wood',
        amount: 100,
        _cachedImage: null
    };
    resourceNodes.push(node);
    resourceGrid.add(node);
}

const camera = { x: 500, y: 500 };

// Original function logic (reconstructed)
function drawResourceNodesOriginal() {
    const margin = 50;
    resourceGrid.queryRect(camera.x - margin, camera.y - margin, VIEW_WIDTH + margin * 2, VIEW_HEIGHT + margin * 2, _resourceRenderCache);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();

    const nodesLen = _resourceRenderCache.length;

    // Pass 1
    for (let i = 0; i < nodesLen; i++) {
        const node = _resourceRenderCache[i];
        if (node.amount <= 0) continue;

        const screenX = (node.x - camera.x) | 0;
        const screenY = (node.y - camera.y) | 0;

        if (screenX < -node.radius || screenX > VIEW_WIDTH + node.radius ||
            screenY < -node.radius || screenY > VIEW_HEIGHT + node.radius) {
            continue;
        }

        ctx.moveTo(screenX + node.radius, screenY);
        ctx.arc(screenX, screenY, node.radius, 0, Math.PI * 2);
    }
    ctx.fill();

    // Pass 2
    for (let i = 0; i < nodesLen; i++) {
        const node = _resourceRenderCache[i];
        if (node.amount <= 0) continue;

        const screenX = (node.x - camera.x) | 0;
        const screenY = (node.y - camera.y) | 0;

        if (screenX < -node.radius || screenX > VIEW_WIDTH + node.radius ||
            screenY < -node.radius || screenY > VIEW_HEIGHT + node.radius) {
            continue;
        }

        let img = node._cachedImage;
        if (!img) img = assetLoader.getImage(node.type);

        if (img) {
            // drawImage mock
        }
    }
}

// Optimized function logic
function drawResourceNodesOptimized() {
    const margin = 50;
    // Use queryRect to populate cache
    resourceGrid.queryRect(camera.x - margin, camera.y - margin, VIEW_WIDTH + margin * 2, VIEW_HEIGHT + margin * 2, _resourceRenderCache);

    // Pre-pass: Calculate coordinates and filter
    let visibleCount = 0;
    const len = _resourceRenderCache.length;

    for (let i = 0; i < len; i++) {
        const node = _resourceRenderCache[i];
        if (node.amount <= 0) continue;

        const screenX = (node.x - camera.x) | 0;
        const screenY = (node.y - camera.y) | 0;

        // Frustum culling
        if (screenX >= -node.radius && screenX <= VIEW_WIDTH + node.radius &&
            screenY >= -node.radius && screenY <= VIEW_HEIGHT + node.radius) {

            node._screenX = screenX;
            node._screenY = screenY;
            _resourceRenderCache[visibleCount++] = node;
        }
    }

    // Batch background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();

    for (let i = 0; i < visibleCount; i++) {
        const node = _resourceRenderCache[i];
        ctx.moveTo(node._screenX + node.radius, node._screenY);
        ctx.arc(node._screenX, node._screenY, node.radius, 0, Math.PI * 2);
    }
    ctx.fill();

    // Batch icons
    for (let i = 0; i < visibleCount; i++) {
        const node = _resourceRenderCache[i];
        let img = node._cachedImage;
        if (!img) img = assetLoader.getImage(node.type);
        // drawImage
    }
}

// Benchmark
const ITERATIONS = 20000;

console.log('Running benchmark...');

// Warmup
for (let i = 0; i < 100; i++) drawResourceNodesOriginal();

const startOriginal = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    drawResourceNodesOriginal();
}
const endOriginal = performance.now();
const timeOriginal = endOriginal - startOriginal;

// Warmup
for (let i = 0; i < 100; i++) drawResourceNodesOptimized();

const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    drawResourceNodesOptimized();
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

console.log(`Original: ${timeOriginal.toFixed(2)}ms`);
console.log(`Optimized: ${timeOptimized.toFixed(2)}ms`);
console.log(`Improvement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}%`);
