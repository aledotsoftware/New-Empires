import { SpatialGrid } from '../js/managers/SpatialGrid.js';

const grid = new SpatialGrid(6400, 6400, 100);

const entities = [];
for (let i = 0; i < 5000; i++) {
    entities.push({
        x: Math.random() * 6400,
        y: Math.random() * 6400,
        visionRadius: 10 * 32,
        _spatialMinX: null,
        _spatialMaxX: null,
        _spatialMinY: null,
        _spatialMaxY: null,
        _spatialIndex: -1,
        _spatialCellSize: 0
    });
}

// Warm up
for (let j = 0; j < 5000; j++) {
    grid.add(entities[j]);
}

console.time('Optimized (Cached)');
for (let i = 0; i < 1000; i++) {
    grid.clear();
    for (let j = 0; j < 5000; j++) {
        // simulate slight movement
        if (Math.random() < 0.1) {
            entities[j].x += (Math.random() - 0.5) * 5;
            entities[j].y += (Math.random() - 0.5) * 5;
        }
        grid.add(entities[j]);
    }
}
console.timeEnd('Optimized (Cached)');
