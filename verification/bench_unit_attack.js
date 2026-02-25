
import { Unit } from '../js/entities/Unit.js';

// Mock global objects
if (typeof global !== 'undefined') {
    global.Image = class { constructor() { this.src = ''; this.onload = null; } };
}

function benchmark() {
    console.log('=== Benchmarking Attack Range Optimization V2 ===');

    const unit = new Unit(0, 0, 'player');
    unit.attackRange = 50;
    const target = new Unit(30, 0, 'enemy');

    const iterations = 10000000;

    // Warmup Baseline
    for (let i = 0; i < 1000; i++) {
        const x = unit.attackRange * unit.attackRange;
    }

    console.time('Baseline (getter * getter)');
    for (let i = 0; i < iterations; i++) {
        const dx = unit.x - target.x;
        const dy = unit.y - target.y;
        const distSq = dx * dx + dy * dy;

        // This invokes the getter twice!
        const rangeSq = unit.attackRange * unit.attackRange;

        if (distSq <= rangeSq) {}
    }
    console.timeEnd('Baseline (getter * getter)');

    // Warmup Optimized
    for (let i = 0; i < 1000; i++) {
        const x = unit.attackRangeSq;
    }

    console.time('Optimized (property)');
    for (let i = 0; i < iterations; i++) {
        const dx = unit.x - target.x;
        const dy = unit.y - target.y;
        const distSq = dx * dx + dy * dy;

        const rangeSq = unit.attackRangeSq;

        if (distSq <= rangeSq) {}
    }
    console.timeEnd('Optimized (property)');
}

benchmark();
