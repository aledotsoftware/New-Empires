const array = new Array(100).fill(null).map((_, i) => ({ type: i % 2 === 0 ? 'villager' : 'warrior', team: 'player', isDead: i % 10 === 0, isUnit: true }));

console.time('filter');
for (let i = 0; i < 100000; i++) {
    const toDelete = array.filter(e => e.team === 'player' && !e.isDead);
}
console.timeEnd('filter');

console.time('loop');
for (let i = 0; i < 100000; i++) {
    const toDelete = [];
    const len = array.length;
    for (let j = 0; j < len; j++) {
        const e = array[j];
        if (e.team === 'player' && !e.isDead) {
            toDelete.push(e);
        }
    }
}
console.timeEnd('loop');
