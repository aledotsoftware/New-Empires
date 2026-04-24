const fs = require('fs');
const file = 'js/systems/EffectsManager.js';
let content = fs.readFileSync(file, 'utf8');

const search = `        let writeIdx = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (p.update(deltaTime)) {`;

const replace = `        let writeIdx = 0;
        const len = this.particles.length;
        for (let i = 0; i < len; i++) {
            const p = this.particles[i];
            if (p.update(deltaTime)) {`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content);
    console.log('EffectsManager.js updated successfully (1).');
} else {
    console.log('Search block 1 not found.');
}

const search2 = `        writeIdx = 0;
        for (let i = 0; i < this.projectiles.length; i++) {
            if (this.projectiles[i].update(deltaTime)) {
                this.projectiles[writeIdx++] = this.projectiles[i];
            }
        }`;

const replace2 = `        writeIdx = 0;
        const projLen = this.projectiles.length;
        for (let i = 0; i < projLen; i++) {
            if (this.projectiles[i].update(deltaTime)) {
                this.projectiles[writeIdx++] = this.projectiles[i];
            }
        }`;

if (content.includes(search2)) {
    content = content.replace(search2, replace2);
    fs.writeFileSync(file, content);
    console.log('EffectsManager.js updated successfully (2).');
} else {
    console.log('Search block 2 not found.');
}

const search3 = `        // BOLT OPTIMIZATION: Standard loop avoids iterator allocation
        for (let i = 0; i < this.particles.length; i++) {`;

const replace3 = `        // BOLT OPTIMIZATION: Standard loop avoids iterator allocation
        const pLen = this.particles.length;
        for (let i = 0; i < pLen; i++) {`;

if (content.includes(search3)) {
    content = content.replace(search3, replace3);
    fs.writeFileSync(file, content);
    console.log('EffectsManager.js updated successfully (3).');
} else {
    console.log('Search block 3 not found.');
}
