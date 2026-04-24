const assert = require('assert');

function baselineUpdate(particles, deltaTime) {
    let writeIdx = 0;
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.update(deltaTime)) {
            particles[writeIdx++] = p;
        } else {
            // fake release
        }
    }
    particles.length = writeIdx;
}

function optimizedUpdate(particles, deltaTime) {
    let writeIdx = 0;
    const len = particles.length;
    for (let i = 0; i < len; i++) {
        const p = particles[i];
        if (p.update(deltaTime)) {
            particles[writeIdx++] = p;
        } else {
            // fake release
        }
    }
    particles.length = writeIdx;
}

class Particle {
    constructor() { this.life = Math.random(); }
    update(dt) { this.life -= dt; return this.life > 0; }
}

const n = 1000;
let p1 = [];
for (let i = 0; i < n; i++) p1.push(new Particle());

let p2 = JSON.parse(JSON.stringify(p1));
p2 = p2.map(p => {
    let np = new Particle();
    np.life = p.life;
    return np;
});

baselineUpdate(p1, 0.1);
optimizedUpdate(p2, 0.1);
assert.strictEqual(p1.length, p2.length);

const iterations = 5000;
console.time('Baseline');
for(let i=0; i<iterations; i++) {
    let p = [];
    for (let j=0; j<n; j++) p.push(new Particle());
    baselineUpdate(p, 0.1);
}
console.timeEnd('Baseline');

console.time('Optimized');
for(let i=0; i<iterations; i++) {
    let p = [];
    for (let j=0; j<n; j++) p.push(new Particle());
    optimizedUpdate(p, 0.1);
}
console.timeEnd('Optimized');
