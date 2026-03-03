import { performance } from 'perf_hooks';

// Mock context for benchmarking
class Entity {
    constructor(id, hasRally) {
        this.id = id;
        this.team = 'player';
        this.rallyPoint = hasRally ? {x: 10, y: 10} : null;
        this.x = Math.random() * 1000;
        this.y = Math.random() * 1000;
    }
}

const selectedEntities = [];
for (let i = 0; i < 50; i++) {
    selectedEntities.push(new Entity(i, i % 5 === 0));
}

function benchUnoptimized() {
    let sum = 0; // Prevent dead code elimination
    for (let it = 0; it < 50000; it++) {
        const entitiesWithRally = [];
        const len = selectedEntities.length;
        for (let i = 0; i < len; i++) {
            const entity = selectedEntities[i];
            if (entity.team === 'player' && entity.rallyPoint) {
                entitiesWithRally.push(entity);
            }
        }
        sum += entitiesWithRally.length;
    }
    return sum;
}

const _rallyCache = [];
function benchOptimized() {
    let sum = 0;
    for (let it = 0; it < 50000; it++) {
        const cache = _rallyCache;
        cache.length = 0;

        const len = selectedEntities.length;
        let count = 0;
        for (let i = 0; i < len; i++) {
            const entity = selectedEntities[i];
            if (entity.team === 'player' && entity.rallyPoint) {
                cache[count++] = entity;
            }
        }
        sum += count;
    }
    return sum;
}

console.log('⚡ Starting Rally Points Optimization Verification');

const start1 = performance.now();
const res1 = benchUnoptimized();
const end1 = performance.now();

const start2 = performance.now();
const res2 = benchOptimized();
const end2 = performance.now();

const unoptTime = end1 - start1;
const optTime = end2 - start2;

console.log(`Unoptimized: ${unoptTime.toFixed(2)}ms`);
console.log(`Optimized: ${optTime.toFixed(2)}ms`);

if (optTime < unoptTime) {
    const speedup = (unoptTime / optTime).toFixed(2);
    console.log(`✅ Array REUSED! Optimization Active (~${speedup}x faster).`);
} else {
    console.log(`❌ Optimization failed to improve performance.`);
}
console.log('⚡ Verification Complete');
