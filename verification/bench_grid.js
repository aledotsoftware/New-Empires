import { SpatialGrid } from '../js/managers/SpatialGrid.js';

const grid = new SpatialGrid(6400, 6400, 100);

const entities = [];
for (let i = 0; i < 5000; i++) {
    entities.push({
        x: Math.random() * 6400,
        y: Math.random() * 6400,
        visionRadius: 10 * 32
    });
}

console.time('Baseline');
for (let i = 0; i < 1000; i++) {
    grid.clear();
    for (let j = 0; j < 5000; j++) {
        grid.add(entities[j]);
    }
}
console.timeEnd('Baseline');
