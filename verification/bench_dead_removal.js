
const { performance } = require('perf_hooks');

const NUM_ENTITIES = 10000;
const DEAD_RATIO = 0.1; // 10% die each frame

function createEntities() {
    const units = [];
    const buildings = [];
    const enemies = [];
    const entities = [];

    for (let i = 0; i < NUM_ENTITIES; i++) {
        const type = i % 3;
        const entity = { id: i, isDead: false };
        if (type === 0) {
            units.push(entity);
        } else if (type === 1) {
            buildings.push(entity);
        } else {
            enemies.push(entity);
        }
        entities.push(entity);
    }
    return { units, buildings, enemies, entities };
}

function _removeDeadInPlace(array) {
    let writeIdx = 0;
    for (let i = 0; i < array.length; i++) {
        if (!array[i].isDead) {
            array[writeIdx++] = array[i];
        }
    }
    array.length = writeIdx;
}

function runBaseline(data) {
    const { units, buildings, enemies, entities } = data;
    _removeDeadInPlace(entities);
    _removeDeadInPlace(units);
    _removeDeadInPlace(buildings);
    _removeDeadInPlace(enemies);
}

function runOptimized(data) {
    const { units, buildings, enemies, entities } = data;

    // Clean specific lists first
    _removeDeadInPlace(units);
    _removeDeadInPlace(buildings);
    _removeDeadInPlace(enemies);

    // Rebuild entities
    let writeIdx = 0;

    // Unroll manually for speed simulation
    const uLen = units.length;
    for (let i = 0; i < uLen; i++) {
        entities[writeIdx++] = units[i];
    }

    const bLen = buildings.length;
    for (let i = 0; i < bLen; i++) {
        entities[writeIdx++] = buildings[i];
    }

    const eLen = enemies.length;
    for (let i = 0; i < eLen; i++) {
        entities[writeIdx++] = enemies[i];
    }

    entities.length = writeIdx;
}

function benchmark() {
    console.log(`Benchmarking with ${NUM_ENTITIES} entities, ${DEAD_RATIO * 100}% dead ratio.`);

    // Warmup
    for (let i = 0; i < 100; i++) {
        const data = createEntities();
        runBaseline(data);
    }

    const ITERATIONS = 10000;

    let totalBaseline = 0;
    let totalOptimized = 0;

    for (let i = 0; i < ITERATIONS; i++) {
        // Setup data for baseline
        const data1 = createEntities();
        // Mark some dead
        data1.entities.forEach(e => {
            if (Math.random() < DEAD_RATIO) e.isDead = true;
        });

        const start1 = performance.now();
        runBaseline(data1);
        totalBaseline += performance.now() - start1;

        // Setup data for optimized
        const data2 = createEntities();
        // Copy dead state to match EXACTLY (though random is fine for avg)
        // For fairness, let's just regenerate with same seed or just random again
        // Just random is fine for large N
        data2.entities.forEach(e => {
            if (Math.random() < DEAD_RATIO) e.isDead = true;
        });

        const start2 = performance.now();
        runOptimized(data2);
        totalOptimized += performance.now() - start2;
    }

    console.log(`Baseline Total Time: ${totalBaseline.toFixed(2)}ms`);
    console.log(`Optimized Total Time: ${totalOptimized.toFixed(2)}ms`);
    console.log(`Improvement: ${((totalBaseline - totalOptimized) / totalBaseline * 100).toFixed(2)}%`);
}

benchmark();
