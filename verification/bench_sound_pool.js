
// Mock Audio class since we are in Node.js
class MockAudio {
    constructor() {
        this.src = '';
        this.volume = 1.0;
        this.paused = true;
        this.currentTime = 0;
    }

    cloneNode() {
        // Simulate heavy operation
        const clone = new MockAudio();
        clone.src = this.src;
        // Simulate some CPU work
        for(let i=0; i<100; i++) Math.random();
        return clone;
    }

    play() {
        this.paused = false;
        return Promise.resolve();
    }
}

// Baseline: cloneNode every time
function testCloneNode(iterations) {
    const original = new MockAudio();
    const start = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
        const sound = original.cloneNode();
        sound.play();
    }

    const end = process.hrtime.bigint();
    return Number(end - start) / 1e6; // ms
}

// Optimized: Object Pool
class SoundPool {
    constructor(original, size) {
        this.original = original;
        this.pool = [];
        for (let i = 0; i < size; i++) {
            this.pool.push(original.cloneNode());
        }
        this.idx = 0;
    }

    play() {
        // Simple round-robin for benchmark
        const sound = this.pool[this.idx];
        this.idx = (this.idx + 1) % this.pool.length;
        sound.currentTime = 0;
        sound.play();
    }
}

function testPool(iterations) {
    const original = new MockAudio();
    const pool = new SoundPool(original, 10);
    const start = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
        pool.play();
    }

    const end = process.hrtime.bigint();
    return Number(end - start) / 1e6; // ms
}

const ITERATIONS = 100000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

const timeClone = testCloneNode(ITERATIONS);
console.log(`cloneNode: ${timeClone.toFixed(2)} ms`);

const timePool = testPool(ITERATIONS);
console.log(`Pool:      ${timePool.toFixed(2)} ms`);

const speedup = timeClone / timePool;
console.log(`Speedup:   ${speedup.toFixed(2)}x`);
