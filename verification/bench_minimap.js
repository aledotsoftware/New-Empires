
const TILE_SIZE = 32;

// Mock FogOfWar
class FogOfWar {
    constructor(width, height) {
        this.invTileSize = 1 / TILE_SIZE;
        this.cols = Math.ceil(width / TILE_SIZE);
        this.rows = Math.ceil(height / TILE_SIZE);
        // Mock grid
        this.grid = new Uint8Array(this.cols * this.rows);
    }
    isVisible(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        // Deterministic mock result (avoid random)
        return (col + row) % 2 === 0;
    }
}

// Mock Entity
class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this._lastGridCol = -1;
        this._lastGridRow = -1;
    }

    updateGrid() {
         const invTileSize = 1 / TILE_SIZE;
         this._lastGridCol = (this.x * invTileSize) | 0;
         this._lastGridRow = (this.y * invTileSize) | 0;
    }
}

const fow = new FogOfWar(4096, 4096);
const enemies = [];
const COUNT = 10000;

// Init entities
for (let i = 0; i < COUNT; i++) {
    const x = Math.random() * 4096;
    const y = Math.random() * 4096;
    const e = new Entity(x, y);
    e.updateGrid();
    enemies.push(e);
}

// Mock Game
const game = {
    enemies: enemies,
    fow: fow
};

function benchOriginal() {
    let visibleCount = 0;
    const len = game.enemies.length;
    for (let i = 0; i < len; i++) {
        const enemy = game.enemies[i];
        if (!game.fow.isVisible((enemy.x / TILE_SIZE) | 0, (enemy.y / TILE_SIZE) | 0)) {
            continue;
        }
        visibleCount++;
    }
    return visibleCount;
}

function benchOptimized() {
    let visibleCount = 0;
    const len = game.enemies.length;
    // Hoist invTileSize
    const invTileSize = game.fow.invTileSize;

    for (let i = 0; i < len; i++) {
        const enemy = game.enemies[i];
        // Use cached
        const col = enemy._lastGridCol !== -1 ? enemy._lastGridCol : (enemy.x * invTileSize) | 0;
        const row = enemy._lastGridRow !== -1 ? enemy._lastGridRow : (enemy.y * invTileSize) | 0;

        if (!game.fow.isVisible(col, row)) {
            continue;
        }
        visibleCount++;
    }
    return visibleCount;
}

// Warmup
for (let i=0; i<100; i++) benchOriginal();
for (let i=0; i<100; i++) benchOptimized();

const ITERATIONS = 2000;

console.log(`Benchmarking ${COUNT} entities over ${ITERATIONS} iterations...`);

console.time('Original');
for (let i=0; i<ITERATIONS; i++) {
    benchOriginal();
}
console.timeEnd('Original');

console.time('Optimized');
for (let i=0; i<ITERATIONS; i++) {
    benchOptimized();
}
console.timeEnd('Optimized');
