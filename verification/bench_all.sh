#!/bin/bash
echo "=== Running all performance benchmarks ==="
node verification/bench_spatial_query.js
node verification/bench_grid.js
node verification/bench_fow.js
node verification/bench_array_methods.js
node verification/bench_unit_pred.js
node verification/bench_circle.js
