const iterations = 10000;
const arraySize = 500;

console.log(`Running benchmark: ${iterations} iterations with array size ${arraySize}\n`);

// Mock data
const entities = new Array(arraySize).fill(null).map((_, i) => ({
    id: i,
    type: i % 5 === 0 ? 'building' : (i % 2 === 0 ? 'villager' : 'warrior'),
    team: i % 10 === 0 ? 'enemy' : 'player',
    isDead: i % 15 === 0,
    isUnit: i % 5 !== 0,
    hp: 100
}));

// 1. Benchmark: deleteSelectedEntities (filter & some vs loops)
console.log('--- deleteSelectedEntities (Filter & Some vs Loop) ---');

console.time('Baseline (filter & some)');
for (let i = 0; i < iterations; i++) {
    const toDelete = entities.filter(e => e.team === 'player' && !e.isDead);
    let hasEnemy = false;
    if (toDelete.length === 0) {
        if (entities.length > 0 && entities.some(e => e.team !== 'player')) {
            hasEnemy = true; // Simulating error notification
        }
    }
}
console.timeEnd('Baseline (filter & some)');

console.time('Optimized (loops)');
for (let i = 0; i < iterations; i++) {
    const toDelete = [];
    const selLen = entities.length;
    let hasEnemy = false;

    for (let j = 0; j < selLen; j++) {
        const e = entities[j];
        if (e.team === 'player' && !e.isDead) {
            toDelete.push(e);
        } else if (e.team !== 'player') {
            hasEnemy = true;
        }
    }

    if (toDelete.length === 0) {
        if (selLen > 0 && hasEnemy) {
            // Simulating error notification
        }
    }
}
console.timeEnd('Optimized (loops)');
console.log('');

// 2. Benchmark: handleKeyDown F (filter vs loop)
console.log('--- handleKeyDown "F" (Filter vs Loop) ---');

console.time('Baseline (filter)');
for (let i = 0; i < iterations; i++) {
    const selectedUnits = entities.filter(e => e.isUnit);
}
console.timeEnd('Baseline (filter)');

console.time('Optimized (loop)');
for (let i = 0; i < iterations; i++) {
    const selectedUnits = [];
    const selLen = entities.length;
    for (let j = 0; j < selLen; j++) {
        const e = entities[j];
        if (e.isUnit) selectedUnits.push(e);
    }
}
console.timeEnd('Optimized (loop)');
console.log('');

// 3. Benchmark: handleKeyDown B (some vs loop)
console.log('--- handleKeyDown "B" (Some vs Loop) ---');
const someEntities = new Array(10).fill(null).map((_, i) => ({ type: i === 9 ? 'warrior' : 'villager' }));

console.time('Baseline (some)');
for (let i = 0; i < iterations; i++) {
    const hasNonVillager = someEntities.some(e => e.type !== 'villager');
}
console.timeEnd('Baseline (some)');

console.time('Optimized (loop)');
for (let i = 0; i < iterations; i++) {
    let hasNonVillager = false;
    const selLen = someEntities.length;
    for (let j = 0; j < selLen; j++) {
        if (someEntities[j].type !== 'villager') {
            hasNonVillager = true;
            break;
        }
    }
}
console.timeEnd('Optimized (loop)');
console.log('');
