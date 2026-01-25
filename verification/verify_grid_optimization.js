
class MockPath2D {
    constructor() {
        this.commands = [];
    }
    moveTo(x, y) { this.commands.push({ type: 'moveTo', x, y }); }
    lineTo(x, y) { this.commands.push({ type: 'lineTo', x, y }); }
}

global.Path2D = MockPath2D;

class MockContext {
    constructor() {
        this.ops = [];
        this.strokeStyle = '';
        this.lineWidth = 1;
    }
    beginPath() { this.ops.push({ type: 'beginPath' }); }
    moveTo(x, y) { this.ops.push({ type: 'moveTo', x, y }); }
    lineTo(x, y) { this.ops.push({ type: 'lineTo', x, y }); }
    stroke(path) { this.ops.push({ type: 'stroke', path }); }
    translate(x, y) { this.ops.push({ type: 'translate', x, y }); }
    save() { this.ops.push({ type: 'save' }); }
    restore() { this.ops.push({ type: 'restore' }); }
}

const TILE_SIZE = 32;
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;

// Old logic simulation
function drawGridOld(ctx, cameraX, cameraY) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    const gridSize = TILE_SIZE;
    const startX = Math.floor(cameraX / gridSize) * gridSize;
    const startY = Math.floor(cameraY / gridSize) * gridSize;

    for (let x = startX; x < cameraX + VIEW_WIDTH; x += gridSize) {
        ctx.moveTo(x - cameraX, 0);
        ctx.lineTo(x - cameraX, VIEW_HEIGHT);
    }
    for (let y = startY; y < cameraY + VIEW_HEIGHT; y += gridSize) {
        ctx.moveTo(0, y - cameraY);
        ctx.lineTo(VIEW_WIDTH, y - cameraY);
    }
    ctx.stroke();
}

// New logic simulation
function createGridPath() {
    const path = new Path2D();
    const width = VIEW_WIDTH + TILE_SIZE;
    const height = VIEW_HEIGHT + TILE_SIZE;

    for (let x = 0; x <= width; x += TILE_SIZE) {
        path.moveTo(x, 0);
        path.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += TILE_SIZE) {
        path.moveTo(0, y);
        path.lineTo(width, y);
    }
    return path;
}

function drawGridNew(ctx, cameraX, cameraY, path) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // ctx.beginPath(); // Not strictly needed if stroking path directly, but harmless if present in actual code?
    // Game.js used beginPath(), but with stroke(path) it's different.
    // We'll stick to stroke(path).

    ctx.save();
    // Offset calculation
    const dx = -(cameraX % TILE_SIZE);
    const dy = -(cameraY % TILE_SIZE);

    ctx.translate(dx, dy);
    ctx.stroke(path);
    ctx.restore();
}

// Verification
const ctxOld = new MockContext();
const camX = 35;
const camY = 40;

drawGridOld(ctxOld, camX, camY);

const ctxNew = new MockContext();
const gridPath = createGridPath();
drawGridNew(ctxNew, camX, camY, gridPath);

// Analyze results
console.log("Old ops count:", ctxOld.ops.length);
console.log("New ops count:", ctxNew.ops.length);

// Verify coordinates
// Old: Line at startX (32) - camX (35) = -3
// New: Line at 0, translated by -(35%32) = -3. Match.

const oldMove = ctxOld.ops.find(op => op.type === 'moveTo');
console.log("Old first moveTo:", oldMove);

const newTranslate = ctxNew.ops.find(op => op.type === 'translate');
console.log("New translate:", newTranslate);
const firstPathMove = gridPath.commands[0];
console.log("Path first moveTo:", firstPathMove);

const expectedX = firstPathMove.x + newTranslate.x;
console.log(`New effective X: ${firstPathMove.x} + ${newTranslate.x} = ${expectedX}`);

if (Math.abs(oldMove.x - expectedX) < 0.001) {
    console.log("✅ SUCCESS: Grid alignment matches");
} else {
    console.error("❌ FAILURE: Grid alignment mismatch");
    console.error(`Expected ${oldMove.x}, got ${expectedX}`);
    process.exit(1);
}

// Check performance (ops count)
// Old should have many moveTo/lineTo
// New should have save, translate, stroke, restore
if (ctxNew.ops.length < ctxOld.ops.length) {
    console.log("✅ SUCCESS: Reduced draw calls");
} else {
    console.error("❌ FAILURE: No reduction in calls");
    process.exit(1);
}
