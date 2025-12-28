
import { SpatialGrid } from '../js/managers/SpatialGrid.js';
import { strict as assert } from 'assert';

console.log('Running verification for SpatialGrid...');

const width = 1000;
const height = 1000;
const cellSize = 100;
const grid = new SpatialGrid(width, height, cellSize);

// Test 1: Grid dimensions
assert.equal(grid.cols, 10, 'Columns should be 10');
assert.equal(grid.rows, 10, 'Rows should be 10');
assert.equal(grid.invCellSize, 0.01, 'InvCellSize should be 0.01');

// Test 2: Add entity
const entity = { x: 50, y: 50, id: 1 };
grid.add(entity);

const result = grid.query(50, 50, 10);
assert.equal(result.length, 1, 'Should find 1 entity');
assert.equal(result[0].id, 1, 'Should find correct entity');

// Test 3: Boundary check
const entityOut = { x: -10, y: -10, id: 2 };
grid.add(entityOut); // Should be ignored
// Query near border
const resultOut = grid.query(0, 0, 100);
// Should only find entity 1 (at 50,50), entityOut is ignored by add()
assert.ok(resultOut.some(e => e.id === 1), 'Should contain entity 1');
assert.ok(!resultOut.some(e => e.id === 2), 'Should NOT contain entity 2');

// Test 4: Clear
grid.clear();
const resultClear = grid.query(50, 50, 10);
assert.equal(resultClear.length, 0, 'Grid should be empty after clear');

console.log('✅ All SpatialGrid verification tests passed.');
