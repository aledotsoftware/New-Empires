
const { performance } = require('perf_hooks');

// Mock classes
class Entity {
    constructor(x, y, team) {
        this.x = x;
        this.y = y;
        this.team = team;
        this.size = 20;
        this._lastGridCol = (x / 32) | 0;
        this._lastGridRow = (y / 32) | 0;
        this._screenX = 0;
        this._screenY = 0;
    }
}

class SpatialGrid {
    constructor() {
        this.buckets = [];
    }

    queryRowIndices(row, startCol, endCol, result) {
        // Mock query - returns 100 entities per row
        // Simulate some distribution
        for (let i = 0; i < 100; i++) {
            const x = startCol * 100 + Math.random() * 100 * (endCol - startCol);
            const y = row * 100 + Math.random() * 100;
            const team = Math.random() > 0.5 ? 'enemy' : 'player';
            result.push(new Entity(x, y, team));
        }
    }
}

// Mock Game statics
const CONFIG = { VISION: { ENABLED: true } };
const FOW_STATES = { HIDDEN: 0, EXPLORED: 1, VISIBLE: 2 };

// Benchmark
async function runBenchmark() {
    console.log("Starting Render Culling Benchmark...");

    const grid = new SpatialGrid();
    const _rowCache = [];
    const _renderCache = [];

    // Setup Viewport
    const camX = 1000;
    const camY = 1000;
    const viewW = 800;
    const viewH = 600;

    // Setup FOW
    const fowCols = 200;
    const fowRows = 200;
    const fowGrid = new Uint8Array(fowCols * fowRows);
    // Fill FOW with random visibility (50%)
    for (let i = 0; i < fowGrid.length; i++) {
        fowGrid[i] = Math.random() > 0.5 ? FOW_STATES.VISIBLE : FOW_STATES.HIDDEN;
    }
    const fowInvTileSize = 1/32;
    const fowVisibleState = FOW_STATES.VISIBLE;
    const isVisionEnabled = true;

    // Static sorter
    const sorter = (a, b) => a.y - b.y;

    const ITERATIONS = 1000;

    // --- BASELINE ---
    let start = performance.now();

    for (let iter = 0; iter < ITERATIONS; iter++) {
        _renderCache.length = 0;

        // Loop over rows (simulate 10 rows visible)
        for (let r = 10; r < 20; r++) {
            _rowCache.length = 0;
            grid.queryRowIndices(r, 10, 20, _rowCache); // 100 entities per row

            // 1. Sort
            _rowCache.sort(sorter);

            // 2. Loop & Append
            const len = _rowCache.length;
            let renderIdx = _renderCache.length;

            for (let i = 0; i < len; i++) {
                const ent = _rowCache[i];

                // FOW Check
                if (isVisionEnabled && ent.team === 'enemy') {
                    let col = ent._lastGridCol;
                    let row = ent._lastGridRow;
                    if (fowGrid[row * fowCols + col] !== fowVisibleState) {
                        continue;
                    }
                }

                // Screen Coords
                ent._screenX = (ent.x - camX) | 0;
                ent._screenY = (ent.y - camY) | 0;

                _renderCache[renderIdx++] = ent;
            }
        }
    }

    const baselineTime = performance.now() - start;
    console.log(`Baseline Time: ${baselineTime.toFixed(2)}ms`);


    // --- OPTIMIZED ---
    start = performance.now();

    for (let iter = 0; iter < ITERATIONS; iter++) {
        _renderCache.length = 0;

        // Loop over rows
        for (let r = 10; r < 20; r++) {
            _rowCache.length = 0;
            grid.queryRowIndices(r, 10, 20, _rowCache);

            // 1. Filter In-Place (FOW + Culling)
            let writeIdx = 0;
            const len = _rowCache.length;

            for (let i = 0; i < len; i++) {
                const ent = _rowCache[i];

                // FOW Check
                if (isVisionEnabled && ent.team === 'enemy') {
                    let col = ent._lastGridCol;
                    let row = ent._lastGridRow;
                    if (fowGrid[row * fowCols + col] !== fowVisibleState) {
                        continue;
                    }
                }

                // Screen Coords
                ent._screenX = (ent.x - camX) | 0;
                ent._screenY = (ent.y - camY) | 0;

                // Fine-Grained Culling (Simulating the optimization)
                const size = ent.size;
                if (ent._screenX < -size || ent._screenX > viewW + size ||
                    ent._screenY < -size || ent._screenY > viewH + size) {
                    continue;
                }

                _rowCache[writeIdx++] = ent;
            }
            _rowCache.length = writeIdx;

            // 2. Sort (Sorted filtered list)
            _rowCache.sort(sorter);

            // 3. Append (Bulk)
            const finalLen = _rowCache.length;
            let renderIdx = _renderCache.length;
            for (let i = 0; i < finalLen; i++) {
                _renderCache[renderIdx++] = _rowCache[i];
            }
        }
    }

    const optimizedTime = performance.now() - start;
    console.log(`Optimized Time: ${optimizedTime.toFixed(2)}ms`);

    const improvement = baselineTime - optimizedTime;
    const percent = (improvement / baselineTime) * 100;

    console.log(`Improvement: ${improvement.toFixed(2)}ms (${percent.toFixed(2)}%)`);
}

runBenchmark();
