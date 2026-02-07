
import { FogOfWar } from '../js/map/FogOfWar.js';
import { performance } from 'perf_hooks';

// Mock minimal config for benchmark
global.CONFIG = {
    VISION: {
        ENABLED: true
    }
};

const ITERATIONS = 1000;
const ENTITY_COUNT = 200;
const MAP_SIZE = 200; // 200x200 tiles

function runBenchmark() {
    console.log(`Running FOW Benchmark: ${ITERATIONS} iterations, ${ENTITY_COUNT} entities, ${MAP_SIZE}x${MAP_SIZE} map`);

    const fow = new FogOfWar(MAP_SIZE, MAP_SIZE);

    // Create mock entities
    const entities = [];
    for (let i = 0; i < ENTITY_COUNT; i++) {
        entities.push({
            x: Math.random() * MAP_SIZE * 32,
            y: Math.random() * MAP_SIZE * 32,
            visionRadius: 250, // Default unit vision
            isDead: false
        });
    }

    const start = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
        // Simulate movement slightly
        for (let e of entities) {
            e.x += (Math.random() - 0.5) * 2;
            e.y += (Math.random() - 0.5) * 2;
        }
        fow.update(entities);
    }

    const end = performance.now();
    const duration = end - start;
    const avg = duration / ITERATIONS;

    console.log(`Total time: ${duration.toFixed(2)}ms`);
    console.log(`Average per update: ${avg.toFixed(4)}ms`);
    console.log(`Updates per second: ${(1000 / avg).toFixed(2)}`);
}

runBenchmark();
