
const ITERATIONS = 1000000;
const x1 = 100.5, y1 = 200.5;
const x2 = 130.2, y2 = 220.8;

console.time('Exponentiation');
for(let i=0; i<ITERATIONS; i++) {
    const distSq = (x1 - x2) ** 2 + (y1 - y2) ** 2;
}
console.timeEnd('Exponentiation');

console.time('Multiplication');
for(let i=0; i<ITERATIONS; i++) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distSq = dx * dx + dy * dy;
}
console.timeEnd('Multiplication');
