
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
                const len = bucket.length;
                for (let i = 0; i < len; i++) {
                    result.push(bucket[i]);
                }
            }
        }
    }
}

// Mock FOW
const TILE_SIZE = 32;
const FOW_STATES = { HIDDEN: 0, EXPLORED: 1, VISIBLE: 2 };

class FogOfWar {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.invTileSize = 1 / TILE_SIZE;
        this.grid = new Uint8Array(cols * rows);
        this.grid.fill(1); // All explored for benchmark
    }

    isExplored(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        const state = this.grid[row * this.cols + col];
        return state === 1 || state === 2;
    }
}

// Setup
const CONFIG = { CANVAS_WIDTH: 6400, CANVAS_HEIGHT: 6400 };
const VIEW_WIDTH = 1920;
const VIEW_HEIGHT = 1080;

const resourceGrid = new SpatialGrid(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT, 100);
const resourceNodes = [];
const _resourceRenderCache = [];

// Populate resources
for (let i = 0; i < 10000; i++) {
    const x = Math.random() * CONFIG.CANVAS_WIDTH;
    const y = Math.random() * CONFIG.CANVAS_HEIGHT;
    const node = {
        x: x,
        y: y,
        radius: 20,
        type: 'wood',
        amount: 100,
        // Pre-calculated for optimization
        _gridCol: (x / TILE_SIZE) | 0,
        _gridRow: (y / TILE_SIZE) | 0
    };
    resourceNodes.push(node);
    resourceGrid.add(node);
}

const fow = new FogOfWar(CONFIG.CANVAS_WIDTH / TILE_SIZE, CONFIG.CANVAS_HEIGHT / TILE_SIZE);
const camera = { x: 2000, y: 2000 };

// Simulate Game class context
const game = {
    fow: fow,
    camera: camera,
    viewWidth: VIEW_WIDTH,
    viewHeight: VIEW_HEIGHT,
    _resourceRenderCache: _resourceRenderCache
};

function drawResourceNodesCurrent() {
    const margin = 50;
    resourceGrid.queryRect(game.camera.x - margin, game.camera.y - margin, game.viewWidth + margin * 2, game.viewHeight + margin * 2, game._resourceRenderCache);

    let visibleCount = 0;
    const nodesLen = game._resourceRenderCache.length;
    const viewW = game.viewWidth;
    const viewH = game.viewHeight;
    const camX = game.camera.x;
    const camY = game.camera.y;

    for (let i = 0; i < nodesLen; i++) {
        const node = game._resourceRenderCache[i];
        if (node.amount <= 0) continue;

        // Current Logic: Calculate coords and call function
        if (!game.fow.isExplored((node.x * game.fow.invTileSize) | 0, (node.y * game.fow.invTileSize) | 0)) {
            continue;
        }

        const screenX = (node.x - camX) | 0;
        const screenY = (node.y - camY) | 0;
        const radius = node.radius;

        if (screenX >= -radius && screenX <= viewW + radius &&
            screenY >= -radius && screenY <= viewH + radius) {
            visibleCount++;
        }
    }
    return visibleCount;
}

function drawResourceNodesProposed() {
    const margin = 50;
    resourceGrid.queryRect(game.camera.x - margin, game.camera.y - margin, game.viewWidth + margin * 2, game.viewHeight + margin * 2, game._resourceRenderCache);

    let visibleCount = 0;
    const nodesLen = game._resourceRenderCache.length;
    const viewW = game.viewWidth;
    const viewH = game.viewHeight;
    const camX = game.camera.x;
    const camY = game.camera.y;

    // Hoisted
    const fowGrid = game.fow.grid;
    const fowCols = game.fow.cols;

    for (let i = 0; i < nodesLen; i++) {
        const node = game._resourceRenderCache[i];
        if (node.amount <= 0) continue;

        // Proposed Logic: Use cached coords and inline array access
        // Assuming FOW_STATES.HIDDEN is 0
        if (fowGrid[node._gridRow * fowCols + node._gridCol] === 0) {
            continue;
        }

        const screenX = (node.x - camX) | 0;
        const screenY = (node.y - camY) | 0;
        const radius = node.radius;

        if (screenX >= -radius && screenX <= viewW + radius &&
            screenY >= -radius && screenY <= viewH + radius) {
            visibleCount++;
        }
    }
    return visibleCount;
}

// Benchmark
const ITERATIONS = 10000;

console.log('Running benchmark (Resource FOW Check)...');

// Warmup
for (let i = 0; i < 100; i++) drawResourceNodesCurrent();
for (let i = 0; i < 100; i++) drawResourceNodesProposed();

const startCurrent = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    drawResourceNodesCurrent();
}
const endCurrent = performance.now();
const timeCurrent = endCurrent - startCurrent;

const startProposed = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    drawResourceNodesProposed();
}
const endProposed = performance.now();
const timeProposed = endProposed - startProposed;

console.log(`Current: ${timeCurrent.toFixed(2)}ms`);
console.log(`Proposed: ${timeProposed.toFixed(2)}ms`);
console.log(`Improvement: ${((timeCurrent - timeProposed) / timeCurrent * 100).toFixed(2)}%`);
