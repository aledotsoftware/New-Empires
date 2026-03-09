// Test enemy predicate logic

const AGGRO_RADIUS_SQ = 200 * 200;

function enemyPredicateBaseline(entity, unit) {
    if (!entity.isDead) {
        const dx = unit.x - entity.x;
        const dy = unit.y - entity.y;
        const distSq = dx * dx + dy * dy;
        return distSq < AGGRO_RADIUS_SQ;
    }
    return false;
}

function enemyPredicateOptimized(entity, unit) {
    if (entity.isDead) return false;

    const dx = unit.x - entity.x;
    if (dx > 200 || dx < -200) return false; // Early exit

    const dy = unit.y - entity.y;
    if (dy > 200 || dy < -200) return false; // Early exit

    return (dx * dx + dy * dy) < AGGRO_RADIUS_SQ;
}

const unit = { x: 500, y: 500 };
const entities = [];
for (let i = 0; i < 10000; i++) {
    entities.push({
        isDead: false,
        x: Math.random() * 1000,
        y: Math.random() * 1000
    });
}

const iter = 1000;
let match1 = 0;
let match2 = 0;

console.time('Baseline');
for (let i = 0; i < iter; i++) {
    for (let j = 0; j < 10000; j++) {
        if (enemyPredicateBaseline(entities[j], unit)) match1++;
    }
}
console.timeEnd('Baseline');

console.time('Optimized');
for (let i = 0; i < iter; i++) {
    for (let j = 0; j < 10000; j++) {
        if (enemyPredicateOptimized(entities[j], unit)) match2++;
    }
}
console.timeEnd('Optimized');

console.log(match1, match2);
