// Verification script for Drag Selection Counter logic

// Mock Canvas Context
class MockCtx {
    constructor() {
        this.calls = [];
        this.fillStyle = '';
        this.strokeStyle = '';
        this.font = '';
        this.textAlign = '';
        this.textBaseline = '';
        this.lineWidth = 1;
    }

    measureText(text) {
        return { width: text.length * 6 };
    }

    fillRect(x, y, w, h) {
        this.calls.push({ type: 'fillRect', x, y, w, h, style: this.fillStyle });
    }

    strokeRect(x, y, w, h) {
        this.calls.push({ type: 'strokeRect', x, y, w, h, style: this.strokeStyle });
    }

    fillText(text, x, y) {
        this.calls.push({ type: 'fillText', text, x, y, style: this.fillStyle });
    }

    beginPath() {}
    rect(x, y, w, h) {
        this.calls.push({ type: 'rect', x, y, w, h });
    }
    fill() {}
    stroke() {}
}

// Mock SpatialGrid
class MockSpatialGrid {
    constructor(entities) {
        this.entities = entities;
    }

    queryRect(x, y, w, h, result) {
        result.length = 0;
        // Simple bounding box check for mock
        for (const ent of this.entities) {
            if (ent.x >= x && ent.x <= x + w && ent.y >= y && ent.y <= y + h) {
                result.push(ent);
            }
        }
        // In reality, spatial grid returns approximate buckets,
        // so we should simulate returning some extra units outside bounds
        // to verify the precise filtering logic in Game.js
        // But for this unit test, exact match of queryRect is fine as long as we add edge cases.
        return result;
    }
}

// Mock Game (Minimal)
class Game {
    constructor() {
        this.ctx = new MockCtx();
        this.camera = { x: 0, y: 0 };
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
        this.dragStart = { x: 0, y: 0 };
        this._dragSelectCache = [];
        this.spatialGrid = null;
    }

    // Copied from implementation for testing isolation
    drawDragSelection() {
        const startX = (this.dragStart.x - this.camera.x) | 0;
        const startY = (this.dragStart.y - this.camera.y) | 0;
        const width = (this.mouse.x - startX) | 0;
        const height = (this.mouse.y - startY) | 0;

        this.ctx.strokeStyle = '#48bb78';
        this.ctx.fillStyle = 'rgba(72, 187, 120, 0.1)';
        this.ctx.lineWidth = 2;

        this.ctx.fillRect(startX, startY, width, height);
        this.ctx.strokeRect(startX, startY, width, height);

        // Palette: Drag Selection Counter
        if (this.spatialGrid && this._dragSelectCache) {
            const minX = Math.min(this.dragStart.x, this.mouse.worldX);
            const maxX = Math.max(this.dragStart.x, this.mouse.worldX);
            const minY = Math.min(this.dragStart.y, this.mouse.worldY);
            const maxY = Math.max(this.dragStart.y, this.mouse.worldY);
            const w = maxX - minX;
            const h = maxY - minY;

            // Reuse cache
            this.spatialGrid.queryRect(minX, minY, w, h, this._dragSelectCache);

            let count = 0;
            const len = this._dragSelectCache.length;
            for (let i = 0; i < len; i++) {
                const ent = this._dragSelectCache[i];
                // Check if it's a valid player unit inside the selection box
                if (ent.team === 'player' && ent.isUnit && !ent.isDead) {
                    if (ent.x >= minX && ent.x <= maxX &&
                        ent.y >= minY && ent.y <= maxY) {
                        count++;
                    }
                }
            }

            if (count > 0) {
                const text = `${count}`;
                this.ctx.font = 'bold 12px "Inter", sans-serif';
                const metrics = this.ctx.measureText(text);
                const padding = 6;
                const bgW = metrics.width + padding * 2;
                const bgH = 20;

                // Position near cursor but not overlapping
                const bgX = this.mouse.x + 16;
                const bgY = this.mouse.y + 16;

                // Draw background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                this.ctx.strokeStyle = '#48bb78';
                this.ctx.lineWidth = 1;

                this.ctx.beginPath();
                this.ctx.rect(bgX, bgY, bgW, bgH);
                this.ctx.fill();
                this.ctx.stroke();

                // Draw text
                this.ctx.fillStyle = '#ffffff';
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(text, bgX + padding, bgY + bgH / 2);
            }
        }
    }
}

// --- RUN TESTS ---
console.log('Running Drag Selection Counter Verification...');

const game = new Game();
game.mouse = { x: 200, y: 200, worldX: 200, worldY: 200 };
game.dragStart = { x: 100, y: 100 }; // 100x100 box

// Setup Entities
const entities = [
    { x: 150, y: 150, team: 'player', isUnit: true, isDead: false }, // Inside
    { x: 120, y: 120, team: 'player', isUnit: true, isDead: false }, // Inside
    { x: 150, y: 150, team: 'enemy', isUnit: true, isDead: false },  // Enemy (Ignore)
    { x: 150, y: 150, team: 'player', isUnit: false, isDead: false }, // Building (Ignore)
    { x: 150, y: 150, team: 'player', isUnit: true, isDead: true },  // Dead (Ignore)
    { x: 50, y: 50, team: 'player', isUnit: true, isDead: false },   // Outside
    { x: 250, y: 250, team: 'player', isUnit: true, isDead: false }  // Outside
];

game.spatialGrid = new MockSpatialGrid(entities);

// Test 1: Should count 2 units
game.drawDragSelection();

const textCalls = game.ctx.calls.filter(c => c.type === 'fillText');
const lastText = textCalls[textCalls.length - 1];

if (lastText && lastText.text === '2') {
    console.log('✅ Test 1 Passed: Counted 2 units correctly.');
} else {
    console.error('❌ Test 1 Failed: Expected "2", got', lastText ? lastText.text : 'nothing');
    process.exit(1);
}

// Test 2: Zero units (should not draw text)
game.ctx.calls = [];
game.dragStart = { x: 0, y: 0 };
game.mouse = { x: 10, y: 10, worldX: 10, worldY: 10 }; // Area with no units
game.drawDragSelection();

const textCalls2 = game.ctx.calls.filter(c => c.type === 'fillText');
if (textCalls2.length === 0) {
    console.log('✅ Test 2 Passed: No badge drawn for 0 units.');
} else {
    console.error('❌ Test 2 Failed: Badge drawn unexpectedly.');
    process.exit(1);
}

console.log('All tests passed.');
