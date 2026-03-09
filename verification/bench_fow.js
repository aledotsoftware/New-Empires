import { FogOfWar } from '../js/map/FogOfWar.js';

const fow = new FogOfWar(200, 200);

fow.beginUpdate();

const entities = [];
for (let i = 0; i < 500; i++) {
    entities.push({
        x: Math.random() * 6400,
        y: Math.random() * 6400,
        visionRadius: 10 * 32
    });
}

console.time('Baseline');
for (let i=0; i<500; i++) {
    fow.addEntity(entities[i]);
}
fow.endUpdate();
console.timeEnd('Baseline');
