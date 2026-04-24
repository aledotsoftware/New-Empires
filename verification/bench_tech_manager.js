const assert = require('assert');

function baseline(queue) {
    for (let i = queue.length - 1; i >= 0; i--) {
        const item = queue[i];
        item.timer -= 0.1;
        if (item.timer <= 0) {
            queue.splice(i, 1);
        }
    }
}

function optimized(queue) {
    let writeIdx = 0;
    const len = queue.length;
    for (let i = 0; i < len; i++) {
        const item = queue[i];
        item.timer -= 0.1;
        if (item.timer > 0) {
            queue[writeIdx++] = item;
        }
    }
    queue.length = writeIdx;
}

const n = 100;
let q1 = [];
for (let i = 0; i < n; i++) {
    q1.push({ timer: Math.random() });
}

let q2 = JSON.parse(JSON.stringify(q1));

baseline(q1);
optimized(q2);

assert.deepStrictEqual(q1, q2);

const iterations = 10000;
console.time('Baseline');
for (let i=0; i<iterations; i++) {
    let q = [];
    for (let j=0; j<n; j++) q.push({timer: Math.random()});
    baseline(q);
}
console.timeEnd('Baseline');

console.time('Optimized');
for (let i=0; i<iterations; i++) {
    let q = [];
    for (let j=0; j<n; j++) q.push({timer: Math.random()});
    optimized(q);
}
console.timeEnd('Optimized');
