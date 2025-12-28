
import { SpatialGrid } from '../js/managers/SpatialGrid.js';
import { strict as assert } from 'assert';

console.log('Running verification for SpatialGrid optimization...');

const width = 1000;
const height = 1000;
const cellSize = 100;
const grid = new SpatialGrid(width, height, cellSize);

// Test 1: Check invCellSize initialization
assert.equal(grid.invCellSize, 0.01, 'invCellSize should be 0.01 for cellSize 100');

// Test 2: Add entity and verify bucket placement
const entity = { x: 150, y: 150 };
grid.add(entity);

// 150 * 0.01 = 1.5 -> floor = 1. row=1, col=1.
// cols = 10. index = 1 * 10 + 1 = 11.
const expectedIndex = 11;
assert.equal(grid.buckets[expectedIndex].length, 1, 'Entity should be in bucket 11');
assert.equal(grid.buckets[expectedIndex][0], entity, 'Bucket should contain the entity');

// Test 3: Query
const result = grid.query(150, 150, 50);
assert.equal(result.length, 1, 'Query should return 1 entity');
assert.equal(result[0], entity, 'Query result should be the entity');

// Test 4: Boundary check
const entityOut = { x: -10, y: -10 };
grid.add(entityOut);
// Should not throw and should not be added (col -1)
// We need to check if it ended up anywhere.
let count = 0;
for(let b of grid.buckets) count += b.length;
assert.equal(count, 1, 'Out of bounds entity should not be added');

console.log('✅ Verification passed!');
