
import { Unit } from '../js/entities/Unit.js';
import { Archer } from '../js/entities/units/Archer.js';

// Mock global objects if necessary
if (typeof global !== 'undefined') {
    global.Image = class { constructor() { this.src = ''; this.onload = null; } };
}

function verifyAttackRangeOptimization() {
    console.log('=== Verifying Attack Range Optimization ===');

    // Test 1: Base Unit
    console.log('\n--- Test 1: Base Unit ---');
    const unit = new Unit(0, 0, 'player');

    console.log(`Initial attackRange: ${unit.attackRange}`);
    console.log(`Initial attackRangeSq: ${unit.attackRangeSq}`);

    if (unit.attackRangeSq === undefined) {
        console.log('❌ attackRangeSq is undefined (Optimization not applied yet)');
    } else if (unit.attackRangeSq === unit.attackRange * unit.attackRange) {
        console.log('✅ attackRangeSq matches squared range');
    } else {
        console.log(`❌ attackRangeSq mismatch! Expected ${unit.attackRange**2}, got ${unit.attackRangeSq}`);
    }

    // Modify attackRange
    console.log('Modifying attackRange to 60...');
    unit.attackRange = 60;

    console.log(`New attackRange: ${unit.attackRange}`);
    console.log(`New attackRangeSq: ${unit.attackRangeSq}`);

    if (unit.attackRangeSq === 60 * 60) {
        console.log('✅ attackRangeSq updated correctly');
    } else {
        console.log(`❌ attackRangeSq failed to update! Expected 3600, got ${unit.attackRangeSq}`);
    }

    // Test 2: Archer (Subclass with override)
    console.log('\n--- Test 2: Archer (Subclass) ---');
    const archer = new Archer(0, 0, 'player');

    console.log(`Archer attackRange: ${archer.attackRange}`);
    console.log(`Archer attackRangeSq: ${archer.attackRangeSq}`);

    if (archer.attackRange === 100 && archer.attackRangeSq === 10000) {
        console.log('✅ Archer initialized correctly with overridden range');
    } else {
        console.log(`❌ Archer initialization failed! Range: ${archer.attackRange}, Sq: ${archer.attackRangeSq}`);
    }

    // Modify Archer range
    console.log('Modifying Archer attackRange to 120...');
    archer.attackRange = 120;

    if (archer.attackRangeSq === 14400) {
        console.log('✅ Archer attackRangeSq updated correctly');
    } else {
        console.log(`❌ Archer attackRangeSq failed to update! Expected 14400, got ${archer.attackRangeSq}`);
    }
}

verifyAttackRangeOptimization();
