
const assert = require('assert');

// Mock Game class
class Game {
    constructor() {
        this.entities = [];
        this.selectedEntities = [];
        this.camera = { x: 0, y: 0 };
        this.viewWidth = 800;
        this.viewHeight = 600;
        this.mouse = { worldX: 0, worldY: 0 };
        this.notifications = [];
    }

    // Helper method (the one we plan to implement)
    getEntityAt(worldX, worldY) {
        let closest = null;
        let closestDistSq = Infinity;

        for (let entity of this.entities) {
            // Logic copied from selectEntities in Game.js (with team check removed or kept?)
            // selectEntities checks for 'player' team. dblclick should probably do same.
            // But getEntityAt is generic. Let's make it generic and filter later.

            const dx = entity.x - worldX;
            const dy = entity.y - worldY;
            const distSq = dx * dx + dy * dy;
            const sizeSq = entity.size * entity.size;

            if (distSq < sizeSq && distSq < closestDistSq) {
                closest = entity;
                closestDistSq = distSq;
            }
        }
        return closest;
    }

    // The logic we want to verify
    handleDoubleClick() {
        // Mock finding target
        const target = this.getEntityAt(this.mouse.worldX, this.mouse.worldY);

        if (target && target.team === 'player') {
            const type = target.type;

            // Filter visible entities of same type
            const visibleSameType = this.entities.filter(u =>
                u.team === 'player' &&
                u.type === type &&
                !u.isDead &&
                u.x >= this.camera.x && u.x <= this.camera.x + this.viewWidth &&
                u.y >= this.camera.y && u.y <= this.camera.y + this.viewHeight
            );

            if (visibleSameType.length > 0) {
                this.selectedEntities = visibleSameType;
                this.updateSelectionPanel();
                this.updateActionsPanel();
                this.showNotification(`Seleccionadas todas las unidades visibles: ${type}`);
            }
        }
    }

    updateSelectionPanel() {
        // Mock
    }

    updateActionsPanel() {
        // Mock
    }

    showNotification(msg) {
        this.notifications.push(msg);
    }
}

// Helper to create entity
function createEntity(id, x, y, type, team) {
    return {
        id, x, y, type, team,
        size: 20,
        isDead: false
    };
}

// Test Case 1: Select all visible villagers
console.log('Test 1: Select all visible villagers');
const game1 = new Game();
// Add target villager (under mouse)
game1.entities.push(createEntity(1, 100, 100, 'villager', 'player'));
// Add another visible villager
game1.entities.push(createEntity(2, 200, 200, 'villager', 'player'));
// Add invisible villager (off screen)
game1.entities.push(createEntity(3, 2000, 2000, 'villager', 'player'));
// Add visible warrior (different type)
game1.entities.push(createEntity(4, 300, 300, 'warrior', 'player'));
// Add visible enemy villager (different team)
game1.entities.push(createEntity(5, 400, 400, 'villager', 'enemy'));

game1.mouse.worldX = 100;
game1.mouse.worldY = 100;

game1.handleDoubleClick();

assert.strictEqual(game1.selectedEntities.length, 2, 'Should select 2 villagers');
assert.strictEqual(game1.selectedEntities[0].id, 1);
assert.strictEqual(game1.selectedEntities[1].id, 2);
console.log('✅ Passed');

// Test 2: Double click enemy
console.log('Test 2: Double click enemy (should ignore)');
const game2 = new Game();
game2.entities.push(createEntity(1, 100, 100, 'villager', 'enemy'));
game2.mouse.worldX = 100;
game2.mouse.worldY = 100;

game2.handleDoubleClick();

assert.strictEqual(game2.selectedEntities.length, 0, 'Should not select enemy');
console.log('✅ Passed');

// Test 3: Double click empty space
console.log('Test 3: Double click empty space');
const game3 = new Game();
game3.entities.push(createEntity(1, 100, 100, 'villager', 'player'));
game3.mouse.worldX = 500; // Far away
game3.mouse.worldY = 500;

game3.handleDoubleClick();

assert.strictEqual(game3.selectedEntities.length, 0, 'Should not select anything');
console.log('✅ Passed');
