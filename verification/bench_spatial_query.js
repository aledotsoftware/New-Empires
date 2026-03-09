import { SpatialGrid } from '../js/managers/SpatialGrid.js';

const grid = new SpatialGrid(6400, 6400, 100);

const entities = [];
for (let i = 0; i < 20000; i++) {
    const e = {
        x: Math.random() * 6400,
        y: Math.random() * 6400,
        visionRadius: 10 * 32,
        _spatialMinX: null,
        _spatialMaxX: null,
        _spatialMinY: null,
        _spatialMaxY: null,
        _spatialIndex: -1,
        _spatialCellSize: 0
    };
    entities.push(e);
    grid.add(e);
}

const cache = [];

function queryBaseline(grid, x, y, radius, result = []) {
    result.length = 0;
    const buckets = grid.buckets;
    const cols = grid.cols;
    const rows = grid.rows;
    let count = result.length;
    const cellRadius = Math.ceil(radius * grid.invCellSize);
    const centerCol = (x * grid.invCellSize) | 0;
    const centerRow = (y * grid.invCellSize) | 0;

    const startRow = Math.max(0, centerRow - cellRadius);
    const endRow = Math.min(rows - 1, centerRow + cellRadius);
    const startCol = Math.max(0, centerCol - cellRadius);
    const endCol = Math.min(cols - 1, centerCol + cellRadius);

    for (let r = startRow; r <= endRow; r++) {
        const rowBase = r * cols;
        for (let c = startCol; c <= endCol; c++) {
            const index = rowBase + c;
            const bucket = buckets[index];
            const bLen = bucket.length;
            if (bLen > 0) {
                for (let i = 0; i < bLen; i++) {
                    result[count++] = bucket[i];
                }
            }
        }
    }
    return result;
}

function queryOptimized(grid, x, y, radius, result = []) {
    result.length = 0;
    const buckets = grid.buckets;
    const cols = grid.cols;
    const rows = grid.rows;
    let count = result.length;

    const invCellSize = grid.invCellSize;
    const startCol = Math.max(0, ((x - radius) * invCellSize) | 0);
    const endCol = Math.min(cols - 1, ((x + radius) * invCellSize) | 0);
    const startRow = Math.max(0, ((y - radius) * invCellSize) | 0);
    const endRow = Math.min(rows - 1, ((y + radius) * invCellSize) | 0);

    for (let r = startRow; r <= endRow; r++) {
        const rowBase = r * cols;
        for (let c = startCol; c <= endCol; c++) {
            const index = rowBase + c;
            const bucket = buckets[index];
            const bLen = bucket.length;
            if (bLen > 0) {
                for (let i = 0; i < bLen; i++) {
                    result[count++] = bucket[i];
                }
            }
        }
    }
    return result;
}

console.time('queryBaseline');
for (let i = 0; i < 5000; i++) {
    queryBaseline(grid, 3200, 3200, 200, cache);
}
console.timeEnd('queryBaseline');

console.time('queryOptimized');
for (let i = 0; i < 5000; i++) {
    queryOptimized(grid, 3200, 3200, 200, cache);
}
console.timeEnd('queryOptimized');
