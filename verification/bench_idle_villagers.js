import assert from "assert";

// Mock Unit
class MockUnit {
    constructor(type, team, state) {
        this.type = type;
        this.team = team;
        this.state = state;
    }
}

// Mock units list
const N = 1000;
const units = [];
for (let i = 0; i < N; i++) {
    const isPlayer = Math.random() < 0.8;
    const isVillager = Math.random() < 0.6;
    const isIdle = Math.random() < 0.2;

    units.push(new MockUnit(
        isVillager ? 'villager' : 'warrior',
        isPlayer ? 'player' : 'enemy',
        isIdle ? 'IDLE' : 'MOVING'
    ));
}

function baseline_selectNextIdleVillager(units) {
    const idleVillagers = [];
    const len = units.length;
    for (let i = 0; i < len; i++) {
        const unit = units[i];
        if (unit.type === 'villager' && unit.team === 'player' && unit.state === 'IDLE') {
            idleVillagers.push(unit);
        }
    }
    return idleVillagers.length > 0 ? idleVillagers[0] : null;
}

function optimized_selectNextIdleVillager(units, startIndex) {
    const len = units.length;
    for (let i = 0; i < len; i++) {
        // Wrap around logic without creating an array
        const idx = (startIndex + i) % len;
        const unit = units[idx];
        if (unit.type === 'villager' && unit.team === 'player' && unit.state === 'IDLE') {
            return { unit, index: (idx + 1) % len };
        }
    }
    return { unit: null, index: startIndex };
}

// Correctness
const baseRes = baseline_selectNextIdleVillager(units);

// Need to find first one manually for optimized
let firstIdx = 0;
while (firstIdx < units.length && !(units[firstIdx].type === 'villager' && units[firstIdx].team === 'player' && units[firstIdx].state === 'IDLE')) {
    firstIdx++;
}

const optRes = optimized_selectNextIdleVillager(units, firstIdx);
assert.strictEqual(optRes.unit, baseRes, 'Should return the same unit');


// Benchmark
const iterations = 50000;

console.time('Baseline (Array Allocation)');
for (let i = 0; i < iterations; i++) {
    baseline_selectNextIdleVillager(units);
}
console.timeEnd('Baseline (Array Allocation)');

console.time('Optimized (In-place Iteration)');
let currentIndex = 0;
for (let i = 0; i < iterations; i++) {
    const res = optimized_selectNextIdleVillager(units, currentIndex);
    currentIndex = res.index;
}
console.timeEnd('Optimized (In-place Iteration)');
