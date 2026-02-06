
import { Unit } from '../js/entities/Unit.js';
import { Game } from '../js/core/Game.js';

// Mock Config
global.CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    VISION: {
        DEFAULT_UNIT: 200
    }
};

class MockUnit extends Unit {
    constructor(x, y, range) {
        super(x, y, 'player');
        this.attackRange = range;
        this.canAttack = true;
    }
}

class MockTarget extends Unit {
    constructor(x, y) {
        super(x, y, 'enemy');
        this.size = 20;
    }
}

// Mock Game
const game = {
    gridMap: null, // No collision for this test
    terrainMap: null
};

// Test Setup
const attacker = new MockUnit(0, 0, 100); // Range 100
const target = new MockTarget(200, 0); // Distance 200

attacker.attackTarget = target;

console.log('Initial Dist:', Math.sqrt(200*200));

// Simulate 1 second of movement
const deltaTime = 1.0;
// Speed is 50. Should move 50px.

attacker.update(deltaTime, game);

console.log('After 1s (Speed 50):');
console.log('Attacker X:', attacker.x);
const dist1 = Math.sqrt((target.x - attacker.x)**2);
console.log('Dist:', dist1);

// Move again until close
// With default behavior (minDistSq=25), it should keep moving until dist < 5
// With optimization, it should stop at dist <= 100

for (let i = 0; i < 10; i++) {
    attacker.update(deltaTime, game);
}

console.log('After 10s:');
console.log('Attacker X:', attacker.x);
const distFinal = Math.sqrt((target.x - attacker.x)**2);
console.log('Final Dist:', distFinal);

if (distFinal <= 5.1 && distFinal < 100) {
    console.log('Current Behavior: Unit moved into melee range (5px)');
} else if (distFinal >= 99 && distFinal <= 101) {
    console.log('Optimized Behavior: Unit stopped at attack range (100px)');
} else {
    console.log('Unknown Behavior');
}
