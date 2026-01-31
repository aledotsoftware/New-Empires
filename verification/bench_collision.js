
const { performance } = require('perf_hooks');

class GridMap {
    constructor() {
        this.cols = 25;
        this.rows = 25;
        this.collisionGrid = new Uint8Array(625);
        this.invTileSize = 1 / 32;
    }
}

class Game {
    constructor() {
        this.gridMap = new GridMap();
    }
}

class Unit {
    constructor() {
        this.x = 100;
        this.y = 100;
        this._lastGridCol = -1;
        this._lastGridRow = -1;
    }

    moveStandard(game) {
        let currCol = -1;
        let currRow = -1;

        if (game && game.gridMap) {
            const gridMap = game.gridMap;
            const invTileSize = gridMap.invTileSize;
            currCol = (this.x * invTileSize) | 0;
            currRow = (this.y * invTileSize) | 0;

            if (currCol !== this._lastGridCol || currRow !== this._lastGridRow) {
                this._lastGridCol = currCol;
                this._lastGridRow = currRow;
            }

            // Collision logic simulation
            const collisionGrid = gridMap.collisionGrid;
            if (collisionGrid.length > 0) return true;
        }
        return false;
    }

    moveOptimized(game) {
        // Optimized: direct access if possible or simpler check
        // Assuming game.gridMap exists
        const gridMap = game.gridMap;
        if (gridMap) {
             const invTileSize = gridMap.invTileSize;
             const currCol = (this.x * invTileSize) | 0;
             const currRow = (this.y * invTileSize) | 0;

            if (currCol !== this._lastGridCol || currRow !== this._lastGridRow) {
                this._lastGridCol = currCol;
                this._lastGridRow = currRow;
            }

             const collisionGrid = gridMap.collisionGrid;
             if (collisionGrid.length > 0) return true;
        }
        return false;
    }
}

// Verification Phase
console.log("Verifying correctness...");
const vGame = new Game();
const vUnitStd = new Unit();
const vUnitOpt = new Unit();

// Scenario 1: No movement
const resStd1 = vUnitStd.moveStandard(vGame);
const resOpt1 = vUnitOpt.moveOptimized(vGame);

if (resStd1 !== resOpt1) {
    console.error(`Mismatch 1: Standard ${resStd1} vs Optimized ${resOpt1}`);
    process.exit(1);
}
if (vUnitStd._lastGridCol !== vUnitOpt._lastGridCol) {
     console.error(`Mismatch State Col: ${vUnitStd._lastGridCol} vs ${vUnitOpt._lastGridCol}`);
     process.exit(1);
}

// Scenario 2: Movement
vUnitStd.x = 200; vUnitStd.y = 200;
vUnitOpt.x = 200; vUnitOpt.y = 200;

vUnitStd.moveStandard(vGame);
vUnitOpt.moveOptimized(vGame);

if (vUnitStd._lastGridCol !== vUnitOpt._lastGridCol) {
    console.error(`Mismatch State Col after move: ${vUnitStd._lastGridCol} vs ${vUnitOpt._lastGridCol}`);
    process.exit(1);
}

console.log("Correctness Verified ✅");

const game = new Game();
const unit = new Unit();
const iterations = 100000000;

const startStd = performance.now();
for (let i = 0; i < iterations; i++) {
    unit.moveStandard(game);
}
const endStd = performance.now();

const startOpt = performance.now();
for (let i = 0; i < iterations; i++) {
    unit.moveOptimized(game);
}
const endOpt = performance.now();

console.log(`Standard: ${(endStd - startStd).toFixed(2)}ms`);
console.log(`Optimized: ${(endOpt - startOpt).toFixed(2)}ms`);
console.log(`Improvement: ${((endStd - endOpt) / endStd * 100).toFixed(2)}%`);
