
const { SpatialGrid } = require('../js/managers/SpatialGrid.js');

// Mock Game class structure for testing
class MockGame {
    constructor() {
        this.cursorBadge = { src: '', style: { display: 'none' } };
        this.selectedEntities = [];
        this.mouse = { worldX: 0, worldY: 0 };
        this.enemyUnitGrid = new SpatialGrid(1000, 1000, 100);
        this.buildingGrid = new SpatialGrid(1000, 1000, 100);
        this.resourceGrid = new SpatialGrid(1000, 1000, 100);
    }

    // Copied from Game.js (or re-implemented matching the change)
    static _cursorEnemyPredicate(entity, mouse) {
        if (entity.isDead) return false;
        const dx = entity.x - mouse.worldX;
        const dy = entity.y - mouse.worldY;
        return (dx * dx + dy * dy) < (entity.size * entity.size);
    }

    static _cursorBuildingPredicate(entity, mouse) {
        if (entity.team !== 'player' || !entity.isUnderConstruction) return false;
        const checkRadius = entity.size / 2 + 20;
        const dx = entity.x - mouse.worldX;
        const dy = entity.y - mouse.worldY;
        return (dx * dx + dy * dy) < (checkRadius * checkRadius);
    }

    static _cursorResourcePredicate(entity, mouse) {
        if (entity.amount <= 0) return false;
        const dx = entity.x - mouse.worldX;
        const dy = entity.y - mouse.worldY;
        return (dx * dx + dy * dy) < (entity.radius * entity.radius);
    }

    updateCursorState() {
        if (!this.cursorBadge) return;

        let showBadge = false;
        let badgeIcon = '';

        if (this.selectedEntities.length === 1) {
            const entity = this.selectedEntities[0];
            if (entity.team === 'player' && entity.isUnit) {
                if (entity.canAttack) {
                    const target = this.enemyUnitGrid.find(
                        this.mouse.worldX,
                        this.mouse.worldY,
                        30,
                        MockGame._cursorEnemyPredicate,
                        this.mouse
                    );

                    if (target) {
                        badgeIcon = 'assets/icons/swords.png';
                        showBadge = true;
                    }
                }

                if (!showBadge && entity.type === 'villager' && this.buildingGrid) {
                    const target = this.buildingGrid.find(
                        this.mouse.worldX,
                        this.mouse.worldY,
                        30,
                        MockGame._cursorBuildingPredicate,
                        this.mouse
                    );

                    if (target) {
                        badgeIcon = 'assets/icons/build.png';
                        showBadge = true;
                    }
                }

                if (!showBadge && entity.canGather && entity.type === 'villager' && this.resourceGrid) {
                    const res = this.resourceGrid.find(
                        this.mouse.worldX,
                        this.mouse.worldY,
                        30,
                        MockGame._cursorResourcePredicate,
                        this.mouse
                    );

                    if (res) {
                        badgeIcon = 'assets/icons/gold.png'; // simplified
                        showBadge = true;
                    }
                }
            }
        }

        if (showBadge) {
            this.cursorBadge.src = badgeIcon;
            this.cursorBadge.style.display = 'block';
        } else {
            this.cursorBadge.style.display = 'none';
        }
    }
}

// Test Suite
function runTests() {
    const game = new MockGame();

    // Setup Unit
    const unit = { x: 100, y: 100, team: 'player', isUnit: true, canAttack: true, type: 'warrior' };
    game.selectedEntities = [unit];

    // Test 1: Hover over nothing
    game.mouse.worldX = 500;
    game.mouse.worldY = 500;
    game.updateCursorState();
    if (game.cursorBadge.style.display !== 'none') throw new Error('Test 1 Failed: Badge should be hidden');

    // Test 2: Hover over enemy
    const enemy = { x: 200, y: 200, size: 20, isDead: false };
    game.enemyUnitGrid.add(enemy);
    game.mouse.worldX = 200; // Exact center
    game.mouse.worldY = 200;
    game.updateCursorState();

    if (game.cursorBadge.style.display !== 'block' || game.cursorBadge.src !== 'assets/icons/swords.png') {
        throw new Error('Test 2 Failed: Should show sword icon for enemy');
    }
    console.log('Test 2 Passed: Enemy detected');

    // Test 3: Hover over enemy (out of range)
    game.mouse.worldX = 200 + 25; // 25px away. Size 20. 25*25=625 > 400.

    game.updateCursorState();
    if (game.cursorBadge.style.display !== 'none') {
        throw new Error('Test 3 Failed: Should not detect enemy out of range');
    }
    console.log('Test 3 Passed: Enemy range check');

    // Test 4: Hover over building (Villager only)
    game.selectedEntities[0] = { ...unit, type: 'villager', canGather: true }; // Villager

    const building = { x: 300, y: 300, size: 60, team: 'player', isUnderConstruction: true };
    game.buildingGrid.add(building);

    game.mouse.worldX = 300;
    game.mouse.worldY = 300;
    game.updateCursorState();

    if (game.cursorBadge.style.display !== 'block' || game.cursorBadge.src !== 'assets/icons/build.png') {
        throw new Error('Test 4 Failed: Should show build icon');
    }
    console.log('Test 4 Passed: Building detected');

    console.log('All cursor logic verification tests passed!');
}

runTests();
