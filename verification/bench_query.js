import { SpatialGrid } from '../js/managers/SpatialGrid.js';

const grid = new SpatialGrid(6400, 6400, 100);

const entities = [];
for (let i = 0; i < 50000; i++) {
    const e = {
        x: Math.random() * 6400,
        y: Math.random() * 6400,
        visionRadius: 10 * 32,
        _spatialMinX: null,
        _spatialMaxX: null,
        _spatialMinY: null,
        _spatialMaxY: null,
        _spatialIndex: -1,
        _spatialCellSize: 0
    };
    entities.push(e);
    grid.add(e);
}

const cache = [];

console.time('query');
for (let i = 0; i < 1000; i++) {
    grid.query(3200, 3200, 500, cache);
}
console.timeEnd('query');

console.time('queryRect');
for (let i = 0; i < 1000; i++) {
    grid.queryRect(3200-500, 3200-500, 1000, 1000, cache);
}
console.timeEnd('queryRect');
