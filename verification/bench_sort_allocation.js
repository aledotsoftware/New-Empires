
const ITERATIONS = 100000;
const ARRAY_SIZE = 20;

const arr = [];
for(let i=0; i<ARRAY_SIZE; i++) arr.push({y: Math.random()});

console.time('With Allocation');
for(let i=0; i<ITERATIONS; i++) {
    arr.sort((a, b) => a.y - b.y);
}
console.timeEnd('With Allocation');

const sorter = (a, b) => a.y - b.y;

console.time('Without Allocation');
for(let i=0; i<ITERATIONS; i++) {
    arr.sort(sorter);
}
console.timeEnd('Without Allocation');
